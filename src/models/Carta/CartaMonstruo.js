import { Carta } from "./Carta"

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

  /** Constructor para una carta monstruo necesita los datos de la clase padre (Carta), linkval y linkmarkers.
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
