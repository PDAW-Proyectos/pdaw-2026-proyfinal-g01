import { Carousel } from "../bootstrap/bootstrap.bundle.min.js"

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
