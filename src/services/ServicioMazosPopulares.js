import { RepositorioMazosPopulares } from "../repositories/RepositorioMazosPopulares.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { Mazo } from "../models/Mazo.js"
import { NotFoundError } from "../utils/errors.js"
import { descargarMazosPopulares } from "./ServicioApiYgo.js"

/** La clase ServicioMazosPopulares gestiona la descarga semanal, hidratacion
 * y cache en memoria de los mazos competitivos populares. */
export class ServicioMazosPopulares {
  #repositorioMazosPopulares
  #repositorioCartas
  #arrayMazosPopulares = []

  /**
   * @param {RepositorioMazosPopulares} repositorioMazosPopulares
   * @param {RepositorioCartas} repositorioCartas
   */
  constructor(repositorioMazosPopulares, repositorioCartas) {
    if (!(repositorioMazosPopulares instanceof RepositorioMazosPopulares)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioMazosPopulares")
    }
    if (!(repositorioCartas instanceof RepositorioCartas)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioCartas")
    }

    this.#repositorioMazosPopulares = repositorioMazosPopulares
    this.#repositorioCartas = repositorioCartas
  }

  /** Ruta del archivo de persistencia de mazos populares para el programador de descargas.
   * @returns {string}
   */
  get ruta() {
    return this.#repositorioMazosPopulares.ruta
  }

  /** Indica si el repositorio de mazos populares se encuentra vacio.
   * @returns {boolean}
   */
  estaVacio() {
    return this.#repositorioMazosPopulares.cantidadTotal() === 0
  }

  /** Sincroniza el arreglo en memoria de mazos populares con el repositorio. */
  actualizarCache() {
    this.#arrayMazosPopulares = Array.from(this.#repositorioMazosPopulares.mazos.values())
      .map((mazo) => this.#formatearMazoDetalle(mazo))
  }

  #construirMazoMeta(id, mazoExterno) {
    const mazo = new Mazo({ id, username: "meta", nombre: mazoExterno.nombre })

    for (const { name, amount = 1 } of mazoExterno.cartas) {
      const carta = this.#repositorioCartas.buscarPorNombre(name)
      if (!carta) continue

      for (let copia = 0; copia < amount; copia++) {
        try {
          mazo.agregarCarta(carta)
        } catch {
          break
        }
      }
    }

    return mazo.toJSON()
  }

  #formatearMazoDetalle(mazo) {
    const hidratar = (lista) => lista.map(({ id, cantidad }) => ({
      carta: this.#repositorioCartas.buscar(id)?.toDTO() ?? null,
      cantidad
    }))

    const cartasMainDeck = hidratar(mazo.mainDeck)
    const cartasExtraDeck = hidratar(mazo.extraDeck)

    let precioTotal = 0;
    [...cartasMainDeck, ...cartasExtraDeck].forEach(({ carta, cantidad }) => {
      precioTotal += (carta?.card_price ?? 0) * cantidad
    })

    return {
      id: mazo.id,
      username: mazo.username,
      nombre: mazo.nombre,
      mainDeck: cartasMainDeck,
      extraDeck: cartasExtraDeck,
      valido: mazo.valido(),
      precioTotal: Number(precioTotal.toFixed(2))
    }
  }

  /** Descarga los mazos populares desde las APIs externas, los hidrata con las cartas locales
   * delegando la separacion entre Main Deck y Extra Deck y las restricciones TCG a la clase Mazo.
   */
  async descargar() {
    const mazosExternos = await descargarMazosPopulares()
    const mazosHidratados = mazosExternos.map((mazo, i) => this.#construirMazoMeta(i + 1, mazo))

    await this.#repositorioMazosPopulares.guardar(mazosHidratados)
  }

  /** Devuelve los mazos competitivos populares en memoria con sus cartas hidratadas.
   * @returns {Array<Object>}
   * @throws {NotFoundError} Si no hay mazos populares cargados.
   */
  listarMazosPopulares() {
    if (this.#arrayMazosPopulares.length === 0) {
      throw new NotFoundError("No hay mazos populares cargados.")
    }

    return [...this.#arrayMazosPopulares]
  }

  /** Busca un mazo popular especifico por su ID.
   * @param {number|string} idMazo
   * @returns {Object}
   * @throws {NotFoundError} Si el mazo popular no existe.
   */
  obtenerMazoPopular(idMazo) {
    const mazo = this.#repositorioMazosPopulares.buscar(Number(idMazo))
    if (!mazo) {
      throw new NotFoundError(`El Mazo popular asociado al id "${idMazo}" no se encontro.`)
    }

    return this.#formatearMazoDetalle(mazo)
  }
}
