import { Carta } from "./Carta.js"

/** Clase hijo de Carta, agrega los atributos (ark, def. level) necesario para las cartas pendulo
 * y adapta el metodo toJSON() para usarlo.
 */
export class CartaMonstruo extends Carta {
  /** @type {Number} */
  #atk
  /** @type {Number} */
  #def
  /** @type {Number} */
  #level
  /** @type {string} */
  #attribute

  /** Una CartaMonstruo necesita los datos id, name, type, frameType, race, desc, card_images, card_prices,
   * atk, def, level y attribute.
   * @param {Object} data
   */
  constructor(data) {
    super(data)

    this.#atk = data.atk
    this.#def = data.def?? null
    this.#level = data.level?? null
    this.#attribute = data.attribute
  }

  // Getters
  /** Ataque de la carta */
  get atk() { return this.#atk }

  /** Defensa de la carta */
  get def() { return this.#def }

  /** Cantidad de estrellas de la carta */
  get level() { return this.#level }

  /** Atributo elemental de la carta */
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
