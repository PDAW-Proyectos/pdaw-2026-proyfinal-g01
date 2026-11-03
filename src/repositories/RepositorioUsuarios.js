import { readFile, writeFile } from "node:fs/promises"
import { NotFoundError, ConflictError } from "../utils/errors.js"
import { Usuario } from '../models/Usuario.js'

/** Clase que almacena los usuarios ordenandolos por username, sirve para cargar los
 * usuarios desde la base de data y guardarlos en la misma. */
export class RepositorioUsuarios {
  /** @type {string} */
  #ruta
  /** @type {Map <string, Usuario>} */
  #usuarios

  /** Requiere una ruta a la base de data y crea el map de usuarios vacio.
   * @param {string} ruta
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#usuarios = new Map()
  }

  // Getters
  /** Mapa de usuarios con claves de username para rapido acceso
   * @returns {Map <string, Usuario>}
   */
  get usuarios() {
    const copia = new Map()
    for (const [username, usuario] of this.#usuarios) {
      copia.set(username, Usuario.fromJSON(usuario.toJSON()))
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

  /** Busca un usuario especifico por su username, retorna null si no encuentra nada.
   * @param {string} username
   * @returns {Usuario | null}
   */
  buscar(username) {
    if (typeof username !== "string") {
      return null
    }
    const usernameNormalizado = username.trim()
    const usuario = this.#usuarios.get(usernameNormalizado)
    return usuario ? Usuario.fromJSON(usuario.toJSON()) : null
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
      Object.entries(data).forEach(([username, dataUsuario]) => {
        this.#usuarios.set(username, Usuario.fromJSON(dataUsuario))
      })
    } catch (error) {
      if (error.code === "ENOENT") {
        this.#usuarios = new Map()
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
    // El usuario se crea antes para que se aplique la logica del username
    const usuario = Usuario.fromJSON(data)
    if (this.#usuarios.has(usuario.username)) {
      throw new ConflictError(`El nombre de usuario "${usuario.username}" ya esta registrado.`)
    }

    this.#usuarios.set(usuario.username, usuario)

    await this.guardar()
    return usuario
  }

  /** Toma los datos dados y los combina con los del Usuario asociado al username dado, crea
   * un Usuario y lo actualiza en el repositorio, despues guarda los usuarios.
   * @param {Object} data
   * @returns {Promise <Usuario>}
   * @throws NotFoundError si no encuentra el Usuario.
   */
  async actualizar(data) {
    const anterior = this.buscar(data.username)
    if (!anterior) {
      throw new NotFoundError(`El Usuario asociado a la llave "${data.username}" no se encontro.`)
    }

    const actualizada = Usuario.fromJSON({ ...anterior.toJSON(), ...data })

    this.#usuarios.set(actualizada.username, actualizada)
    await this.guardar();
    return actualizada;
  }

  /** Elimina el usuario asignado a los datos dados, si existe el usuario asociado al username,
   *  y guarda los usuarios en la base de datos.
   * @param {string} username
   * @returns {Promise <true>} Si el usuario fue eliminado
   * @throws NotFoundError si no encuentra el Usuario.
   */
  async eliminar(username) {
    const existe = this.buscar(username)
    if (!existe) {
      throw new NotFoundError(`El Usuario asociado a la llave "${username}" no se encontro.`)
    }

    this.#usuarios.delete(existe.username)

    await this.guardar()
    return true
  }
}
