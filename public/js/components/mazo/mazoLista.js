import { formatearPrecio } from "../../utils/utilidadesCartas.js"
import {
  contarCartasMazo,
  crearUrlDetalleMazo,
  obtenerCartaPortadaMazo
} from "../../utils/utilidadesMazos.js"
import { renderizarImagenCarta } from "../imagenCarta.js"

/**
 * Crea un elemento de lista para un mazo compatible con `renderizarListaTabla`:
 * - Imagen de portada a la izquierda en tamaño `small-card`
 * - Título del mazo arriba a la derecha y creador debajo del título
 * - Cantidad total de cartas abajo a la izquierda y precio total abajo a la derecha
 *
 * @param {Object} mazo
 * @returns {HTMLAnchorElement}
 */
export function crearMazoLista(mazo) {
  const enlace = document.createElement("a")
  enlace.href = crearUrlDetalleMazo(mazo)
  enlace.className =
    "card border border-primary bg-white p-4 d-flex flex-column sm:flex-row align-items-center sm:align-items-stretch gap-4 text-decoration-none fg-body hover-lift"

  const cartaPortada = obtenerCartaPortadaMazo(mazo)
  const imagen = renderizarImagenCarta(cartaPortada, {
    tamano: "small",
    estadoBan: null,
    alt: mazo?.nombre ?? "Mazo",
    clasesContenedor: "flex-shrink-0",
    clasesImagen: "border border-primary"
  })

  const contenido = document.createElement("div")
  contenido.className =
    "d-flex flex-column justify-content-between flex-grow-1 min-w-0 w-100"

  const encabezado = document.createElement("div")
  encabezado.className = "min-w-0"

  const titulo = document.createElement("h2")
  titulo.className = "h4 fw-bold fg-primary mb-1 text-truncate"
  titulo.textContent = mazo?.nombre ?? "Mazo sin nombre"

  const creador = document.createElement("p")
  creador.className = "fg-2 fs-sm mb-0 text-truncate"
  creador.textContent = `Por ${mazo?.username ?? "Anónimo"}`

  encabezado.append(titulo, creador)

  const pie = document.createElement("div")
  pie.className =
    "d-flex justify-content-between align-items-end gap-3 mt-4 pt-3 border-top border-primary"

  const totalCartas = contarCartasMazo(mazo)
  const cantidad = document.createElement("span")
  cantidad.className = "badge theme-primary rounded-1 fs-sm"
  cantidad.textContent = `${totalCartas} ${totalCartas === 1 ? "carta" : "cartas"}`

  const precio = document.createElement("span")
  precio.className = "fs-lg fw-bold fg-body text-end"
  precio.textContent = formatearPrecio(Number(mazo?.precioTotal ?? 0), "US$ 0,00")

  pie.append(cantidad, precio)
  contenido.append(encabezado, pie)
  enlace.append(imagen, contenido)

  return enlace
}
