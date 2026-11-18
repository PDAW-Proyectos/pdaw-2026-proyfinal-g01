import { buscarCartasPaginadas } from "../services/servicioCartas.js"
import { leerFiltrosCartas } from "../utils/utilidadesCartas.js"
import { renderizarCartasBusqueda, renderizarErrorCartaBusqueda } from "../components/cartaBusqueda.js"
import { mostrarSkeletons } from "../components/skeletonCarta.js"
import {
  cerrarDropdownBusqueda,
  inicializarBusquedaDialogo,
  inicializarBusquedaDropdown,
  inicializarBusquedaRapida
} from "./busquedaCartasRapida.js"

const ESPERA_MS = 250
const CARTAS_POR_PAGINA = 20

/**
 * Inicializa la búsqueda completa de cartas en un contenedor de grilla usando
 * `cartaBusqueda` (tarjetas `.small-card` con flip) y `skeletonCarta` mientras carga.
 */
export function crearBusquedaCartas({
  contenedor = document.getElementById("cardsGrid"),
  entrada,
  botonBuscar,
  filtros = {},
  contenedorFiltros,
  estado = document.getElementById("cards-status"),
  obtenerOrden,
  cantidadSkeletons = CARTAS_POR_PAGINA,
  esperaMs = ESPERA_MS,
  buscarAlIniciar = true,
  onSelect,
  onPaginacion
} = {}) {
  if (!contenedor) return null

  let paginaActual = 1
  let paginacionActual = null
  let solicitudActual = 0
  let temporizador
  let abortController

  async function cargarPagina(pagina = 1) {
    clearTimeout(temporizador)
    abortController?.abort()
    abortController = new AbortController()

    const idSolicitud = ++solicitudActual
    contenedor.setAttribute("aria-busy", "true")
    if (estado) estado.textContent = "Cargando cartas..."

    mostrarSkeletons(contenedor, cantidadSkeletons)
    onPaginacion?.(paginacionActual, true)

    const parametros = leerFiltrosCartas(entrada, filtros, contenedorFiltros)
    parametros.page = pagina
    const orden = obtenerOrden?.()
    if (orden) parametros.orden = orden

    try {
      const resultado = await buscarCartasPaginadas(parametros, {
        signal: abortController.signal
      })
      if (idSolicitud !== solicitudActual) return

      renderizarCartasBusqueda(resultado.datos, contenedor, { onSelect })
      paginaActual = resultado.paginacion.paginaActual
      paginacionActual = resultado.paginacion
      if (estado) estado.textContent = ""
    } catch (error) {
      if (error.name === "AbortError" || idSolicitud !== solicitudActual) return
      console.error("No se pudieron cargar las cartas:", error)
      renderizarErrorCartaBusqueda(contenedor)
      if (estado) {
        estado.textContent = "No se pudieron cargar las cartas. Intentá nuevamente."
      }
    } finally {
      if (idSolicitud === solicitudActual) {
        contenedor.setAttribute("aria-busy", "false")
        onPaginacion?.(paginacionActual, false)
      }
    }
  }

  entrada?.addEventListener("input", () => {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => void cargarPagina(1), esperaMs)
  })

  entrada?.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault()
      void cargarPagina(1)
    }
  })

  botonBuscar?.addEventListener("click", () => void cargarPagina(1))

  for (const control of Object.values(filtros)) {
    control?.addEventListener("change", () => void cargarPagina(1))
  }
  contenedorFiltros?.querySelectorAll("[data-card-filter]").forEach((el) => {
    el.addEventListener("change", () => void cargarPagina(1))
  })

  if (buscarAlIniciar) {
    void cargarPagina(1)
  }

  return {
    buscar: () => cargarPagina(1),
    cargarPagina,
    paginaAnterior: () => {
      if (paginacionActual?.tieneAnterior) return cargarPagina(paginaActual - 1)
    },
    paginaSiguiente: () => {
      if (paginacionActual?.tieneSiguiente) return cargarPagina(paginaActual + 1)
    }
  }
}

/**
 * Inicializa el buscador según los controles presentes en la página.
 */
export function inicializarBusquedaCartas(opciones = {}) {
  if (opciones.contenedor) {
    return crearBusquedaCartas(opciones)
  }

  const tieneDropdown =
    document.getElementById("search-input") &&
    document.getElementById("search-button") &&
    document.getElementById("search-dropdown")
  const tieneDialogo =
    document.getElementById("navbarSearchInput") &&
    document.getElementById("searchResults")

  if (tieneDropdown) inicializarBusquedaDropdown(opciones)
  if (tieneDialogo) inicializarBusquedaDialogo(opciones)
}

export {
  cerrarDropdownBusqueda,
  inicializarBusquedaDialogo,
  inicializarBusquedaDropdown,
  inicializarBusquedaRapida
}
