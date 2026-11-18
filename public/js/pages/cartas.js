import {
  inicializarEventosPaginacion,
  renderizarPaginacion
} from "../components/paginacion.js"
import {
  crearBusquedaCartas,
  inicializarBusquedaDialogo
} from "../modules/busquedaCartas.js"

const grid = document.getElementById("cardsGrid")
const estado = document.getElementById("cards-status")
const contenedorPaginacion = document.querySelector(".cards-pagination")
const selectAlfabetico = document.getElementById("selectAlfabetico")
const selectPrecio = document.getElementById("selectPrecio")

function obtenerOrden() {
  return selectAlfabetico?.value && selectAlfabetico.value !== "none"
    ? selectAlfabetico.value
    : selectPrecio?.value && selectPrecio.value !== "none"
      ? selectPrecio.value
      : undefined
}

const buscador = crearBusquedaCartas({
  contenedor: grid,
  estado,
  obtenerOrden,
  onPaginacion: (paginacion, cargando) => {
    renderizarPaginacion(contenedorPaginacion, paginacion, { cargando })
  }
})

inicializarEventosPaginacion(contenedorPaginacion, (pagina) => {
  void buscador?.cargarPagina(pagina)
})

selectAlfabetico?.addEventListener("change", () => {
  if (selectAlfabetico.value !== "none" && selectPrecio) {
    selectPrecio.value = "none"
  }
  void buscador?.buscar()
})

selectPrecio?.addEventListener("change", () => {
  if (selectPrecio.value !== "none" && selectAlfabetico) {
    selectAlfabetico.value = "none"
  }
  void buscador?.buscar()
})

inicializarBusquedaDialogo()
