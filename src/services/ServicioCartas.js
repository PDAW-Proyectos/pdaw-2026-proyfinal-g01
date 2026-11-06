import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { DatabaseError, NotFoundError } from "../utils/errors.js"
import { filtrarCartas } from "../utils/filtroCartas.js"
import { descargarCartas } from "./ServicioApiYgo.js"
import { stat } from "node:fs/promises"

const UNA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000
const MAX_REINTENTOS = 3

export class ServicioCartas {
  #repositorioCartas

  constructor(repositorioCartas) {
    // Validaciones
    if (!(repositorioCartas instanceof RepositorioCartas)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioCartas")
    }

    this.#repositorioCartas = repositorioCartas
  }

  /** Descarga las cartas de la API externa y actualiza el repositorio local,
   * reintentando una cantidad fija de veces si ocurre un fallo.
   */
  async #descargarDesdeApi() {
    let intentos = 1
    while (intentos <= MAX_REINTENTOS) {
      try {
        const datosCartas = await descargarCartas()
        await this.#repositorioCartas.guardar(datosCartas)
        return
      } catch (error) {
        if (intentos === MAX_REINTENTOS) {
          throw new DatabaseError(`No se pudo actualizar la base de cartas tras ${MAX_REINTENTOS} intentos: ${error.message}`)
        }
        intentos++
      }
    }
  }

  /** Se ejecuta al iniciar el servidor: descarga si no existe o si paso 1 semana, y programa la actualizacion */
  async cargarCartas() {
    // Se inicia en caso de que la base de datos tenga dias de creada pero no llegue a una semana
    let tiempoTranscurrido = 0

    if (this.#repositorioCartas.cantidadTotal() === 0) {
      await this.#descargarDesdeApi()
    } else {
      try {
        const info = await stat(this.#repositorioCartas.ruta)
        tiempoTranscurrido = Date.now() - info.mtimeMs
      } catch (error) {
        throw new DatabaseError(`No se pudo conseguir las stats de la base de cartas: ${error.message}`)
      }

      if (tiempoTranscurrido >= UNA_SEMANA_MS) {
        await this.#descargarDesdeApi()
        tiempoTranscurrido = 0
      }
    }

    // .unref() evita que el timer bloquee el cierre de Jest o Node
    if (tiempoTranscurrido > 0) {
      setTimeout(() => { this.cargarCartas() }, (UNA_SEMANA_MS - tiempoTranscurrido)).unref()
    } else {
      setInterval(() => { this.#descargarDesdeApi() }, UNA_SEMANA_MS).unref()
    }
  }

  /** Lista todas las cartas o las filtra segun los atributos proporcionados.
   * @param {Object} [filtros={}]
   * @returns {Array<import("../models/carta/Carta.js").Carta>}
   * @throws {NotFoundError} Si no se encuentran cartas que coincidan con la busqueda.
   */
  listarCartas(filtros = {}) {
    const arrayCartas = Array.from(this.#repositorioCartas.cartas.values())
    const resultados = filtrarCartas(arrayCartas, filtros)

    if (resultados.length === 0) {
      throw new NotFoundError("No se encontraron cartas que coincidan con los criterios de busqueda.")
    }

    return resultados
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
