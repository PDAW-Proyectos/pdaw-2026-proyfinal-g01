import { formatearPrecio } from "../utils/utilidadesCartas.js"
import {
  LIMITE_EXTRA_DECK,
  LIMITE_MAIN_DECK,
  contarCartasMazo,
  contarCartasZona
} from "../utils/utilidadesMazos.js"

export { LIMITE_EXTRA_DECK, LIMITE_MAIN_DECK }

function asignarTexto(id, texto) {
  const elemento = document.getElementById(id)
  if (elemento) {
    elemento.textContent = texto
  }
}

/**
 * Asigna a los elementos correspondientes los datos del mazo:
 * título, cartas totales, cantidad en Main Deck, cantidad en Extra Deck,
 * estado de validación y precio total.
 *
 * @param {Object|null} mazo
 * @param {{mutando?: boolean}} [opciones]
 */
export function renderizarInformacionMazo(mazo, { mutando = false } = {}) {
  const cantidadMain = contarCartasZona(mazo?.mainDeck)
  const cantidadExtra = contarCartasZona(mazo?.extraDeck)
  const totalCartas = contarCartasMazo(mazo)

  // Título y estado de guardado
  asignarTexto("deck-title", mazo?.nombre ?? "Mis mazos")
  asignarTexto("deck-name", mazo?.nombre ?? "")
  asignarTexto("delete-deck-name", mazo ? `«${mazo.nombre}»` : "")
  asignarTexto(
    "deck-save-status",
    mazo
      ? "Los cambios se guardan automáticamente."
      : "Crea un mazo en el panel izquierdo para comenzar."
  )
  if (mazo?.username) {
    asignarTexto("deck-author", `Por: ${mazo.username}`)
  }

  // Cartas en total, Main Deck y Extra Deck
  asignarTexto(
    "deck-total-cards",
    `${totalCartas} ${totalCartas === 1 ? "carta" : "cartas"}`
  )
  asignarTexto("main-heading", `Main Deck (${cantidadMain}/${LIMITE_MAIN_DECK})`)
  asignarTexto("extra-heading", `Extra Deck (${cantidadExtra}/${LIMITE_EXTRA_DECK})`)
  asignarTexto("deck-main-count", `${cantidadMain} cartas`)
  asignarTexto("deck-extra-count", `${cantidadExtra} cartas`)
  asignarTexto(
    "deck-breakdown-cards",
    `Main: ${cantidadMain}/${LIMITE_MAIN_DECK} · Extra: ${cantidadExtra}/${LIMITE_EXTRA_DECK}`
  )

  // Validación del mazo
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

  // Precio total
  const precio = Number(mazo?.precioTotal ?? 0)
  asignarTexto(
    "deck-price",
    Number.isFinite(precio) && precio >= 0
      ? formatearPrecio(precio, "$0,00")
      : formatearPrecio(0, "$0,00")
  )

  // Botón de eliminar mazo (si existe en la vista)
  const btnEliminarMazo = document.getElementById("delete-deck-btn")
  if (btnEliminarMazo) {
    btnEliminarMazo.disabled = !mazo || Boolean(mutando)
  }
}
