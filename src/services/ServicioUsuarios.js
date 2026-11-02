import bcrypt from "bcryptjs"
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js"
import { ValidationError, ConflictError, AuthenticationError } from "../utils/errors.js"

export class ServicioUsuarios {
  #repositorioUsuarios

  /** Inicia el servicio con el repositorio dado, maneja el RepositorioUsuarios.
   * @param {RepositorioUsuarios} repositorioUsuarios
   * @throws TypeError si el parametro no de la clase usada por el servicio.
   */
  constructor(repositorioUsuarios) {
    // Validaciones
    if (!(repositorioUsuarios instanceof RepositorioUsuarios)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioUsuarios")
    }

    this.#repositorioUsuarios = repositorioUsuarios
  }

  // Methods
  /** Registra un nuevo usuario en el sistema.
   * @param {Object} datos
   * @param {string} datos.nombre
   * @param {string} datos.username
   * @param {string} datos.contraseña
   * @returns {Promise<Usuario>}
   */
  async registrar({ nombre, username, contraseña }) {
    const existe = this.#repositorioUsuarios.buscarPorUsername(username)
    if (existe) {
      throw new ConflictError(`El nombre de usuario "${username}" ya esta registrado.`)
    }

    if (typeof contraseña !== "string" || contraseña.length < 6) {
      throw new ValidationError("La contraseña debe tener al menos 6 caracteres.")
    }

    const contraseñaHash = await bcrypt.hash(contraseña, 10)

    return await this.#repositorioUsuarios.agregar({
      nombre,
      username,
      contraseña: contraseñaHash,
      mazos: []
    })
  }

  /** Verifica las credenciales de un usuario.
   * @param {string} username 
   * @param {string} contraseñaPlana 
   * @returns {Promise<Usuario>}
   */
  async autenticar(username, contraseñaPlana) {
    const usuario = this.#repositorioUsuarios.buscarPorUsername(username)
    const valida = usuario !== null && await usuario.verificarContraseña(contraseñaPlana)
    
    if (!valida) {
      throw new AuthenticationError("Usuario o contraseña incorrectos")
    }

    return usuario
  }
}