// Renderizador del póster en canvas 2D. Sin dependencias.
import { project, galacticToEquatorial } from "./astronomy.js";

const DEG = Math.PI / 180;

export const THEMES = {
  noche: {
    nombre: "Noche",
    bg: "#080b14",
    vignette: true,
    discCenter: "#101a33",
    discEdge: "#070c18",
    star: "#f5f7ff",
    line: "#5b6f9c",
    grid: "rgba(120,150,200,0.16)",
    milky: "#bed2ff",
    text: "#eef2fb",
    muted: "#8fa0c4",
    accent: "#d9b56a",
    horizon: "rgba(217,181,106,0.55)",
    moonLit: "#f3ead2",
    moonDark: "#1a2238",
    mono: false,
  },
  azul: {
    nombre: "Azul profundo",
    bg: "#04121f",
    vignette: true,
    discCenter: "#082a44",
    discEdge: "#03101c",
    star: "#e2f4ff",
    line: "#3f7fa6",
    grid: "rgba(110,190,240,0.18)",
    milky: "#8fd0ff",
    text: "#e8f6ff",
    muted: "#7fb3d1",
    accent: "#6fc3ff",
    horizon: "rgba(111,195,255,0.55)",
    moonLit: "#dff3ff",
    moonDark: "#0b2033",
    mono: false,
  },
  sepia: {
    nombre: "Sepia",
    bg: "#efe6d2",
    vignette: false,
    discCenter: "#f8f1e0",
    discEdge: "#e7dcc4",
    star: "#3a2e20",
    line: "#a8926d",
    grid: "rgba(120,95,60,0.16)",
    milky: "#7a6242",
    text: "#3a2e20",
    muted: "#8a7758",
    accent: "#9c6b3a",
    horizon: "rgba(156,107,58,0.6)",
    moonLit: "#3a2e20",
    moonDark: "#e7dcc4",
    mono: true,
  },
  blanco: {
    nombre: "Blanco",
    bg: "#ffffff",
    vignette: false,
    discCenter: "#ffffff",
    discEdge: "#f2f2f2",
    star: "#101010",
    line: "#c4c4c4",
    grid: "rgba(0,0,0,0.10)",
    milky: "#6d6d6d",
    text: "#111111",
    muted: "#777777",
    accent: "#8a8a8a",
    horizon: "rgba(0,0,0,0.35)",
    moonLit: "#111111",
    moonDark: "#f0f0f0",
    mono: true,
  },
};

/** Formatos de impresión: alto / ancho. */
export const FORMATOS = {
  "3:4": { nombre: "3:4 · clásico", ratio: 4 / 3 },
  "4:5": { nombre: "4:5 · retrato", ratio: 5 / 4 },
  "2:3": { nombre: "2:3 · panorámico", ratio: 3 / 2 },
};

