import {
  formatearPrecio,
  obtenerAtributosCarta,
  obtenerEstadoBanlist,
  obtenerSubtituloCarta
} from "../../utils/utilidadesCartas.js"
import { obtenerElemento } from "../../utils/utilidadesDominio.js"
import { renderizarImagenCarta } from "../imagenCarta.js"

function renderizarAtributos(carta) {
  const grilla = obtenerElemento("detail-attributes")
  const fragmento = document.createDocumentFragment()

  for (const [etiqueta, valor] of obtenerAtributosCarta(carta, { detallado: true })) {
    const item = document.createElement("div")
    item.className =
      "g-col-6 sm:g-col-4 md:g-col-3 badge theme-primary rounded-1 d-flex flex-column justify-content-center align-items-center p-3 h-100 text-wrap lh-sm"

    const nombre = document.createElement("span")
    nombre.className = "fs-xs text-uppercase opacity-75 fw-normal"
    nombre.textContent = etiqueta

    const contenido = document.createElement("span")
    contenido.className = "fs-sm fw-bold mt-1"
    contenido.textContent = String(valor)

    item.append(nombre, contenido)
    fragmento.append(item)
  }

  grilla.replaceChildren(fragmento)
}

function renderizarDatoInferior(idElemento, etiqueta, valorTexto) {
  const contenedor = obtenerElemento(idElemento)
  const etiquetaEl = document.createElement("small")
  etiquetaEl.className = "fs-xs fg-2 text-uppercase fw-semibold"
  etiquetaEl.textContent = etiqueta

  const valorEl = document.createElement("span")
  valorEl.className = "fs-lg fw-bold"
  valorEl.textContent = valorTexto

  contenedor.replaceChildren(etiquetaEl, valorEl)
}

/** Presenta los datos de una carta en la plantilla de detalle. */
export function renderizarDetalleCarta(carta) {
  const imagenActual = obtenerElemento("detail-image")
  const contenedorImagen = renderizarImagenCarta(carta, {
    tamano: "full",
    estadoBan: obtenerEstadoBanlist(carta),
    idImagen: "detail-image",
    clasesContenedor: "hover-lift",
    clasesImagen: "border border-2 border-primary"
  })

  const imagen = contenedorImagen.querySelector("#detail-image")
  imagen.setAttribute("role", "button")
  imagen.tabIndex = 0
  imagen.dataset.bsToggle = "dialog"
  imagen.dataset.bsTarget = "#cardImageDialog"
  imagen.setAttribute("aria-label", "Ver imagen de la carta en grande")

  imagenActual.parentElement.replaceWith(contenedorImagen)

  obtenerElemento("detail-name").textContent = carta.name
  obtenerElemento("detail-subname").textContent = obtenerSubtituloCarta(carta)
  obtenerElemento("detail-description").textContent =
    carta.desc || "Esta carta no tiene una descripción disponible."

  const misc = carta.misc_info ?? {}
  const konamiId = misc.konami_id ?? carta.id
  renderizarDatoInferior(
    "detail-konami-id",
    "KONAMI ID",
    konamiId !== null && konamiId !== undefined && konamiId !== ""
      ? String(konamiId)
      : "Sin ID disponible"
  )

  renderizarDatoInferior(
    "detail-price",
    "PRECIO",
    formatearPrecio(carta.card_price)
  )

  renderizarAtributos(carta)
  obtenerElemento("detail-status").hidden = true
  obtenerElemento("detail-card").hidden = false
  obtenerElemento("detail-page").setAttribute("aria-busy", "false")
  document.title = `${carta.name} · YuGiKi`
}

/** Informa errores de parámetro o de carga en la página de detalle. */
export function renderizarErrorDetalleCarta(mensaje) {
  obtenerElemento("detail-card").hidden = true
  obtenerElemento("detail-status").textContent = mensaje
  obtenerElemento("detail-page").setAttribute("aria-busy", "false")
}
