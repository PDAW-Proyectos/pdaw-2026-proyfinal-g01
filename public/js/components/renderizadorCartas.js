import { crearUrlDetalleCarta } from "../modules/navegacionCarta.js"

function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontró el elemento requerido #${id}.`)
  }
  return elemento
}

/**
 * Construye la URL del endpoint propio que entrega y cachea las imágenes.
 * @param {Object} carta
 * @param {"full" | "small"} tipo
 * @returns {string}
 */
export function obtenerUrlImagen(carta, tipo) {
  if (!Number.isInteger(Number(carta.id))) {
    throw new Error(`La carta "${carta.name}" no tiene un ID válido.`)
  }

  return `/api/imagenes/${encodeURIComponent(carta.id)}?tipo=${tipo}`
}

/**
 * Devuelve el precio positivo más alto entre las fuentes de precio disponibles
 * en el modelo de cartas (eBay y Amazon) o el DTO de la API.
 * @param {Object} carta
 * @returns {number}
 */
export function obtenerPrecioMaximo(carta) {
  const precioDTO = Number(carta.card_price)
  if (Number.isFinite(precioDTO) && precioDTO > 0) {
    return precioDTO
  }

  const precios = carta.card_prices?.flatMap((fuente) =>
    [fuente.ebay_price, fuente.amazon_price].map(Number)
  ) ?? []

  return precios.reduce((maximo, precio) =>
    Number.isFinite(precio) && precio > maximo ? precio : maximo, 0)
}

function obtenerCartaPortadaMazo(mazo) {
  const entradas = [...(mazo.extraDeck ?? []), ...(mazo.mainDeck ?? [])]
    .filter((entrada) => entrada?.carta && Number.isInteger(Number(entrada.carta.id)))

  const primeraPalabra = mazo.nombre?.trim().split(/\s+/)[0]?.toLocaleLowerCase()
  if (primeraPalabra) {
    const coincidencia = entradas.find(({ carta }) =>
      carta.name?.toLocaleLowerCase().includes(primeraPalabra)
    )
    if (coincidencia) return coincidencia.carta
  }

  return entradas[0]?.carta ?? null
}

function contarCartasMazo(mazo) {
  return [...(mazo.mainDeck ?? []), ...(mazo.extraDeck ?? [])].reduce(
    (total, entrada) => total + (Number(entrada?.cantidad) || 0),
    0
  )
}

function inicializarCarruselBootstrap(elemento) {
  globalThis.bootstrap?.Carousel?.getOrCreateInstance(elemento)
}

/**
 * Renderiza el carrusel principal (Hero) con hasta 5 cartas destacadas.
 * @param {Array<Object>} cards
 */
export function renderHeroCarousel(cards) {
  const carouselEl = obtenerElemento("heroCardsCarousel")
  const inner = obtenerElemento("hero-carousel-inner")
  const status = obtenerElemento("hero-carousel-status")
  const template = obtenerElemento("hero-slide-template")
  const slides = cards.slice(0, 5)
  const fragmento = document.createDocumentFragment()

  slides.forEach((card, index) => {
    const clone = template.content.cloneNode(true)
    const item = clone.querySelector(".carousel-item")
    if (index === 0) item.classList.add("active")

    const img = clone.querySelector(".hero-card-img")
    img.src = obtenerUrlImagen(card, "full")
    img.alt = card.name

    clone.querySelector(".hero-card-title").textContent = card.name
    clone.querySelector(".hero-card-desc").textContent =
      card.desc || [card.race, card.type].filter(Boolean).join(" / ") || "Sin descripción disponible."
    clone.querySelector(".hero-card-link").href = crearUrlDetalleCarta(card)

    fragmento.append(clone)
  })

  inner.replaceChildren(fragmento)

  const indicators = document.querySelectorAll("#hero-carousel-indicators [data-bs-slide-to]")
  indicators.forEach((boton, index) => {
    boton.hidden = index >= slides.length
    boton.classList.toggle("active", index === 0)
    if (index === 0) {
      boton.setAttribute("aria-current", "true")
    } else {
      boton.removeAttribute("aria-current")
    }
  })

  status.hidden = true
  carouselEl.hidden = false
  inicializarCarruselBootstrap(carouselEl)
}

