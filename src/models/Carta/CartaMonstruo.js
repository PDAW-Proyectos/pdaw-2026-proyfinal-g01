import { Carta } from "./Carta"

export class CartaMonstruo extends Carta {
  /** @type {Number} */
  #atk
  /** @type {Number} */
  #def
  /** @type {Number} */
  #level
  /** @type {string} */
  #attribute

  constructor(data) {
    super(data)

    this.#atk = data.atk
    this.#def = data.def?? null
    this.#level = data.level?? null
    this.#attribute = data.attribute
  }

  // Getters
  get atk() { return this.#atk }

  get def() { return this.#def }

  get level() { return this.#level }

  get attribute() { return this.#attribute }

  // Methods
  /** Transforma los atributos de la carta en un Object generico para poder guardarlo en un archivo JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      ...super.toJSON(),
      atk: this.#atk,
      def: this.#def,
      level: this.#level,
      attribute: this.#attribute
    }
  }
}
