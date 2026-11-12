import { buscarCartas } from "../services/cartaApi.js"
import {
  cerrarDropdownBusqueda,
  mostrarCargaBusqueda,
  mostrarErrorBusqueda,
  renderizarResultadosBusqueda
} from "../components/renderizadorBusqueda.js"

const DEMORA_SPINNER_MS = 150
const ESPERA_ENTRE_TECLAS_MS = 250
const LONGITUD_MINIMA_BUSQUEDA = 2

function coincideTipo(carta, filtro) {
  if (filtro === "link") return carta.type?.toLowerCase().includes("link") ?? false
  if (filtro === "monster") return carta.type?.toLowerCase().includes("monster") ?? false
  if (filtro === "pendulum") return carta.type?.toLowerCase().includes("pendulum") ?? false
  return true
}

/**
 * Conecta la búsqueda con el catálogo de cartas y su dropdown.
 * espera 250ms después de la escritura, cancela solicitudes obsoletas y muestra el spinner
 * solo si la consulta tarda más que el intervalo configurado.
 */
export function inicializarBusquedaCartas() {
  const entrada = document.getElementById("search-input")
  const boton = document.getElementById("search-button")
  const filtroTipo = document.getElementById("search-type-filter")
  const filtroRaza = document.getElementById("search-race-filter")
  const dropdown = document.getElementById("search-dropdown")

  if (!entrada || !boton || !filtroTipo || !filtroRaza || !dropdown) {
    throw new Error("No se encontraron todos los controles de búsqueda de cartas.")
  }

  let esperaEscritura
  let temporizadorSpinner
  let solicitudActiva
  let idBusqueda = 0

  function cancelarBusquedaActual() {
    clearTimeout(esperaEscritura)
    clearTimeout(temporizadorSpinner)
    solicitudActiva?.abort()
    solicitudActiva = undefined
  }

  async function buscar() {
    cancelarBusquedaActual()
    const idActual = ++idBusqueda
    const nombre = entrada.value.trim()
    cerrarDropdownBusqueda()

    if (nombre.length < LONGITUD_MINIMA_BUSQUEDA) {
      return
    }

    const controlador = new AbortController()
    solicitudActiva = controlador
    temporizadorSpinner = setTimeout(mostrarCargaBusqueda, DEMORA_SPINNER_MS)

    try {
      const cartas = await buscarCartas({
        name: nombre,
        race: filtroRaza.value
      }, { signal: controlador.signal })

      if (idActual !== idBusqueda) return

      clearTimeout(temporizadorSpinner)
      const filtradas = cartas.filter((carta) => coincideTipo(carta, filtroTipo.value))
      renderizarResultadosBusqueda(filtradas)
    } catch (error) {
      if (error.name === "AbortError" || idActual !== idBusqueda) return

      clearTimeout(temporizadorSpinner)
      console.error("No se pudo completar la búsqueda de cartas:", error)
      mostrarErrorBusqueda()
    } finally {
      if (idActual === idBusqueda) {
        solicitudActiva = undefined
      }
    }
  }

  entrada.addEventListener("input", () => {
    cancelarBusquedaActual()
    idBusqueda++
    cerrarDropdownBusqueda()
    esperaEscritura = setTimeout(buscar, ESPERA_ENTRE_TECLAS_MS)
  })
  boton.addEventListener("click", buscar)
  entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault()
      buscar()
    } else if (evento.key === "Escape") {
      cancelarBusquedaActual()
      idBusqueda++
      cerrarDropdownBusqueda()
    }
  })
  filtroTipo.addEventListener("change", buscar)
  filtroRaza.addEventListener("change", buscar)
  document.addEventListener("click", (evento) => {
    if (!dropdown.parentElement?.contains(evento.target)) {
      cancelarBusquedaActual()
      idBusqueda++
      cerrarDropdownBusqueda()
    }
  })
}
