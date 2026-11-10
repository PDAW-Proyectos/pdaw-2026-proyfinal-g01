import { readFile, writeFile } from "node:fs/promises"
import { NotFoundError, ValidationError } from "../utils/errors.js"
import { Mazo } from "../models/Mazo.js"

export const MAX_MAZOS = 10

/** Clase que almacena los mazos ordenandolos por username, sirve para cargar los
 * mazos desde la base de data y guardarlos en la misma. */
export class RepositorioMazos {
  /** @type {string} */
  #ruta
  /** @type {Map <number, Mazo>} */
  #mazos
  /** @type {Map <string, Array<number>>} */
  #mazosPorUsername
  /** @type {Number} */
  #proximoId = 1

  /** Requiere una ruta a la base de data y crea el map de mazos vacio.
   * @param {string} ruta
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#mazos = new Map()
    this.#mazosPorUsername = new Map()
  }

  // Getters
  get ruta() { return this.#ruta }

  /** Mapa de mazos con claves de id para rapido acceso
   * @returns {Map <Number, Mazo>}
   */
  get mazos() { return this.#mazos }

  // Methods
  /** Calcula el total de mazos en el repositorio
   * @returns {Number}
   */
  cantidadTotal() {
    return this.#mazos.size
  }

  /** Busca un mazo especifico asignado al id dado, retorna null si no encuentra nada.
   * @param {Number} id
   * @returns {Mazo | null}
   */
  buscar(id) {
    return this.#mazos.get(id) ?? null
  }

  /** Busca los ids de los mazos pertenecientes a un usuario.
   * @param {string} username
   * @returns {Array<number>}
   */
  buscarPorUsername(username) {
    if (typeof username !== "string") {
      return null
    }

    return this.#mazosPorUsername.get(username) ?? null
  }

  /** Guarda todos los Mazos a la base de datos, como objeto JSON */
  async guardar() {
    await writeFile(
      this.#ruta,
      JSON.stringify(Object.fromEntries(this.#mazos)),
      "utf8"
    )
  }

  /** Carga los datos desde la base de datos iniciando el repositorio con objetos de clase Mazo */
  async cargar() {
    try {
      const contenido = await readFile(this.#ruta, "utf8")
      const data = JSON.parse(contenido)

      //this.#mazos.clear()
      //this.#mazosPorUsername.clear()
      //this.#proximoId = 1

      for (const dataMazo of Object.values(data)) {
        const mazo = Mazo.fromJSON(dataMazo)
        const idsMazos = this.#mazosPorUsername.get(mazo.username) ?? []
        if (idsMazos.length >= MAX_MAZOS) {
          throw new ValidationError(`El usuario no puede tener mas de ${MAX_MAZOS} mazos.`)
        }

        if (mazo.id >= this.#proximoId) {
          this.#proximoId = mazo.id + 1
        }

        this.#mazos.set(mazo.id, mazo)
        idsMazos.push(mazo.id)
        this.#mazosPorUsername.set(mazo.username, idsMazos)
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        this.#mazos = new Map()
        this.#mazosPorUsername = new Map()
        this.#proximoId = 1
        await this.guardar()
      } else {
        throw error
      }
    }
  }

  async eliminarPorUsername(username) {
    const mazoIds = this.#mazosPorUsername.get(username)
    if (!mazoIds || mazoIds.length === 0) {
      return false
    }
    for (const id of mazoIds) {
      this.#mazos.delete(id)
    }
    this.#mazosPorUsername.delete(username)
    await this.guardar()
    return true
  }

  /** Crea y agrega un mazo con los datos dados y guarda los mazos en la base de datos
   * @param {Object} data
   * @returns {Promise <Mazo>} El Mazo si fue creado correctamente
   */
  async agregar(data) {
    const id = this.#proximoId
    const mazo = Mazo.fromJSON({ ...data, id: id })
    const idsMazos = this.#mazosPorUsername.get(mazo.username) ?? []

    if (idsMazos.length >= MAX_MAZOS) {
      throw new ValidationError(`El usuario ya alcanzo el limite de ${MAX_MAZOS} mazos.`)
    }

    this.#proximoId++
    this.#mazos.set(id, mazo)
    idsMazos.push(id)
    this.#mazosPorUsername.set(mazo.username, idsMazos)

    await this.guardar()
    return mazo
  }

  /** Toma los datos dados y los combina con los del Mazo asociado al id dado, crea
   * un Mazo y lo actualiza en el repositorio, despues guarda los mazos.
   * @param {Object} data
   * @returns {Promise <Mazo>}
   * @throws NotFoundError si no encuentra el Mazo.
   */
  async actualizar(data) {
    const anterior = this.buscar(data.id)
    if (!anterior) { throw new NotFoundError(`El Mazo asociado a la llave "${data.id}" no se encontro.`) }

    const actualizada = Mazo.fromJSON({ ...anterior.toJSON(), ...data })

    this.#mazos.set(data.id, actualizada)
    await this.guardar();
    return actualizada;
  }

  /** Elimina el mazo asignado a los datos dados, si existe el mazo asociado al id,
   *  y guarda los mazos en la base de datos.
   * @param {Number} id
   * @returns {Promise <true>} Si el mazo fue eliminado
   * @throws NotFoundError si no encuentra el Mazo.
   */
  async eliminar(id) {
    const mazo = this.#mazos.get(id)
    if (!mazo) { throw new NotFoundError(`El Mazo asociado a la llave "${id}" no se encontro.`) }

    const elimino = this.#mazos.delete(id)
    const idsMazos = this.#mazosPorUsername.get(mazo.username)
    if (idsMazos) {
      const filtrados = idsMazos.filter(mazoId => mazoId !== id)
      if (filtrados.length > 0) {
        this.#mazosPorUsername.set(mazo.username, filtrados)
      } else {
        this.#mazosPorUsername.delete(mazo.username)
      }
    }

    await this.guardar()
    return elimino
  }
}
