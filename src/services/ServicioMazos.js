import { NotFoundError, ValidationError } from "../utils/errors.js"
import { RepositorioMazos } from "../repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"

const TIPOS_EXTRA_DECK = ["fusion", "synchro", "xyz", "link", "fusion_pendulum", "synchro_pendulum", "xyz_pendulum"]

export class ServicioMazos {
  #repositorioMazos
  #repositorioCartas

  /** Inicia el servicio con el repositorio dado, maneja el RepositorioMazos y ademas lee del
   * RepositorioCartas para conseguir el resto de la informacion.
   * @param {RepositorioMazos} repositorioMazos
   * @param {RepositorioCartas} repositorioCartas
   * @throws TypeError si el parametro no de la clase usada por el servicio.
   */
  constructor(repositorioMazos, repositorioCartas) {
    // Validaciones
    if (!(repositorioMazos instanceof RepositorioMazos)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioMazos")
    }
    if (!(repositorioCartas instanceof RepositorioCartas)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioCartas")
    }

    this.#repositorioMazos = repositorioMazos
    this.#repositorioCartas = repositorioCartas
  }

  // Methods
  listarMazos(idMazos) {
    if (!idMazos) {
      return Array.from(this.#repositorioMazos.mazos.values())
    }

    if (!Array.isArray(idMazos)) {
      throw new ValidationError("Los ids tienen que ser un Array")
    }
    return idMazos.map((id) => this.obtenerMazo(id))
  }

  obtenerMazo(idMazo) {
    const mazo = this.#repositorioMazos.buscar(Number(idMazo))
    if (!mazo) {
      throw new NotFoundError(`El Mazo asociado al id "${idMazo}" no se encontro.`)
    }

    return mazo
  }

  obtenerMazoDetallado(idMazo) {
    const mazo = this.obtenerMazo(idMazo)
    return {
      id: mazo.id,
      nombre: mazo.nombre,
      mainDeck: mazo.mainDeck.map(id => this.#repositorioCartas.buscar(id)),
      extraDeck: mazo.extraDeck.map(id => this.#repositorioCartas.buscar(id)),
      valido: mazo.valido(),
      precioTotal: this.precioTotal(idMazo)
    }
  }

  precioTotal(idMazo) {
    const mazo = this.obtenerMazo(idMazo)
    let total = 0;
    [...mazo.mainDeck, ...mazo.extraDeck].forEach(id => {
      const carta = this.#repositorioCartas.buscar(id)
      const precioEbay = Number(carta.card_prices.ebay_price)
      const precioAmazon = Number(carta.card_prices.amazon_price)
      total += Math.max(precioEbay, precioAmazon)
    })
    return Number(total.toFixed(2))
  }

  async crearMazo(data) {
    return await this.#repositorioMazos.agregar({
      nombre: data.nombre,
      mainDeck: data.mainDeck,
      extraDeck: data.extraDeck
    })
  }

  async actualizarMazo(idMazo, data) {
     return await this.#repositorioMazos.actualizar({
       ...data,
       id: Number(idMazo),
     })
  }

  async eliminarMazo(idMazo) {
     return await this.#repositorioMazos.eliminar(Number(idMazo))
  }

  async agregarCarta(idMazo, idCarta) {
    const mazo = this.obtenerMazo(idMazo)

    // Todavia no tengo la clase RepositorioCartas para saber bien como implementarlo
    const carta = this.#repositorioCartas.buscar(Number(idCarta))
    if (!carta) {
      throw new NotFoundError(`La carta asociada al id "${idCarta}" no existe.`)
    }

    const banInfo = carta.banlist_info?.ban_tcg ?? "none"
    const destino = TIPOS_EXTRA_DECK.includes(carta.frameType) ? "extra" : "main"

    mazo.agregarCarta(carta.id, banInfo, destino)
    return await this.#repositorioMazos.actualizar(mazo.toJSON())
  }

  async eliminarCarta(idMazo, idCarta) {
    const mazo = this.obtenerMazo(idMazo)

    const eliminada = mazo.eliminarCarta(Number(idCarta))
    if (!eliminada) {
      throw new NotFoundError(`La carta asociada al id "${idCarta}" no se encontro en el mazo.`)
    }

    return await this.#repositorioMazos.actualizar(mazo.toJSON())
  }
}
