const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD"
})

function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontro el elemento requerido #${id}.`)
  }
  return elemento
}

/**
 * Construye la URL del endpoint propio que entrega y cachea las imágenes.
 * @param {Object} carta
 * @param {"full" | "small"} tipo
 * @returns {string}
 */
function obtenerUrlImagen(carta, tipo) {
  if (!Number.isInteger(Number(carta.id))) {
    throw new Error(`La carta "${carta.name}" no tiene un ID válido.`)
  }

  return `/api/imagenes/${encodeURIComponent(carta.id)}?tipo=${tipo}`
}

/**
 * Devuelve el precio positivo más alto entre las fuentes de precio disponibles
 * en el modelo de cartas (eBay y Amazon).
 * @param {Object} carta
 * @returns {number}
 */
export function obtenerPrecioMaximo(carta) {
  const precios = carta.card_prices?.flatMap((fuente) =>
    [fuente.ebay_price, fuente.amazon_price].map(Number)
  ) ?? []

  return precios.reduce((maximo, precio) =>
    Number.isFinite(precio) && precio > maximo ? precio : maximo, 0)
}

/**
 * Presenta la carta más cara en el bloque destacado.
 * @param {Object} carta
 * @param {number} precio
 */
export function renderizarCartaDestacada(carta, precio) {
  const bloque = document.querySelector(".featured-card")
  if (!bloque) {
    throw new Error("No se encontro el bloque de la carta destacada.")
  }

  const imagen = obtenerElemento("featured-card-image")
  imagen.src = obtenerUrlImagen(carta, "full")
  imagen.alt = carta.name
  obtenerElemento("featured-card-name").textContent = carta.name
  obtenerElemento("featured-card-description").textContent =
    carta.desc || `${carta.race} / ${carta.type}`
  obtenerElemento("featured-card-price").textContent =
    `Precio máximo disponible: ${formatoPrecio.format(precio)}`
  obtenerElemento("featured-card-status").textContent = ""
  bloque.setAttribute("aria-busy", "false")
}

/**
 * Renderiza las cartas mediante clones de la etiqueta <template>.
 * @param {Array<Object>} cartas
 * @returns {number} Cantidad de cartas renderizadas.
 */
export function renderizarCartasPopulares(cartas) {
  const plantilla = obtenerElemento("popular-card-template")
  const grilla = obtenerElemento("popular-cards-grid")
  const fragmento = document.createDocumentFragment()

  for (const carta of cartas) {
    const columna = plantilla.content.cloneNode(true)
    const imagen = columna.querySelector(".popular-card-image")
    imagen.src = obtenerUrlImagen(carta, "small")
    imagen.alt = carta.name
    columna.querySelector(".card-item-name").textContent = carta.name
    columna.querySelector(".card-item-type").textContent =
      `${carta.race} / ${carta.type}`
    fragmento.append(columna)
  }

  grilla.replaceChildren(fragmento)
  obtenerElemento("popular-cards-status").textContent = ""
  return cartas.length
}

/** Informa en la página cuando no es posible cargar los datos. */
export function renderizarErrorDeCartas() {
  const bloque = document.querySelector(".featured-card")
  if (bloque) {
    bloque.setAttribute("aria-busy", "false")
  }

  obtenerElemento("featured-card-name").textContent =
    "Carta destacada no disponible"
  obtenerElemento("featured-card-status").textContent =
    "No se pudo cargar la carta destacada."
  obtenerElemento("popular-cards-status").textContent =
    "No se pudieron cargar las cartas populares."
}
