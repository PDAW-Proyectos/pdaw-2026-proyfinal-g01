export const LIMITE_MAIN_DECK = 60
export const LIMITE_EXTRA_DECK = 15

/**
 * Construye la URL hacia la página de detalle de un mazo (`mazo.html?id=...`).
 * @param {Object|number|string} mazoOId
 * @param {{popular?: boolean}} [opciones]
 * @returns {string}
 */
export function crearUrlDetalleMazo(mazoOId, { popular = false } = {}) {
  const id = typeof mazoOId === "object" ? mazoOId.id : mazoOId
  return `mazo.html?id=${encodeURIComponent(id)}${popular ? "&popular=true" : ""}`
}

/**
 * Suma la cantidad de copias de todas las entradas `{ carta, cantidad }` de una zona del mazo.
 * @param {Array<{carta: Object, cantidad: number}>} [entradas=[]]
 * @returns {number}
 */
export function contarCartasZona(entradas = []) {
  return entradas.reduce((total, { cantidad }) => total + cantidad, 0)
}

/**
 * Cuenta el total de cartas de un mazo sumando las cantidades de `mainDeck` y `extraDeck`.
 * @param {Object} mazo
 * @returns {number}
 */
export function contarCartasMazo(mazo) {
  if (!mazo) return 0
  return contarCartasZona(mazo.mainDeck) + contarCartasZona(mazo.extraDeck)
}

/**
 * Obtiene la carta de portada de un mazo buscando coincidencia con la primera palabra
 * del nombre en `extraDeck` / `mainDeck` o usando la primera carta disponible.
 * @param {Object} mazo
 * @returns {Object|null}
 */
export function obtenerCartaPortadaMazo(mazo) {
  const entradas = [...(mazo?.extraDeck ?? []), ...(mazo?.mainDeck ?? [])]
  const primeraPalabra = mazo?.nombre?.trim().split(/\s+/)[0]?.toLocaleLowerCase()

  if (primeraPalabra) {
    const coincidencia = entradas.find(({ carta }) =>
      carta.name.toLocaleLowerCase().includes(primeraPalabra)
    )
    if (coincidencia) return coincidencia.carta
  }

  return entradas[0]?.carta ?? null
}
