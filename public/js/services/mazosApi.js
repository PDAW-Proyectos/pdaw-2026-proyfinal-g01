import { ApiError, api } from "../api.js"

function normalizarListaCartas(entradas) {
  if (!Array.isArray(entradas)) {
    throw new Error("La API de mazos devolvió una lista inválida.")
  }

  return entradas.flatMap(({ carta, cantidad }) => {
    if (
      !carta ||
      typeof carta !== "object" ||
      !Number.isSafeInteger(carta.id) ||
      typeof carta.name !== "string" ||
      !Number.isSafeInteger(cantidad) ||
      cantidad < 1
    ) {
      throw new Error("La API de mazos devolvió una carta inválida.")
    }

    return Array.from({ length: cantidad }, () => carta)
  })
}

function normalizarMazo(mazo) {
  return {
    ...mazo,
    mainDeck: normalizarListaCartas(mazo.mainDeck),
    extraDeck: normalizarListaCartas(mazo.extraDeck)
  }
}

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
  return respuesta.datos.map(normalizarMazo)
}

/**
 * Obtiene un mazo con los datos de sus cartas para mostrar su detalle público.
 * @param {number|string} idMazo
 * @returns {Promise<Object>}
 */
export async function obtenerMazoPorId(idMazo) {
  const id = Number(idMazo)
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("El ID del mazo debe ser un entero positivo.")
  }

  const respuesta = await api(`/api/mazos/${encodeURIComponent(id)}`)
  if (
    !respuesta ||
    typeof respuesta !== "object" ||
    Number(respuesta.id) !== id ||
    !Array.isArray(respuesta.mainDeck) ||
    !Array.isArray(respuesta.extraDeck)
  ) {
    throw new Error("La API de mazos devolvió un detalle inválido.")
  }

  return normalizarMazo(respuesta)
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
