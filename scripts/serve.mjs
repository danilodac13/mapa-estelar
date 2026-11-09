#!/usr/bin/env node
// Servidor estático mínimo, sin dependencias.
// Uso: node scripts/serve.mjs [puerto]
import { createServer } from "node:http";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(fileURLToPath(new URL(".", import.meta.url)), ".."));
const port = Number(process.argv[2] ?? process.env.PORT ?? 5173);
const MAX_BODY = 80 * 1024 * 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
};

function nombreSeguro(raw) {
  let nombre = decodeURIComponent(String(raw ?? "mapa-estelar.png"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!nombre.toLowerCase().endsWith(".png")) nombre += ".png";
  return nombre || "mapa-estelar.png";
}

async function rutaLibre(dir, nombre) {
  const base = nombre.replace(/\.png$/i, "");
  let candidato = nombre;
  let n = 2;
  for (;;) {
    try {
      await access(join(dir, candidato));
      candidato = `${base}-${n}.png`;
      n += 1;
    } catch {
      return join(dir, candidato);
    }
  }
}

async function guardarPng(req, res) {
  const origin = req.headers.origin;
  const permitidos = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  if (origin && !permitidos.includes(origin)) {
    json(res, 403, { ok: false, error: "Origen no permitido" });
    return;
  }

  const trozos = [];
  let total = 0;
  for await (const trozo of req) {
    total += trozo.length;
    if (total > MAX_BODY) {
      json(res, 413, { ok: false, error: "Imagen demasiado grande" });
      req.destroy();
      return;
    }
    trozos.push(trozo);
  }

  const datos = Buffer.concat(trozos);
  if (datos.length < 8 || !datos.subarray(0, 8).equals(PNG_MAGIC)) {
    json(res, 400, { ok: false, error: "El cuerpo no es un PNG válido" });
    return;
  }

  const dir = join(root, "descargas");
  await mkdir(dir, { recursive: true });
  const destino = await rutaLibre(dir, nombreSeguro(req.headers["x-nombre"]));
  await writeFile(destino, datos);

  json(res, 200, {
    ok: true,
    archivo: `descargas/${basename(destino)}`,
    ruta: destino,
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "POST" && url.pathname === "/guardar") {
      await guardarPng(req, res);
      return;
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const target = normalize(join(root, pathname));
    if (target !== root && !target.startsWith(root + sep)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("403 Prohibido");
      return;
    }

    const info = await stat(target);
    if (!info.isFile()) throw new Error("no es un archivo");

    const body = await readFile(target);
    res.writeHead(200, {
      "Content-Type": MIME[extname(target).toLowerCase()] ?? "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 No encontrado");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mapa Estelar en http://localhost:${port}`);
});
