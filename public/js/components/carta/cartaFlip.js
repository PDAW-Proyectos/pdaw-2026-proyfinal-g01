import {
  crearUrlDetalleCarta,
  obtenerAtributosCarta
} from "../../utils/utilidadesCartas.js"
import { crearTarjetaCarta } from "./cartaTarjeta.js"

function sincronizarAccesibilidadCaras(tarjeta, estaVolteada) {
  tarjeta.setAttribute("aria-pressed", String(estaVolteada))

  const frente = tarjeta.querySelector(".card-front")
  const dorso = tarjeta.querySelector(".card-back")

  if (frente) {
    frente.inert = estaVolteada
  }

  if (dorso) {
    dorso.inert = !estaVolteada
    for (const accion of dorso.querySelectorAll("a, button")) {
      accion.tabIndex = estaVolteada ? 0 : -1
    }
  }
}

/**
 * Alterna el giro (flip) de una tarjeta de carta y actualiza su accesibilidad.
 * @param {HTMLElement} tarjeta
 * @param {boolean} [forzarEstado]
 * @returns {boolean}
 */
export function alternarFlipCarta(tarjeta, forzarEstado) {
  if (!tarjeta) return false
  const estaVolteada = tarjeta.classList.toggle("flipped", forzarEstado)
  sincronizarAccesibilidadCaras(tarjeta, estaVolteada)
  return estaVolteada
}

/**
 * Conecta los eventos de clic y teclado (Enter / Espacio) para voltear la tarjeta,
 * evitando interceptar clics sobre botones o enlaces de acción.
 * @param {HTMLElement} tarjeta
 */
export function enlazarFlipCarta(tarjeta) {
  if (!tarjeta) return

  tarjeta.addEventListener("click", (evento) => {
    if (evento.target.closest("a, button, [data-card-action]")) return
    alternarFlipCarta(tarjeta)
  })

  tarjeta.addEventListener("keydown", (evento) => {
    if (evento.target.closest("a, button, [data-card-action]")) return
    if (evento.key !== "Enter" && evento.key !== " ") return
    evento.preventDefault()
    alternarFlipCarta(tarjeta)
  })
}

/**
 * Construye el dorso de la tarjeta flip estilizado con Bootstrap 6, mostrando el
 * resumen de atributos de la carta y el botón de acción hacia su página de detalle.
 * @param {Object} carta
 * @param {{onSelect?: (carta: Object) => void, textoAccion?: string}} [opciones]
 * @returns {HTMLDivElement}
 */
export function crearDorsoCartaFlip(carta, { onSelect, textoAccion } = {}) {
  const dorso = document.createElement("div")
  dorso.className =
    "card card-face card-back border border-primary bg-primary fg-white p-3 d-flex flex-column h-100"
  dorso.inert = true

  const titulo = document.createElement("h3")
  titulo.className =
    "card-back-title h6 fw-bold mb-2 pb-2 border-bottom text-truncate flex-shrink-0"
  titulo.textContent = carta.name

  const atributos = document.createElement("ul")
  atributos.className =
    "card-back-attrs list-unstyled d-flex flex-column gap-1 mb-3 flex-grow-1 min-h-0 overflow-y-auto"

  for (const [etiqueta, valor] of obtenerAtributosCarta(carta)) {
    const item = document.createElement("li")
    item.className =
      "card-back-attr d-flex justify-content-between align-items-baseline gap-2 py-1 border-bottom fs-xs"

    const spanNombre = document.createElement("span")
    spanNombre.className = "text-uppercase opacity-75 flex-shrink-0"
    spanNombre.textContent = etiqueta

    const spanValor = document.createElement("span")
    spanValor.className = "fw-bold text-end"
    spanValor.textContent = String(valor)

    item.append(spanNombre, spanValor)
    atributos.append(item)
  }

  let accion
  if (onSelect) {
    accion = document.createElement("button")
    accion.type = "button"
    accion.textContent = textoAccion || "Agregar al mazo"
    accion.addEventListener("click", () => onSelect(carta))
  } else {
    accion = document.createElement("a")
    accion.href = crearUrlDetalleCarta(carta)
    accion.textContent = textoAccion || "Ver detalles"
  }

  accion.className =
    "btn-solid hero-cta-btn btn-sm w-100 text-uppercase fw-semibold mt-auto flex-shrink-0 text-center"
  accion.dataset.cardAction = "true"
  accion.tabIndex = -1

  dorso.append(titulo, atributos, accion)
  return dorso
}

/**
 * Envuelve una tarjeta frontal (o construye una con `crearTarjetaCarta`) en un
 * contenedor flippable 3D con resumen de atributos y botón de detalle en el dorso.
 * @param {Object} carta
 * @param {{frente?: HTMLElement, onSelect?: (carta: Object) => void, textoAccion?: string}} [opciones]
 * @returns {HTMLElement}
 */
export function crearCartaFlip(carta, { frente, onSelect, textoAccion } = {}) {
  const tarjeta = document.createElement("article")
  tarjeta.className = "card-flip hover-lift"
  tarjeta.tabIndex = 0
  tarjeta.dataset.id = carta.id
  tarjeta.setAttribute("role", "button")
  tarjeta.setAttribute("aria-pressed", "false")
  tarjeta.setAttribute(
    "aria-label",
    `${carta.name}, voltear carta para ver atributos`
  )

  const interior = document.createElement("div")
  interior.className = "card-flip-inner"

  const caraFrontal =
    frente ??
    crearTarjetaCarta(carta, {
      conEnlace: false,
      conHoverLift: false,
      clasesTarjeta: "card-face card-front"
    })

  caraFrontal.classList.add("card-face", "card-front")

  const dorso = crearDorsoCartaFlip(carta, { onSelect, textoAccion })

  interior.append(caraFrontal, dorso)
  tarjeta.append(interior)

  enlazarFlipCarta(tarjeta)
  return tarjeta
}

/**
 * Renderiza un mensaje de error cuando no se pueden cargar o generar las cartas.
 * @param {HTMLElement} contenedor
 * @param {string} [mensaje="No se pudieron cargar las cartas. Intentá nuevamente."]
 */
export function renderizarErrorCartasFlip(
  contenedor,
  mensaje = "No se pudieron cargar las cartas. Intentá nuevamente."
) {
  const errorEl = document.createElement("p")
  errorEl.className = "fg-danger text-center my-4 w-100"
  errorEl.textContent = mensaje
  contenedor.replaceChildren(errorEl)
}

/**
 * Renderiza una lista de cartas flippables de tamaño `.small-card` dentro de un contenedor.
 * @param {Array<Object>} cartas
 * @param {HTMLElement} contenedor
 * @param {{onSelect?: (carta: Object) => void, textoAccion?: string}} [opciones]
 */
export function renderizarCartasFlip(cartas, contenedor, opciones = {}) {
  if (!Array.isArray(cartas)) {
    renderizarErrorCartasFlip(contenedor)
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
      fragmento.append(crearCartaFlip(carta, opciones))
    }
    contenedor.replaceChildren(fragmento)
  } catch (error) {
    console.error("No se pudieron renderizar las cartas:", error)
    renderizarErrorCartasFlip(contenedor)
  }
}
