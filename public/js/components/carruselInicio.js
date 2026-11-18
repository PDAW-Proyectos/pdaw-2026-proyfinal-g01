import {
  inicializarCarruselBootstrap,
  obtenerElemento
} from "../utils/utilidadesDominio.js"
import {
  crearUrlDetalleCarta,
  obtenerSubtituloCarta
} from "../utils/utilidadesCartas.js"
import {
  contarCartasMazo,
  crearUrlDetalleMazo,
  obtenerCartaPortadaMazo
} from "../utils/utilidadesMazos.js"
import { renderizarImagenCarta } from "./imagenCarta.js"

const CANTIDAD_HERO = 5

export function renderizarErrorHero(
  mensaje = "No se pudieron cargar las cartas destacadas."
) {
  const carouselEl = document.getElementById("heroCardsCarousel")
  if (carouselEl) carouselEl.hidden = true

  const status = document.getElementById("hero-carousel-status")
  if (status) {
    status.textContent = mensaje
    status.hidden = false
  }
}

export function renderizarErrorCartasPopulares(
  mensaje = "No se pudieron cargar las cartas populares."
) {
  const status = document.getElementById("popular-cards-status")
  if (status) {
    status.textContent = mensaje
    status.hidden = false
  }
}

export function renderizarErrorMazosDestacados(
  mensaje = "No se pudieron cargar los mazos destacados."
) {
  const status = document.getElementById("featured-decks-status")
  if (status) {
    status.textContent = mensaje
    status.hidden = false
  }
}

export function renderHeroCarousel(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    renderizarErrorHero()
    return
  }

  try {
    const carouselEl = obtenerElemento("heroCardsCarousel")
    const inner = obtenerElemento("hero-carousel-inner")
    const status = obtenerElemento("hero-carousel-status")
    const template = obtenerElemento("hero-slide-template")
    const slides = cards.slice(0, CANTIDAD_HERO)
    const fragmento = document.createDocumentFragment()

    slides.forEach((card, index) => {
      const clone = template.content.cloneNode(true)
      const item = clone.querySelector(".carousel-item")
      if (index === 0) item.classList.add("active")

      const img = clone.querySelector(".hero-card-img")
      img.replaceWith(
        renderizarImagenCarta(card, {
          tamano: "full",
          clasesImagen: "hero-card-img border border-2 border-white shadow"
        })
      )

      clone.querySelector(".hero-card-title").textContent = card.name
      clone.querySelector(".hero-card-desc").textContent =
        card.desc || obtenerSubtituloCarta(card) || "Sin descripción disponible."
      clone.querySelector(".hero-card-link").href = crearUrlDetalleCarta(card)

      fragmento.append(clone)
    })

    inner.replaceChildren(fragmento)

    const indicators = document.querySelectorAll(
      "#hero-carousel-indicators [data-bs-slide-to]"
    )
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
    inicializarCarruselBootstrap(carouselEl, { autoplay: true })
  } catch (error) {
    console.error("No se pudo generar el carrusel Hero:", error)
    renderizarErrorHero()
  }
}

export function renderCardSlider(cards) {
  if (!Array.isArray(cards) || cards.length === 0) {
    renderizarErrorCartasPopulares()
    return
  }

  try {
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
      img.replaceWith(
        renderizarImagenCarta(card, {
          tamano: "small",
          clasesImagen: "card-slide-img card-img-top"
        })
      )

      clone.querySelector(".card-slide-name").textContent = card.name
      clone.querySelector(".card-slide-type").textContent = obtenerSubtituloCarta(card)
      clone.querySelector(".card-slide-link").href = crearUrlDetalleCarta(card)

      fragmento.append(clone)
    })

    inner.replaceChildren(fragmento)
    status.hidden = true
    inicializarCarruselBootstrap(sliderEl)
  } catch (error) {
    console.error("No se pudo generar el slider de cartas populares:", error)
    renderizarErrorCartasPopulares()
  }
}

export function renderDeckSlider(decks) {
  if (!Array.isArray(decks) || decks.length === 0) {
    renderizarErrorMazosDestacados()
    return
  }

  try {
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
      img.replaceWith(
        renderizarImagenCarta(cartaPortada, {
          tamano: "small",
          estadoBan: null,
          alt: deck.nombre,
          clasesImagen: "deck-slide-img card-img-top"
        })
      )

      clone.querySelector(".deck-slide-name").textContent = deck.nombre
      clone.querySelector(".deck-slide-count").textContent = `${contarCartasMazo(deck)} cartas`
      clone.querySelector(".deck-slide-link").href = crearUrlDetalleMazo(deck, {
        popular: true
      })

      fragmento.append(clone)
    })

    inner.replaceChildren(fragmento)
    status.hidden = true
    inicializarCarruselBootstrap(sliderEl)
  } catch (error) {
    console.error("No se pudo generar el slider de mazos destacados:", error)
    renderizarErrorMazosDestacados()
  }
}
