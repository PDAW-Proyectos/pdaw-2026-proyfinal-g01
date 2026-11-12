import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { NotFoundError } from "../utils/errors.js"
import { filtrarCartas } from "../utils/filtroCartas.js"
import { descargarCartas } from "./ServicioApiYgo.js"

const CARTAS_POR_PAGINA = 20
const CANTIDAD_POPULARES = 10

export class ServicioCartas {
  #repositorioCartas
  #arrayCartas = []
  #arrayCartasPopulares = []

  constructor(repositorioCartas) {
    // Validaciones
    if (!(repositorioCartas instanceof RepositorioCartas)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioCartas")
    }

    this.#repositorioCartas = repositorioCartas
  }

  /** Ruta del archivo de persistencia del repositorio de cartas.
   * @returns {string}
   */
  get ruta() {
    return this.#repositorioCartas.ruta
  }

  /** Indica si el repositorio de cartas se encuentra vacio.
   * @returns {boolean}
   */
  estaVacio() {
    return this.#repositorioCartas.cantidadTotal() === 0
  }

  /** Sincroniza los arreglos en memoria (#arrayCartas y #arrayCartasPopulares) con el repositorio. */
  actualizarCache() {
    this.#arrayCartas = Array.from(this.#repositorioCartas.cartas.values())
    this.#arrayCartasPopulares = [...this.#arrayCartas]
      .sort((a, b) => (b.misc_info[0]?.viewsweek ?? 0) - (a.misc_info[0]?.viewsweek ?? 0))
      .slice(0, CANTIDAD_POPULARES)
  }

  /** Descarga las cartas de la API externa y actualiza el repositorio local. */
  async descargar() {
    const datosCartas = await descargarCartas()
    await this.#repositorioCartas.guardar(datosCartas)
  }

  /** Devuelve el top 10 de cartas mas populares de la semana segun viewsweek.
   * @returns {Array<import("../models/carta/Carta.js").Carta>}
   * @throws {NotFoundError} Si no hay cartas cargadas en el repositorio.
   */
  listarCartasPopulares() {
    if (this.#arrayCartasPopulares.length === 0) {
      throw new NotFoundError("No hay cartas cargadas para calcular las populares.")
    }

    return [...this.#arrayCartasPopulares]
  }

  /** Lista todas las cartas o las filtra segun los atributos proporcionados, paginando los resultados.
   * @param {Object} [filtros={}]
   * @returns {{ datos: Array<import("../models/carta/Carta.js").Carta>, paginacion: Object }}
   * @throws {NotFoundError} Si no se encuentran cartas que coincidan con la busqueda o si la pagina no existe.
   */
  listarCartas(filtros = {}) {
    const resultados = filtrarCartas(this.#arrayCartas, filtros)

    if (resultados.length === 0) {
      throw new NotFoundError("No se encontraron cartas que coincidan con los criterios de busqueda.")
    }

    const paginaActual = Number(filtros.page) || 1
    const totalCartas = resultados.length
    const totalPaginas = Math.ceil(totalCartas / CARTAS_POR_PAGINA)

    if (paginaActual > totalPaginas) {
      throw new NotFoundError(`La pagina ${paginaActual} no existe. Total de paginas: ${totalPaginas}.`)
    }

    const inicio = (paginaActual - 1) * CARTAS_POR_PAGINA
    const datos = resultados.slice(inicio, inicio + CARTAS_POR_PAGINA)

    return {
      datos,
      paginacion: {
        paginaActual,
        totalPaginas,
        totalCartas,
        tieneAnterior: paginaActual > 1,
        tieneSiguiente: paginaActual < totalPaginas
      }
    }
  }

  /** Obtiene una carta especifica a partir de su ID.
   * @param {Number} idCarta
   * @returns {import("../models/carta/Carta.js").Carta}
   * @throws {NotFoundError} Si la carta no existe en el repositorio.
   */
  obtenerCarta(idCarta) {
    const carta = this.#repositorioCartas.buscar(Number(idCarta))
    if (!carta) {
      throw new NotFoundError(`La carta asociada al id "${idCarta}" no existe.`)
    }

    return carta
  }
}
