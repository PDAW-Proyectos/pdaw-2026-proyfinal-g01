import { obtenerPrecioMaximo, obtenerUrlImagen } from "../components/renderizadorCartas.js"
import { obtenerPaginaCartas } from "../services/cartaApi.js"

const grid = document.getElementById("cardsGrid")
const plantilla = document.getElementById("card-template")
const estado = document.getElementById("cards-status")
const estadoPaginacion = document.getElementById("pagination-status")
const botonAnterior = document.getElementById("previous-page")
const botonSiguiente = document.getElementById("next-page")
const selectAlfabetico = document.getElementById("selectAlfabetico")
const selectPrecio = document.getElementById("selectPrecio")
const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD"
})

let paginaActual = 1
let paginacionActual
let solicitudActual = 0
let cargando = false

function obtenerOrden() {
  return selectAlfabetico.value !== "none"
    ? selectAlfabetico.value
    : selectPrecio.value !== "none"
      ? selectPrecio.value
      : undefined
}

function actualizarControlesPaginacion() {
  botonAnterior.disabled = cargando || !paginacionActual?.tieneAnterior
  botonSiguiente.disabled = cargando || !paginacionActual?.tieneSiguiente
  estadoPaginacion.textContent = paginacionActual
    ? `Página ${paginacionActual.paginaActual} de ${paginacionActual.totalPaginas} · ${paginacionActual.totalCartas} cartas`
    : ""
}

function agregarAtributo(lista, etiqueta, valor) {
  if (valor === null || valor === undefined || valor === "") return

  const item = document.createElement("li")
  const nombre = document.createElement("span")
  const contenido = document.createElement("span")
  nombre.textContent = etiqueta
  contenido.textContent = String(valor)
  item.append(nombre, contenido)
  lista.append(item)
}

function crearCarta(carta) {
  const tarjeta = plantilla.content.cloneNode(true)
  const elemento = tarjeta.querySelector(".card-flip")
  const imagen = tarjeta.querySelector(".card-image")
  const precio = obtenerPrecioMaximo(carta)
  const atributos = tarjeta.querySelector(".back-attr-list")
  const detalles = tarjeta.querySelector(".btn-details")

  elemento.dataset.id = carta.id
  elemento.setAttribute("aria-label", `${carta.name}, mostrar detalles`)
  imagen.src = obtenerUrlImagen(carta, "small")
  imagen.alt = carta.name
  imagen.addEventListener("error", () => {
    const marcador = document.createElement("div")
    marcador.className = "img-placeholder"
    marcador.textContent = carta.name
    imagen.replaceWith(marcador)
  }, { once: true })

  tarjeta.querySelector(".card-front-name").textContent = carta.name
  tarjeta.querySelector(".card-front-type").textContent =
    [carta.race, carta.type].filter(Boolean).join(" / ")

  agregarAtributo(atributos, "Nivel", carta.level)
  agregarAtributo(atributos, "ATK", carta.atk)
  agregarAtributo(atributos, "DEF", carta.def)
  agregarAtributo(atributos, "Atributo", carta.attribute)
  agregarAtributo(atributos, "Raza", carta.race)
  agregarAtributo(atributos, "Tipo", carta.type)
  agregarAtributo(
    atributos,
    "Precio",
    precio > 0 ? formatoPrecio.format(precio) : "Sin precio disponible"
  )

  detalles.href = `carta.html?id=${encodeURIComponent(carta.id)}`
  return tarjeta
}

function renderizarCartas(cartas) {
  const fragmento = document.createDocumentFragment()
  for (const carta of cartas) {
    fragmento.append(crearCarta(carta))
  }
  grid.replaceChildren(fragmento)
}

/**
 * Carga una página del backend (20 cartas por página), ordenada globalmente por
 * el servidor. El estado de paginación devuelto por la API habilita los botones
 * anterior/siguiente y permite recorrer el catálogo completo.
 * @param {number} pagina
 */
async function cargarPagina(pagina) {
  const idSolicitud = ++solicitudActual
  cargando = true
  grid.setAttribute("aria-busy", "true")
  estado.textContent = "Cargando cartas..."
  actualizarControlesPaginacion()

  try {
    const resultado = await obtenerPaginaCartas(pagina, obtenerOrden())
    if (idSolicitud !== solicitudActual) return

    renderizarCartas(resultado.datos)
    paginaActual = resultado.paginacion.paginaActual
    paginacionActual = resultado.paginacion
    estado.textContent = ""
  } catch (error) {
    if (idSolicitud !== solicitudActual) return
    console.error("No se pudieron cargar las cartas:", error)
    estado.textContent = "No se pudieron cargar las cartas. Intentá nuevamente."
  } finally {
    if (idSolicitud === solicitudActual) {
      cargando = false
      grid.setAttribute("aria-busy", "false")
      actualizarControlesPaginacion()
    }
  }
}

grid.addEventListener("click", (evento) => {
  if (evento.target.closest(".btn-details")) return
  const tarjeta = evento.target.closest(".card-flip")
  tarjeta?.classList.toggle("flipped")
})

grid.addEventListener("keydown", (evento) => {
  if (evento.target.closest(".btn-details")) return
  if (evento.key !== "Enter" && evento.key !== " ") return
  const tarjeta = evento.target.closest(".card-flip")
  if (!tarjeta) return

  evento.preventDefault()
  tarjeta.classList.toggle("flipped")
})

selectAlfabetico.addEventListener("change", () => {
  if (selectAlfabetico.value !== "none") selectPrecio.value = "none"
  cargarPagina(1)
})

selectPrecio.addEventListener("change", () => {
  if (selectPrecio.value !== "none") selectAlfabetico.value = "none"
  cargarPagina(1)
})

botonAnterior.addEventListener("click", () => {
  if (paginacionActual?.tieneAnterior) cargarPagina(paginaActual - 1)
})

botonSiguiente.addEventListener("click", () => {
  if (paginacionActual?.tieneSiguiente) cargarPagina(paginaActual + 1)
})

cargarPagina(paginaActual)