function withAlpha(color, alpha) {
  if (!color.startsWith("#")) return color;
  let h = color.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function starColor(ci, theme, colorStars) {
  if (!colorStars || theme.mono || ci == null) return theme.star;
  if (ci < -0.1) return "#9bb0ff";
  if (ci < 0.2) return "#aabfff";
  if (ci < 0.4) return "#cad7ff";
  if (ci < 0.6) return "#f8f7ff";
  if (ci < 0.8) return "#fff4ea";
  if (ci < 1.1) return "#ffd9b8";
  if (ci < 1.5) return "#ffc48a";
  return "#ffb06b";
}

function starRadius(mag, radius) {
  return Math.max(radius * 0.0012, radius * 0.005 * Math.pow(10, -0.16 * mag));
}

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundedRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawMoonPhase(ctx, x, y, r, fase, creciente, theme) {
  const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.6);
  halo.addColorStop(0, withAlpha(theme.moonLit, 0.16));
  halo.addColorStop(1, withAlpha(theme.moonLit, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.moonDark;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  const f = Math.max(0, Math.min(1, fase));
  if (f < 0.004) return;
  const a = r * Math.abs(2 * f - 1);

  ctx.save();
  ctx.fillStyle = theme.moonLit;
  if (!creciente) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
  if (f <= 0.5) {
    ctx.ellipse(x, y, a, r, 0, Math.PI / 2, -Math.PI / 2, true);
  } else {
    ctx.ellipse(x, y, a, r, 0, Math.PI / 2, (3 * Math.PI) / 2, false);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const wrap180 = (deg) => (((deg % 360) + 540) % 360) - 180;

/** Ancho aparente de la banda de la Vía Láctea, en grados. */
function mwWidth(l) {
  const centro = Math.exp(-((wrap180(l) / 55) ** 2));
  const cygnus = Math.exp(-((wrap180(l - 80) / 42) ** 2));
  return 7 + 6.5 * centro + 2.5 * cygnus;
}

/** Brillo relativo de la banda según la longitud galáctica. */
function mwBrightness(l) {
  const centro = Math.exp(-((wrap180(l) / 65) ** 2));
  const cygnus = Math.exp(-((wrap180(l - 80) / 45) ** 2));
  return 0.55 + 0.5 * centro + 0.3 * cygnus;
}

/**
 * Dibuja el póster completo.
 * width/height: tamaño en píxeles.
 */
export function renderPoster(ctx, width, height, opts) {
  const {
    stars,
    constellations,
    sky,
    theme,
    showConstellations = true,
    showGrid = false,
    showMilkyWay = true,
    showMoon = true,
    colorStars = true,
    titulo = "",
    nombres = "",
    tipografiaNombres = "Great Vibes",
    fechaTexto = "",
    lugarTexto = "",
    mensaje = "",
    spotify = null,
  } = opts;

  const W = width;
  const H = height;
  const cx = W / 2;
  const cy = H * 0.4275;
  const R = H * 0.2625;

  ctx.clearRect(0, 0, W, H);

  // Fondo
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  if (theme.vignette) {
    const v = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, Math.max(W, H) * 0.8);
    v.addColorStop(0, "rgba(255,255,255,0.025)");
    v.addColorStop(0.55, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // Disco del cielo
  const disc = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  disc.addColorStop(0, theme.discCenter);
  disc.addColorStop(1, theme.discEdge);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = disc;
  ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

  const projectPoint = (raDeg, decDeg) => {
    const { alt, az } = sky.equatorial(raDeg, decDeg);
    const p = project(alt, az, R);
    return { x: cx + p.x, y: cy + p.y, alt, az, r: p.r };
  };

  // Vía Láctea: banda procedural en coordenadas galácticas.
  if (showMilkyWay) {
    const step = 2;
    const layers = [
      { scale: 1, alpha: 0.07 },
      { scale: 1.7, alpha: 0.035 },
      { scale: 2.6, alpha: 0.018 },
    ];
    const gal = (l, b) => {
      const [ra, dec] = galacticToEquatorial(l, b);
      const { alt, az } = sky.equatorial(ra, dec);
      const p = project(alt, az, R);
      const rr = Math.min(p.r, R * 1.04);
      const k = p.r > 0 ? rr / p.r : 0;
      return { x: cx + p.x * k, y: cy + p.y * k, alt };
    };

    for (let l = 0; l < 360; l += step) {
      const l2 = l + step + 0.3;
      const bright = (mwBrightness(l) + mwBrightness(l2)) / 2;
      const w1 = mwWidth(l) / 2;
      const w2 = mwWidth(l2) / 2;
      for (const layer of layers) {
        const a = gal(l, w1 * layer.scale);
        const b = gal(l, -w1 * layer.scale);
        const c = gal(l2, -w2 * layer.scale);
        const d = gal(l2, w2 * layer.scale);
        if (Math.max(a.alt, b.alt, c.alt, d.alt) < -2) continue;
        ctx.fillStyle = withAlpha(theme.milky, Math.min(0.15, layer.alpha * bright));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Cuadrícula
  if (showGrid) {
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = R * 0.0023;
    for (const alt of [30, 60]) {
      const r = R * Math.tan(((90 - alt) / 2) * DEG);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let az = 0; az < 360; az += 30) {
      const p = project(0, az, R);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + p.x, cy + p.y);
      ctx.stroke();
    }
  }

  // Constelaciones
  if (showConstellations && constellations?.length) {
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = R * 0.003;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const constellation of constellations) {
      for (const line of constellation.lineas) {
        if (line.length < 2) continue;
        ctx.beginPath();
        let started = false;
        for (const [ra, dec] of line) {
          const p = projectPoint(ra, dec);
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }
    }
  }

  // Estrellas
  for (const [raHours, dec, mag, ci] of stars) {
    const { alt, az } = sky.star(raHours, dec);
    if (alt < -0.5) continue;
    const p = project(alt, az, R);
    const x = cx + p.x;
    const y = cy + p.y;
    const r = starRadius(mag, R);
    const color = starColor(ci, theme, colorStars);

    if (mag <= 1.3) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4.2);
      glow.addColorStop(0, withAlpha(color, 0.32));
      glow.addColorStop(1, withAlpha(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 4.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Luna
  if (showMoon && sky.moon) {
    const { alt, az } = sky.body(sky.moon.raDeg, sky.moon.decDeg);
    if (alt > -1) {
      const p = project(alt, az, R);
      drawMoonPhase(
        ctx,
        cx + p.x,
        cy + p.y,
        R * 0.06,
        sky.moon.fase,
        sky.moon.creciente,
        theme,
      );
    }
  }

  ctx.restore();

  // Anillo del horizonte
  ctx.strokeStyle = theme.horizon;
  ctx.lineWidth = R * 0.004;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  // Marcas cada 10°
  ctx.strokeStyle = withAlpha(theme.accent, 0.5);
  ctx.lineWidth = R * 0.002;
  for (let az = 0; az < 360; az += 10) {
    const inner = project(0, az, R * 1.012);
    const outer = project(0, az, R * 1.032);
    ctx.beginPath();
    ctx.moveTo(cx + inner.x, cy + inner.y);
    ctx.lineTo(cx + outer.x, cy + outer.y);
    ctx.stroke();
  }

  // Puntos cardinales
  ctx.fillStyle = theme.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${W * 0.021}px "Segoe UI", system-ui, sans-serif`;
  for (const [label, az] of [
    ["N", 0],
    ["E", 90],
    ["S", 180],
    ["O", 270],
  ]) {
    const p = project(0, az, R * 1.105);
    ctx.fillText(label, cx + p.x, cy + p.y);
  }

  // Nombres con tipografía tipo firma
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const tieneNombres = Boolean(nombres);
  if (tieneNombres) {
    const familia = `"${tipografiaNombres}", "Segoe Script", "Brush Script MT", "Apple Chancery", cursive`;
    let size = W * 0.058;
    ctx.font = `400 ${size}px ${familia}`;
    while (ctx.measureText(nombres).width > W * 0.8 && size > W * 0.028) {
      size -= W * 0.001;
      ctx.font = `400 ${size}px ${familia}`;
    }
    ctx.fillStyle = theme.accent;
    ctx.fillText(nombres, cx, H * 0.048);
  }

  // Título
  const yTitulo = H * (tieneNombres ? 0.095 : 0.085);
  const yFecha = H * (tieneNombres ? 0.126 : 0.1185);
  const yLinea = H * 0.148;
  if (titulo) {
    ctx.fillStyle = theme.text;
    ctx.font = `600 ${W * 0.046}px Georgia, "Times New Roman", serif`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${W * 0.0055}px`;
    ctx.fillText(titulo, cx, yTitulo);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }

  // Fecha
  if (fechaTexto) {
    ctx.fillStyle = theme.muted;
    ctx.font = `400 ${W * 0.0175}px "Segoe UI", system-ui, sans-serif`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${W * 0.0035}px`;
    ctx.fillText(fechaTexto.toUpperCase(), cx, yFecha);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }

  // Línea decorativa
  ctx.strokeStyle = withAlpha(theme.accent, 0.6);
  ctx.lineWidth = R * 0.0026;
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.105, yLinea);
  ctx.lineTo(cx - W * 0.018, yLinea);
  ctx.moveTo(cx + W * 0.018, yLinea);
  ctx.lineTo(cx + W * 0.105, yLinea);
  ctx.stroke();
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.moveTo(cx, yLinea - H * 0.0045);
  ctx.lineTo(cx + W * 0.006, yLinea);
  ctx.lineTo(cx, yLinea + H * 0.0045);
  ctx.lineTo(cx - W * 0.006, yLinea);
  ctx.closePath();
  ctx.fill();

  // Lugar
  if (lugarTexto) {
    ctx.fillStyle = theme.text;
    ctx.font = `400 ${W * 0.0195}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(lugarTexto, cx, H * 0.75);
  }

  // Dedicatoria
  if (mensaje) {
    ctx.fillStyle = theme.muted;
    ctx.font = `italic 400 ${W * 0.0225}px Georgia, "Times New Roman", serif`;
    const lines = wrapText(ctx, mensaje, W * 0.72).slice(0, 3);
    lines.forEach((line, i) => {
      ctx.fillText(line, cx, H * 0.7965 + i * H * 0.0255);
    });
  }

  // Código de Spotify
  const tieneSpotify = Boolean(spotify?.bitmap);
  if (tieneSpotify) {
    const codeW = W * 0.28;
    const codeH = codeW / 4;
    const pad = W * 0.012;
    const caption = String(spotify.caption ?? "").trim();
    let captionSize = W * 0.0145;

    if (caption) {
      ctx.font = `italic 400 ${captionSize}px Georgia, "Times New Roman", serif`;
      while (ctx.measureText(caption).width > codeW && captionSize > W * 0.009) {
        captionSize -= W * 0.0005;
        ctx.font = `italic 400 ${captionSize}px Georgia, "Times New Roman", serif`;
      }
    }

    const captionH = caption ? captionSize * 1.2 : 0;
    const gap = caption ? W * 0.006 : 0;
    const cardW = codeW + pad * 2;
    const cardH = pad * 2 + captionH + gap + codeH;
    const cardX = cx - cardW / 2;
    const cardY = H * 0.865;

    ctx.save();
    ctx.fillStyle = theme.bg;
    ctx.strokeStyle = withAlpha(theme.accent, 0.35);
    ctx.lineWidth = Math.max(1, W * 0.0012);
    roundedRect(ctx, cardX, cardY, cardW, cardH, W * 0.008);
    ctx.fill();
    ctx.stroke();

    let y = cardY + pad;
    if (caption) {
      ctx.fillStyle = theme.muted;
      ctx.font = `italic 400 ${captionSize}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(caption, cx, y);
      y += captionH + gap;
    }

    ctx.drawImage(spotify.bitmap, cardX + pad, y, codeW, codeH);
    ctx.restore();
  }

  // Pie
  ctx.fillStyle = withAlpha(theme.muted, 0.75);
  ctx.font = `400 ${W * 0.0115}px "Segoe UI", system-ui, sans-serif`;
  const coords = `${Math.abs(sky.lat).toFixed(4)}° ${sky.lat >= 0 ? "N" : "S"} · ${Math.abs(sky.lon).toFixed(4)}° ${sky.lon >= 0 ? "E" : "O"}`;
  ctx.fillText(coords, cx, tieneSpotify ? H * 0.975 : H * 0.96);
}
