import { RepositorioMazos, MAX_MAZOS } from "../repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { NotFoundError, AuthorizationError } from "../utils/errors.js"
import { paginar } from "../utils/paginacion.js"

/** La clase ServicioMazos maneja el RepositorioMazos y ademas lee del
 * RepositorioCartas para conseguir el resto de la informacion. */
export class ServicioMazos {
  #repositorioMazos
  #repositorioCartas

  /** Inicia el servicio con los repositorios dados.
   * @param {RepositorioMazos} repositorioMazos
   * @param {RepositorioCartas} repositorioCartas
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

  #hidratarListaCartas(lista) {
    return lista.map(({ id, cantidad }) => ({
      carta: this.#repositorioCartas.buscar(id)?.toDTO() ?? null,
      cantidad
    }))
  }

  /** Lista los mazos de un usuario si se pasa el username, si no, lista todos los mazos paginados.
   * @param {string} [username]
   * @param {number|string} [page=1]
   * @returns {{ datos: Array <Object>, paginacion: Object }}
   */
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
    }

    const { datos: idsPagina, paginacion } = paginar(idsMazos, MAX_MAZOS, page)

    return {
      datos: idsPagina.map((id) => this.obtenerMazo(id)),
      paginacion
    }
  }

  /** Busca y obtiene el mazo devolviendo con las cartas cargadas, si el mismo existe.
   * @param {string} idMazo
   * @returns {Object}
   */
  obtenerMazo(idMazo) {
    const mazo = this.#repositorioMazos.buscar(Number(idMazo))
    if (!mazo) {
      throw new NotFoundError(`El Mazo asociado al id "${idMazo}" no se encontro.`)
    }

    const cartasMainDeck = this.#hidratarListaCartas(mazo.mainDeck)
    const cartasExtraDeck = this.#hidratarListaCartas(mazo.extraDeck)

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

    mazo.agregarCarta(carta)
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
