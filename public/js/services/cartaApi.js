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
