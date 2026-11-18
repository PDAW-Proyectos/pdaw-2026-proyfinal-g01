import { formatearPrecio } from "../../utils/utilidadesCartas.js"
import {
  LIMITE_EXTRA_DECK,
  LIMITE_MAIN_DECK,
  contarCartasMazo,
  contarCartasZona
} from "../../utils/utilidadesMazos.js"

export { LIMITE_EXTRA_DECK, LIMITE_MAIN_DECK }

function asignarTexto(id, texto) {
  const elemento = document.getElementById(id)
  if (elemento) {
    elemento.textContent = texto
  }
}

/**
 * Asigna a los elementos estandarizados de mazo los datos correspondientes:
 * nombre, creador (opcional, omitiendo `"meta"`), encabezados de zonas,
 * cartas totales, cantidad en Main Deck, cantidad en Extra Deck,
 * validez y precio total.
 *
 * @param {Object|null} mazo
 * @param {{mostrarCreador?: boolean, tituloPorDefecto?: string}} [opciones]
 */
export function renderizarInformacionMazo(
  mazo,
  { mostrarCreador = false, tituloPorDefecto = "Mis mazos" } = {}
) {
  const cantidadMain = contarCartasZona(mazo?.mainDeck)
  const cantidadExtra = contarCartasZona(mazo?.extraDeck)
  const totalCartas = contarCartasMazo(mazo)

  // Nombre del mazo
  asignarTexto("deck-title", mazo?.nombre ?? tituloPorDefecto)

  // Creador del mazo (solo en vista detallada y cuando no sea "meta")
  const autorEl = document.getElementById("deck-author")
  if (autorEl) {
    const creador = mazo?.username?.trim() ?? ""
    const debeMostrarCreador =
      mostrarCreador && Boolean(creador) && creador.toLowerCase() !== "meta"
    autorEl.textContent = debeMostrarCreador ? `Creado por: ${creador}` : ""
    autorEl.hidden = !debeMostrarCreador
  }

  // Encabezados de zonas (Main Deck y Extra Deck)
  asignarTexto("main-heading", `Main Deck (${cantidadMain}/${LIMITE_MAIN_DECK})`)
  asignarTexto("extra-heading", `Extra Deck (${cantidadExtra}/${LIMITE_EXTRA_DECK})`)

  // Información del mazo: total, Main Deck, Extra Deck, validez y precio
  asignarTexto(
    "deck-total-cards",
    `${totalCartas} ${totalCartas === 1 ? "carta" : "cartas"}`
  )
  asignarTexto(
    "deck-main-count",
    `${cantidadMain} ${cantidadMain === 1 ? "carta" : "cartas"}`
  )
  asignarTexto(
    "deck-extra-count",
    `${cantidadExtra} ${cantidadExtra === 1 ? "carta" : "cartas"}`
  )

  const validezEl = document.getElementById("deck-validity")
  if (validezEl) {
    const usaBadge = validezEl.classList.contains("badge")
    if (!mazo) {
      validezEl.textContent = "Sin mazo"
      if (usaBadge) validezEl.className = "badge theme-secondary rounded-1 mt-2"
    } else if (mazo.valido) {
      validezEl.textContent = "Válido"
      if (usaBadge) validezEl.className = "badge theme-success rounded-1 mt-2"
    } else {
      validezEl.textContent = "Incompleto (mín. 40 en Main)"
      if (usaBadge) validezEl.className = "badge theme-warning rounded-1 mt-2 text-wrap"
    }
  }

  const precio = Number(mazo?.precioTotal ?? 0)
  asignarTexto(
    "deck-price",
    Number.isFinite(precio) && precio >= 0
      ? formatearPrecio(precio, "$0,00")
      : formatearPrecio(0, "$0,00")
  )
}
