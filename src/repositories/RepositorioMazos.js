import { readFile, writeFile } from "node:fs/promises"
import { NotFoundError } from "../errors.js"
import { Mazo } from "../models/Mazo.js"

/** Clase que almacena los mazos ordenandolos por username, sirve para cargar los
 * mazos desde la base de data y guardarlos en la misma. */
export class RepositorioMazos {
  /** @type {} */
  #ruta
  /** @type {Map <id, Array <Mazo>>} */
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
  /** Mapa de mazos con claves de username para rapido acceso */
  get mazos() {
    return new Map(
      [...this.#mazos.entries()].map(([username, arrayMazos]) => [
        username,
        arrayMazos.map((mazo) => Mazo.fromJSON(mazo.toJSON())),
      ])
    )
  }


  // Methods
  /** Calcula el total de mazos en el repositorio
   * @returns {Number}
   */
  cantidadTotal() {
    let total = 0
    this.#mazos.forEach(array => {
      total += array.length
    })
    return total
  }

  /** Busca un mazo especifico asignado al id dado, retorna null si no encuentra nada.
   * @param {Number} id
   * @returns {Mazo | null}
   */
  buscar(id) {
    for (const arrayMazos of this.#mazos.values()) {
      const mazoEncontrado = arrayMazos.find(mazo => mazo.id === id)
      if (mazoEncontrado) {
        return Mazo.fromJSON(mazoEncontrado.toJSON())
      }
    }
    return null
  }

  /** Busca el array de mazos asignado al username dado, retorna null si no encuentra nada.
   * @param {string} username
   * @returns {Array <Mazo> | null}
   */
  buscarMazos(username) {
    const arrayMazos = this.#mazos.get(username)
    if (!arrayMazos) return null

    return arrayMazos.map(mazo => Mazo.fromJSON(mazo.toJSON()))
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
      Object.entries(data).map(([username, arrayObjects]) => {
        const arrayMazos = []
        arrayObjects.forEach(data => {
          arrayMazos.push(Mazo.fromJSON(data))
          if (data.id >= this.#proximoId) {
            this.#proximoId = data.id + 1
          }
        })

        this.#mazos.set(username, arrayMazos)
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
    data.id = this.#proximoId++
    const mazo = Mazo.fromJSON(data)
    const { username } = data
    if (this.#mazos.get(username)) {
      this.#mazos.get(username).push(mazo)
    } else {
      this.#mazos.set(username, [mazo])
    }

    await this.guardar()
    return mazo
  }

  /** Elimina el mazo asignado a los datos dados, si existe la lista de Mazos asociada al username
   *  y el mazo asociado al id, y guarda los mazos en la base de datos
   * @param {Object} data
   * @throws NotFoundError
   */
  async eliminar({ username, id }) {
    const arrayMazos = this.#mazos.get(username)
    if (!arrayMazos) { throw new NotFoundError("Array<Mazo>", username) }

    const indice = arrayMazos.findIndex((mazo) => mazo.id === id)
    if (indice === -1) { throw new NotFoundError("Mazo", id) }

    arrayMazos.splice(indice, 1)
    await this.guardar()
    return true
  }
}
