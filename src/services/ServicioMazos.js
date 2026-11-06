import { RepositorioMazos } from "../repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js"
import { NotFoundError, ValidationError, AuthorizationError } from "../utils/errors.js"

const TIPOS_EXTRA_DECK = ["fusion", "synchro", "xyz", "link", "fusion_pendulum", "synchro_pendulum", "xyz_pendulum"]

export class ServicioMazos {
  #repositorioMazos
  #repositorioCartas
  #repositorioUsuarios

  /** Inicia el servicio con el repositorio dado, maneja el RepositorioMazos y ademas lee del
   * RepositorioCartas para conseguir el resto de la informacion.
   * @param {RepositorioMazos} repositorioMazos
   * @param {RepositorioCartas} repositorioCartas
   * @throws TypeError si el parametro no de la clase usada por el servicio.
   */
  constructor(repositorioMazos, repositorioCartas, repositorioUsuarios) {
    // Validaciones
    if (!(repositorioMazos instanceof RepositorioMazos)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioMazos")
    }
    if (!(repositorioCartas instanceof RepositorioCartas)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioCartas")
    }
    if (!(repositorioUsuarios instanceof RepositorioUsuarios)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioUsuarios")
    }

    this.#repositorioMazos = repositorioMazos
    this.#repositorioCartas = repositorioCartas
    this.#repositorioUsuarios = repositorioUsuarios
  }

  // Methods
  #verificarDueño(idMazo, username) {
    const usuario = this.#repositorioUsuarios.buscar(username)
    if (!usuario) {
      throw new NotFoundError(`El usuario "${username}" no existe.`)
    }
    
    // Verifica si el id está en el arreglo de mazos del usuario
    if (!usuario.mazos.includes(Number(idMazo))) {
      throw new AuthorizationError("No tienes permisos para modificar este mazo.")
    }
    return usuario
  }

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
      const primerPrecio = carta?.card_prices?.[0]
      const precioEbay = Number(primerPrecio?.ebay_price ?? 0)
      const precioAmazon = Number(primerPrecio?.amazon_price ?? 0)
      total += Math.max(precioEbay, precioAmazon)
    })
    return Number(total.toFixed(2))
  }

  async crearMazo(data, username) {
    const usuario = this.#repositorioUsuarios.buscar(username)
    if (!usuario) {
      throw new NotFoundError(`El usuario "${username}" no existe.`)
    }
    const nuevoMazo = await this.#repositorioMazos.agregar({
      nombre: data.nombre,
      mainDeck: data.mainDeck,
      extraDeck: data.extraDeck
    })
    //agrego el id del mazo al usuario
    usuario.agregarMazo(nuevoMazo.id)
    await this.#repositorioUsuarios.actualizar(usuario.toJSON())

    return nuevoMazo
  }


  async actualizarMazo(idMazo, data, username) {
    //solo quiero la verificacion de usuario
    this.#verificarDueño(idMazo, username) //al hacer esa asignacion asi ejecuta el metodo, pero no me importa lo que retorne, solo los erroes

     return await this.#repositorioMazos.actualizar({
       ...data,
       id: Number(idMazo),
     })
  }

  async eliminarMazo(idMazo, username) {
    const usuario = this.#verificarDueño(idMazo, username)
    
    await this.#repositorioMazos.eliminar(Number(idMazo))
    
    usuario.eliminarMazo(Number(idMazo))
    await this.#repositorioUsuarios.actualizar(usuario.toJSON())
    //retorna siempre true, porque si llego a este punto la eliminacion fue existosa
    return true
  }

  async agregarCarta(idMazo, idCarta, username) {
    this.#verificarDueño(idMazo, username)

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

  async eliminarCarta(idMazo, idCarta, username) {
    this.#verificarDueño(idMazo, username)
    
    const mazo = this.obtenerMazo(idMazo)

    const eliminada = mazo.eliminarCarta(Number(idCarta))
    if (!eliminada) {
      throw new NotFoundError(`La carta asociada al id "${idCarta}" no se encontro en el mazo.`)
    }

    return await this.#repositorioMazos.actualizar(mazo.toJSON())
  }
}