/**
 * Renderiza el slider de hasta 10 cartas populares.
 * @param {Array<Object>} cards
 */
export function renderCardSlider(cards) {
  const sliderEl = obtenerElemento("popularCardsSlider")
  const inner = obtenerElemento("popular-cards-inner")
  const status = obtenerElemento("popular-cards-status")
  const template = obtenerElemento("card-slide-template")
  const fragmento = document.createDocumentFragment()

  cards.slice(0, 10).forEach((card, index) => {
    const clone = template.content.cloneNode(true)
    const item = clone.querySelector(".carousel-item")
    if (index === 0) item.classList.add("active")

    const img = clone.querySelector(".card-slide-img")
    img.src = obtenerUrlImagen(card, "small")
    img.alt = card.name

    clone.querySelector(".card-slide-name").textContent = card.name
    clone.querySelector(".card-slide-type").textContent =
      [card.race, card.type].filter(Boolean).join(" / ")
    clone.querySelector(".card-slide-link").href = crearUrlDetalleCarta(card)

    fragmento.append(clone)
  })

  inner.replaceChildren(fragmento)
  status.hidden = true
  inicializarCarruselBootstrap(sliderEl)
}

/**
 * Renderiza el slider de hasta 10 mazos destacados desde /api/mazos/populares.
 * @param {Array<Object>} decks
 */
export function renderDeckSlider(decks) {
  const sliderEl = obtenerElemento("featuredDecksSlider")
  const inner = obtenerElemento("featured-decks-inner")
  const status = obtenerElemento("featured-decks-status")
  const template = obtenerElemento("deck-slide-template")
  const fragmento = document.createDocumentFragment()

  decks.slice(0, 10).forEach((deck, index) => {
    const clone = template.content.cloneNode(true)
    const item = clone.querySelector(".carousel-item")
    if (index === 0) item.classList.add("active")

    const img = clone.querySelector(".deck-slide-img")
    const cartaPortada = obtenerCartaPortadaMazo(deck)
    if (cartaPortada) {
      img.src = obtenerUrlImagen(cartaPortada, "small")
      img.alt = deck.nombre
    } else {
      img.hidden = true
    }

    clone.querySelector(".deck-slide-name").textContent = deck.nombre
    clone.querySelector(".deck-slide-count").textContent = `${contarCartasMazo(deck)} cartas`
    clone.querySelector(".deck-slide-author").textContent = `Por ${deck.username}`
    clone.querySelector(".deck-slide-link").href =
      `mazo.html?id=${encodeURIComponent(deck.id)}&popular=true`

    fragmento.append(clone)
  })

  inner.replaceChildren(fragmento)
  status.hidden = true
  inicializarCarruselBootstrap(sliderEl)
}

export function renderizarErrorHero(mensaje = "No se pudieron cargar las cartas destacadas.") {
  const carouselEl = document.getElementById("heroCardsCarousel")
  if (carouselEl) carouselEl.hidden = true

  const status = document.getElementById("hero-carousel-status")
  if (status) {
    status.textContent = mensaje
    status.hidden = false
  }
}

export function renderizarErrorCartasPopulares(mensaje = "No se pudieron cargar las cartas populares.") {
  const status = document.getElementById("popular-cards-status")
  if (status) {
    status.textContent = mensaje
    status.hidden = false
  }
}

export function renderizarErrorMazosDestacados(mensaje = "No se pudieron cargar los mazos destacados.") {
  const status = document.getElementById("featured-decks-status")
  if (status) {
    status.textContent = mensaje
    status.hidden = false
  }
}

/** Informa en la página cuando no es posible cargar los datos. */
export function renderizarErrorDeCartas() {
  renderizarErrorHero()
  renderizarErrorCartasPopulares()
  renderizarErrorMazosDestacados()
}
