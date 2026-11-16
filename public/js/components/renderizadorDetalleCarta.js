import { obtenerPrecioMaximo, obtenerUrlImagen } from "./renderizadorCartas.js"

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD"
})

function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontró el elemento requerido #${id}.`)
  }
  return elemento
}

function obtenerAtributos(carta) {
  const atributos = [
    ["Nivel", carta.level],
    ["ATK", carta.atk],
    ["DEF", carta.def],
    ["Atributo", carta.attribute],
    ["Raza", carta.race],
    ["Tipo de carta", carta.type],
    ["Clase", carta.frameType],
    ["Escala de péndulo", carta.scale],
    ["Valor de Link", carta.linkval],
    ["Marcadores de Link", carta.linkmarkers?.join(", ")],
    ["ID de carta", carta.id]
  ]

  const lista = Object.entries(carta.banlist_info ?? {})
    .map(([formato, estado]) => `${formato.toUpperCase()}: ${estado}`)
    .join(" · ")
  if (lista) {
    atributos.push(["Lista de prohibición", lista])
  }

  return atributos.filter(([, valor]) =>
    valor !== null && valor !== undefined && valor !== ""
  )
}

function renderizarAtributos(carta) {
  const grilla = obtenerElemento("detail-attributes")
  const fragmento = document.createDocumentFragment()

  for (const [etiqueta, valor] of obtenerAtributos(carta)) {
    const item = document.createElement("div")
    item.className = "attr-item"

    const nombre = document.createElement("div")
    nombre.className = "attr-label"
    nombre.textContent = etiqueta

    const contenido = document.createElement("div")
    contenido.className = "attr-value"
    contenido.textContent = String(valor)

    item.append(nombre, contenido)
    fragmento.append(item)
  }

  grilla.replaceChildren(fragmento)
}

/** Presenta los datos de una carta en la plantilla de detalle. */
export function renderizarDetalleCarta(carta) {
  const imagen = obtenerElemento("detail-image")
  imagen.src = obtenerUrlImagen(carta, "full")
  imagen.alt = carta.name
  imagen.loading = "eager"

  obtenerElemento("detail-name").textContent = carta.name
  obtenerElemento("detail-subname").textContent = [carta.race, carta.type]
    .filter(Boolean)
    .join(" / ")
  obtenerElemento("detail-description").textContent =
    carta.desc || "Esta carta no tiene una descripción disponible."

  const precio = obtenerPrecioMaximo(carta)
  const bloquePrecio = obtenerElemento("detail-price")
  const etiquetaPrecio = document.createElement("small")
  etiquetaPrecio.textContent = "PRECIO"
  bloquePrecio.replaceChildren(
    etiquetaPrecio,
    document.createTextNode(
      precio > 0 ? formatoPrecio.format(precio) : "Sin precio disponible"
    )
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
