import { ApiError, api } from "../api.js"

/**
 * Obtiene las cartas populares desde `/api/cartas/populares`.
 * @returns {Promise<Array<Object>>}
 */
export function obtenerCartasPopulares() {
  return api("/api/cartas/populares")
}

/**
 * Obtiene el detalle de una carta por su ID desde `/api/cartas/:id`.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export function obtenerCartaPorId(id) {
  return api(`/api/cartas/${encodeURIComponent(id)}`)
}

/**
 * Busca cartas paginadas en `/api/cartas` aplicando filtros y ordenamiento.
 * @param {Record<string, *>} [filtros]
 * @param {{signal?: AbortSignal}} [opciones]
 * @returns {Promise<{datos: Array<Object>, paginacion: Object}>}
 */
export async function buscarCartasPaginadas(filtros = {}, { signal } = {}) {
  const query = new URLSearchParams(filtros).toString()
  try {
    return await api(query ? `/api/cartas?${query}` : "/api/cartas", { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        datos: [],
        paginacion: {
          paginaActual: 1,
          totalPaginas: 0,
          totalEntradas: 0,
          tieneAnterior: false,
          tieneSiguiente: false
        }
      }
    }
    throw error
  }
}

/**
 * Busca cartas y devuelve únicamente el arreglo `datos`.
 * @param {Record<string, *>} [filtros]
 * @param {{signal?: AbortSignal}} [opciones]
 * @returns {Promise<Array<Object>>}
 */
export async function buscarCartas(filtros = {}, { signal } = {}) {
  const { datos } = await buscarCartasPaginadas(filtros, { signal })
  return datos
}

export const servicioCartas = {
  obtenerCartasPopulares,
  obtenerCartaPorId,
  buscarCartasPaginadas,
  buscarCartas
}
