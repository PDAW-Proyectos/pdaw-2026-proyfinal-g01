import { ApiError } from "../api.js"
import {
  renderizarDetalleMazo,
  renderizarErrorDetalleMazo
} from "../components/renderizadorDetalleMazo.js"
import { obtenerMazoPorId } from "../services/mazosApi.js"

const paginas = { main: 1, extra: 1 }
let mazoActual

function cambiarPagina(zona, pagina) {
  paginas[zona] = pagina
  renderizarDetalleMazo(mazoActual, paginas, cambiarPagina)
}

/**
 * Lee el ID de la URL, carga el mazo desde el backend y conecta la paginación.
 */
async function inicializarDetalleMazo() {
  const idMazo = new URLSearchParams(window.location.search).get("id")
  if (!idMazo) {
    renderizarErrorDetalleMazo("No se indicó qué mazo se debe mostrar.")
    return
  }

  try {
    mazoActual = await obtenerMazoPorId(idMazo)
    renderizarDetalleMazo(mazoActual, paginas, cambiarPagina)
  } catch (error) {
    console.error("No se pudo cargar el detalle del mazo:", error)
    const mensaje = error instanceof ApiError && error.status === 404
      ? "No se encontró el mazo solicitado."
      : error.message || "No se pudo cargar el detalle del mazo."
    renderizarErrorDetalleMazo(mensaje)
  }
}

void inicializarDetalleMazo()