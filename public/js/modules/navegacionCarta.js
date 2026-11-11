/**
 * Construye la URL de detalle usando el ID estable de la carta.
 * Puede reutilizarse en resultados, cartas populares y componentes de mazos.
 * @param {{id: number|string}} carta
 * @returns {string}
 */
export function crearUrlDetalleCarta(carta) {
  const valorId = carta?.id
  const id = Number(valorId)
  const idValido =
    (typeof valorId === "number" && Number.isSafeInteger(id) && id > 0) ||
    (typeof valorId === "string" && /^[1-9]\d*$/.test(valorId) && Number.isSafeInteger(id))
  if (!idValido) {
    throw new Error("No se puede abrir el detalle de una carta sin un ID válido.")
  }

  return `carta.html?id=${encodeURIComponent(id)}`
}

/**
 * Vincula un elemento visual con la navegación al detalle de una carta.
 * Los elementos no interactivos se habilitan también para navegación con Enter.
 * @param {HTMLElement} elemento
 * @param {{id: number|string}} carta
 */
export function enlazarNavegacionCarta(elemento, carta) {
  const url = crearUrlDetalleCarta(carta)
  const esInteractivo = ["A", "BUTTON"].includes(elemento.tagName)

  if (!esInteractivo) {
    elemento.setAttribute("role", "link")
    elemento.tabIndex = 0
    elemento.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault()
        elemento.click()
      }
    })
  }

  elemento.addEventListener("click", () => {
    window.location.assign(url)
  })
}
