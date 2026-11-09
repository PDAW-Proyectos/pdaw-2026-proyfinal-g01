import { obtenerCartas } from "../services/cartaApi.js"
import { inicializarBusquedaCartas } from "../modules/busquedaCartas.js"
import {
  obtenerPrecioMaximo,
  renderizarCartaDestacada,
  renderizarCartasPopulares,
  renderizarErrorDeCartas
} from "../components/renderizadorCartas.js"

// Cartas populares que se mostrarán en la portada.
const NOMBRES_CARTAS_POPULARES = [
  "Dark Magician",
  "Exodia the Forbidden One",
  "Red-Eyes Black Dragon",
  "Cyber Dragon",
  "Stardust Dragon",
  "Trickstar Lycoris",
  "Kashtira Riseheart",
  "Branded Fusion"
]

function seleccionarCartasPopulares(cartas) {
  const cartasPorNombre = new Map(
    cartas.map((carta) => [carta.name.toLocaleLowerCase(), carta])
  )

  const populares = NOMBRES_CARTAS_POPULARES.map((nombre) =>
    cartasPorNombre.get(nombre.toLocaleLowerCase())
  ).filter(Boolean)

  if (populares.length !== NOMBRES_CARTAS_POPULARES.length) {
    throw new Error("No se encontraron las ocho cartas populares configuradas.")
  }

  return populares
}

function seleccionarCartaMasCara(cartas) {
  let cartaMasCara = null
  let precioMaximo = 0

  for (const carta of cartas) {
    const precio = obtenerPrecioMaximo(carta)
    if (precio > precioMaximo) {
      cartaMasCara = carta
      precioMaximo = precio
    }
  }

  if (!cartaMasCara) {
    throw new Error("No se encontro ninguna carta con un precio disponible.")
  }

  return { carta: cartaMasCara, precio: precioMaximo }
}

async function inicializarInicio() {
  inicializarBusquedaCartas()

  try {
    const cartas = await obtenerCartas()
    const destacada = seleccionarCartaMasCara(cartas)
    const populares = seleccionarCartasPopulares(cartas)

    renderizarCartaDestacada(destacada.carta, destacada.precio)
    renderizarCartasPopulares(populares)
  } catch (error) {
    console.error("No se pudo inicializar la portada:", error)
    renderizarErrorDeCartas()
  }
}

inicializarInicio()