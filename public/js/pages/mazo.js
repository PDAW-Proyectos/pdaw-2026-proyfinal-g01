import { ApiError } from "../api.js"
import {
  renderizarErrorMazoDetallado,
  renderizarMazoDetallado
} from "../components/mazo/mazoDetallado.js"
import { obtenerMazoPorId } from "../services/servicioMazos.js"

/**
 * Lee el ID de la URL, carga el mazo desde el backend y lo renderiza con `mazoDetallado`.
 */
async function inicializarDetalleMazo() {
  const parametros = new URLSearchParams(window.location.search)
  const idMazo = parametros.get("id")
  const esPopular = parametros.get("popular") === "true"
  if (!idMazo) {
    renderizarErrorMazoDetallado("No se indicó qué mazo se debe mostrar.")
    return
  }

  try {
    const mazo = await obtenerMazoPorId(idMazo, { popular: esPopular })
    renderizarMazoDetallado(mazo)
  } catch (error) {
    console.error("No se pudo cargar el detalle del mazo:", error)
    const mensaje = error instanceof ApiError && error.status === 404
      ? "No se encontró el mazo solicitado."
      : error.message || "No se pudo cargar el detalle del mazo."
    renderizarErrorMazoDetallado(mensaje)
  }
}

void inicializarDetalleMazo()
