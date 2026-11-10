/**
 * Obtiene las cartas del backend, que mantiene sincronizada su copia local con
 * la API de Yu-Gi-Oh! y entrega los datos en formato JSON.
 * @returns {Promise<Array<Object>>}
 */
export async function obtenerCartas() {
  const respuesta = await fetch("/api/cartas")

  if (!respuesta.ok) {
    throw new Error(`La API de cartas respondio con HTTP ${respuesta.status}.`)
  }

  const cartas = await respuesta.json()
  if (!Array.isArray(cartas) || cartas.length === 0) {
    throw new Error("La API de cartas no devolvio una lista de cartas.")
  }

  return cartas
}

/**
 * Obtiene desde el backend los datos completos de una carta por su ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function obtenerCartaPorId(id) {
  const idNumerico = Number(id)
  const idValido =
    (typeof id === "number" && Number.isSafeInteger(idNumerico) && idNumerico > 0) ||
    (typeof id === "string" && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(idNumerico))
  if (!idValido) {
    throw new Error("El ID de la carta debe ser un entero positivo.")
  }

  const respuesta = await fetch(`/api/cartas/${encodeURIComponent(idNumerico)}`)
  if (!respuesta.ok) {
    throw new Error(`La API de cartas respondió con HTTP ${respuesta.status}.`)
  }

  const carta = await respuesta.json()
  if (!carta || typeof carta !== "object" || Number(carta.id) !== idNumerico) {
    throw new Error("La API de cartas devolvió un detalle inválido.")
  }

  return carta
}

/**
 * Busca cartas en el backend, que consulta su catálogo sincronizado con YGOProDeck.
 * Los filtros opcionales admitidos son `name` y `race`.
 * @param {{name: string, race?: string}} filtros
 * @param {{signal?: AbortSignal}} [opciones]
 * @returns {Promise<Array<Object>>} Una lista vacía si no hay coincidencias.
 */
export async function buscarCartas(filtros, { signal } = {}) {
  const parametros = new URLSearchParams({ name: filtros.name })
  if (filtros.race) {
    parametros.set("race", filtros.race)
  }

  const respuesta = await fetch(`/api/cartas?${parametros.toString()}`, { signal })
  if (respuesta.status === 404) {
    return []
  }
  if (!respuesta.ok) {
    throw new Error(`La búsqueda de cartas respondió con HTTP ${respuesta.status}.`)
  }

  const cartas = await respuesta.json()
  if (!Array.isArray(cartas)) {
    throw new Error("La API de cartas devolvió un formato de búsqueda inválido.")
  }

  return cartas
}
