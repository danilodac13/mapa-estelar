// Astronomía básica: tiempo sidéreo, precesión, coordenadas horizontales
// y posiciones aproximadas de Sol y Luna. Sin dependencias.

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export const normalize360 = (deg) => ((deg % 360) + 360) % 360;

/** Fecha juliana a partir de milisegundos UTC. */
export function julianDate(utcMs) {
  return utcMs / 86400000 + 2440587.5;
}

/** Tiempo sidéreo medio de Greenwich, en grados. */
export function gmst(jd) {
  const t = (jd - 2451545.0) / 36525;
  const deg =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return normalize360(deg);
}

/** Tiempo sidéreo local (grados) para una longitud este positiva. */
export function localSiderealTime(jd, lonDeg) {
  return normalize360(gmst(jd) + lonDeg);
}

/**
 * Precesión de coordenadas J2000 a la fecha juliana indicada.
 * Fórmulas de Meeus (precesión ecuatorial, IAU 1976).
 */
export function precess(raDeg, decDeg, jd) {
  const t = (jd - 2451545.0) / 36525;
  const zeta = (2306.2181 * t + 0.30188 * t * t + 0.017998 * t * t * t) / 3600;
  const z = (2306.2181 * t + 1.09468 * t * t + 0.018203 * t * t * t) / 3600;
  const theta = (2004.3109 * t - 0.42665 * t * t - 0.041833 * t * t * t) / 3600;

  const ra0 = raDeg * DEG;
  const dec0 = decDeg * DEG;
  const zetaR = zeta * DEG;
  const zR = z * DEG;
  const thetaR = theta * DEG;

  const a = Math.cos(dec0) * Math.sin(ra0 + zetaR);
  const b =
    Math.cos(thetaR) * Math.cos(dec0) * Math.cos(ra0 + zetaR) -
    Math.sin(thetaR) * Math.sin(dec0);
  const c =
    Math.sin(thetaR) * Math.cos(dec0) * Math.cos(ra0 + zetaR) +
    Math.cos(thetaR) * Math.sin(dec0);

  return [
    normalize360(Math.atan2(a, b) * RAD + z),
    Math.asin(Math.max(-1, Math.min(1, c))) * RAD,
  ];
}

/**
 * Coordenadas ecuatoriales (de la fecha) a horizontales.
 * Azimut medido desde el norte, hacia el este.
 */
export function toHorizontal(raDeg, decDeg, lstDeg, latDeg) {
  const h = (lstDeg - raDeg) * DEG;
  const dec = decDeg * DEG;
  const lat = latDeg * DEG;

  const sinAlt =
    Math.sin(dec) * Math.sin(lat) +
    Math.cos(dec) * Math.cos(lat) * Math.cos(h);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const az = Math.atan2(
    -Math.cos(dec) * Math.sin(h),
    Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(h),
  );

  return { alt: alt * RAD, az: normalize360(az * RAD) };
}

/**
 * Proyección estereográfica cenital.
 * Devuelve coordenadas relativas al centro del disco.
 * Norte arriba, Este a la izquierda (vista desde dentro del cielo).
 */
export function project(altDeg, azDeg, radius) {
  const alt = Math.max(-85, Math.min(90, altDeg)) * DEG;
  const r = radius * Math.tan((Math.PI / 2 - alt) / 2);
  const az = azDeg * DEG;
  return { x: -r * Math.sin(az), y: -r * Math.cos(az), r };
}

/**
 * Coordenadas galácticas (l, b) a ecuatoriales J2000 (RA, Dec) en grados.
 * Matriz estándar J2000 (galáctico -> ecuatorial).
 */
