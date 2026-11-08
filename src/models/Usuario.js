import bcrypt from "bcryptjs"

/** Representa la entidad Usuario
 */
export class Usuario {
  #nombre
  #username
  #contraseña
  #rol

  /**
   * @param {Object} datos // es el objeto que se recibe para crear el usuario
   * @param {string} datos.nombre
   * @param {string} datos.username
   * @param {string} datos.contraseña
   * @param {string} [datos.rol='usuario']
   */
  constructor({ nombre, username, contraseña, rol = "usuario" }) {
    this.#nombre = nombre.trim()
    this.#username = username.trim()
    this.#contraseña = contraseña
    this.#rol = rol
  }

  /** @returns {string} */
  get nombre() { return this.#nombre }

  /** @returns {string} */
  get username() { return this.#username }

  /** @returns {string} */
  get contraseña() { return this.#contraseña }

  /** @returns {string} */
  get rol() { return this.#rol }

  // Methods
  /** Serializa el objeto Usuario a un objeto JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      nombre: this.#nombre,
      username: this.#username,
      contraseña: this.#contraseña,
      rol: this.#rol
    }
  }

  /** Crea una instancia de Usuario a partir de un objeto deserializado.
   * @param {Object} data
   * @returns {Usuario}
   */
  static fromJSON(data) {
    return new Usuario({
      nombre: data.nombre,
      username: data.username,
      contraseña: data.contraseña,
      rol: data.rol
    })
  }

  /** Compara una contraseña en texto plano con el hash guardado.
   * @param {string} contraseñaPlana
   * @returns {Promise<boolean>}
   */
  async verificarContraseña(contraseñaPlana) {
    return await bcrypt.compare(contraseñaPlana, this.#contraseña)
  }
}
