import { NotFoundError } from "./errors.js"

/** Pagina un arreglo de elementos y construye los metadatos de paginacion.
 * @template T
 * @param {Array<T>} datos
 * @param {number} porPagina
 * @param {number|string} [pagina=1]
 * @returns {{ datos: Array<T>, paginacion: Object }}
 * @throws {NotFoundError} Si la pagina solicitada supera el total de paginas.
 */
export function paginar(datos, porPagina, pagina = 1) {
  const paginaActual = Number(pagina)
  const total = datos.length
  const totalPaginas = Math.ceil(total / porPagina)

  if (paginaActual > totalPaginas) {
    throw new NotFoundError(`La pagina ${paginaActual} no existe. Total de paginas: ${totalPaginas}.`)
  }

  const inicio = (paginaActual - 1) * porPagina

  return {
    datos: datos.slice(inicio, inicio + porPagina),
    paginacion: {
      paginaActual,
      totalPaginas,
      totalEntradas: total,
      tieneAnterior: paginaActual > 1,
      tieneSiguiente: paginaActual < totalPaginas
    }
  }
}