export function galacticToEquatorial(lDeg, bDeg) {
  const l = lDeg * DEG;
  const b = bDeg * DEG;
  const cl = Math.cos(l);
  const sl = Math.sin(l);
  const cb = Math.cos(b);
  const sb = Math.sin(b);

  const x = -0.0548755604 * cl * cb + 0.4941094279 * sl * cb - 0.867666149 * sb;
  const y = -0.8734370902 * cl * cb - 0.44482963 * sl * cb - 0.1980763734 * sb;
  const z = -0.4838350155 * cl * cb + 0.7469822445 * sl * cb + 0.4559837762 * sb;

  return [
    normalize360(Math.atan2(y, x) * RAD),
    Math.asin(Math.max(-1, Math.min(1, z))) * RAD,
  ];
}

// --- Sol ---------------------------------------------------------------------

function sunEquatorial(d) {
  const w = (282.9404 + 4.70935e-5 * d) * DEG;
  const e = 0.016709 - 1.151e-9 * d;
  const m = normalize360(356.047 + 0.9856002585 * d) * DEG;

  let ecc = m + e * Math.sin(m) * (1 + e * Math.cos(m));
  for (let i = 0; i < 4; i += 1) {
    ecc -= (ecc - e * Math.sin(ecc) - m) / (1 - e * Math.cos(ecc));
  }

  const x = Math.cos(ecc) - e;
  const y = Math.sqrt(1 - e * e) * Math.sin(ecc);
  const v = Math.atan2(y, x);
  const lon = v + w;
  const r = Math.hypot(x, y);

  const obl = (23.4393 - 3.563e-7 * d) * DEG;
  const xe = r * Math.cos(lon);
  const ye = r * Math.sin(lon) * Math.cos(obl);
  const ze = r * Math.sin(lon) * Math.sin(obl);

  return {
    lonDeg: normalize360(lon * RAD),
    raDeg: normalize360(Math.atan2(ye, xe) * RAD),
    decDeg: Math.atan2(ze, Math.hypot(xe, ye)) * RAD,
  };
}

// --- Luna --------------------------------------------------------------------

