import { ApiError, api } from "../api.js"

/**
 * Confirma que la petición pertenece a una sesión autenticada.
 * @returns {Promise<Object>} Perfil del usuario autenticado.
 */
export function verificarSesionMazos() {
  return api("/api/usuarios/me")
}

/**
 * Obtiene los mazos del usuario actual. El backend usa 404 cuando todavía no
 * tiene mazos; para la interfaz ese caso equivale a una lista vacía.
 * @returns {Promise<Array<Object>>}
 */
export async function listarMazosPropios() {
  let respuesta
  try {
    respuesta = await api("/api/mazos")
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return []
    }
    throw error
  }

  if (!Array.isArray(respuesta?.datos)) {
    throw new Error("La API de mazos devolvió una lista inválida.")
  }
  return respuesta.datos
}

/**
 * Crea un mazo vacío para el usuario de la sesión.
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
 * Agrega una carta; el servidor decide si pertenece al Main o Extra Deck.
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
 * Quita una copia de la carta del mazo.
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
