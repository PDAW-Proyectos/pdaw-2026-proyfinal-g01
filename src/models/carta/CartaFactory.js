import { Carta } from "./Carta.js"
import { CartaMonstruo } from "./CartaMonstruo.js"
import { CartaPendulo } from "./CartaPendulo.js"
import { CartaLink } from "./CartaLink.js"

/** Analiza que tipo de carta es y devuelve la clase correspondiente
 * que se necesita instanciar.
 * @param {string} frameType
 * @returns {typeof Carta}
 */
function getCardClass(frameType) {
  if (frameType === "link") return CartaLink
  if (frameType.includes("pendulum")) return CartaPendulo
  if (["spell", "trap", "skill"].includes(frameType)) return Carta
  return CartaMonstruo
}

/** Fabrica que crea la instancia de la clase de carta correcta.
 * Vive en un archivo aparte para evitar imports circulares entre Carta y sus subclases.
 */
export class CartaFactory {
  /** Tomando el frameType del Object decide que clase se tiene que crear y devuelve
   * una instancia de esa clase en base a los datos.
   * @param {Object} data
   * @returns {Carta}
   */
  static fromJSON(data) {
    const ClaseCarta = getCardClass(data.frameType)
    return new ClaseCarta(data)
  }
}
