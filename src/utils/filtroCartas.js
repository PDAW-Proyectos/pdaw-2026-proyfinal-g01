import { ValidationError } from "./errors.js"

function normalizarTexto(valor) {
  return String(valor).trim().toLowerCase()
}

function normalizarNumero(valor, campo) {
  const numero = Number(valor)
  if (Number.isNaN(numero)) {
    throw new ValidationError(`El filtro "${campo}" debe ser un numero valido.`)
  }
  return numero
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
  return function (valor, campo) {
    const buscado = normalizarNumero(valor, campo)
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

/** Prepara los predicados de los filtros activos una sola vez y filtra la lista de cartas.
 * @param {Array<import("../models/carta/Carta.js").Carta>} cartas
 * @param {Object} [filtros={}]
 * @returns {Array<import("../models/carta/Carta.js").Carta>}
 * @throws {ValidationError} Si algun atributo no existe o un valor numerico es invalido.
 */
export function filtrarCartas(cartas, filtros = {}) {
  const predicados = []

  for (const [campo, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === "") continue

    const crearPredicado = CREADORES_FILTRO[campo]
    if (!crearPredicado) {
      throw new ValidationError(`El atributo de filtro "${campo}" no es valido.`)
    }

    predicados.push(crearPredicado(valor, campo))
  }

  if (predicados.length === 0) {
    return cartas
  }

  // predicados es un array de funciones por eso funciona
  return cartas.filter((carta) => predicados.every((cumple) => cumple(carta)))
}
