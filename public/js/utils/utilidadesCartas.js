export const IMAGEN_DORSO_CARTA = "img/backYgoCard.png"

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD"
})

export const ICONOS_BANLIST = {
  forbidden: {
    src: "img/forbidden.svg",
    alt: "Carta prohibida (Forbidden)"
  },
  banned: {
    src: "img/forbidden.svg",
    alt: "Carta prohibida (Forbidden)"
  },
  limited: {
    src: "img/limited.svg",
    alt: "Carta limitada a 1 copia (Limited)"
  },
  "semi-limited": {
    src: "img/semi-limited.svg",
    alt: "Carta semi-limitada a 2 copias (Semi-Limited)"
  }
}

const MAX_COPIAS_BANLIST = {
  Forbidden: 0,
  Banned: 0,
  Limited: 1,
  "Semi-Limited": 2
}

/**
 * Construye la URL del endpoint propio que entrega y cachea las imágenes (/api/imagenes/:id).
 * @param {Object} carta
 * @param {"full" | "small"} [tipo="small"]
 * @returns {string}
 */
export function obtenerUrlImagen(carta, tipo = "small") {
  return `/api/imagenes/${carta.id}?tipo=${tipo}`
}

/**
 * Construye la URL hacia la página de detalle de una carta (`carta.html?id=...`).
 * @param {Object} carta
 * @returns {string}
 */
export function crearUrlDetalleCarta(carta) {
  return `carta.html?id=${carta.id}`
}

/**
 * Vincula un elemento del DOM con la navegación hacia el detalle de una carta
 * (`carta.html?id=...`) mediante clic o tecla Enter.
 * @param {HTMLElement} elemento
 * @param {Object} carta
 */
export function enlazarNavegacionCarta(elemento, carta) {
  if (!elemento || !carta) return
  const url = crearUrlDetalleCarta(carta)
  const esInteractivo = ["A", "BUTTON"].includes(elemento.tagName)

  if (!esInteractivo) {
    elemento.setAttribute("role", "link")
    elemento.tabIndex = 0
    elemento.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault()
        elemento.click()
      }
    })
  }

  elemento.addEventListener("click", () => {
    window.location.assign(url)
  })
}

/**
 * Formatea `card_price` (ya calculado en el DTO de la API) en USD o devuelve el texto por defecto.
 * @param {number} precio
 * @param {string} [textoSinPrecio="Sin precio disponible"]
 * @returns {string}
 */
export function formatearPrecio(precio, textoSinPrecio = "Sin precio disponible") {
  return precio > 0 ? formatoPrecio.format(precio) : textoSinPrecio
}

/**
 * Formatea ATK o DEF convirtiendo `-1` en `"?"` y omitiendo valores nulos.
 * @param {number|null|undefined} valor
 * @returns {number|string|null}
 */
export function formatearEstadisticaCombate(valor) {
  if (valor === null || valor === undefined) return null
  return valor === -1 ? "?" : valor
}

/**
 * Devuelve el subtítulo de raza y tipo de una carta (`"Spellcaster / Normal Monster"`).
 * @param {Object} carta
 * @returns {string}
 */
export function obtenerSubtituloCarta(carta) {
  return [carta.race, carta.type].filter(Boolean).join(" / ")
}

/**
 * Obtiene la lista de pares `[etiqueta, valor]` no vacíos de una carta.
 * Si `detallado` es `true`, incluye metadatos de `misc_info` y marcadores de Link
 * para la página de detalle; si es `false`, devuelve el resumen para el dorso de tarjeta.
 * @param {Object} carta
 * @param {{detallado?: boolean}} [opciones]
 * @returns {Array<[string, string|number]>}
 */
export function obtenerAtributosCarta(carta, { detallado = false } = {}) {
  const atk = formatearEstadisticaCombate(carta.atk)
  const def = formatearEstadisticaCombate(carta.def)

  const atributos = detallado
    ? [
        ["Tipo", carta.type],
        ["Raza", carta.race],
        ["Atributo", carta.attribute],
        ["Nivel", carta.level],
        ["ATK", atk],
        ["DEF", def],
        ["Escala de péndulo", carta.scale],
        ["Valor de Link", carta.linkval],
        ["Marcadores de Link", carta.linkmarkers?.join(", ")],
        ["Rareza", carta.misc_info?.md_rarity],
        ["Lanzamiento TCG", carta.misc_info?.tcg_date],
        ["Lanzamiento OCG", carta.misc_info?.ocg_date]
      ]
    : [
        ["Nivel", carta.level],
        ["ATK", atk],
        ["DEF", def],
        ["Escala", carta.scale],
        ["Link", carta.linkval],
        ["Atributo", carta.attribute],
        ["Raza", carta.race],
        ["Tipo", carta.type],
        ["Precio", formatearPrecio(carta.card_price)]
      ]

  return atributos.filter(
    ([, valor]) => valor !== null && valor !== undefined && valor !== ""
  )
}

/**
 * Obtiene el estado de banlist aplicable a la carta (priorizando `ban_tcg`).
 * @param {Object} carta
 * @returns {string|null}
 */
export function obtenerEstadoBanlist(carta) {
  const info = carta?.banlist_info
  return info?.ban_tcg ?? info?.ban_ocg ?? info?.ban_goat ?? null
}

/**
 * Devuelve la configuración del ícono SVG de banlist a partir de un objeto carta
 * o directamente de un string de estado (`forbidden`/`banned`, `limited` o `semi-limited`).
 * @param {Object|string|null|undefined} cartaOEstado
 * @returns {{src: string, alt: string}|null}
 */
export function obtenerIconoBanlist(cartaOEstado) {
  const estado =
    typeof cartaOEstado === "string"
      ? cartaOEstado
      : obtenerEstadoBanlist(cartaOEstado)
  return estado ? (ICONOS_BANLIST[estado.toLowerCase()] ?? null) : null
}

/**
 * Devuelve la cantidad máxima de copias permitidas según `ban_tcg` (por defecto 3).
 * @param {Object} carta
 * @returns {number}
 */
export function obtenerMaxCopiasCarta(carta) {
  return MAX_COPIAS_BANLIST[carta?.banlist_info?.ban_tcg] ?? 3
}

/**
 * Lee los filtros de búsqueda de cartas desde un input, un mapa de controles y/o
 * elementos con atributo `[data-card-filter]`.
 * @param {HTMLInputElement|null} entrada
 * @param {Record<string, HTMLInputElement|HTMLSelectElement>} [filtros]
 * @param {HTMLElement|null} [contenedorFiltros]
 * @returns {Record<string, string>}
 */
export function leerFiltrosCartas(
  entrada,
  filtros = {},
  contenedorFiltros = null
) {
  const resultado = {}
  const nombre = entrada?.value?.trim()
  if (nombre) resultado.name = nombre

  const controles = { ...filtros }
  if (contenedorFiltros) {
    for (const el of contenedorFiltros.querySelectorAll("[data-card-filter]")) {
      controles[el.dataset.cardFilter] = el
    }
  }

  for (const [clave, control] of Object.entries(controles)) {
    const valor = control?.value?.trim()
    if (valor && valor !== "all" && valor !== "none") {
      resultado[clave] = valor
    }
  }

  return resultado
}
