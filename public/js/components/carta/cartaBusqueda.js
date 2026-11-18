import {
  crearUrlDetalleCarta,
  obtenerAtributosCarta,
  obtenerSubtituloCarta
} from "../../utils/utilidadesCartas.js"
import { renderizarImagenCarta } from "../imagenCarta.js"

/**
 * Alterna el giro (flip) de una tarjeta de carta.
 * @param {HTMLElement} tarjeta
 */
export function alternarFlipCarta(tarjeta) {
  tarjeta.classList.toggle("flipped")
}

function enlazarFlipCarta(tarjeta) {
  tarjeta.addEventListener("click", (evento) => {
    if (evento.target.closest(".btn-details")) return
    alternarFlipCarta(tarjeta)
  })

  tarjeta.addEventListener("keydown", (evento) => {
    if (evento.target.closest(".btn-details")) return
    if (evento.key !== "Enter" && evento.key !== " ") return
    evento.preventDefault()
    alternarFlipCarta(tarjeta)
  })
}

/**
 * Renderiza un mensaje de error cuando no se pueden cargar o generar las cartas.
 * @param {HTMLElement} contenedor
 * @param {string} [mensaje="No se pudieron cargar las cartas. Intentá nuevamente."]
 */
export function renderizarErrorCartaBusqueda(
  contenedor,
  mensaje = "No se pudieron cargar las cartas. Intentá nuevamente."
) {
  const errorEl = document.createElement("p")
  errorEl.className = "fg-danger text-center my-4 w-100"
  errorEl.textContent = mensaje
  contenedor.replaceChildren(errorEl)
}

/**
 * Crea una tarjeta de carta de tamaño `.small-card` con efecto flip para ver atributos
 * y le asigna sus eventos de giro y acción.
 * @param {Object} carta
 * @param {{onSelect?: (carta: Object) => void, textoAccion?: string}} [opciones]
 * @returns {HTMLElement}
 */
export function crearCartaBusqueda(carta, { onSelect, textoAccion } = {}) {
  const tarjeta = document.createElement("article")
  tarjeta.className = "card-flip border border-primary"
  tarjeta.tabIndex = 0
  tarjeta.dataset.id = carta.id
  tarjeta.setAttribute("aria-label", `${carta.name}, mostrar detalles`)

  const interior = document.createElement("div")
  interior.className = "card-flip-inner"

  const frente = document.createElement("div")
  frente.className = "card-face card-front"

  const imagen = renderizarImagenCarta(carta, {
    tamano: "small",
    clasesContenedor: "w-100",
    clasesImagen: "card-image"
  })

  const infoFrente = document.createElement("div")
  infoFrente.className = "card-front-info"

  const nombre = document.createElement("div")
  nombre.className = "card-front-name"
  nombre.textContent = carta.name

  const tipo = document.createElement("div")
  tipo.className = "card-front-type"
  tipo.textContent = obtenerSubtituloCarta(carta)

  infoFrente.append(nombre, tipo)
  frente.append(imagen, infoFrente)

  const dorso = document.createElement("div")
  dorso.className = "card-face card-back"

  const atributos = document.createElement("ul")
  atributos.className = "back-attr-list"

  for (const [etiqueta, valor] of obtenerAtributosCarta(carta)) {
    const item = document.createElement("li")
    const spanNombre = document.createElement("span")
    const spanValor = document.createElement("span")
    spanNombre.textContent = etiqueta
    spanValor.textContent = String(valor)
    item.append(spanNombre, spanValor)
    atributos.append(item)
  }

  let accion
  if (onSelect) {
    accion = document.createElement("button")
    accion.type = "button"
    accion.className = "btn-details"
    accion.textContent = textoAccion || "Agregar al mazo"
    accion.addEventListener("click", () => onSelect(carta))
  } else {
    accion = document.createElement("a")
    accion.className = "btn-details"
    accion.href = crearUrlDetalleCarta(carta)
    accion.textContent = textoAccion || "Ver detalles"
  }

  dorso.append(atributos, accion)
  interior.append(frente, dorso)
  tarjeta.append(interior)

  enlazarFlipCarta(tarjeta)
  return tarjeta
}

/**
 * Renderiza una lista de cartas con `.small-card` y flip dentro de un contenedor.
 * @param {Array<Object>} cartas
 * @param {HTMLElement} contenedor
 * @param {{onSelect?: (carta: Object) => void, textoAccion?: string}} [opciones]
 */
export function renderizarCartasBusqueda(cartas, contenedor, opciones = {}) {
  if (!Array.isArray(cartas)) {
    renderizarErrorCartaBusqueda(contenedor)
    return
  }

  if (!cartas.length) {
    const vacio = document.createElement("p")
    vacio.className = "fg-2 text-center my-4 w-100"
    vacio.textContent = "No se encontraron cartas."
    contenedor.replaceChildren(vacio)
    return
  }

  try {
    const fragmento = document.createDocumentFragment()
    for (const carta of cartas) {
      fragmento.append(crearCartaBusqueda(carta, opciones))
    }
    contenedor.replaceChildren(fragmento)
  } catch (error) {
    console.error("No se pudieron renderizar las cartas:", error)
    renderizarErrorCartaBusqueda(contenedor)
  }
}
