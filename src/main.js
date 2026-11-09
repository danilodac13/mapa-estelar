import { computeSky, formatFechaEs, localToUtcMs } from "./astronomy.js";
import { renderPoster, THEMES, FORMATOS } from "./render.js";
import { iniciarProteccion } from "./proteccion.js";

const $ = (id) => document.getElementById(id);

// --- Lugares predefinidos ----------------------------------------------------
// [grupo, nombre, país, latitud, longitud, offset UTC]
const LUGARES = [
  // Colombia
  { grupo: "Colombia", nombre: "Bogotá", pais: "Colombia", lat: 4.711, lon: -74.0721, tz: -5 },
  { grupo: "Colombia", nombre: "Medellín", pais: "Colombia", lat: 6.2442, lon: -75.5812, tz: -5 },
  { grupo: "Colombia", nombre: "Cali", pais: "Colombia", lat: 3.4516, lon: -76.532, tz: -5 },
  { grupo: "Colombia", nombre: "Barranquilla", pais: "Colombia", lat: 10.9685, lon: -74.7813, tz: -5 },
  { grupo: "Colombia", nombre: "Cartagena", pais: "Colombia", lat: 10.391, lon: -75.4794, tz: -5 },
  { grupo: "Colombia", nombre: "Bucaramanga", pais: "Colombia", lat: 7.1193, lon: -73.1227, tz: -5 },
  { grupo: "Colombia", nombre: "Pereira", pais: "Colombia", lat: 4.8133, lon: -75.6961, tz: -5 },
  { grupo: "Colombia", nombre: "Manizales", pais: "Colombia", lat: 5.0703, lon: -75.5138, tz: -5 },
  { grupo: "Colombia", nombre: "Santa Marta", pais: "Colombia", lat: 11.2408, lon: -74.199, tz: -5 },
  { grupo: "Colombia", nombre: "Cúcuta", pais: "Colombia", lat: 7.8891, lon: -72.4967, tz: -5 },
  { grupo: "Colombia", nombre: "Ibagué", pais: "Colombia", lat: 4.4389, lon: -75.2322, tz: -5 },
  { grupo: "Colombia", nombre: "Villavicencio", pais: "Colombia", lat: 4.142, lon: -73.6266, tz: -5 },
  { grupo: "Colombia", nombre: "Pasto", pais: "Colombia", lat: 1.2136, lon: -77.2811, tz: -5 },
  { grupo: "Colombia", nombre: "Montería", pais: "Colombia", lat: 8.748, lon: -75.8814, tz: -5 },
  { grupo: "Colombia", nombre: "Neiva", pais: "Colombia", lat: 2.9345, lon: -75.2809, tz: -5 },
  { grupo: "Colombia", nombre: "Armenia", pais: "Colombia", lat: 4.5339, lon: -75.6811, tz: -5 },
  { grupo: "Colombia", nombre: "Valledupar", pais: "Colombia", lat: 10.4631, lon: -73.2532, tz: -5 },
  { grupo: "Colombia", nombre: "Sincelejo", pais: "Colombia", lat: 9.3047, lon: -75.3978, tz: -5 },
  { grupo: "Colombia", nombre: "Tunja", pais: "Colombia", lat: 5.5353, lon: -73.3678, tz: -5 },
  { grupo: "Colombia", nombre: "Popayán", pais: "Colombia", lat: 2.4448, lon: -76.6147, tz: -5 },
  { grupo: "Colombia", nombre: "Riohacha", pais: "Colombia", lat: 11.5444, lon: -72.9072, tz: -5 },
  { grupo: "Colombia", nombre: "Quibdó", pais: "Colombia", lat: 5.6947, lon: -76.6611, tz: -5 },
  { grupo: "Colombia", nombre: "Florencia", pais: "Colombia", lat: 1.6144, lon: -75.6062, tz: -5 },
  { grupo: "Colombia", nombre: "Yopal", pais: "Colombia", lat: 5.3378, lon: -72.3959, tz: -5 },
  { grupo: "Colombia", nombre: "Leticia", pais: "Colombia", lat: -4.2153, lon: -69.9406, tz: -5 },
  { grupo: "Colombia", nombre: "San Andrés", pais: "Colombia", lat: 12.5847, lon: -81.7006, tz: -5 },

  // Latinoamérica
  { grupo: "Latinoamérica", nombre: "Ciudad de México", pais: "México", lat: 19.4326, lon: -99.1332, tz: -6 },
  { grupo: "Latinoamérica", nombre: "Guadalajara", pais: "México", lat: 20.6597, lon: -103.3496, tz: -6 },
  { grupo: "Latinoamérica", nombre: "Monterrey", pais: "México", lat: 25.6866, lon: -100.3161, tz: -6 },
  { grupo: "Latinoamérica", nombre: "Buenos Aires", pais: "Argentina", lat: -34.6037, lon: -58.3816, tz: -3 },
  { grupo: "Latinoamérica", nombre: "Córdoba", pais: "Argentina", lat: -31.4201, lon: -64.1888, tz: -3 },
  { grupo: "Latinoamérica", nombre: "Santiago", pais: "Chile", lat: -33.4489, lon: -70.6693, tz: -4 },
  { grupo: "Latinoamérica", nombre: "Lima", pais: "Perú", lat: -12.0464, lon: -77.0428, tz: -5 },
  { grupo: "Latinoamérica", nombre: "Quito", pais: "Ecuador", lat: -0.1807, lon: -78.4678, tz: -5 },
  { grupo: "Latinoamérica", nombre: "Guayaquil", pais: "Ecuador", lat: -2.1709, lon: -79.9224, tz: -5 },
  { grupo: "Latinoamérica", nombre: "Caracas", pais: "Venezuela", lat: 10.4806, lon: -66.9036, tz: -4 },
  { grupo: "Latinoamérica", nombre: "Maracaibo", pais: "Venezuela", lat: 10.6545, lon: -71.6404, tz: -4 },
  { grupo: "Latinoamérica", nombre: "La Paz", pais: "Bolivia", lat: -16.4897, lon: -68.1193, tz: -4 },
  { grupo: "Latinoamérica", nombre: "Santa Cruz", pais: "Bolivia", lat: -17.7833, lon: -63.1821, tz: -4 },
  { grupo: "Latinoamérica", nombre: "Asunción", pais: "Paraguay", lat: -25.2637, lon: -57.5759, tz: -4 },
  { grupo: "Latinoamérica", nombre: "Montevideo", pais: "Uruguay", lat: -34.9011, lon: -56.1645, tz: -3 },
  { grupo: "Latinoamérica", nombre: "São Paulo", pais: "Brasil", lat: -23.5505, lon: -46.6333, tz: -3 },
  { grupo: "Latinoamérica", nombre: "Río de Janeiro", pais: "Brasil", lat: -22.9068, lon: -43.1729, tz: -3 },
  { grupo: "Latinoamérica", nombre: "Brasilia", pais: "Brasil", lat: -15.7939, lon: -47.8828, tz: -3 },
  { grupo: "Latinoamérica", nombre: "San José", pais: "Costa Rica", lat: 9.9281, lon: -84.0907, tz: -6 },
  { grupo: "Latinoamérica", nombre: "Panamá", pais: "Panamá", lat: 8.9824, lon: -79.5199, tz: -5 },
  { grupo: "Latinoamérica", nombre: "San Salvador", pais: "El Salvador", lat: 13.6929, lon: -89.2182, tz: -6 },
  { grupo: "Latinoamérica", nombre: "Guatemala", pais: "Guatemala", lat: 14.6349, lon: -90.5069, tz: -6 },
  { grupo: "Latinoamérica", nombre: "Tegucigalpa", pais: "Honduras", lat: 14.0723, lon: -87.1921, tz: -6 },
  { grupo: "Latinoamérica", nombre: "Managua", pais: "Nicaragua", lat: 12.114, lon: -86.2362, tz: -6 },
  { grupo: "Latinoamérica", nombre: "La Habana", pais: "Cuba", lat: 23.1136, lon: -82.3666, tz: -5 },
  { grupo: "Latinoamérica", nombre: "Santo Domingo", pais: "Rep. Dominicana", lat: 18.4861, lon: -69.9312, tz: -4 },
  { grupo: "Latinoamérica", nombre: "San Juan", pais: "Puerto Rico", lat: 18.4655, lon: -66.1057, tz: -4 },

  // España
  { grupo: "España", nombre: "Madrid", pais: "España", lat: 40.4168, lon: -3.7038, tz: 1 },
  { grupo: "España", nombre: "Barcelona", pais: "España", lat: 41.3874, lon: 2.1686, tz: 1 },
  { grupo: "España", nombre: "Valencia", pais: "España", lat: 39.4699, lon: -0.3763, tz: 1 },
  { grupo: "España", nombre: "Sevilla", pais: "España", lat: 37.3891, lon: -5.9845, tz: 1 },
  { grupo: "España", nombre: "Bilbao", pais: "España", lat: 43.263, lon: -2.935, tz: 1 },
  { grupo: "España", nombre: "Málaga", pais: "España", lat: 36.7213, lon: -4.4214, tz: 1 },
  { grupo: "España", nombre: "Las Palmas", pais: "España", lat: 28.1235, lon: -15.4363, tz: 0 },
  { grupo: "España", nombre: "Santa Cruz de Tenerife", pais: "España", lat: 28.4636, lon: -16.2518, tz: 0 },

  // Estados Unidos
  { grupo: "Estados Unidos", nombre: "Nueva York", pais: "EE. UU.", lat: 40.7128, lon: -74.006, tz: -5 },
  { grupo: "Estados Unidos", nombre: "Los Ángeles", pais: "EE. UU.", lat: 34.0522, lon: -118.2437, tz: -8 },
  { grupo: "Estados Unidos", nombre: "Chicago", pais: "EE. UU.", lat: 41.8781, lon: -87.6298, tz: -6 },
  { grupo: "Estados Unidos", nombre: "Miami", pais: "EE. UU.", lat: 25.7617, lon: -80.1918, tz: -5 },
  { grupo: "Estados Unidos", nombre: "Houston", pais: "EE. UU.", lat: 29.7604, lon: -95.3698, tz: -6 },
  { grupo: "Estados Unidos", nombre: "San Francisco", pais: "EE. UU.", lat: 37.7749, lon: -122.4194, tz: -8 },
  { grupo: "Estados Unidos", nombre: "Seattle", pais: "EE. UU.", lat: 47.6062, lon: -122.3321, tz: -8 },
  { grupo: "Estados Unidos", nombre: "Washington D. C.", pais: "EE. UU.", lat: 38.9072, lon: -77.0369, tz: -5 },
  { grupo: "Estados Unidos", nombre: "Boston", pais: "EE. UU.", lat: 42.3601, lon: -71.0589, tz: -5 },
  { grupo: "Estados Unidos", nombre: "Denver", pais: "EE. UU.", lat: 39.7392, lon: -104.9903, tz: -7 },

  // Otras ciudades
  { grupo: "Otras ciudades", nombre: "Lisboa", pais: "Portugal", lat: 38.7223, lon: -9.1393, tz: 0 },
  { grupo: "Otras ciudades", nombre: "París", pais: "Francia", lat: 48.8566, lon: 2.3522, tz: 1 },
  { grupo: "Otras ciudades", nombre: "Londres", pais: "Reino Unido", lat: 51.5074, lon: -0.1278, tz: 0 },
  { grupo: "Otras ciudades", nombre: "Roma", pais: "Italia", lat: 41.9028, lon: 12.4964, tz: 1 },
  { grupo: "Otras ciudades", nombre: "Berlín", pais: "Alemania", lat: 52.52, lon: 13.405, tz: 1 },
  { grupo: "Otras ciudades", nombre: "Ámsterdam", pais: "Países Bajos", lat: 52.3676, lon: 4.9041, tz: 1 },
  { grupo: "Otras ciudades", nombre: "Tokio", pais: "Japón", lat: 35.6762, lon: 139.6503, tz: 9 },
  { grupo: "Otras ciudades", nombre: "Sídney", pais: "Australia", lat: -33.8688, lon: 151.2093, tz: 10 },
  { grupo: "Otras ciudades", nombre: "Dubái", pais: "EAU", lat: 25.2048, lon: 55.2708, tz: 4 },
  { grupo: "Otras ciudades", nombre: "El Cairo", pais: "Egipto", lat: 30.0444, lon: 31.2357, tz: 2 },
  { grupo: "Otras ciudades", nombre: "Ciudad del Cabo", pais: "Sudáfrica", lat: -33.9249, lon: 18.4241, tz: 2 },
];

