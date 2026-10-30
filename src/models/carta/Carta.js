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
  /** @type {Object} */
  #banlist_info = {}
  /** @type {Array <Object>} */
  #card_images = []
  /** @type {Object} */
  #card_prices

  /** Una Carta necesita los datos id, name, type, frameType, race, desc, card_images, card_prices.
   * @param {Object} data
   */
  constructor({ id, name, type, frameType, race, desc, banlist_info, card_images, card_prices }) {
    this.#id = id
    this.#name = name
    this.#type = type
    this.#frameType = frameType
    this.#race = race
    this.#desc = desc
    if (banlist_info) {
      this.#banlist_info = { ...banlist_info }
    }
    for (const url of card_images) {
      this.#card_images.push({
        image_url: url.image_url,
        image_url_small: url.image_url_small
      })
    }
    this.#card_prices = {
      ebay_price: card_prices.ebay_price ?? 0,
      amazon_price: card_prices.amazon_price ?? 0
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

  /** Descripcion de la carta. */
  get banlist_info() { return {...this.#banlist_info} }

  /** Array de Object con los valores image_url y image_url_small */
  get card_images() { return [...this.#card_images] }

  /** Object con los valores ebay_price y amazon_price */
  get card_prices() { return {...this.#card_prices} }

  // Methods
  /** Transforma los atributos de la carta en un Object generico para poder guardarlo en un archivo JSON.
   * @returns {Object}
   */
  toJSON() {
    const obj =  {
      id: this.#id,
      name: this.#name,
      type: this.#type,
      frameType: this.#frameType,
      race: this.#race,
      desc: this.#desc,
      card_images: this.card_images,
      card_prices: this.card_prices,
    }
    if (Object.keys(this.#banlist_info).length > 0) {
      obj.banlist_info = this.banlist_info
    }
    return obj
  }
}
