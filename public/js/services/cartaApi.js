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
