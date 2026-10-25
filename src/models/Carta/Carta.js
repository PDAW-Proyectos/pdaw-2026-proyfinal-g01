/** Analiza que tipo de carta es y devuelve el string correspondiente
 * a la clase que se necesita crear
 * @param {string} type
 * @returns {string}
 */
function getCardClass(type) {
  let toReturn = "CartaMonstruo"

  if (type.includes("pendulum")) {
    toReturn = "CartaPendulo"
  }
  if (type === 'link') {
    toReturn = "CartaLink"
  }
  if (['spell', 'trap', 'skill'].includes(type)) {
    toReturn = "Carta"
  }
  return toReturn
}

export class Carta {
  // Capaz id no sea necesario y se pueda eliminar.
  /** @type {Number} */
  #id
  /** @type {string} */
  #name
  /** @type {string} */
  #type
  /** @type {string} */
  #frameType
  /** @type {string} */
  #race
  /** @type {string} */
  #desc
  /** @type {Array <Object>} */
  #card_images = []
  /** @type {Array <string>} */
  #card_prices

  /** Una Carta necesita los datos id, name, type, frameType, race, desc, card_images, card_prices.
   * @param {Object} data
   */
  constructor({ id, name, type, frameType, race, desc, card_images, card_prices }) {
    this.#id = id
    this.#name = name
    this.#type = type
    this.#frameType = frameType
    this.#race = race
    this.#desc = desc
    for (const url of card_images) {
      this.#card_images.push({
        image_url: url.image_url,
        image_url_small: url.image_url_small
      })
    }
    this.#card_prices = {
      ebay_price: card_prices[0].ebay_price,
      amazon_price: card_prices[0].amazon_price
    }
  }

  // Getters
  /** Id de la carta dada por la API. */
  get id() { return this.#id }

  /** Nombre de la carta es unico. */
  get name() { return this.#name }

  /** Tipo leible por una persona. */
  get type() { return this.#type }

  /** Tipo de carta para la creacion de clases. */
  get frameType() { return this.#frameType }

  /** Raza de la carta, tambien reprencenta que "tipo" de carta es. */
  get race() { return this.#race }

  /** Descripcion de la carta. */
  get descripcion() { return this.#desc }

  /** Array de Object con los valores image_url y image_url_small */
  get card_images() { return [...this.#card_images] }

  /** Object con los valores ebay_price y amazon_price */
  get card_prices() { return [...this.#card_prices] }

  // Methods}
  /** Tomando el type del Object decide que clase se tiene que crear y devuelve
   * una instancia de esa clase en base a los datos.
   * @param {Object} data
   * @returns {Carta}
   */
  static fromJSON(data) {
    const ClaseCarta = getCardClass(this.frameType)
    return new ClaseCarta(data)
  }

  /** Transforma los atributos de la carta en un Object generico para poder guardarlo en un archivo JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.#id,
      name: this.#name,
      type: this.#type,
      frameType: this.#frameType,
      race: this.#race,
      desc: this.#desc,
      card_images: this.#card_images,
      card_prices: this.#card_prices,
    }
  }
}
