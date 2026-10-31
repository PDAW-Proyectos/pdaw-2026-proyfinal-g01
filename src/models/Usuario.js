import bcrypt from "bcryptjs"
import { ValidationError, ConflictError, NotFoundError } from "../utils/errors.js"

// Reglas de negocio
const MAX_MAZOS = 10

/** Representa la entidad Usuario
 */
export class Usuario {
  #id
  #nombre
  #username
  #contraseña
  #mazos

  /**
   * @param {Object} datos // es el objeto que se recibe para crear el usuario
   * @param {number} datos.id
   * @param {string} datos.nombre
   * @param {string} datos.username
   * @param {string} datos.contraseña
   * @param {Array<number>} [datos.mazos=[]]
   */
  constructor({ id, nombre, username, contraseña, mazos = [] }) {
    // Validaciones
    if (!Number.isInteger(id) || id <= 0) {
      throw new ValidationError("El id del usuario debe ser un entero positivo")
    }
    if (typeof nombre !== "string" || nombre.trim() === "") {
      throw new ValidationError("El nombre no puede estar vacio")
    }
    if (typeof username !== "string" || username.trim() === "") {
      throw new ValidationError("El username no puede estar vacio")
    }
    if (typeof contraseña !== "string" || contraseña.trim() === "") {
      throw new ValidationError("La contraseña no puede estar vacia")
    }
    if (mazos.length > MAX_MAZOS) {
      throw new ValidationError(`El usuario no puede tener mas de ${MAX_MAZOS} mazos.`)
    }

    this.#id = id
    this.#nombre = nombre.trim()
    this.#username = username.trim()
    this.#contraseña = contraseña
    this.#mazos = [...mazos]
  }

  /** @returns {number} */
  get id() { return this.#id }

  /** @returns {string} */
  get nombre() { return this.#nombre }

  /** @returns {string} */
  get username() { return this.#username }

  /** @returns {string} */
  get contraseña() { return this.#contraseña }

  /** @returns {Array <number>} */
  get mazos() { return [...this.#mazos] }

  // Methods
  /** Serializa el objeto Usuario a un objeto JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.#id,
      nombre: this.#nombre,
      username: this.#username,
      contraseña: this.#contraseña,
      mazos: [...this.#mazos]
    }
  }

  /** Crea una instancia de Usuario a partir de un objeto deserializado.
   * @param {Object} data
   * @returns {Usuario}
   */
  static fromJSON(data) {
    return new Usuario({
      id: data.id,
      nombre: data.nombre,
      username: data.username,
      contraseña: data.contraseña,
      mazos: data.mazos
    })
  }

  // Methods
  /** Compara una contraseña en texto plano con el hash guardado.
   * @param {string} contraseñaPlana
   * @returns {Promise<boolean>}
   */
  async verificarContraseña(contraseñaPlana) {
    return await bcrypt.compare(contraseñaPlana, this.#contraseña)
  }

  /** Agrega el identificador de un mazo a la lista del usuario.
   * @param {number} idMazo
   * @returns {boolean}
   */
  agregarMazo(idMazo) {
    // Validaciones
    if (!Number.isInteger(idMazo) || idMazo <= 0) {
      throw new ValidationError("El id del mazo debe ser un entero positivo.")
    }
    if (this.#mazos.length >= MAX_MAZOS) {
      throw new ValidationError(`El usuario ya alcanzo el limite de ${MAX_MAZOS} mazos.`)
    }
    if (this.#mazos.includes(idMazo)) {
      throw new ConflictError("No se pueden añadir copias del mismo mazo.")
    }

    this.#mazos.push(idMazo)
    return true
  }

  /** Elimina un mazo de la lista del usuario.
   * @param {number} idMazo
   * @returns {boolean} True si el mazo fue encontrado y eliminado, false si no
   */
  eliminarMazo(idMazo) {
    const indice = this.#mazos.indexOf(idMazo)
    if (indice !== -1) {
      this.#mazos.splice(indice, 1)
      return true
    }
    return false
  }
}