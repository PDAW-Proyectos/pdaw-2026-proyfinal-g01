import {
  renderCardSlider,
  renderDeckSlider,
  renderHeroCarousel,
  renderizarErrorCartasPopulares,
  renderizarErrorHero,
  renderizarErrorMazosDestacados
} from "../components/carruselInicio.js"
import { obtenerCartasPopulares } from "../services/servicioCartas.js"
import { listarMazosPopulares } from "../services/servicioMazos.js"

const CANTIDAD_HERO = 5

async function inicializarInicio() {
  const [resPopulares, resMazos] = await Promise.allSettled([
    obtenerCartasPopulares(),
    listarMazosPopulares()
  ])

  if (resPopulares.status === "fulfilled") {
    const cartasPopulares = resPopulares.value
    const destacadasHero = cartasPopulares.slice(0, CANTIDAD_HERO)
    const restoPopulares = cartasPopulares.slice(CANTIDAD_HERO)

    renderHeroCarousel(destacadasHero)
    if (restoPopulares.length > 0) {
      renderCardSlider(restoPopulares)
    } else {
      renderizarErrorCartasPopulares("No hay cartas populares adicionales disponibles.")
    }
  } else {
    console.error("No se pudieron cargar las cartas populares:", resPopulares.reason)
    renderizarErrorHero()
    renderizarErrorCartasPopulares()
  }

  if (resMazos.status === "fulfilled") {
    renderDeckSlider(resMazos.value)
  } else {
    console.error("No se pudieron cargar los mazos populares:", resMazos.reason)
    renderizarErrorMazosDestacados()
  }
}

void inicializarInicio()