// --- Estado ------------------------------------------------------------------

let stars = [];
let constellations = [];
let listo = false;
let timer = null;

const SPOTIFY_TIPOS = new Set(["track", "album", "playlist", "artist", "episode", "show"]);
const SPOTIFY_CODE_BASE = "https://scannables.scdn.co/uri/plain/png";
const spotifyCache = new Map();

const FUENTES_FIRMA = [
  { familia: "Great Vibes", archivo: "assets/fonts/GreatVibes-Regular.woff2" },
  { familia: "Parisienne", archivo: "assets/fonts/Parisienne-Regular.woff2" },
  { familia: "Sacramento", archivo: "assets/fonts/Sacramento-Regular.woff2" },
  { familia: "Pinyon Script", archivo: "assets/fonts/PinyonScript-Regular.woff2" },
];

let spotifySeq = 0;
let spotifyUiSeq = 0;
let spotifyTimer = null;
let spotify = {
  uri: null,
  themeKey: null,
  bitmap: null,
  caption: "",
  loading: false,
  error: null,
};

function setStatus(texto) {
  $("status").textContent = texto;
}

function etiquetaZona(v) {
  const signo = v < 0 ? "−" : "+";
  const abs = Math.abs(v);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${signo}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function llenarZonas() {
  const sel = $("tz");
  for (let v = -12; v <= 14; v += 0.5) {
    const opt = document.createElement("option");
    opt.value = String(v);
    opt.textContent = etiquetaZona(v);
    sel.appendChild(opt);
  }
}

function llenarLugares() {
  const sel = $("lugarPreset");
  const grupos = new Map();
  LUGARES.forEach((l, i) => {
    if (!grupos.has(l.grupo)) {
      const g = document.createElement("optgroup");
      g.label = l.grupo;
      sel.appendChild(g);
      grupos.set(l.grupo, g);
    }
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${l.nombre}, ${l.pais}`;
    grupos.get(l.grupo).appendChild(opt);
  });
}

function ahoraLocal(tz) {
  const now = new Date(Date.now() + tz * 3600000);
  const p = (n) => String(n).padStart(2, "0");
  return {
    fecha: `${now.getUTCFullYear()}-${p(now.getUTCMonth() + 1)}-${p(now.getUTCDate())}`,
    hora: `${p(now.getUTCHours())}:${p(now.getUTCMinutes())}`,
  };
}

function aplicarLugar(l) {
  $("lugarNombre").value = `${l.nombre}, ${l.pais}`;
  $("lat").value = l.lat;
  $("lon").value = l.lon;
  $("tz").value = String(l.tz);
}

function parseSpotifyUri(raw) {
  const input = String(raw ?? "")
    .trim()
    .split(/[?#]/)[0]
    .trim();
  if (!input) return null;

  if (input.toLowerCase().startsWith("spotify:")) {
    const partes = input.split(":").map((p) => p.trim()).filter(Boolean);
    for (let i = 1; i < partes.length - 1; i++) {
      const tipo = partes[i].toLowerCase();
      const id = partes[i + 1];
      if (SPOTIFY_TIPOS.has(tipo) && /^[0-9A-Za-z]{22}$/.test(id)) {
        return `spotify:${tipo}:${id}`;
      }
    }
    return null;
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!/(^|\.)spotify\.com$/i.test(url.hostname)) return null;

  const partes = url.pathname.split("/").filter(Boolean);
  for (let i = 0; i < partes.length - 1; i++) {
    const tipo = partes[i].toLowerCase();
    const id = partes[i + 1];
    if (SPOTIFY_TIPOS.has(tipo) && /^[0-9A-Za-z]{22}$/.test(id)) {
      return `spotify:${tipo}:${id}`;
    }
  }
  return null;
}

function spotifyTema(theme) {
  return {
    bg: theme.bg.replace("#", ""),
    fg: theme.mono ? "black" : "white",
  };
}

function spotifyCodeUrl(uri, theme, size = 1280) {
  const { bg, fg } = spotifyTema(theme);
  return `${SPOTIFY_CODE_BASE}/${bg}/${fg}/${size}/${uri}`;
}

async function cargarImagenSpotify(url) {
  const res = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith("image/")) throw new Error("La respuesta no es una imagen");

  if ("createImageBitmap" in window) return createImageBitmap(blob);

  const objUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo decodificar el código"));
      img.src = objUrl;
    });
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

function cargarCodigoSpotify(uri, theme) {
  const { bg, fg } = spotifyTema(theme);
  const clave = `${uri}|${bg}|${fg}`;
  if (!spotifyCache.has(clave)) {
    spotifyCache.set(
      clave,
      cargarImagenSpotify(spotifyCodeUrl(uri, theme)).catch((err) => {
        spotifyCache.delete(clave);
        throw err;
      }),
    );
  }
  return spotifyCache.get(clave);
}

/**
 * Deja `spotify.bitmap` listo para el tema y el enlace actuales. Devuelve el
 * bitmap o null si no hay código válido o si Spotify no responde.
 */
async function asegurarCodigo(s) {
  const token = ++spotifySeq;
  const activo = $("spotifyOn").checked;
  const uri = activo ? parseSpotifyUri($("spotifyUrl").value) : null;
  const caption = $("spotifyTexto").value.trim();

  if (!uri) {
    spotify = { uri: null, themeKey: null, bitmap: null, caption: "", loading: false, error: null };
    return null;
  }

  const theme = THEMES[s.tema] ?? THEMES.noche;
  const { bg, fg } = spotifyTema(theme);
  const themeKey = `${bg}|${fg}`;

  if (spotify.uri === uri && spotify.themeKey === themeKey && spotify.bitmap) {
    spotify.caption = caption;
    return spotify.bitmap;
  }

  spotify = { uri, themeKey, bitmap: null, caption, loading: true, error: null };
  try {
    const bitmap = await cargarCodigoSpotify(uri, theme);
    if (token !== spotifySeq) return null;
    spotify.bitmap = bitmap;
    spotify.loading = false;
    spotify.error = null;
    return bitmap;
  } catch (err) {
    if (token !== spotifySeq) return null;
    spotify.loading = false;
    spotify.error = err.message;
    console.error("Código de Spotify:", err);
    return null;
  }
}

async function actualizarSpotify() {
  const uiToken = ++spotifyUiSeq;
  const activo = $("spotifyOn").checked;
  $("spotifyCampos").hidden = !activo;

  if (!activo) {
    $("spotifyEstado").textContent = "";
    $("spotifyPreviewBox").hidden = true;
    await asegurarCodigo(leer());
    programar();
    return;
  }

  const raw = $("spotifyUrl").value.trim();
  const uri = parseSpotifyUri(raw);
  if (!uri) {
    $("spotifyEstado").textContent = raw
      ? "Enlace no válido. Usa un enlace completo de open.spotify.com o un URI spotify:…"
      : "";
    $("spotifyPreviewBox").hidden = true;
    await asegurarCodigo(leer());
    programar();
    return;
  }

  $("spotifyEstado").textContent = "Cargando código de Spotify…";
  $("spotifyPreviewBox").hidden = true;
  const bitmap = await asegurarCodigo(leer());
  if (uiToken !== spotifyUiSeq) return;

  if (!bitmap) {
    $("spotifyEstado").textContent = "No se pudo cargar el código. Revisa el enlace o tu conexión.";
    $("spotifyPreviewBox").hidden = true;
    programar();
    return;
  }

  const theme = THEMES[$("tema").value] ?? THEMES.noche;
  $("spotifyPreview").src = spotifyCodeUrl(uri, theme);
  $("spotifyPreviewBox").hidden = false;
  $("spotifyEstado").textContent = "Código listo. Escanéalo desde la app de Spotify.";
  programar();
}

async function cargarFuentesFirma() {
  if (!("FontFace" in window)) return;
  await Promise.allSettled(
    FUENTES_FIRMA.map(async ({ familia, archivo }) => {
      try {
        const fuente = new FontFace(familia, `url(${archivo})`);
        await fuente.load();
        document.fonts.add(fuente);
      } catch (err) {
        console.warn(`No se pudo cargar la tipografía ${familia}:`, err);
      }
    }),
  );
}

function actualizarFirmaPreview() {
  const el = $("firmaPreview");
  if (!el) return;
  const familia = $("tipografiaNombres").value;
  el.style.fontFamily = `"${familia}", "Segoe Script", "Brush Script MT", "Apple Chancery", cursive`;
  el.textContent = $("nombres").value.trim() || "Ana & Luis";
}

function leer() {
  return {
    titulo: $("titulo").value.trim(),
    nombres: $("nombres").value.trim(),
    tipografiaNombres: $("tipografiaNombres").value,
    fecha: $("fecha").value,
    hora: $("hora").value || "00:00",
    tz: Number($("tz").value) || 0,
    lat: Math.max(-90, Math.min(90, Number($("lat").value) || 0)),
    lon: Math.max(-180, Math.min(180, Number($("lon").value) || 0)),
    lugar: $("lugarNombre").value.trim(),
    mensaje: $("mensaje").value.trim(),
    tema: $("tema").value,
    constelaciones: $("constelaciones").checked,
    viaLactea: $("viaLactea").checked,
    luna: $("luna").checked,
    cuadricula: $("cuadricula").checked,
    colorEstrellas: $("colorEstrellas").checked,
    formato: FORMATOS[$("formato").value] ? $("formato").value : "3:4",
    tamano: Number($("tamano").value) || 2400,
  };
}

function ratioFormato(formato) {
  return (FORMATOS[formato] ?? FORMATOS["3:4"]).ratio;
}

function actualizarMedidas() {
  const w = Number($("tamano").value) || 2400;
  const ratio = ratioFormato($("formato").value);
  const cm = (px) => ((px / 300) * 2.54).toFixed(1).replace(".", ",");
  $("medidas").textContent = `A 300 dpi: ${cm(w)} × ${cm(Math.round(w * ratio))} cm`;
}

function opciones(s) {
  const utcMs = localToUtcMs(s.fecha, s.hora, s.tz);
  const sky = computeSky({ utcMs, lat: s.lat, lon: s.lon });
  return {
    stars,
    constellations,
    sky,
    theme: THEMES[s.tema] ?? THEMES.noche,
    showConstellations: s.constelaciones,
    showGrid: s.cuadricula,
    showMilkyWay: s.viaLactea,
    showMoon: s.luna,
    colorStars: s.colorEstrellas,
    titulo: s.titulo || "Nuestro cielo",
    nombres: s.nombres,
    tipografiaNombres: s.tipografiaNombres,
    fechaTexto: formatFechaEs(s.fecha, s.hora),
    lugarTexto: s.lugar,
    mensaje: s.mensaje,
    spotify: spotify.bitmap ? { bitmap: spotify.bitmap, caption: spotify.caption } : null,
  };
}

function dibujar() {
  const canvas = $("preview");
  const formato = $("formato").value;
  canvas.style.aspectRatio = String(1 / ratioFormato(formato));
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  try {
    renderPoster(canvas.getContext("2d"), w, h, opciones(leer()));
    setStatus(`${stars.length.toLocaleString("es")} estrellas · ${constellations.length} constelaciones`);
  } catch (err) {
    console.error(err);
    setStatus(`No se pudo dibujar: ${err.message}`);
  }
}

function programar() {
  if (!listo) return;
  clearTimeout(timer);
  timer = setTimeout(dibujar, 70);
}

let resultadoUrl = null;

function cerrarModal() {
  $("modal").hidden = true;
}

/**
 * Guarda el PNG en la carpeta descargas/ del proyecto a través del servidor
 * local. Si la página se sirve de forma estática, devuelve null y se usa la
 * descarga normal del navegador.
 */
async function guardarEnServidor(blob, nombre) {
  try {
    const res = await fetch("/guardar", {
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        "X-Nombre": encodeURIComponent(nombre),
      },
      body: blob,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && data.ok ? data : null;
  } catch {
    return null;
  }
}

async function descargar() {
  const s = leer();
  const btn = $("descargar");
  btn.disabled = true;
  setStatus("Generando imagen en alta resolución…");
  await new Promise((r) => setTimeout(r, 30));
  try {
    const quiereCodigo =
      $("spotifyOn").checked && Boolean(parseSpotifyUri($("spotifyUrl").value));
    await asegurarCodigo(s);
    const sinCodigo = quiereCodigo && !spotify.bitmap;

    const w = s.tamano;
    const h = Math.round(w * ratioFormato(s.formato));
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    renderPoster(off.getContext("2d"), w, h, opciones(s));

    const blob = await new Promise((resolve, reject) =>
      off.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo crear el PNG"))), "image/png"),
    );

    const slug =
      (s.titulo || "mapa-estelar")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "mapa-estelar";
    const nombre = `${slug}.png`;
    const guardado = await guardarEnServidor(blob, nombre);

    // El panel de resultado siempre queda disponible, aunque el navegador
    // bloquee la descarga automática.
    const anterior = resultadoUrl;
    resultadoUrl = URL.createObjectURL(blob);
    if (anterior) setTimeout(() => URL.revokeObjectURL(anterior), 30000);

    $("resultado").src = resultadoUrl;
    $("resultadoInfo").textContent = `${nombre} · ${w} × ${h} px`;
    $("guardar").href = resultadoUrl;
    $("guardar").download = nombre;

    if (guardado) {
      $("rutaGuardada").textContent = guardado.ruta;
      $("guardadoInfo").hidden = false;
      $("abrir").href = guardado.archivo;
      $("abrir").textContent = "Abrir archivo guardado";
    } else {
      $("guardadoInfo").hidden = true;
      $("abrir").href = resultadoUrl;
      $("abrir").textContent = "Abrir en pestaña nueva";
    }

    $("modal").hidden = false;

    // Si el servidor local no pudo guardarlo, intenta la descarga del navegador.
    if (!guardado) {
      const a = document.createElement("a");
      a.href = resultadoUrl;
      a.download = nombre;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    setStatus(
      guardado
        ? `Listo: ${w} × ${h} px${sinCodigo ? " · sin código de Spotify" : ""} · guardado en ${guardado.archivo}`
        : `Listo: ${w} × ${h} px${sinCodigo ? " · sin código de Spotify" : ""} · si no se descargó, usa «Guardar PNG»`,
    );
  } catch (err) {
    console.error(err);
    setStatus("No se pudo generar la imagen.");
  } finally {
    btn.disabled = false;
  }
}

async function buscarLugar() {
  const q = $("buscar").value.trim();
  if (!q) return;
  setStatus("Buscando en OpenStreetMap…");
  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const sel = $("resultados");
    sel.innerHTML = "";
    if (!data.length) {
      sel.hidden = true;
      setStatus("Sin resultados. Prueba con otro nombre.");
      return;
    }
    for (const r of data) {
      const opt = document.createElement("option");
      opt.value = JSON.stringify({
        lat: Number(r.lat),
        lon: Number(r.lon),
        name: r.display_name.split(",").slice(0, 3).join(", "),
      });
      opt.textContent = r.display_name;
      sel.appendChild(opt);
    }
    sel.hidden = false;
    setStatus("Elige un resultado de la lista.");
  } catch (err) {
    console.error(err);
    setStatus("No se pudo buscar. Revisa tu conexión o escribe las coordenadas a mano.");
  }
}

function conectar() {
  const ids = [
    "titulo",
    "fecha",
    "hora",
    "tz",
    "lat",
    "lon",
    "lugarNombre",
    "mensaje",
    "tema",
    "constelaciones",
    "viaLactea",
    "luna",
    "cuadricula",
    "colorEstrellas",
    "formato",
    "tamano",
  ];
  for (const id of ids) {
    const el = $(id);
    el.addEventListener("input", programar);
    el.addEventListener("change", programar);
  }

  $("formato").addEventListener("change", actualizarMedidas);
  $("tamano").addEventListener("change", actualizarMedidas);

  $("spotifyOn").addEventListener("change", () => {
    $("spotifyCampos").hidden = !$("spotifyOn").checked;
    actualizarSpotify();
  });
  $("spotifyUrl").addEventListener("input", () => {
    clearTimeout(spotifyTimer);
    spotifyTimer = setTimeout(actualizarSpotify, 600);
  });
  $("spotifyUrl").addEventListener("change", () => {
    clearTimeout(spotifyTimer);
    actualizarSpotify();
  });
  $("spotifyTexto").addEventListener("input", () => {
    spotify.caption = $("spotifyTexto").value.trim();
    programar();
  });
  $("tema").addEventListener("change", () => {
    spotify.bitmap = null;
    actualizarSpotify();
  });

  $("nombres").addEventListener("input", () => {
    actualizarFirmaPreview();
    programar();
  });
  $("tipografiaNombres").addEventListener("change", () => {
    actualizarFirmaPreview();
    programar();
  });

  $("lugarPreset").addEventListener("change", () => {
    const l = LUGARES[Number($("lugarPreset").value)];
    if (!l) return;
    aplicarLugar(l);
    programar();
  });

  $("ahora").addEventListener("click", () => {
    const tz = Number($("tz").value) || 0;
    const a = ahoraLocal(tz);
    $("fecha").value = a.fecha;
    $("hora").value = a.hora;
    programar();
  });

  $("btnBuscar").addEventListener("click", buscarLugar);
  $("buscar").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarLugar();
    }
  });

  $("resultados").addEventListener("change", () => {
    const v = $("resultados").value;
    if (!v) return;
    try {
      const r = JSON.parse(v);
      $("lat").value = r.lat;
      $("lon").value = r.lon;
      $("lugarNombre").value = r.name;
      $("resultados").hidden = true;
      setStatus("Lugar actualizado. Revisa la zona horaria.");
      programar();
    } catch {
      /* ignorar */
    }
  });

  $("descargar").addEventListener("click", descargar);
  $("cerrarModal").addEventListener("click", cerrarModal);
  $("copiarRuta").addEventListener("click", async () => {
    const ruta = $("rutaGuardada").textContent;
    if (!ruta) return;
    try {
      await navigator.clipboard.writeText(ruta);
      setStatus("Ruta copiada al portapapeles.");
    } catch {
      setStatus("No se pudo copiar. Selecciona la ruta manualmente.");
    }
  });
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal")) cerrarModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("modal").hidden) cerrarModal();
  });
  window.addEventListener("pagehide", () => {
    if (resultadoUrl) URL.revokeObjectURL(resultadoUrl);
  });
  window.addEventListener("resize", programar);
}

async function cargar() {
  setStatus("Cargando catálogo de estrellas…");
  const [e, c] = await Promise.all([
    fetch("data/estrellas.json").then((r) => {
      if (!r.ok) throw new Error(`estrellas: HTTP ${r.status}`);
      return r.json();
    }),
    fetch("data/constelaciones.json").then((r) => {
      if (!r.ok) throw new Error(`constelaciones: HTTP ${r.status}`);
      return r.json();
    }),
  ]);
  stars = e.estrellas;
  constellations = c.constelaciones;
  await cargarFuentesFirma();
  actualizarFirmaPreview();
  listo = true;
  // Ganchos de desarrollo: permiten comprobar el render sin la interfaz.
  window.__renderParaPrueba = (ctx, w, h) => renderPoster(ctx, w, h, opciones(leer()));
  window.__mapaListo = true;
  dibujar();
}

function init() {
  llenarZonas();
  llenarLugares();

  const indiceBogota = LUGARES.findIndex((l) => l.nombre === "Bogotá");
  const inicial = indiceBogota >= 0 ? indiceBogota : 0;
  $("lugarPreset").value = String(inicial);
  aplicarLugar(LUGARES[inicial]);

  const ahora = ahoraLocal(LUGARES[inicial].tz);
  $("fecha").value = ahora.fecha;
  $("hora").value = ahora.hora;

  actualizarMedidas();
  actualizarFirmaPreview();
  conectar();
  cargar().catch((err) => {
    console.error(err);
    setStatus("No se pudo cargar el catálogo. Sirve la carpeta por HTTP (npm start).");
  });
}

iniciarProteccion();
init();
