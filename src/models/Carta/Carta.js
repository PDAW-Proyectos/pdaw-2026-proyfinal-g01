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
  #id
  #name
  #type
  #frameType
  #race
  #desc
  #card_images = []
  #card_prices

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
  get id() { return this.#id }

  get name() { return this.#name }

  get type() { return this.#type }

  get frameType() { return this.#frameType }

  get race() { return this.#race }

  get descripcion() { return this.#desc }

  get card_images() { return [...this.#card_images] }

  get card_prices() { return [...this.#card_prices] }

  // Methods
  static fromJSON(data) {
    const ClaseCarta = getCardClass(this.frameType)
    return new ClaseCarta(data)
  }

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