function moonEquatorial(d, sun) {
  const node = normalize360(125.1228 - 0.0529538083 * d) * DEG;
  const inc = 5.1454 * DEG;
  const peri = normalize360(318.0634 + 0.1643573223 * d) * DEG;
  const a = 60.2666;
  const e = 0.0549;
  const m = normalize360(115.3654 + 13.0649929509 * d) * DEG;

  let ecc = m + e * Math.sin(m) * (1 + e * Math.cos(m));
  for (let i = 0; i < 6; i += 1) {
    ecc -= (ecc - e * Math.sin(ecc) - m) / (1 - e * Math.cos(ecc));
  }

  const xv = a * (Math.cos(ecc) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(ecc);
  const v = Math.atan2(yv, xv);
  const r = Math.hypot(xv, yv);

  const xh =
    r * (Math.cos(node) * Math.cos(v + peri) -
      Math.sin(node) * Math.sin(v + peri) * Math.cos(inc));
  const yh =
    r * (Math.sin(node) * Math.cos(v + peri) +
      Math.cos(node) * Math.sin(v + peri) * Math.cos(inc));
  const zh = r * Math.sin(v + peri) * Math.sin(inc);

  let lonDeg = normalize360(Math.atan2(yh, xh) * RAD);
  let latDeg = Math.atan2(zh, Math.hypot(xh, yh)) * RAD;

  // Perturbaciones principales (Schlyter).
  const ls = sun.lonDeg;
  const lm = normalize360((node + peri + m) * RAD);
  const ms = normalize360(356.047 + 0.9856002585 * d);
  const mm = normalize360(115.3654 + 13.0649929509 * d);
  const dElong = normalize360(lm - ls);
  const f = normalize360(lm - node * RAD);
  const sin = (deg) => Math.sin(deg * DEG);

  lonDeg +=
    -1.274 * sin(mm - 2 * dElong) +
    0.658 * sin(2 * dElong) -
    0.186 * sin(ms) -
    0.059 * sin(2 * mm - 2 * dElong) -
    0.057 * sin(mm - 2 * dElong + ms) +
    0.053 * sin(mm + 2 * dElong) +
    0.046 * sin(2 * dElong - ms) +
    0.041 * sin(mm - ms) -
    0.035 * sin(dElong) -
    0.031 * sin(mm + ms) -
    0.015 * sin(2 * f - 2 * dElong) +
    0.011 * sin(mm - 4 * dElong);

  latDeg +=
    -0.173 * sin(f - 2 * dElong) -
    0.055 * sin(mm - f - 2 * dElong) -
    0.046 * sin(mm + f - 2 * dElong) +
    0.033 * sin(f + 2 * dElong) +
    0.017 * sin(2 * mm + f);

  lonDeg = normalize360(lonDeg);

  const obl = (23.4393 - 3.563e-7 * d) * DEG;
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const xe = Math.cos(lat) * Math.cos(lon);
  const ye = Math.cos(lat) * Math.sin(lon);
  const ze = Math.sin(lat);

  const xq = xe;
  const yq = ye * Math.cos(obl) - ze * Math.sin(obl);
  const zq = ye * Math.sin(obl) + ze * Math.cos(obl);

  const elong =
    Math.acos(
      Math.max(
        -1,
        Math.min(1, Math.cos(lat) * Math.cos((lonDeg - sun.lonDeg) * DEG)),
      ),
    ) * RAD;

  const fase = (1 - Math.cos(elong * DEG)) / 2;
  const edad = (normalize360(lonDeg - sun.lonDeg) / 360) * 29.530588;
  const creciente = normalize360(lonDeg - sun.lonDeg) < 180;

  return {
    raDeg: normalize360(Math.atan2(yq, xq) * RAD),
    decDeg: Math.atan2(zq, Math.hypot(xq, yq)) * RAD,
    fase,
    edad,
    creciente,
  };
}

/**
 * Prepara el cielo para un instante y lugar.
 * utcMs: instante en milisegundos UTC.
 * lat: latitud en grados (norte positiva).
 * lon: longitud en grados (este positiva).
 */
export function computeSky({ utcMs, lat, lon }) {
  const jd = julianDate(utcMs);
  const lst = localSiderealTime(jd, lon);
  const d = jd - 2451543.5;
  const sun = sunEquatorial(d);
  const moon = moonEquatorial(d, sun);

  return {
    jd,
    lst,
    lat,
    lon,
    sun,
    moon,
    /** Estrella del catálogo (RA en horas, Dec en grados, J2000). */
    star(raHours, decDeg) {
      const [ra, dec] = precess(raHours * 15, decDeg, jd);
      return toHorizontal(ra, dec, lst, lat);
    },
    /** Punto en coordenadas ecuatoriales J2000 (grados). */
    equatorial(raDeg, decDeg) {
      const [ra, dec] = precess(raDeg, decDeg, jd);
      return toHorizontal(ra, dec, lst, lat);
    },
    /** Sol / Luna ya vienen en coordenadas de la fecha. */
    body(raDeg, decDeg) {
      return toHorizontal(raDeg, decDeg, lst, lat);
    },
  };
}

// --- Utilidades de fecha -----------------------------------------------------

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2024-02-14" + "21:30" -> "14 de febrero de 2024 · 21:30" */
export function formatFechaEs(fechaISO, hora) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-").map(Number);
  if (!y || !m || !d) return "";
  const mes = MESES[m - 1] ?? "";
  const h = hora ? ` · ${hora}` : "";
  return `${d} de ${mes} de ${y}${h}`;
}

/** Convierte fecha/hora local + offset a milisegundos UTC. */
export function localToUtcMs(fechaISO, hora, tzOffsetHours) {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const [hh, mm] = (hora || "00:00").split(":").map(Number);
  if (!y || !m || !d) return Date.now();
  return Date.UTC(y, m - 1, d, hh || 0, mm || 0) - tzOffsetHours * 3600000;
}
