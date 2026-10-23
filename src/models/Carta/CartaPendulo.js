import { CartaMonstruo } from "./CartaMonstruo";

/** Clase hijo de CartaMonstruo, agrega un atributo (scale) necesario para las cartas pendulo
 * y adapta el metodo toJSON() para usarlo.
 */
export class CartaPendulo extends CartaMonstruo {
  /** @type {Number} */
  #scale

  /** Constructor para una carta pendulo necesita los datos de la clase padre (CartaMonstruo) y scale.
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
