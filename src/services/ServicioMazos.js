import { RepositorioMazos, MAX_MAZOS } from "../repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { NotFoundError, AuthorizationError } from "../utils/errors.js"

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

    if (mazo.username !== username) {
      throw new AuthorizationError("No tienes permisos para modificar este mazo.")
    }

    return mazo
  }

  /** Lista los mazos de un usuario si se pasa el username; si no, lista todos los mazos paginados.
   * @param {string} [username]
   * @param {number|string} [page=1]
   * @returns {{ datos: Array<Object>, paginacion: Object }}
   * @throws {NotFoundError} Si no hay mazos o si la pagina solicitada no existe.
   */
<<<<<<< HEAD
  listarMazos(username, page = 1) {
    let idsMazos

    if (username) {
      idsMazos = this.#repositorioMazos.buscarPorUsername(username)
      if (!idsMazos) {
        throw new NotFoundError("El Usuario no tiene ningun mazo creado.")
      }
    } else {
      idsMazos = Array.from(this.#repositorioMazos.mazos.keys())
      if (idsMazos.length === 0) {
        throw new NotFoundError("No hay mazos creados.")
      }
=======
  listarMazos(username) {
    if (!username) {
      return Array.from(this.#repositorioMazos.mazos.keys()).map((id) => this.obtenerMazo(id))
>>>>>>> 6a9a64d489d1901973338b4dd02f2a831264397e
    }

    const paginaActual = Number(page) || 1
    const totalMazos = idsMazos.length
    const totalPaginas = Math.ceil(totalMazos / MAX_MAZOS)

    if (paginaActual > totalPaginas) {
      throw new NotFoundError(`La pagina ${paginaActual} no existe. Total de paginas: ${totalPaginas}.`)
    }

    const inicio = (paginaActual - 1) * MAX_MAZOS
    const datos = idsMazos.slice(inicio, inicio + MAX_MAZOS).map((id) => this.obtenerMazo(id))

    return {
      datos,
      paginacion: {
        paginaActual,
        totalPaginas,
        totalMazos,
        tieneAnterior: paginaActual > 1,
        tieneSiguiente: paginaActual < totalPaginas
      }
    }
  }

  obtenerMazo(idMazo) {
    const mazo = this.#repositorioMazos.buscar(Number(idMazo))
    if (!mazo) {
      throw new NotFoundError(`El Mazo asociado al id "${idMazo}" no se encontro.`)
    }

    const cartasMainDeck = mazo.mainDeck.map(id => this.#repositorioCartas.buscar(id))
    const cartasExtraDeck = mazo.extraDeck.map(id => this.#repositorioCartas.buscar(id))

    let precioTotal = 0;
    [...cartasMainDeck, ...cartasExtraDeck].forEach(carta => {
      const primerPrecio = carta?.card_prices?.[0]
      const precioEbay = Number(primerPrecio?.ebay_price ?? 0)
      const precioAmazon = Number(primerPrecio?.amazon_price ?? 0)
      precioTotal += Math.max(precioEbay, precioAmazon)
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
