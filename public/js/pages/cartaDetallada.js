import {
  inicializarDialogoImagenCarta,
  renderizarDetalleCarta,
  renderizarErrorDetalleCarta
} from "../components/carta/cartaDetalle.js"
import { obtenerCartaPorId } from "../services/servicioCartas.js"

async function inicializarDetalleCarta() {
  inicializarDialogoImagenCarta()

  const id = new URLSearchParams(window.location.search).get("id")
  if (!id) {
    renderizarErrorDetalleCarta("No se indicó qué carta mostrar.")
    return
  }

  try {
    const carta = await obtenerCartaPorId(id)
    renderizarDetalleCarta(carta)
  } catch (error) {
    console.error("No se pudo cargar el detalle de la carta:", error)
    renderizarErrorDetalleCarta(
      "No se pudo cargar esta carta. Verificá el enlace e intentá nuevamente."
    )
  }
}

inicializarDetalleCarta()
