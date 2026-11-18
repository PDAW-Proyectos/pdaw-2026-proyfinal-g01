import {
  crearUrlDetalleCarta,
  obtenerSubtituloCarta
} from "../../utils/utilidadesCartas.js"
import { renderizarImagenCarta } from "../imagenCarta.js"

/**
 * Construye una tarjeta de carta de tamaño `.small-card` con el diseño
 * del carrusel principal de `index.html`.
 *
 * @param {Object} carta
 * @param {Object} [opciones]
 * @param {boolean} [opciones.conEnlace=true]
 * @param {boolean} [opciones.conHoverLift=true]
 * @param {string} [opciones.clasesTarjeta=""]
 * @param {string} [opciones.clasesImagen="card-slide-img card-img-top"]
 * @returns {HTMLElement}
 */
export function crearTarjetaCarta(
  carta,
  {
    conEnlace = true,
    conHoverLift = true,
    clasesTarjeta = "",
    clasesImagen = "card-slide-img card-img-top"
  } = {}
) {
  const tarjeta = document.createElement("article")
  tarjeta.className = [
    "card h-100 border border-primary",
    conHoverLift ? "hover-lift" : "",
    clasesTarjeta
  ]
    .filter(Boolean)
    .join(" ")

  const imagen = renderizarImagenCarta(carta, {
    tamano: "small",
    clasesContenedor: "flex-shrink-0",
    clasesImagen
  })

  const cuerpo = document.createElement("div")
  cuerpo.className = "card-body bg-white fg-body text-center p-3 w-100"

  const nombre = document.createElement("h3")
  nombre.className = "card-slide-name h6 fw-bold mb-1 text-truncate"
  nombre.textContent = carta.name

  const tipo = document.createElement("p")
  tipo.className = "card-slide-type fs-xs mb-0 text-truncate"
  tipo.textContent = obtenerSubtituloCarta(carta)

  cuerpo.append(nombre, tipo)

  if (conEnlace) {
    const enlace = document.createElement("a")
    enlace.href = crearUrlDetalleCarta(carta)
    enlace.className = "card-slide-link stretched-link"
    enlace.setAttribute("aria-label", `Ver detalles de ${carta.name}`)
    cuerpo.append(enlace)
  }

  tarjeta.append(imagen, cuerpo)
  return tarjeta
}
