import { CartaMonstruo } from "./CartaMonstruo.js"

/** Clase hijo de CartaMonstruo, agrega los atributos (linkval y linkmarkers) necesarios
 * para las cartas link y adapta el metodo toJSON() para usarlos.
 */
export class CartaLink extends CartaMonstruo {
  /** @type {Number} */
  #linkval
  /** @type {Array <string>} */
  #linkmarkers

  /** Una CartaLink necesita los datos id, name, type, frameType, race, desc, card_images, card_prices,
   * atk, linkval y linkmarkers, los atributos def y level son asignados null.
   * @param {Object} data
   */
  constructor(data) {
    super(data)

    this.#linkval = data.linkval
    this.#linkmarkers = data.linkmarkers
  }

  // Getters
  /** Valor link de la carta, remplaza el nivel. */
  get linkval() { return this.#linkval }

  /** Las flechas indicadores de la carta link. */
  get linkmarkers() { return [...this.#linkmarkers] }

  // Methods
  /** Transforma los atributos de la carta en un Object generico para poder guardarlo en un archivo JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      linkval: this.#linkval,
      linkmarkers: this.#linkmarkers
    }
  }
}
