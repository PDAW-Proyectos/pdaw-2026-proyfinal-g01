import {
  renderizarCartasBusqueda,
  renderizarErrorCartaBusqueda
} from "../components/carta/cartaBusqueda.js"
import { mostrarSkeletons } from "../components/carta/skeletonCarta.js"
import {
  inicializarEventosPaginacion,
  renderizarPaginacion
} from "../components/paginacion.js"
import { crearBusquedaCartas } from "../modules/busquedaCartas.js"

const CARTAS_POR_PAGINA = 20

const grid = document.getElementById("cardsGrid")
const estado = document.getElementById("cards-status")
const contenedorPaginacion = document.querySelector(".cards-pagination")
const selectAlfabetico = document.getElementById("selectAlfabetico")
const selectPrecio = document.getElementById("selectPrecio")

const buscador = crearBusquedaCartas({
  contenedor: grid,
  selectAlfabetico,
  selectPrecio,
  alIniciarCarga: ({ contenedor, paginacionActual }) => {
    if (estado) estado.textContent = "Cargando cartas..."
    mostrarSkeletons(contenedor, CARTAS_POR_PAGINA)
    renderizarPaginacion(contenedorPaginacion, paginacionActual, { cargando: true })
  },
  alRecibirResultados: (cartas, _paginacion, contenedor) => {
    renderizarCartasBusqueda(cartas, contenedor)
    if (estado) estado.textContent = ""
  },
  alOcurrirError: (_error, contenedor) => {
    renderizarErrorCartaBusqueda(contenedor)
    if (estado) {
      estado.textContent = "No se pudieron cargar las cartas. Intentá nuevamente."
    }
  },
  alFinalizarCarga: (paginacionActual) => {
    renderizarPaginacion(contenedorPaginacion, paginacionActual, { cargando: false })
  }
})

inicializarEventosPaginacion(contenedorPaginacion, (pagina) => {
  void buscador?.cargarPagina(pagina)
})
