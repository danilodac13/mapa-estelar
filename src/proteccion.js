// Disuasión de inspección. No es seguridad real: el navegador siempre descarga
// el HTML, el CSS y el JavaScript para poder mostrarlos, así que cualquier
// persona con conocimientos puede saltarse esto. Sirve para frenar curiosos,
// no para proteger secretos.
//
// Modo desarrollo (para ti): abre la página con ?dev=1 o ejecuta en la consola
// localStorage.setItem("mapaEstelarDev", "1") y recarga.

const CLAVE_MODO_DEV = "mapaEstelarDev";
const CLAVE_AVISO_VISTO = "mapaEstelarAvisoVisto";

function modoDesarrollo() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.has("dev") || params.get("modo") === "dev") return true;
    if (localStorage.getItem(CLAVE_MODO_DEV) === "1") return true;
  } catch {
    // localStorage puede estar bloqueado; seguimos con la protección.
  }
  return false;
}

function esCampo(el) {
  return Boolean(
    el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT" ||
        el.isContentEditable),
  );
}

function permiteContexto(el) {
  if (esCampo(el)) return true;
  // En la tarjeta de resultado se permite para poder guardar la imagen.
  return Boolean(el?.closest?.("#resultado, .modal, a"));
}

let aviso = null;

function crearAviso() {
  if (aviso) return aviso;

  aviso = document.createElement("div");
  aviso.className = "aviso-inspeccion";
  aviso.id = "avisoInspeccion";
  aviso.setAttribute("role", "alertdialog");
  aviso.setAttribute("aria-modal", "true");
  aviso.setAttribute("aria-labelledby", "avisoInspeccionTitulo");
  aviso.hidden = true;

  const card = document.createElement("div");
  card.className = "aviso-card";

  const titulo = document.createElement("h2");
  titulo.id = "avisoInspeccionTitulo";
  titulo.textContent = "Inspección deshabilitada";

  const texto = document.createElement("p");
  texto.textContent =
    "Esta página oculta su código por cortesía. Si necesitas revisarlo, usa el modo de desarrollo.";

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "ghost";
  boton.textContent = "Volver";
  boton.addEventListener("click", () => {
    aviso.hidden = true;
    try {
      sessionStorage.setItem(CLAVE_AVISO_VISTO, "1");
    } catch {
      // Sin sessionStorage el aviso simplemente puede reaparecer.
    }
  });

  card.append(titulo, texto, boton);
  aviso.append(card);
  document.body.append(aviso);
  return aviso;
}

function mostrarAviso() {
  if (modoDesarrollo()) return;
  crearAviso().hidden = false;
}

function bloquearContexto(evento) {
  if (permiteContexto(evento.target)) return;
  evento.preventDefault();
}

function bloquearAtajos(evento) {
  const tecla = String(evento.key || "").toLowerCase();
  const ctrl = evento.ctrlKey || evento.metaKey;
  const bloqueado =
    evento.key === "F12" ||
    evento.key === "ContextMenu" ||
    (evento.shiftKey && evento.key === "F10") ||
    (ctrl && evento.shiftKey && ["i", "j", "c", "k"].includes(tecla)) ||
    (ctrl && ["u", "s"].includes(tecla)) ||
    (evento.metaKey && evento.altKey && ["i", "j", "c", "u"].includes(tecla));

  if (!bloqueado) return;
  evento.preventDefault();
  evento.stopPropagation();
  mostrarAviso();
}

function bloquearArrastre(evento) {
  if (evento.target instanceof HTMLCanvasElement) {
    evento.preventDefault();
  }
}

function avisoYaVisto() {
  try {
    return sessionStorage.getItem(CLAVE_AVISO_VISTO) === "1";
  } catch {
    return false;
  }
}

function detectarPanel() {
  if (modoDesarrollo() || avisoYaVisto()) return;
  // Heurística: el panel acoplado abajo reduce mucho la altura interior.
  // No detecta el panel flotante ni el acoplado a la derecha, y puede fallar
  // con ventanas muy pequeñas. Por eso el aviso se puede cerrar.
  const altoOcupado = window.outerHeight - window.innerHeight;
  if (altoOcupado > 320) mostrarAviso();
}

export function iniciarProteccion() {
  if (modoDesarrollo()) {
    console.info("Modo desarrollo: la protección de inspección está desactivada.");
    return;
  }

  document.addEventListener("contextmenu", bloquearContexto);
  document.addEventListener("keydown", bloquearAtajos, true);
  document.addEventListener("dragstart", bloquearArrastre);

  window.addEventListener("resize", detectarPanel);
  const temporizador = window.setInterval(detectarPanel, 1500);
  window.addEventListener("pagehide", () => window.clearInterval(temporizador), { once: true });
}
