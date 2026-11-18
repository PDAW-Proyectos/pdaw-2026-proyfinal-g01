import { ApiError, api } from "../api.js"

/**
 * Confirma que la petición pertenece a una sesión autenticada.
 * @returns {Promise<Object>}
 */
export function verificarSesionMazos() {
  return api("/api/usuarios/me")
}

/**
 * Obtiene los mazos del usuario actual (`GET /api/mazos`).
 * Si el backend responde 404 porque todavía no tiene mazos, devuelve `[]`.
 * @returns {Promise<Array<Object>>}
 */
export async function listarMazosPropios() {
  try {
    const { datos } = await api("/api/mazos")
    return datos
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return []
    }
    throw error
  }
}

/**
 * Obtiene los mazos creados en la base de datos (`GET /api/mazos?all=true&page=...`).
 * Si el backend responde 404 en la primera página porque aún no hay mazos, devuelve una lista vacía.
 * @param {number|{page?: number, all?: boolean}} [paginaOOpciones=1]
 * @param {{signal?: AbortSignal}} [opciones]
 * @returns {Promise<{datos: Array<Object>, paginacion: Object}>}
 */
export async function listarMazos(paginaOOpciones = 1, { signal } = {}) {
  const opciones =
    typeof paginaOOpciones === "object" && paginaOOpciones !== null
      ? paginaOOpciones
      : { page: paginaOOpciones }

  const pagina = Math.max(1, Number(opciones.page) || 1)
  const params = new URLSearchParams({
    all: String(opciones.all ?? true),
    page: String(pagina)
  })

  try {
    return await api(`/api/mazos?${params.toString()}`, { signal })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && pagina === 1) {
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
 * Obtiene los mazos competitivos populares (`GET /api/mazos/populares`).
 * @returns {Promise<Array<Object>>}
 */
export function listarMazosPopulares() {
  return api("/api/mazos/populares")
}

/**
 * Obtiene un mazo (propio/público o popular) por su ID.
 * @param {number|string} idMazo
 * @param {{popular?: boolean}} [opciones]
 * @returns {Promise<Object>}
 */
export function obtenerMazoPorId(idMazo, { popular = false } = {}) {
  const ruta = popular
    ? `/api/mazos/populares/${encodeURIComponent(idMazo)}`
    : `/api/mazos/${encodeURIComponent(idMazo)}`
  return api(ruta)
}

/**
 * Alias para obtener un mazo popular por su ID.
 * @param {number|string} idMazo
 * @returns {Promise<Object>}
 */
export function obtenerMazoPopularPorId(idMazo) {
  return obtenerMazoPorId(idMazo, { popular: true })
}

/**
 * Crea un mazo vacío para el usuario de la sesión (`POST /api/mazos`).
 * @param {string} nombre
 * @returns {Promise<Object>}
 */
export function crearMazo(nombre) {
  return api("/api/mazos", {
    method: "POST",
    body: { nombre }
  })
}

/**
 * Elimina un mazo perteneciente al usuario de la sesión (`DELETE /api/mazos/:id`).
 * @param {number|string} idMazo
 * @returns {Promise<null>}
 */
export function eliminarMazo(idMazo) {
  return api(`/api/mazos/${encodeURIComponent(idMazo)}`, {
    method: "DELETE"
  })
}

/**
 * Agrega una copia de una carta al mazo (`POST /api/mazos/:id/cartas`).
 * @param {number|string} idMazo
 * @param {number|string} idCarta
 * @returns {Promise<Object>}
 */
export function agregarCartaAlMazo(idMazo, idCarta) {
  return api(`/api/mazos/${encodeURIComponent(idMazo)}/cartas`, {
    method: "POST",
    body: { idCarta: Number(idCarta) }
  })
}

/**
 * Quita una copia de la carta del mazo (`DELETE /api/mazos/:id/cartas/:idCarta`).
 * @param {number|string} idMazo
 * @param {number|string} idCarta
 * @returns {Promise<Object>}
 */
export function quitarCartaDelMazo(idMazo, idCarta) {
  return api(
    `/api/mazos/${encodeURIComponent(idMazo)}/cartas/${encodeURIComponent(idCarta)}`,
    { method: "DELETE" }
  )
}

export const servicioMazos = {
  verificarSesionMazos,
  listarMazosPropios,
  listarMazos,
  listarMazosPopulares,
  obtenerMazoPorId,
  obtenerMazoPopularPorId,
  crearMazo,
  eliminarMazo,
  agregarCartaAlMazo,
  quitarCartaDelMazo
}
