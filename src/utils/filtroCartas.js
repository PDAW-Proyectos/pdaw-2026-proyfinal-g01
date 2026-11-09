function normalizarTexto(valor) {
  return String(valor).trim().toLowerCase()
}

function filtroTextoParcial(propiedad) {
  return function (valor) {
    const buscado = normalizarTexto(valor)
    return (carta) => carta[propiedad]?.toLowerCase().includes(buscado) ?? false
  }
}

function filtroExacto(propiedad) {
  return function (valor) {
    return (carta) => carta[propiedad] === valor
  }
}

function filtroNumerico(propiedad) {
  return function (valor) {
    const buscado = Number(valor)
    return (carta) => carta[propiedad] === buscado
  }
}

const CREADORES_FILTRO = {
  // Atributos de Carta
  name: filtroTextoParcial("name"),
  frameType: filtroExacto("frameType"),
  race: filtroExacto("race"),

  // Atributos de CartaMonstruo
  atk: filtroNumerico("atk"),
  def: filtroNumerico("def"),
  level: filtroNumerico("level"),
  attribute: filtroExacto("attribute"),

  // Atributos de CartaPendulo
  scale: filtroNumerico("scale"),

  // Atributos de CartaLink
  linkval: filtroNumerico("linkval")
}

// Se uso ia para mejorar la forma en la que se aplicaban los filtros para intentar tener eficiencia
// por el numero de cartas.
/** Prepara los predicados de los filtros activos una sola vez y filtra la lista de cartas.
 * @param {Array<import("../models/carta/Carta.js").Carta>} cartas
 * @param {Object} [filtros={}]
 * @returns {Array<import("../models/carta/Carta.js").Carta>}
 */
export function filtrarCartas(cartas, filtros = {}) {
  const predicados = []

  // Creacion de array de funciones que filtran los valores
  for (const [campo, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === "") continue

    const crearPredicado = CREADORES_FILTRO[campo]
    if (crearPredicado) {
      predicados.push(crearPredicado(valor))
    }
  }

  if (predicados.length === 0) {
    return cartas
  }

  // Uso del array para recorrer todo el mismo cada vez que se tiene una carta
  return cartas.filter((carta) => predicados.every((cumple) => cumple(carta)))
}
