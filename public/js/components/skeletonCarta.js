import { renderizarImagenCarta } from "./imagenCarta.js"

/** Crea un elemento skeleton usando el dorso de carta de Yu-Gi-Oh! mientras carga. */
export function crearSkeletonCarta({
  tamano = "small",
  clasesImagen = "border border-primary"
} = {}) {
  const tarjeta = document.createElement("article")
  tarjeta.className = "card-skeleton d-inline-flex justify-content-center"
  tarjeta.setAttribute("aria-hidden", "true")

  tarjeta.append(
    renderizarImagenCarta(null, {
      tamano,
      estadoBan: null,
      clasesImagen
    })
  )
  return tarjeta
}

/** Muestra una cantidad determinada de cartas en estado de carga dentro de un contenedor. */
export function mostrarSkeletons(contenedor, cantidad = 20, opciones = {}) {
  const fragmento = document.createDocumentFragment()

  for (let i = 0; i < cantidad; i++) {
    fragmento.append(crearSkeletonCarta(opciones))
  }

  contenedor.replaceChildren(fragmento)
}
