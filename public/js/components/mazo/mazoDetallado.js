import { obtenerElemento } from "../../utils/utilidadesDominio.js"
import {
  LIMITE_EXTRA_DECK,
  LIMITE_MAIN_DECK
} from "../../utils/utilidadesMazos.js"
import { renderizarZonaCartasMazo } from "../carta/cartaMazo.js"
import { renderizarInformacionMazo } from "./informacionMazo.js"

/**
 * Renderiza un mazo en modo de solo lectura (vista detallada):
 * nombre del mazo, creador (salvo cuando es `"meta"`), Main Deck y Extra Deck
 * con `cartaMazo` (sin controles de edición), y el panel de información.
 *
 * @param {Object} mazo
 */
export function renderizarMazoDetallado(mazo) {
  renderizarInformacionMazo(mazo, {
    mostrarCreador: true,
    tituloPorDefecto: "Mazo"
  })

  const mensajeVacio = "Este mazo todavía no tiene cartas en esta sección."

  renderizarZonaCartasMazo(obtenerElemento("main-cards"), mazo?.mainDeck ?? [], {
    nombreMazo: mazo?.nombre,
    limiteZona: LIMITE_MAIN_DECK,
    editable: false,
    mensajeVacio
  })

  renderizarZonaCartasMazo(obtenerElemento("extra-cards"), mazo?.extraDeck ?? [], {
    nombreMazo: mazo?.nombre,
    limiteZona: LIMITE_EXTRA_DECK,
    editable: false,
    mensajeVacio
  })

  obtenerElemento("deck-content").hidden = false
  obtenerElemento("deck-status").hidden = true
  obtenerElemento("deck-page").setAttribute("aria-busy", "false")
  if (mazo?.nombre) {
    document.title = `${mazo.nombre} · YuGiKi`
  }
}

/**
 * Muestra un mensaje de error en la página de detalle de mazo.
 *
 * @param {string} mensaje
 */
export function renderizarErrorMazoDetallado(mensaje) {
  obtenerElemento("deck-content").hidden = true
  const estado = obtenerElemento("deck-status")
  estado.textContent = mensaje
  estado.classList.add("fg-danger")
  estado.hidden = false
  obtenerElemento("deck-page").setAttribute("aria-busy", "false")
}
