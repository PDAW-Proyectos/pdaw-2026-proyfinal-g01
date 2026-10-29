import { ValidationError } from "../errors.js"

// Reglas de negocio
const MAX_MAIN_DECK = 60
const MIN_MAIN_DECK = 40
const MAX_EXTRA_DECK = 15
const MAX_COPIAS_POR_CARTA = {
  Forbidden: 0,
  Limited: 1,
  "Semi-Limited": 2,
  none: 3
}
const DESTINOS_PERMITIDOS = ["main", "extra"]

/** Representa la entidad Mazo
 */
export class Mazo {
  #id
  #nombre
  #mainDeck
  #extraDeck

  /**
   * @param {Object} datos //es el objeto que se recibe para crear el mazo
   * @param {number} datos.id
   * @param {string} datos.nombre
   * @param {Array<number>} [datos.mainDeck=[]]
   * @param {Array<number>} [datos.extraDeck=[]]
   */
  constructor({ id, nombre, mainDeck = [], extraDeck = [] }) {
    // Validaciones
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError("El id de la carta debe ser un entero positivo")
    }
    if (typeof nombre !== "string" || nombre.trim() === "") {
      throw new ValidationError("El nombre no puede estar vacio")
    }
    if (mainDeck.length > MAX_MAIN_DECK) {
      throw new ValidationError(`El Main Deck no puede tener mas de ${MAX_MAIN_DECK} cartas.`)
    }
    if (extraDeck.length > MAX_EXTRA_DECK) {
      throw new ValidationError(`El Extra Deck no puede tener mas de ${MAX_EXTRA_DECK} cartas.`)
    }

    this.#id = id
    this.#nombre = nombre.trim()
    this.#mainDeck = [...mainDeck]
    this.#extraDeck = [...extraDeck]
  }

  /** @returns {number} */
  get id() { return this.#id }

  /** @returns {string} */
  get nombre() { return this.#nombre }

  /** @returns {Array <number>} */
  get mainDeck() { return [...this.#mainDeck] }

  /** @returns {Array <number>} */
  get extraDeck() { return [...this.#extraDeck] }

  // Validaciones privadas
  #validarMaxCopias(idCarta, banInfo) {
    const copias = [...this.#mainDeck, ...this.#extraDeck].filter(id => id === idCarta).length
    return copias >= MAX_COPIAS_POR_CARTA[banInfo]
  }

  // Methods
  /** Serializa el objeto Mazo a un objeto JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.#id,
      nombre: this.#nombre,
      mainDeck: [...this.#mainDeck],
      extraDeck: [...this.#extraDeck]
    }
  }

  /** Crea una instancia de Mazo a partir de un objeto deserializado.
   * @param {Object} data
   * @returns {Mazo}
   */
  static fromJSON(data) {
    return new Mazo({
      id: data.id,
      nombre: data.nombre,
      mainDeck: data.mainDeck,
      extraDeck: data.extraDeck
    })
  }

  // Methods
  valido() {
    return this.#mainDeck.length >= MIN_MAIN_DECK
  }

  /** Agrega una carta al mazo correspondiente.
   * @param {number} idCarta
   * @param {('main'|'extra')} [destino='main'] - Mazo de destino (es main por defecto)
   * @returns {boolean}
   */
  agregarCarta(idCarta, banInfo = "none", destino = "main") {
    // Validaciones
    if (!Number.isInteger(idCarta) || idCarta <= 0) {
      throw new ValidationError("El id de la carta debe ser un entero positivo.");
    }
    if (!DESTINOS_PERMITIDOS.includes(destino)) {
      throw new ValidationError("El destino de la carta no esta permitido.");
    }
    if (!(banInfo in MAX_COPIAS_POR_CARTA)) {
      throw new ValidationError("El estado de banlist no es valido.");
    }
    if (this.#validarMaxCopias(idCarta, banInfo)) {
      throw new ValidationError("No se pueden añadir copias de la carta.");
    }

    if (destino === "main") {
      if (this.#mainDeck.length >= MAX_MAIN_DECK) {
        throw new ValidationError(`El Main Deck ya alcanzo el limite de ${MAX_MAIN_DECK} cartas.`);
      }
      this.#mainDeck.push(idCarta)
    }
    if (destino === "extra") {
      if (this.#extraDeck.length >= MAX_EXTRA_DECK) {
        throw new ValidationError(`El Extra Deck ya alcanzo el limite de ${MAX_EXTRA_DECK} cartas.`);
      }
      this.#extraDeck.push(idCarta)
    }

    return true
  }

  /** Elimina una carta del mazo. Busca primero en mainDeck y si no esta, en extraDeck.
   * @param {number} idCarta
   * @returns {boolean} True si la carta fue encontrada y eliminada, false si no
   */
  eliminarCarta(idCarta) {
    let indice = this.#mainDeck.indexOf(idCarta)
    if (indice !== -1) {
      this.#mainDeck.splice(indice, 1)
      return true
    }

    indice = this.#extraDeck.indexOf(idCarta)
    if (indice !== -1) {
      this.#extraDeck.splice(indice, 1)
      return true
    }
    return false
  }
}
