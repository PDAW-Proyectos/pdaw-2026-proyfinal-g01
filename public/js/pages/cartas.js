import { obtenerPaginaCartas } from "../services/cartaApi.js"
import { renderizarCartas } from "../components/tarjetasCartas.js"
import { inicializarControlesCartas } from "../components/controlesCartas.js"
import { mostrarSkeletons } from "../components/skeletonCartas.js"

const grid = document.getElementById("cardsGrid")
const plantilla = document.getElementById("card-template")
const estado = document.getElementById("cards-status")
const estadoPaginacion = document.getElementById("pagination-status")
const botonAnterior = document.getElementById("previous-page")
const botonSiguiente = document.getElementById("next-page")
const selectAlfabetico = document.getElementById("selectAlfabetico")
const selectPrecio = document.getElementById("selectPrecio")

const CARTAS_POR_PAGINA = 20

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

  //onCambiarOrden permite que los controles comuniquen sus acciones a cartas.js, 
  // sin tener que conocer cómo se realizan las solicitudes al backend.
  onCambiarOrden: () => cargarPagina(1),

  onPaginaAnterior: () => {
    if (paginacionActual?.tieneAnterior) {
      cargarPagina(paginaActual - 1)
    }
  },

  onPaginaSiguiente: () => {
    if (paginacionActual?.tieneSiguiente) {
      cargarPagina(paginaActual + 1)
    }
  }
})

/**
 * Obtiene una página de cartas desde el backend.
 *
 * Mientras se realiza la solicitud, muestra tarjetas skeleton.
 * Cuando llegan los datos, reemplaza los skeletons por las
 * tarjetas reales.
 *
 * También evita que una solicitud anterior sobrescriba
 * los resultados de una solicitud más reciente.
 *
 * @param {number} pagina - Número de página solicitada.
 * @returns {Promise<void>}
 */
async function cargarPagina(pagina) {
  const idSolicitud = ++solicitudActual
  cargando = true
  grid.setAttribute("aria-busy", "true")
  estado.textContent = "Cargando cartas..."

  // Mostrar skeletons mientras se espera la respuesta.
  mostrarSkeletons(grid, CARTAS_POR_PAGINA)
  controles.actualizarPaginacion(
    paginacionActual,
    cargando
  )

  try {
    const resultado = await obtenerPaginaCartas(
      pagina,
      controles.obtenerOrden()
    )

    // Ignorar respuestas de solicitudes anteriores.
    if (idSolicitud !== solicitudActual) return

    // Reemplazar skeletons por cartas reales.
    renderizarCartas(resultado.datos, grid, plantilla)

    paginaActual = resultado.paginacion.paginaActual
    paginacionActual = resultado.paginacion
    estado.textContent = ""

  } catch (error) {
    if (idSolicitud !== solicitudActual) return

    console.error("No se pudieron cargar las cartas:", error)
    grid.replaceChildren()
    estado.textContent =
      "No se pudieron cargar las cartas. Intentá nuevamente."

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
