import { RepositorioMazos } from "../repositories/RepositorioMazos"

const TIPOS_EXTRA_DECK = ["fusion", "synchro", "xyz", "link", "xyz_pendulum"]

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
      throw new TypeError("Se requiere una instancia de RepositorioCartas")
    }

    this.#repositorioMazos = repositorioMazos
    this.#repositorioCartas = repositorioCartas
  }

  // Methods
  async agregarCarta(idMazo, idCarta) {
    const mazo = this.obtenerMazo(idMazo)

    // Todavia no tengo la clase RepositorioCartas para saber bien como implementarlo
    const carta = this.#repositorioCartas.buscar(Number(idCarta))
    if (!carta) {
      throw new NotFoundError(`La carta con id "${idCarta}" no existe.`)
    }

    const banInfo = carta.banlist_info.ban_tcg ?? "none"
    const destino = TIPOS_EXTRA_DECK.includes(carta.frameType) ? "extra" : "main"

    mazo.agregarCarta(carta.id, banInfo, destino)
    return await this.#repositorioMazos.actualizar(mazo.toJSON())
  }
}
