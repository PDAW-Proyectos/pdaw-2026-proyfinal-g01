import { obtenerUrlImagen } from "./renderizadorCartas.js"
import { enlazarNavegacionCarta } from "../modules/navegacionCarta.js"

const LIMITE_RESULTADOS = 10

function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontró el elemento requerido #${id}.`)
  }
  return elemento
}

function actualizarVisibilidadDropdown(visible) {
  obtenerElemento("search-dropdown").classList.toggle("active", visible)
  obtenerElemento("search-input").setAttribute("aria-expanded", String(visible))
}

/** Muestra el spinner de búsqueda dentro del dropdown. */
export function mostrarCargaBusqueda() {
  actualizarVisibilidadDropdown(true)
  obtenerElemento("search-loading").classList.add("active")
  const resultados = obtenerElemento("search-results")
  resultados.classList.remove("active")
  resultados.replaceChildren()
}

/**
 * Presenta las cartas encontradas usando nodos DOM y texto seguro.
 * @param {Array<Object>} cartas
 * @param {(carta: Object) => void} [onSelect] Acción para usar el resultado en lugar de navegar al detalle.
 */
export function renderizarResultadosBusqueda(cartas, onSelect) {
  const carga = obtenerElemento("search-loading")
  const resultados = obtenerElemento("search-results")
  const fragmento = document.createDocumentFragment()

  carga.classList.remove("active")
  resultados.replaceChildren()

  if (cartas.length === 0) {
    const mensaje = document.createElement("p")
    mensaje.className = "no-results"
    mensaje.textContent = "No se encontraron cartas."
    fragmento.append(mensaje)
  } else {
    for (const carta of cartas.slice(0, LIMITE_RESULTADOS)) {
      const resultado = document.createElement("button")
      resultado.type = "button"
      resultado.className = "search-result-item"

      const imagen = document.createElement("img")
      imagen.className = "search-result-image"
      imagen.src = obtenerUrlImagen(carta, "small")
      imagen.alt = ""
      imagen.loading = "lazy"

      const informacion = document.createElement("span")
      informacion.className = "search-result-info"

      const nombre = document.createElement("span")
      nombre.className = "search-result-name"
      nombre.textContent = carta.name

      const tipo = document.createElement("span")
      tipo.className = "search-result-type"
      tipo.textContent = `${carta.race} / ${carta.type}`

      informacion.append(nombre, tipo)
      resultado.append(imagen, informacion)
      if (onSelect) {
        resultado.setAttribute("role", "option")
        resultado.addEventListener("click", () => onSelect(carta))
      } else {
        enlazarNavegacionCarta(resultado, carta)
      }
      fragmento.append(resultado)
    }

    if (cartas.length > LIMITE_RESULTADOS) {
      const aviso = document.createElement("p")
      aviso.className = "no-results"
      aviso.textContent = `Se muestran ${LIMITE_RESULTADOS} de ${cartas.length} resultados.`
      fragmento.append(aviso)
    }
  }

  resultados.append(fragmento)
  resultados.classList.add("active")
  actualizarVisibilidadDropdown(true)
}

/** Oculta el spinner y comunica un error sin descartar los controles de búsqueda. */
export function mostrarErrorBusqueda() {
  const carga = obtenerElemento("search-loading")
  const resultados = obtenerElemento("search-results")
  const mensaje = document.createElement("p")
  mensaje.className = "no-results"
  mensaje.textContent = "No se pudieron cargar los resultados. Intentalo de nuevo."

  carga.classList.remove("active")
  resultados.replaceChildren(mensaje)
  resultados.classList.add("active")
  actualizarVisibilidadDropdown(true)
}

/** Cierra el dropdown y limpia sus resultados y estado de carga. */
export function cerrarDropdownBusqueda() {
  obtenerElemento("search-loading").classList.remove("active")
  const resultados = obtenerElemento("search-results")
  resultados.classList.remove("active")
  resultados.replaceChildren()
  actualizarVisibilidadDropdown(false)
}
