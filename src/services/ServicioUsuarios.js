import bcrypt from "bcryptjs"
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js"
import { RepositorioMazos } from "../repositories/RepositorioMazos.js"
import { AuthenticationError, ConflictError } from "../utils/errors.js"

export class ServicioUsuarios {
  #repositorioUsuarios
  #repositorioMazos

  /**
   * @param {RepositorioUsuarios} repositorioUsuarios
   * @param {RepositorioMazos} repositorioMazos
   */
  constructor(repositorioUsuarios, repositorioMazos) {
    // Validaciones
    if (!(repositorioUsuarios instanceof RepositorioUsuarios)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioUsuarios")
    }
    if (!(repositorioMazos instanceof RepositorioMazos)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioMazos")
    }

    this.#repositorioUsuarios = repositorioUsuarios
    this.#repositorioMazos = repositorioMazos
  }

  // Methods
  /** Registra un nuevo usuario en el sistema.
   * @param {Object} datos
   * @param {string} datos.nombre
   * @param {string} datos.username
   * @param {string} datos.contraseña
   * @returns {Promise<import("../models/Usuario.js").Usuario>}
   */
  async registrarUsuario({ nombre, username, contraseña }) {
    const contraseñaHash = await bcrypt.hash(contraseña, 10)

    return await this.#repositorioUsuarios.agregar({
      nombre,
      username,
      contraseña: contraseñaHash,
      rol: "usuario"
    })
  }

  /** Verifica las credenciales de un usuario.
   * @param {string} username
   * @param {string} contraseñaPlana
   * @returns {Promise<import("../models/Usuario.js").Usuario>}
   */
  async autenticarUsuario(username, contraseñaPlana) {
    const usuario = this.#repositorioUsuarios.buscar(username)
    const valida = usuario !== null && await usuario.verificarContraseña(contraseñaPlana)

    if (!valida) {
      throw new AuthenticationError("Usuario o contraseña incorrectos")
    }

    return usuario
  }

  async eliminarUsuario(usuarioAEliminar, adminLogueado) {
    const usernameLimpio = usuarioAEliminar.trim()
    if (usernameLimpio === adminLogueado) {
      throw new ConflictError("No se puede eliminar tu propia cuenta de administrador.")
    }

    await this.#repositorioUsuarios.eliminar(usernameLimpio)
    await this.#repositorioMazos.eliminarPorUsername(usernameLimpio)

    return true
  }

  obtenerUsuarios() {
  return this.#repositorioUsuarios.obtenerTodos()
  }
}
