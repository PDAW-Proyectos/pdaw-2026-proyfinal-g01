import {
  IMAGEN_DORSO_CARTA,
  obtenerEstadoBanlist,
  obtenerIconoBanlist,
  obtenerUrlImagen
} from "../utils/utilidadesCartas.js"

export const CLASES_TAMANO_CARTA = {
  full: "full-card",
  small: "small-card",
  list: "list-card"
}

const IMAGENES_COPIAS = {
  2: {
    src: "img/cardsX2.webp",
    alt: "2 copias"
  },
  3: {
    src: "img/cardsX3.webp",
    alt: "3 copias"
  }
}

function normalizarOpciones(carta, tamanoOOpciones, cantidadPos, estadoBanPos, opcionesExtra = {}) {
  if (typeof tamanoOOpciones === "string") {
    return {
      tamano: tamanoOOpciones,
      cantidad: cantidadPos ?? 1,
      estadoBan: estadoBanPos !== undefined ? estadoBanPos : obtenerEstadoBanlist(carta),
      ...opcionesExtra
    }
  }

  const opciones = tamanoOOpciones ?? {}
  return {
    tamano: opciones.tamano ?? opciones.size ?? "small",
    cantidad: opciones.cantidad ?? opciones.amount ?? 1,
    estadoBan:
      opciones.estadoBan !== undefined
        ? opciones.estadoBan
        : opciones.banState !== undefined
          ? opciones.banState
          : obtenerEstadoBanlist(carta),
    ...opciones
  }
}

/**
 * Renderiza la imagen de una carta con su clase de tamaño (`full-card`, `small-card` o `list-card`),
 * insignia de cantidad de copias en el centro inferior e ícono de banlist
 * (arriba a la izquierda si muestra cantidad, o abajo a la derecha si no muestra cantidad).
 *
 * @param {Object|null} carta
 * @param {Object|("full"|"small"|"list")} [tamanoOOpciones]
 * @param {number} [cantidadPos]
 * @param {string|null} [estadoBanPos]
 * @param {Object} [opcionesExtra]
 * @returns {HTMLDivElement}
 */
export function renderizarImagenCarta(
  carta,
  tamanoOOpciones = {},
  cantidadPos,
  estadoBanPos,
  opcionesExtra
) {
  const {
    tamano = "small",
    cantidad = 1,
    estadoBan,
    clasesImagen = "",
    clasesContenedor = "",
    idImagen = "",
    alt,
    loading
  } = normalizarOpciones(carta, tamanoOOpciones, cantidadPos, estadoBanPos, opcionesExtra)

  const claseTamano = CLASES_TAMANO_CARTA[tamano] ?? CLASES_TAMANO_CARTA.small
  const tipoEndpoint = tamano === "full" ? "full" : "small"

  const contenedor = document.createElement("div")
  contenedor.className = ["position-relative d-inline-block", clasesContenedor]
    .filter(Boolean)
    .join(" ")

  const imagen = document.createElement("img")
  if (idImagen) imagen.id = idImagen
  imagen.className = [claseTamano, "d-block", clasesImagen].filter(Boolean).join(" ")
  imagen.alt = alt ?? carta?.name ?? ""
  imagen.loading = loading ?? (tamano === "full" ? "eager" : "lazy")

  try {
    imagen.src = carta ? obtenerUrlImagen(carta, tipoEndpoint) : IMAGEN_DORSO_CARTA
  } catch {
    imagen.src = IMAGEN_DORSO_CARTA
  }

  imagen.addEventListener("error", () => {
    imagen.src = IMAGEN_DORSO_CARTA
  }, { once: true })

  contenedor.append(imagen)

  const configCopias = IMAGENES_COPIAS[Number(cantidad)] ?? null
  const configBanlist = obtenerIconoBanlist(estadoBan)

  if (configBanlist) {
    const iconoBanlist = document.createElement("img")
    iconoBanlist.src = configBanlist.src
    iconoBanlist.alt = configBanlist.alt
    iconoBanlist.title = configBanlist.alt

    const claseBadge = tamano === "full" ? "banlist-badge" : "deck-banlist-badge"
    const clasePosicion = configCopias
      ? "position-absolute top-0 start-0 m-1 pe-none"
      : `position-absolute bottom-0 end-0 ${tamano === "full" ? "m-2" : "m-1"} pe-none`

    iconoBanlist.className = `${claseBadge} ${clasePosicion}`
    contenedor.append(iconoBanlist)
  }

  if (configCopias) {
    const insigniaCopias = document.createElement("img")
    insigniaCopias.src = configCopias.src
    insigniaCopias.alt = configCopias.alt
    insigniaCopias.className =
      "copy-count-badge position-absolute bottom-0 start-50 translate-middle-x mb-1 pe-none"
    contenedor.append(insigniaCopias)
  }

  return contenedor
}
