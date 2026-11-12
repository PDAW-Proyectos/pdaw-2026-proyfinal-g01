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
  /** @type {Array <Object>} */
  #card_prices = []
  /** @type {Array <Object>} */
  #misc_info = []

  /** Una Carta necesita los datos id, name, type, frameType, race, desc, card_images, card_prices y misc_info.
   * @param {Object} data
   */
  constructor({ id, name, type, frameType, race, desc, banlist_info, card_images, card_prices, misc_info = [] }) {
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
    for (const precio of card_prices) {
      this.#card_prices.push({
        ebay_price: precio.ebay_price ?? 0,
        amazon_price: precio.amazon_price ?? 0
      })
    }
    for (const info of misc_info) {
      this.#misc_info.push({
        viewsweek: info.viewsweek ?? 0,
        tcg_date: info.tcg_date ?? null,
        ocg_date: info.ocg_date ?? null,
        konami_id: info.konami_id ?? null,
        md_rarity: info.md_rarity ?? null
      })
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
  get desc() { return this.#desc }

  /** Descripcion de la carta. */
  get banlist_info() { return {...this.#banlist_info} }

  /** Array de Object con los valores image_url y image_url_small */
  get card_images() { return [...this.#card_images] }

  /** Array de Object con los valores ebay_price y amazon_price */
  get card_prices() { return this.#card_prices.map((precio) => ({ ...precio })) }

  /** Array de Object con los valores viewsweek, tcg_date, ocg_date, konami_id y md_rarity */
  get misc_info() { return this.#misc_info.map((info) => ({ ...info })) }

  /** Mayor precio de la carta entre ebay_price y amazon_price */
  get card_price() {
    let mayorPrecio = 0
    for (const precio of this.#card_prices) {
      const precioEbay = Number(precio.ebay_price ?? 0)
      const precioAmazon = Number(precio.amazon_price ?? 0)
      mayorPrecio = Math.max(mayorPrecio, precioEbay, precioAmazon)
    }
    return mayorPrecio
  }

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
      misc_info: this.misc_info,
    }

    if (Object.keys(this.#banlist_info).length > 0) {
      obj.banlist_info = this.banlist_info
    }

    return obj
  }

  /** Transforma la carta a un DTO para enviar al cliente con card_price y sin frameType, card_images ni card_prices.
   * @returns {Object}
   */
  toDTO() {
    const primerMisc = this.#misc_info[0]

    const obj = {
      id: this.#id,
      name: this.#name,
      type: this.#type,
      race: this.#race,
      desc: this.#desc,
      card_price: this.card_price,
      misc_info: {
        viewsweek: primerMisc?.viewsweek ?? 0,
        tcg_date: primerMisc?.tcg_date ?? null,
        ocg_date: primerMisc?.ocg_date ?? null,
        konami_id: primerMisc?.konami_id ?? null,
        md_rarity: primerMisc?.md_rarity ?? null
      },
    }

    if (Object.keys(this.#banlist_info).length > 0) {
      obj.banlist_info = this.banlist_info
    }

    return obj
  }
}
