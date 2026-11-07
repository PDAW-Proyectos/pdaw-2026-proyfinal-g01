import bcrypt from "bcryptjs"
import { ValidationError } from "../utils/errors.js"

// Reglas de negocio
const MIN_LARGO_CONTRASEÑA = 6

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
  constructor({ nombre, username, contraseña, rol = 'usuario' }) {
    // Validaciones
    if (typeof nombre !== "string" || nombre.trim() === "") {
      throw new ValidationError("El nombre no puede estar vacio")
    }
    if (typeof username !== "string" || username.trim() === "") {
      throw new ValidationError("El username no puede estar vacio")
    }
    if (typeof contraseña !== "string" || contraseña.trim() === "") {
      throw new ValidationError("La contraseña no puede estar vacia")
    }
    if (rol !== 'usuario' && rol !== 'admin') {
      throw new ValidationError("Rol inválido. Debe ser 'usuario' o 'admin'.")
    }

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

  static validarContraseñaPlana(contraseña) {
    if (typeof contraseña !== "string" || contraseña.length < MIN_LARGO_CONTRASEÑA) {
      throw new ValidationError(
        `La contraseña debe tener al menos ${MIN_LARGO_CONTRASEÑA} caracteres.`
      )
    }
  }

  /** Compara una contraseña en texto plano con el hash guardado.
   * @param {string} contraseñaPlana
   * @returns {Promise<boolean>}
   */
  async verificarContraseña(contraseñaPlana) {
    return await bcrypt.compare(contraseñaPlana, this.#contraseña)
  }
}
