import { obtenerPrecioMaximo, obtenerUrlImagen } from "../components/renderizadorCartas.js"

const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD"
})

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

function crearCarta(carta, plantilla) {
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

export function renderizarCartas(cartas, grid, plantilla) {
  const fragmento = document.createDocumentFragment()

  for (const carta of cartas) {
    fragmento.append(crearCarta(carta, plantilla))
  }

  grid.replaceChildren(fragmento)
}