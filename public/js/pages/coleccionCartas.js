import { Combobox } from "../bootstrap/bootstrap.bundle.min.js"
import {
  renderizarCartasFlip,
  renderizarErrorCartasFlip
} from "../components/carta/cartaFlip.js"
import { mostrarSkeletons } from "../components/carta/skeletonCarta.js"
import {
  inicializarEventosPaginacion,
  renderizarPaginacion
} from "../components/paginacion.js"
import { crearBusquedaCartas } from "../modules/busquedaCartas.js"
import { inicializarPanelFiltros } from "../modules/filtrosBusqueda.js"

const CARTAS_POR_PAGINA = 20

const grid = document.getElementById("cardsGrid")
const estado = document.getElementById("cards-status")
const contenedorPaginacion = document.querySelector(".cards-pagination")
const headerCatalogo = document.getElementById("catalogHeader")
const inputBusqueda = document.getElementById("catalogSearchInput")
const comboboxOrden = document.getElementById("catalogSortCombobox")

const ClaseCombobox = Combobox ?? globalThis.bootstrap?.Combobox
if (comboboxOrden && ClaseCombobox) {
  ClaseCombobox.getOrCreateInstance(comboboxOrden)
}

let ordenActual = ""
let buscador = null

function actualizarEstadoBotonOrden(valor, item) {
  if (!comboboxOrden) return
  const activo = Boolean(valor)
  comboboxOrden.classList.toggle("btn-solid", activo)
  comboboxOrden.classList.toggle("btn-outline", !activo)
  comboboxOrden.setAttribute(
    "title",
    activo
      ? `Ordenar: ${item?.textContent?.trim() || valor}`
      : "Ordenar cartas"
  )
}

const controladorFiltros = inicializarPanelFiltros({
  contenedor: headerCatalogo ?? document,
  selectorFormulario: "#catalogFiltersForm",
  selectorColapsable: "#catalogFiltersCollapse",
  selectorBotonToggle: "#catalogFiltersToggleBtn",
  selectorBotonLimpiar: "#catalogFiltersClearBtn",
  alCambiarFiltros: () => {
    void buscador?.buscar()
  }
})

buscador = crearBusquedaCartas({
  contenedor: grid,
  entrada: inputBusqueda,
  obtenerFiltros: () => controladorFiltros?.obtenerFiltrosAplicados() ?? {},
  obtenerOrden: () => ordenActual || undefined,
  alIniciarCarga: ({ contenedor, paginacionActual }) => {
    if (estado) {
      estado.textContent = "Cargando cartas..."
      estado.hidden = false
    }
    mostrarSkeletons(contenedor, CARTAS_POR_PAGINA)
    renderizarPaginacion(contenedorPaginacion, paginacionActual, { cargando: true })
  },
  alRecibirResultados: (cartas, _paginacion, contenedor) => {
    renderizarCartasFlip(cartas, contenedor)
    if (estado) {
      estado.textContent = ""
      estado.hidden = true
    }
  },
  alOcurrirError: (_error, contenedor) => {
    renderizarErrorCartasFlip(contenedor)
    if (estado) {
      estado.textContent = ""
      estado.hidden = true
    }
  },
  alFinalizarCarga: (paginacionActual) => {
    renderizarPaginacion(contenedorPaginacion, paginacionActual, { cargando: false })
  }
})

comboboxOrden?.addEventListener("change.bs.combobox", (evento) => {
  ordenActual = evento.detail?.value ?? ""
  actualizarEstadoBotonOrden(ordenActual, evento.detail?.item)
  void buscador?.buscar()
})

inicializarEventosPaginacion(contenedorPaginacion, (pagina) => {
  void buscador?.cargarPagina(pagina)
  window.scrollTo({ top: 0, behavior: "smooth" })
})
