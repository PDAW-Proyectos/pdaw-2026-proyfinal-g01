import { RepositorioMazos } from "../repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"

import { NotFoundError, ValidationError, AuthorizationError } from "../utils/errors.js"

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
  #verificarDueñoYObtenerMazo(idMazo, username) {
    const mazo = this.#repositorioMazos.buscar(Number(idMazo))
    
    if (!mazo) {
      throw new NotFoundError(`El Mazo asociado al id "${idMazo}" no se encontro.`)
    }

    if (mazo.username !== username.trim()) {
      throw new AuthorizationError("No tienes permisos para modificar este mazo.")
    }
    
    return mazo
  }

  /**
   * Lista los mazos de un usuario si se pasa el username, si no, lista todos (si es admin por ej).
   */
  listarMazos(username) {
    if (!username) {
      return Array.from(this.#repositorioMazos.mazos.values())
    }

    const idsMazos = this.#repositorioMazos.buscarPorUsername(username)
    return idsMazos.map((id) => this.obtenerMazo(id))
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
      username: mazo.username,
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
      const primerPrecio = carta?.card_prices?.[0]
      const precioEbay = Number(primerPrecio?.ebay_price ?? 0)
      const precioAmazon = Number(primerPrecio?.amazon_price ?? 0)
      total += Math.max(precioEbay, precioAmazon)
    })
    return Number(total.toFixed(2))
  }

  async crearMazo(data) {
    return await this.#repositorioMazos.agregar({
      username: data.username,
      nombre: data.nombre,
      mainDeck: data.mainDeck,
      extraDeck: data.extraDeck
    })
  }


  async actualizarMazo(idMazo, data, username) {
     this.#verificarDueñoYObtenerMazo(idMazo, username) 
     return await this.#repositorioMazos.actualizar({
       ...data,
       id: Number(idMazo),
       username: username // se asegura de no perder o cambiar el dueño
     })
  }

  async eliminarMazo(idMazo, username) {
    this.#verificarDueñoYObtenerMazo(idMazo, username)
    await this.#repositorioMazos.eliminar(Number(idMazo))
    return true
  }

  async agregarCarta(idMazo, idCarta, username) {
    const mazo = this.#verificarDueñoYObtenerMazo(idMazo, username)

    const carta = this.#repositorioCartas.buscar(Number(idCarta))
    if (!carta) {
      throw new NotFoundError(`La carta asociada al id "${idCarta}" no existe.`)
    }

    const banInfo = carta.banlist_info?.ban_tcg ?? "none"
    const destino = TIPOS_EXTRA_DECK.includes(carta.frameType) ? "extra" : "main"

    mazo.agregarCarta(carta.id, banInfo, destino)
    return await this.#repositorioMazos.actualizar(mazo.toJSON())
  }

  async eliminarCarta(idMazo, idCarta, username) {
    const mazo = this.#verificarDueñoYObtenerMazo(idMazo, username)

    const eliminada = mazo.eliminarCarta(Number(idCarta))
    if (!eliminada) {
      throw new NotFoundError(`La carta asociada al id "${idCarta}" no se encontro en el mazo.`)
    }

    return await this.#repositorioMazos.actualizar(mazo.toJSON())
  }
}
