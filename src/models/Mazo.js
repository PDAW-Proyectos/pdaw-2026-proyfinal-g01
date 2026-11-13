import { ValidationError } from "../utils/errors.js"

// Reglas de negocio
export const MAX_MAIN_DECK = 60
export const MIN_MAIN_DECK = 40
export const MAX_EXTRA_DECK = 15
export const TIPOS_EXTRA_DECK = ["fusion", "synchro", "xyz", "link", "fusion_pendulum", "synchro_pendulum", "xyz_pendulum"]
export const MAX_COPIAS_POR_CARTA = {
  Forbidden: 0,
  Banned: 0,
  Limited: 1,
  "Semi-Limited": 2
}

/** Suma la cantidad total de cartas en un arreglo de entradas `{ id, cantidad }`.
 * @param {Array <{ id: number, cantidad: number }>} lista
 * @returns {number}
 */
function contarCartas(lista) {
  return lista.reduce((total, entrada) => total + entrada.cantidad, 0)
}

/** Representa la entidad Mazo
 */
export class Mazo {
  #id
  #username
  #nombre
  #mainDeck
  #extraDeck

  /**
   * @param {Object} datos //es el objeto que se recibe para crear el mazo
   * @param {number} datos.id
   * @param {string} datos.username
   * @param {string} datos.nombre
   * @param {Array<{ id: number, cantidad: number }>} [datos.mainDeck=[]]
   * @param {Array<{ id: number, cantidad: number }>} [datos.extraDeck=[]]
   */
  constructor({ id, username, nombre, mainDeck = [], extraDeck = [] }) {
    if (contarCartas(mainDeck) > MAX_MAIN_DECK) {
      throw new ValidationError(`El Main Deck ya alcanzo el limite de ${MAX_MAIN_DECK} cartas.`)
    }
    if (contarCartas(extraDeck) > MAX_EXTRA_DECK) {
      throw new ValidationError(`El Extra Deck ya alcanzo el limite de ${MAX_EXTRA_DECK} cartas.`)
    }

    this.#id = id
    this.#username = username.trim()
    this.#nombre = nombre.trim()
    this.#mainDeck = mainDeck.map(entrada => ({ id: entrada.id, cantidad: entrada.cantidad }))
    this.#extraDeck = extraDeck.map(entrada => ({ id: entrada.id, cantidad: entrada.cantidad }))
  }

  /** @returns {number} */
  get id() { return this.#id }

  /** @returns {string} */
  get username() { return this.#username }

  /** @returns {string} */
  get nombre() { return this.#nombre }

  /** @returns {Array<{ id: number, cantidad: number }>} */
  get mainDeck() { return this.#mainDeck.map(entrada => ({ ...entrada })) }

  /** @returns {Array<{ id: number, cantidad: number }>} */
  get extraDeck() { return this.#extraDeck.map(entrada => ({ ...entrada })) }

  // Validaciones privadas
  #validarMaxCopias(idCarta, banInfo) {
    const copias = [...this.#mainDeck, ...this.#extraDeck]
      .filter(entrada => entrada.id === idCarta)
      .reduce((total, entrada) => total + entrada.cantidad, 0)
    const max = MAX_COPIAS_POR_CARTA[banInfo] ?? 3
    return copias >= max
  }

  #agregarEnLista(lista, idCarta, limite, nombreZona) {
    if (contarCartas(lista) >= limite) {
      throw new ValidationError(`El ${nombreZona} ya alcanzo el limite de ${limite} cartas.`)
    }

    const existente = lista.find(entrada => entrada.id === idCarta)
    if (existente) {
      existente.cantidad += 1
    } else {
      lista.push({ id: idCarta, cantidad: 1 })
    }
  }

  #eliminarDeLista(lista, idCarta) {
    const indice = lista.findIndex(entrada => entrada.id === idCarta)
    if (indice === -1) return false

    if (lista[indice].cantidad > 1) {
      lista[indice].cantidad -= 1
    } else {
      lista.splice(indice, 1)
    }
    return true
  }

  // Methods
  /** Serializa el objeto Mazo a un objeto JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.#id,
      username: this.#username,
      nombre: this.#nombre,
      mainDeck: this.mainDeck,
      extraDeck: this.extraDeck
    }
  }

  /** Crea una instancia de Mazo a partir de un objeto deserializado.
   * @param {Object} data
   * @returns {Mazo}
   */
  static fromJSON(data) {
    return new Mazo({
      id: data.id,
      username: data.username,
      nombre: data.nombre,
      mainDeck: data.mainDeck,
      extraDeck: data.extraDeck
    })
  }

  // Methods
  valido() {
    return contarCartas(this.#mainDeck) >= MIN_MAIN_DECK
  }

  /** Agrega una copia de la carta al mazo correspondiente (mainDeck o extraDeck segun su frameType).
   * @param {{ id: number, frameType?: string, banlist_info?: { ban_tcg?: string } }} carta
   * @returns {boolean}
   */
  agregarCarta(carta) {
    const { id, frameType = "normal", banlist_info } = carta
    const banInfo = banlist_info?.ban_tcg ?? "none"

    if (this.#validarMaxCopias(id, banInfo)) {
      throw new ValidationError("No se pueden añadir copias de la carta.")
    }

    if (TIPOS_EXTRA_DECK.includes(frameType)) {
      this.#agregarEnLista(this.#extraDeck, id, MAX_EXTRA_DECK, "Extra Deck")
    } else {
      this.#agregarEnLista(this.#mainDeck, id, MAX_MAIN_DECK, "Main Deck")
    }

    return true
  }

  /** Elimina una copia de la carta del mazo. Busca primero en mainDeck y si no esta, en extraDeck.
   * @param {number} idCarta
   * @returns {boolean} True si la carta fue encontrada y eliminada, false si no
   */
  eliminarCarta(idCarta) {
    return this.#eliminarDeLista(this.#mainDeck, idCarta) || this.#eliminarDeLista(this.#extraDeck, idCarta)
  }
}
