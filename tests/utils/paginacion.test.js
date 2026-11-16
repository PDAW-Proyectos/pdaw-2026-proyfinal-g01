import { paginar } from "../../src/utils/paginacion.js"
import { NotFoundError } from "../../src/utils/errors.js"

describe("paginar", () => {
  const elementos = ["a", "b", "c", "d", "e"]

  test("devuelve la primera pagina por defecto", () => {
    const resultado = paginar(elementos, 2)

    expect(resultado).toEqual({
      datos: ["a", "b"],
      paginacion: {
        paginaActual: 1,
        totalPaginas: 3,
        totalEntradas: 5,
        tieneAnterior: false,
        tieneSiguiente: true
      }
    })
  })

  test("devuelve una pagina intermedia y la ultima pagina correctamente", () => {
    const pagina2 = paginar(elementos, 2, "2")
    expect(pagina2).toEqual({
      datos: ["c", "d"],
      paginacion: {
        paginaActual: 2,
        totalPaginas: 3,
        totalEntradas: 5,
        tieneAnterior: true,
        tieneSiguiente: true
      }
    })

    const pagina3 = paginar(elementos, 2, 3)
    expect(pagina3).toEqual({
      datos: ["e"],
      paginacion: {
        paginaActual: 3,
        totalPaginas: 3,
        totalEntradas: 5,
        tieneAnterior: true,
        tieneSiguiente: false
      }
    })
  })

  test("lanza NotFoundError si la pagina supera el total de paginas", () => {
    expect(() => paginar(elementos, 2, 4)).toThrow(NotFoundError)
    expect(() => paginar([], 2, 1)).toThrow(NotFoundError)
  })
})
