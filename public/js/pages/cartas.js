import { obtenerPaginaCartas } from "../services/cartaApi.js"
import { renderizarCartas } from "../components/tarjetasCartas.js"
import { inicializarControlesCartas } from "../components/controlesCartas.js"

const grid = document.getElementById("cardsGrid")
const plantilla = document.getElementById("card-template")
const estado = document.getElementById("cards-status")
const estadoPaginacion = document.getElementById("pagination-status")
const botonAnterior = document.getElementById("previous-page")
const botonSiguiente = document.getElementById("next-page")
const selectAlfabetico = document.getElementById("selectAlfabetico")
const selectPrecio = document.getElementById("selectPrecio")


let paginaActual = 1
let paginacionActual
let solicitudActual = 0
let cargando = false

// Inicializar controles.
const controles = inicializarControlesCartas({
  grid,
  selectAlfabetico,
  selectPrecio,
  botonAnterior,
  botonSiguiente,
  estadoPaginacion,

  //onCambiarPagina permite que los controles comuniquen sus acciones a cartas.js, 
  // sin tener que conocer cómo se realizan las solicitudes al backend.
  onCambiarPagina: (valor, siguiente = false) => {
    if (siguiente) {
      cargarPagina(paginaActual + valor)
    } else if (valor === -1) {
      cargarPagina(paginaActual - 1)
    } else {
      cargarPagina(valor)
    }
  }
})

/**
 * Carga una página del backend (20 cartas por página), ordenada globalmente por
 * el servidor. El estado de paginación devuelto por la API habilita los botones
 * anterior/siguiente y permite recorrer el catálogo completo.
 * @param {number} pagina
 */
async function cargarPagina(pagina) {
  const idSolicitud = ++solicitudActual
  cargando = true
  grid.setAttribute("aria-busy", "true")
  estado.textContent = "Cargando cartas..."
  controles.actualizarPaginacion(paginacionActual, cargando)

  try {
    const resultado = await obtenerPaginaCartas(pagina, controles.obtenerOrden())
    if (idSolicitud !== solicitudActual) return

    renderizarCartas(resultado.datos, grid, plantilla)
    paginaActual = resultado.paginacion.paginaActual
    paginacionActual = resultado.paginacion
    estado.textContent = ""
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    console.error("No se pudieron cargar las cartas:", error)
    estado.textContent = "No se pudieron cargar las cartas. Intentá nuevamente."
  } finally {
    if (idSolicitud === solicitudActual) {
      cargando = false
      grid.setAttribute("aria-busy", "false")
      controles.actualizarPaginacion(
        paginacionActual,
        cargando
      )
    }
  }
}

cargarPagina(paginaActual)
