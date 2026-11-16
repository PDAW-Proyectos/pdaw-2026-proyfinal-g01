import { buscarCartas } from "../services/cartaApi.js"
import { obtenerUrlImagen } from "../components/renderizadorCartas.js"
import { crearUrlDetalleCarta } from "./navegacionCarta.js"
import {
  cerrarDropdownBusqueda,
  mostrarCargaBusqueda,
  mostrarErrorBusqueda,
  renderizarResultadosBusqueda
} from "../components/renderizadorBusqueda.js"

const DEMORA_SPINNER_MS = 150
const ESPERA_ENTRE_TECLAS_MS = 250
const LONGITUD_MINIMA_BUSQUEDA = 2
const LIMITE_RESULTADOS_DIALOGO = 10

function coincideTipo(carta, filtro) {
  if (filtro === "link") return carta.type?.toLowerCase().includes("link") ?? false
  if (filtro === "monster") return carta.type?.toLowerCase().includes("monster") ?? false
  if (filtro === "pendulum") return carta.type?.toLowerCase().includes("pendulum") ?? false
  return true
}

function inicializarBusquedaDialogo(entrada, contenedorResultados) {
  let esperaEscritura
  let solicitudActiva
  let idBusqueda = 0

  function mostrarMensaje(texto) {
    const mensaje = document.createElement("p")
    mensaje.className = "fg-2 text-center my-4"
    mensaje.textContent = texto
    contenedorResultados.replaceChildren(mensaje)
  }

  function renderizarResultadosDialogo(cartas) {
    if (cartas.length === 0) {
      mostrarMensaje("No se encontraron cartas.")
      return
    }

    const lista = document.createElement("div")
    lista.className = "list-group list-group-flush"

    for (const carta of cartas.slice(0, LIMITE_RESULTADOS_DIALOGO)) {
      const enlace = document.createElement("a")
      enlace.href = crearUrlDetalleCarta(carta)
      enlace.className = "list-group-item list-group-item-action d-flex align-items-center gap-3 py-2"

      const imagen = document.createElement("img")
      imagen.src = obtenerUrlImagen(carta, "small")
      imagen.alt = ""
      imagen.loading = "lazy"
      imagen.style.width = "40px"
      imagen.style.height = "auto"

      const info = document.createElement("div")
      info.className = "d-flex flex-column text-truncate"

      const nombre = document.createElement("span")
      nombre.className = "fw-semibold text-truncate"
      nombre.textContent = carta.name

      const tipo = document.createElement("small")
      tipo.className = "fg-2 text-truncate"
      tipo.textContent = [carta.race, carta.type].filter(Boolean).join(" / ")

      info.append(nombre, tipo)
      enlace.append(imagen, info)
      lista.append(enlace)
    }

    contenedorResultados.replaceChildren(lista)
  }

  async function buscar() {
    clearTimeout(esperaEscritura)
    solicitudActiva?.abort()
    const idActual = ++idBusqueda
    const nombre = entrada.value.trim()

    if (nombre.length < LONGITUD_MINIMA_BUSQUEDA) {
      mostrarMensaje("Escribe para comenzar a buscar cartas...")
      return
    }

    const controlador = new AbortController()
    solicitudActiva = controlador
    mostrarMensaje("Buscando cartas...")

    try {
      const cartas = await buscarCartas({ name: nombre }, { signal: controlador.signal })
      if (idActual !== idBusqueda) return
      renderizarResultadosDialogo(cartas)
    } catch (error) {
      if (error.name === "AbortError" || idActual !== idBusqueda) return
      console.error("No se pudo completar la búsqueda de cartas:", error)
      mostrarMensaje("No se pudieron cargar los resultados. Inténtalo de nuevo.")
    } finally {
      if (idActual === idBusqueda) {
        solicitudActiva = undefined
      }
    }
  }

  entrada.addEventListener("input", () => {
    clearTimeout(esperaEscritura)
    solicitudActiva?.abort()
    idBusqueda++
    esperaEscritura = setTimeout(buscar, ESPERA_ENTRE_TECLAS_MS)
  })

  entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault()
      void buscar()
    }
  })
}

/**
 * Conecta la búsqueda con el catálogo de cartas y su dropdown o diálogo modal.
 * Espera 250ms después de la escritura, cancela solicitudes obsoletas y muestra el spinner
 * solo si la consulta tarda más que el intervalo configurado.
 */
export function inicializarBusquedaCartas({ onSelect } = {}) {
  const entrada = document.getElementById("search-input")
  const boton = document.getElementById("search-button")
  const filtroTipo = document.getElementById("search-type-filter")
  const filtroRaza = document.getElementById("search-race-filter")
  const dropdown = document.getElementById("search-dropdown")

  if (!entrada || !boton || !dropdown) {
    const entradaDialogo = document.getElementById("navbarSearchInput")
    const resultadosDialogo = document.getElementById("searchResults")
    if (entradaDialogo && resultadosDialogo) {
      inicializarBusquedaDialogo(entradaDialogo, resultadosDialogo)
      return
    }
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
        race: filtroRaza?.value
      }, { signal: controlador.signal })

      if (idActual !== idBusqueda) return

      clearTimeout(temporizadorSpinner)
      const filtradas = cartas.filter((carta) =>
        coincideTipo(carta, filtroTipo?.value ?? "all")
      )
      renderizarResultadosBusqueda(filtradas, onSelect)
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
  filtroTipo?.addEventListener("change", buscar)
  filtroRaza?.addEventListener("change", buscar)
  document.addEventListener("click", (evento) => {
    if (!dropdown.parentElement?.contains(evento.target)) {
      cancelarBusquedaActual()
      idBusqueda++
      cerrarDropdownBusqueda()
    }
  })
}
