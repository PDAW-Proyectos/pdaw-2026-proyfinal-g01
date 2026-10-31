import { readFile, writeFile } from "node:fs/promises"
import { NotFoundError } from "../utils/errors.js"
import { Usuario } from '../models/Usuario.js'

/** Clase que almacena los usuarios ordenandolos por id, sirve para cargar los
 * usuarios desde la base de data y guardarlos en la misma. */
export class RepositorioUsuarios {
  /** @type {string} */
  #ruta
  /** @type {Map <number, Usuario>} */
  #usuarios
  /** @type {Number} */
  #proximoId = 1

  /** Requiere una ruta a la base de data y crea el map de usuarios vacio.
   * @param {string} ruta
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#usuarios = new Map()
  }

  // Getters
  /** Mapa de usuarios con claves de id para rapido acceso
   * @returns {Map <Number, Usuario>}
   */
  get usuarios() {
    const copia = new Map()
    for (const [id, usuario] of this.#usuarios) {
      copia.set(id, Usuario.fromJSON(usuario.toJSON()))
    }
    return copia
  }

  // Methods
  /** Calcula el total de usuarios en el repositorio
   * @returns {Number}
   */
  cantidadTotal() {
    return this.#usuarios.size
  }

  /** Busca un usuario especifico asignado al id dado, retorna null si no encuentra nada.
   * @param {Number} id
   * @returns {Usuario | null}
   */
  buscar(id) {
    const usuario = this.#usuarios.get(id)
    return usuario ? Usuario.fromJSON(usuario.toJSON()) : null
  }

  /** Busca un usuario especifico por su username, retorna null si no encuentra nada.
   * @param {string} username
   * @returns {Usuario | null}
   */
  buscarPorUsername(username) {
    for (const usuario of this.#usuarios.values()) {
      if (usuario.username.toLowerCase() === username.toLowerCase()) {
        return Usuario.fromJSON(usuario.toJSON())
      }
    }
    return null
  }

  /** Guarda todos los Usuarios a la base de datos, como objeto JSON */
  async guardar() {
    await writeFile(
      this.#ruta,
      JSON.stringify(Object.fromEntries(this.#usuarios)),
      "utf8"
    )
  }

  /** Carga los datos desde la base de datos iniciando el repositorio con objetos de clase Usuario */
  async cargar() {
    try {
      const contenido = await readFile(this.#ruta, "utf8")
      const data = JSON.parse(contenido)
      Object.entries(data).map(([id, dataUsuario]) => {
        if (dataUsuario.id >= this.#proximoId) {
          this.#proximoId = dataUsuario.id + 1
        }

        this.#usuarios.set(dataUsuario.id, Usuario.fromJSON(dataUsuario))
      })
    } catch (error) {
      if (error.code === "ENOENT") {
        this.#usuarios = new Map()
        this.#proximoId = 1
        await this.guardar()
      } else {
        throw error
      }
    }
  }

  /** Crea y agrega un usuario con los datos dados y guarda los usuarios en la base de datos
   * @param {Object} data
   * @returns {Promise <Usuario>} El Usuario si fue creado correctamente
   */
  async agregar(data) {
    const id = this.#proximoId++
    const usuario = Usuario.fromJSON({ ...data, id: id })
    this.#usuarios.set(id, usuario)

    await this.guardar()
    return usuario
  }

  /** Toma los datos dados y los combina con los del Usuario asociado al id dado, crea
   * un Usuario y lo actualiza en el repositorio, despues guarda los usuarios.
   * @param {Object} data
   * @returns {Promise <Usuario>}
   * @throws NotFoundError si no encuentra el Usuario.
   */
  async actualizar(data) {
    const anterior = this.buscar(data.id)
    if (!anterior) { throw new NotFoundError(`El Usuario asociado a la llave "${data.id}" no se encontro.`) }

    const actualizada = Usuario.fromJSON({ ...anterior.toJSON(), ...data })

    this.#usuarios.set(data.id, actualizada)
    await this.guardar();
    return actualizada;
  }

  /** Elimina el usuario asignado a los datos dados, si existe el usuario asociado al id,
   *  y guarda los usuarios en la base de datos.
   * @param {Number} id
   * @returns {Promise <true>} Si el usuario fue eliminado
   * @throws NotFoundError si no encuentra el Usuario.
   */
  async eliminar(id) {
    const elimino = this.#usuarios.delete(id)
    if (!elimino) { throw new NotFoundError(`El Usuario asociado a la llave "${id}" no se encontro.`) }

    await this.guardar()
    return elimino
  }
}
