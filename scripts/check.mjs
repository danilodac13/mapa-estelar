// Verificación del render vía Chrome DevTools Protocol. Solo para desarrollo.
// Uso: node scripts/check.mjs [url] [puertoCDP]
const url = process.argv[2] ?? "http://localhost:5173/";
const port = Number(process.argv[3] ?? 9333);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  if (!res.ok) throw new Error(`CDP ${path}: HTTP ${res.status}`);
  return res.json();
}

let target = null;
for (let i = 0; i < 60; i += 1) {
  try {
    const list = await json("/json/list");
    target = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (target) break;
  } catch {
    /* aún arrancando */
  }
  await sleep(250);
}
if (!target) throw new Error("No se encontró una pestaña depurable");

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();
const logs = [];

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
    logs.push(`[${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push("[exception] " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression, awaitPromise = true) => {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
};

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url });

let ready = false;
for (let i = 0; i < 120; i += 1) {
  await sleep(250);
  try {
    ready = await evaluate("Boolean(window.__mapaListo) || document.getElementById('status')?.textContent.includes('estrellas')", false);
  } catch {
    ready = false;
  }
  if (ready) break;
}

const diag = await evaluate(`(() => {
  const c = document.getElementById("preview");
  const ctx = c.getContext("2d");
  const { width, height } = c;
  const data = ctx.getImageData(0, 0, width, height).data;
  let lit = 0, gold = 0, blue = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0) continue;
    if (r + g + b > 150) lit++;
    if (r > 150 && g > 120 && b < 120) gold++;
    if (b > 150 && r < 150) blue++;
  }
  return {
    status: document.getElementById("status").textContent,
    canvas: { width, height, pixels: width * height, lit, gold, blue },
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    lugar: document.getElementById("lugarNombre").value,
    lat: document.getElementById("lat").value,
    lon: document.getElementById("lon").value,
    tz: document.getElementById("tz").value,
    opciones: document.querySelectorAll("#lugarPreset option").length,
    canvasVisible: c.getBoundingClientRect().width > 100
  };
})()`);

const exportCheck = await evaluate(`(async () => {
  const c = document.getElementById("preview");
  const src = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  const off = document.createElement("canvas");
  off.width = 1200; off.height = 1600;
  const t0 = performance.now();
  window.__renderParaPrueba(off.getContext("2d"), 1200, 1600);
  const ms = Math.round(performance.now() - t0);
  const blob = await new Promise((r) => off.toBlob(r, "image/png"));
  const sample = off.getContext("2d").getImageData(0, 0, 1200, 1600).data;
  let lit = 0;
  for (let i = 0; i < sample.length; i += 4) if (sample[i] + sample[i+1] + sample[i+2] > 150) lit++;
  return { ms, pngBytes: blob ? blob.size : 0, lit, previewBytes: src.length };
})()`);

// --- Cambio de tema ---------------------------------------------------------
const temaCheck = await evaluate(`(async () => {
  const sel = document.getElementById("tema");
  sel.value = "sepia";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400));
  const c = document.getElementById("preview");
  const px = c.getContext("2d").getImageData(8, 8, 1, 1).data;
  sel.value = "noche";
  sel.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 400));
  const px2 = c.getContext("2d").getImageData(8, 8, 1, 1).data;
  return { sepia: [...px], noche: [...px2] };
})()`);

// --- Descarga real ----------------------------------------------------------
const { mkdtemp, readdir, stat } = await import("node:fs/promises");
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
const downloadDir = await mkdtemp(join(tmpdir(), "mapa-dl-"));
await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });

await evaluate(`(() => {
  const s = document.getElementById("tamano");
  s.value = "1800";
  s.dispatchEvent(new Event("change", { bubbles: true }));
  document.getElementById("descargar").click();
  return true;
})()`, false);

let descarga = null;
for (let i = 0; i < 60; i += 1) {
  await sleep(500);
  const files = (await readdir(downloadDir)).filter((f) => f.endsWith(".png"));
  if (files.length) {
    const info = await stat(join(downloadDir, files[0]));
    if (info.size > 10000) {
      descarga = { archivo: files[0], bytes: info.size };
      break;
    }
  }
}

console.log(JSON.stringify({ ready, diag, exportCheck, temaCheck, descarga, logs }, null, 2));
ws.close();
