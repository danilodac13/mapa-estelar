#!/usr/bin/env node
// Genera los catálogos del proyecto a partir de datos abiertos.
// Uso:
//   node scripts/build-catalog.mjs --hyg hygdata_v41.csv \
//     --constellations constellations.lines.json --out data
//
// Fuentes:
//   - HYG Database v4.1 (astronexus) — CC BY-SA 4.0
//   - d3-celestial (Olaf Frohn) — BSD-3-Clause
import { createReadStream } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith("--")) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const hygPath = args.hyg;
const constellationsPath = args.constellations;
const outDir = args.out ?? "data";

if (!hygPath || !constellationsPath) {
  console.error("Faltan rutas: --hyg --constellations [--out]");
  process.exit(2);
}

await mkdir(outDir, { recursive: true });

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

const round = (value, digits) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

// --- Estrellas ---------------------------------------------------------------
const stars = [];
let header = null;
let skipped = 0;

const rl = createInterface({
  input: createReadStream(hygPath, "utf8"),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  if (!line) continue;
  const fields = parseCSVLine(line);
  if (!header) {
    header = fields;
    continue;
  }

  const get = (name) => fields[header.indexOf(name)];
  const id = get("id");
  if (id === "0") continue; // el Sol no va en el mapa

  const raHours = Number(get("ra"));
  const dec = Number(get("dec"));
  const mag = Number(get("mag"));
  if (!Number.isFinite(raHours) || !Number.isFinite(dec) || !Number.isFinite(mag)) {
    skipped += 1;
    continue;
  }
  if (mag > 6.5 || dec < -90 || dec > 90) {
    skipped += 1;
    continue;
  }

  const ciRaw = get("ci");
  const ci = ciRaw === "" ? null : Number(ciRaw);

  let name = get("proper") ?? "";
  if (!name && mag <= 4.5) {
    const bayer = get("bayer") ?? "";
    const flam = get("flam") ?? "";
    const con = get("con") ?? "";
    if (bayer && con) name = `${bayer} ${con}`;
    else if (flam && con) name = `${flam} ${con}`;
  }

  stars.push([
    round(raHours, 5),
    round(dec, 4),
    round(mag, 2),
    ci === null || !Number.isFinite(ci) ? null : round(ci, 2),
    name || "",
  ]);
}

stars.sort((a, b) => a[2] - b[2]);

await writeFile(
  join(outDir, "estrellas.json"),
  JSON.stringify({ fuente: "HYG Database v4.1", unidadRa: "horas", estrellas: stars }),
);

// --- Constelaciones ----------------------------------------------------------
const constellationsRaw = JSON.parse(await readFile(constellationsPath, "utf8"));
const constellations = constellationsRaw.features.map((feature) => ({
  id: feature.id,
  lineas: (feature.geometry.coordinates ?? []).map((line) =>
    line.map(([ra, dec]) => [round(ra, 3), round(dec, 3)]),
  ),
}));

await writeFile(
  join(outDir, "constelaciones.json"),
  JSON.stringify({ fuente: "d3-celestial", unidadRa: "grados", constelaciones: constellations }),
);

console.log(`Estrellas: ${stars.length} (omitidas ${skipped})`);
console.log(`Constelaciones: ${constellations.length}`);
console.log(`Salida: ${outDir}`);
