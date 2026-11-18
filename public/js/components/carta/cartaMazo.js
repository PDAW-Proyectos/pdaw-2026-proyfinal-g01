import {
  enlazarNavegacionCarta,
  obtenerEstadoBanlist
} from "../../utils/utilidadesCartas.js"
import { contarCartasZona } from "../../utils/utilidadesMazos.js"
import { crearControlesCartaMazo } from "./controlesCartaMazo.js"
import { renderizarImagenCarta } from "../imagenCarta.js"

/**
 * Crea una tarjeta de carta para un mazo (`list-card` en móvil y `small-card` en desktop)
 * con su cantidad de copias, ícono de banlist y navegación a la página de detalle al hacer clic.
 * Si `editable` es `true` o se proveen `onAdd`/`onRemove`, agrega `controlesCartaMazo` debajo.
 *
 * @param {{carta: Object, cantidad: number}} entrada
 * @param {Object} [opciones]
 * @param {string} [opciones.nombreMazo="el mazo"]
 * @param {number} [opciones.totalZona=0]
 * @param {number} [opciones.limiteZona=60]
 * @param {boolean} [opciones.editable=false]
 * @param {boolean} [opciones.mutando=false]
 * @param {(carta: Object) => void} [opciones.onAdd]
 * @param {(carta: Object) => void} [opciones.onRemove]
 * @returns {HTMLElement}
 */
export function crearCartaMazo(
  { carta, cantidad },
  {
    nombreMazo = "el mazo",
    totalZona = 0,
    limiteZona = 60,
    editable = false,
    mutando = false,
    onAdd,
    onRemove
  } = {}
) {
  const tarjeta = document.createElement("article")
  tarjeta.className = "d-flex flex-column align-items-center"

  const contenedorImagen = renderizarImagenCarta(carta, {
    tamano: "list",
    cantidad,
    estadoBan: obtenerEstadoBanlist(carta),
    clasesContenedor: "hover-lift",
    clasesImagen: "deck-card-img border border-2 border-primary"
  })
  contenedorImagen.title = carta.name
  contenedorImagen.style.cursor = "pointer"
  enlazarNavegacionCarta(contenedorImagen, carta)

  tarjeta.append(contenedorImagen)

  if (editable || onAdd || onRemove) {
    tarjeta.append(
      crearControlesCartaMazo(carta, {
        cantidad,
        nombreMazo,
        totalZona,
        limiteZona,
        mutando,
        onAdd,
        onRemove
      })
    )
  }

  return tarjeta
}

/**
 * Renderiza una zona del mazo (Main o Extra Deck) usando directamente las entradas `{ carta, cantidad }`.
 *
 * @param {HTMLElement} contenedor
 * @param {Array<{carta: Object, cantidad: number}>} entradas
 * @param {Object} [opciones]
 */
export function renderizarZonaCartasMazo(
  contenedor,
  entradas = [],
  {
    nombreMazo = "el mazo",
    limiteZona = 60,
    editable = false,
    mutando = false,
    mensajeVacio = "Todavía no agregaste cartas a esta sección.",
    onAdd,
    onRemove
  } = {}
) {
  if (entradas.length === 0) {
    const estado = document.createElement("p")
    estado.className = "fg-2 text-center my-4 w-100"
    estado.textContent = mensajeVacio
    contenedor.replaceChildren(estado)
    return
  }

  const totalZona = contarCartasZona(entradas)
  const fragmento = document.createDocumentFragment()

  for (const entrada of entradas) {
    fragmento.append(
      crearCartaMazo(entrada, {
        nombreMazo,
        totalZona,
        limiteZona,
        editable,
        mutando,
        onAdd,
        onRemove
      })
    )
  }

  contenedor.replaceChildren(fragmento)
}
