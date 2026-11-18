import { Carousel, Dialog } from "../bootstrap/bootstrap.bundle.min.js"

let temporizadorToast

/**
 * Obtiene un elemento del DOM por su ID o lanza un error si no existe.
 * @param {string} id
 * @returns {HTMLElement}
 */
export function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontró el elemento requerido #${id}.`)
  }
  return elemento
}

/**
 * Inicializa o reinicia una instancia de carrusel de Bootstrap 6.
 * @param {HTMLElement} elemento
 * @param {Object} [opciones={}]
 */
export function inicializarCarruselBootstrap(elemento, opciones = {}) {
  const ClaseCarrusel = Carousel ?? globalThis.bootstrap?.Carousel
  if (!ClaseCarrusel) return
  ClaseCarrusel.getInstance(elemento)?.dispose()
  ClaseCarrusel.getOrCreateInstance(elemento, opciones)
}

/**
 * Cierra un diálogo de Bootstrap 6 o `<dialog>` nativo.
 * @param {HTMLDialogElement|HTMLElement} dialogo
 */
export function cerrarDialogoBootstrap(dialogo) {
  if (!dialogo) return
  const ClaseDialogo = Dialog ?? globalThis.bootstrap?.Dialog
  if (ClaseDialogo) {
    ClaseDialogo.getOrCreateInstance(dialogo).hide()
  } else {
    dialogo.close?.()
  }
}

/**
 * Muestra un mensaje temporal en el elemento `#toast`.
 * @param {string} mensaje
 * @param {boolean} [esError=false]
 */
export function mostrarToast(mensaje, esError = false) {
  const toast = obtenerElemento("toast")
  clearTimeout(temporizadorToast)
  toast.textContent = mensaje
  toast.classList.toggle("error", esError)
  toast.classList.add("visible", "show")
  temporizadorToast = setTimeout(() => {
    toast.classList.remove("visible", "show", "error")
  }, 3200)
}
