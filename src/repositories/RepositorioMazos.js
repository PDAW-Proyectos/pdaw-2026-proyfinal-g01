import { readFile, writeFile } from "node:fs/promises"
import { NotFoundError } from "../errors.js"
import { Mazo } from "../models/Mazo.js"

/** Clase que almacena los mazos ordenandolos por username, sirve para cargar los
 * mazos desde la base de data y guardarlos en la misma. */
export class RepositorioMazos {
  /** @type {} */
  #ruta
  /** @type {Map <id, Mazo>} */
  #mazos
  /** @type {Number} */
  #proximoId = 1

  /** Requiere una ruta a la base de data y crea el map de mazos vacio.
   * @param {string} ruta
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#mazos = new Map()
  }

  // Getters
  /** Mapa de mazos con claves de id para rapido acceso */
  get mazos() {
    const copia = new Map()
    for (const [id, mazo] of this.#mazos) {
      copia.set(id, Mazo.fromJSON(mazo))
    }
    return copia
  }

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
    const mazo = this.#mazos.get(id)
    return mazo ? Mazo.fromJSON(mazo) : null
  }

  /** Guarda todos los Mazos a la base de datos, ordenados por username y como objeto JSON */
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
      Object.entries(data).map(([id, dataMazo]) => {
        if (dataMazo.id >= this.#proximoId) {
          this.#proximoId = dataMazo.id + 1
        }

        this.#mazos.set(dataMazo.id, Mazo.fromJSON(dataMazo))
      })
    } catch (error) {
      if (error.code === "ENOENT") {
        this.#mazos = new Map()
        this.#proximoId = 1
        await this.guardar()
      } else {
        throw error
      }
    }
  }

  /** Crea y agrega un mazo con los datos dados y guarda los mazos en la base de datos
   * @param {Object} data
   */
  async agregar(data) {
    const id = this.#proximoId++
    const mazo = Mazo.fromJSON({ ...data, id: id })
    this.#mazos.set(id, mazo)

    await this.guardar()
    return mazo
  }

  /** Toma los datos dados y los combina con los del Mazo asociado al id dado, crea
   * un Mazo y lo actualiza en el repositorio, despues guarda los mazos.
   * @param {Object} data
   * @returns {Mazo}
   * @throws NotFoundError si no encuentra el Mazo.
   */
  async actualizar(data) {
    const anterior = this.buscar(data.id)
    if (!anterior) { throw new NotFoundError("Mazo", data.id) }

    const actualizada = Mazo.fromJSON({ ...anterior.toJSON(), ...data })

    this.#mazos.set(data.id, actualizada)
    await this.guardar();
    return actualizada;
  }

  /** Elimina el mazo asignado a los datos dados, si existe el mazo asociado al id,
   *  y guarda los mazos en la base de datos.
   * @param {Object} data
   * @throws NotFoundError si no encuentra el Mazo.
   */
  async eliminar(id) {
    const elimino = this.#mazos.delete(id)
    if (!elimino) { throw new NotFoundError("Mazo", id) }

    await this.guardar()
    return elimino
  }
}
