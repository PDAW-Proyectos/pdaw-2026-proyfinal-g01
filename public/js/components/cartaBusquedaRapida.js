import { enlazarNavegacionCarta } from "../utils/utilidadesCartas.js"
import { renderizarImagenCarta } from "./imagenCarta.js"
import { renderizarListaTabla } from "./listaTabla.js"

/**
 * Renderiza un mensaje de error en el contenedor de búsqueda rápida.
 * @param {HTMLElement} contenedor
 * @param {string} [mensaje="No se pudieron cargar los resultados."]
 */
export function renderizarErrorBusquedaRapida(
  contenedor,
  mensaje = "No se pudieron cargar los resultados."
) {
  const errorEl = document.createElement("p")
  errorEl.className = "fg-danger text-center my-4"
  errorEl.textContent = mensaje
  contenedor.replaceChildren(errorEl)
}

/**
 * Crea un div simple para la búsqueda rápida con la imagen a la izquierda y el título a la derecha.
 * @param {Object} carta
 * @param {{onSelect?: (carta: Object) => void}} [opciones]
 * @returns {HTMLDivElement}
 */
export function crearCartaBusquedaRapida(carta, { onSelect } = {}) {
  const item = document.createElement("div")
  item.className = "search-result-item d-flex align-items-center gap-3 py-2 px-3"

  const imagen = renderizarImagenCarta(carta, {
    tamano: "list",
    clasesContenedor: "flex-shrink-0",
    clasesImagen: "border border-primary"
  })

  const titulo = document.createElement("span")
  titulo.className = "fw-bold fs-lg text-truncate"
  titulo.textContent = carta.name

  item.append(imagen, titulo)

  if (onSelect) {
    item.setAttribute("role", "button")
    item.tabIndex = 0
    item.addEventListener("click", () => onSelect(carta))
    item.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault()
        onSelect(carta)
      }
    })
  } else {
    enlazarNavegacionCarta(item, carta)
  }

  return item
}

/**
 * Renderiza una lista de cartas en formato de búsqueda rápida dentro de una tabla en el contenedor.
 * @param {Array<Object>} cartas
 * @param {HTMLElement} contenedor
 * @param {{onSelect?: (carta: Object) => void, limite?: number}} [opciones]
 */
export function renderizarCartasBusquedaRapida(
  cartas,
  contenedor,
  { onSelect, limite = 10 } = {}
) {
  if (!Array.isArray(cartas)) {
    renderizarErrorBusquedaRapida(contenedor)
    return
  }

  try {
    renderizarListaTabla(contenedor, cartas.slice(0, limite), {
      crearFila: (carta) => crearCartaBusquedaRapida(carta, { onSelect }),
      mensajeVacio: "No se encontraron cartas.",
      claseCelda: "p-0 border-0"
    })
  } catch (error) {
    console.error("No se pudieron renderizar los resultados rápidos:", error)
    renderizarErrorBusquedaRapida(contenedor)
  }
}
