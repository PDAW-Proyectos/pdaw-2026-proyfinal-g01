import { obtenerUrlImagen } from "./renderizadorCartas.js"

const CARTAS_POR_PAGINA = {
  main: 16,
  extra: 8
}
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

function crearTarjeta(carta) {
  const tarjeta = document.createElement("article")
  tarjeta.className = "card-item"

  const imagen = document.createElement("img")
  imagen.src = obtenerUrlImagen(carta, "small")
  imagen.alt = carta.name
  imagen.loading = "lazy"

  const informacion = document.createElement("div")
  informacion.className = "card-item-info"

  const nombre = document.createElement("h3")
  nombre.className = "card-item-name"
  nombre.textContent = carta.name

  const tipo = document.createElement("p")
  tipo.className = "card-item-type"
  tipo.textContent = [carta.race, carta.type].filter(Boolean).join(" / ")

  informacion.append(nombre, tipo)
  tarjeta.append(imagen, informacion)
  return tarjeta
}

function renderizarCartas(contenedor, cartas, pagina, limite) {
  const inicio = (pagina - 1) * limite
  const cartasPagina = cartas.slice(inicio, inicio + limite)
  const fragmento = document.createDocumentFragment()

  if (cartas.length === 0) {
    const vacio = document.createElement("p")
    vacio.className = "deck-empty"
    vacio.textContent = "Este mazo todavía no tiene cartas en esta sección."
    fragmento.append(vacio)
  } else {
    cartasPagina.forEach((carta) => fragmento.append(crearTarjeta(carta)))
  }

  contenedor.replaceChildren(fragmento)
}

function renderizarPaginacion(contenedor, cartas, pagina, nombre, limite, onPageChange) {
  contenedor.replaceChildren()
  contenedor.hidden = cartas.length <= limite
  if (contenedor.hidden) return

  const totalPaginas = Math.ceil(cartas.length / limite)
  const anterior = document.createElement("button")
  anterior.type = "button"
  anterior.className = "btn btn-main btn-main-outline"
  anterior.textContent = "Anterior"
  anterior.disabled = pagina <= 1
  anterior.addEventListener("click", () => onPageChange(nombre, pagina - 1))

  const estado = document.createElement("span")
  estado.className = "pagination-status"
  estado.setAttribute("aria-live", "polite")
  estado.textContent = `Página ${pagina} de ${totalPaginas}`

  const siguiente = document.createElement("button")
  siguiente.type = "button"
  siguiente.className = "btn btn-main btn-main-outline"
  siguiente.textContent = "Siguiente"
  siguiente.disabled = pagina >= totalPaginas
  siguiente.addEventListener("click", () => onPageChange(nombre, pagina + 1))

  contenedor.append(anterior, estado, siguiente)
}

function renderizarZona(mazo, nombre, pagina, onPageChange) {
  const cartas = mazo[nombre === "main" ? "mainDeck" : "extraDeck"]
  const cantidad = cartas.length
  const etiqueta = nombre === "main" ? "main" : "extra"
  const limite = CARTAS_POR_PAGINA[nombre]

  obtenerElemento(`${etiqueta}-count`).textContent = `${cantidad} cartas`
  renderizarCartas(obtenerElemento(`${etiqueta}-cards`), cartas, pagina, limite)
  renderizarPaginacion(
    obtenerElemento(`${etiqueta}-pagination`),
    cartas,
    pagina,
    nombre,
    limite,
    onPageChange
  )
}

function renderizarDatosMazo(mazo) {
  obtenerElemento("deck-name").textContent = mazo.nombre
  obtenerElemento("deck-author").textContent = `Por: ${mazo.username}`
  obtenerElemento("deck-main-count").textContent = `${mazo.mainDeck.length} cartas`
  obtenerElemento("deck-extra-count").textContent = `${mazo.extraDeck.length} cartas`
  obtenerElemento("deck-validity").textContent = mazo.valido
    ? "Válido"
    : "Incompleto (mínimo 40 cartas en Main Deck)"

  const precio = Number(mazo.precioTotal)
  obtenerElemento("deck-price").textContent =
    Number.isFinite(precio) && precio >= 0
      ? formatoPrecio.format(precio)
      : "No disponible"
}

/**
 * Dibuja la información del mazo y las páginas actuales de Main y Extra Deck.
 * @param {Object} mazo
 * @param {{main: number, extra: number}} paginas
 * @param {(zona: "main"|"extra", pagina: number) => void} onPageChange
 */
export function renderizarDetalleMazo(mazo, paginas, onPageChange) {
  renderizarDatosMazo(mazo)
  renderizarZona(mazo, "main", paginas.main, onPageChange)
  renderizarZona(mazo, "extra", paginas.extra, onPageChange)
  obtenerElemento("deck-content").hidden = false
  obtenerElemento("deck-status").hidden = true
  obtenerElemento("deck-page").setAttribute("aria-busy", "false")
  document.title = `${mazo.nombre} · YuGiKi`
}

/** Presenta un error de carga sin sustituirlo por datos simulados. */
export function renderizarErrorDetalleMazo(mensaje) {
  obtenerElemento("deck-content").hidden = true
  const estado = obtenerElemento("deck-status")
  estado.textContent = mensaje
  estado.classList.add("deck-load-error")
  estado.hidden = false
  obtenerElemento("deck-page").setAttribute("aria-busy", "false")
}
