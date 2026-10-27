import { CartaMonstruo } from "./CartaMonstruo.js"

/** Clase hijo de CartaMonstruo, agrega un atributo (scale) necesario para las cartas pendulo
 * y adapta el metodo toJSON() para usarlo.
 */
export class CartaPendulo extends CartaMonstruo {
  /** @type {Number} */
  #scale

  /** Una carta pendulo necesita los datos id, name, type, frameType, race, desc, card_images, card_prices,
   * atk, def, level, attribute y scale.
   * @param {Object} data
   */
  constructor(data) {
    super(data)

    this.#scale = data.scale
  }

  // Getters
  /** Escala pendulo de la carta. */
  get scale() { return this.#scale }

  // Methods
  /** Transforma los atributos de la carta en un Object generico para poder guardarlo en un archivo JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      scale: this.#scale
    }
  }
}
