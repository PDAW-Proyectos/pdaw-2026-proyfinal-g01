import bcrypt from "bcryptjs"
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js"
import { AuthenticationError, ConflictError } from "../utils/errors.js"
import { Usuario } from "../models/Usuario.js"

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
    Usuario.validarContraseñaPlana(contraseña)
    const contraseñaHash = await bcrypt.hash(contraseña, 10)

    return await this.#repositorioUsuarios.agregar({
      nombre,
      username,
      contraseña: contraseñaHash,
      rol: 'usuario',
      mazos: []
    })
  }

  /** Verifica las credenciales de un usuario.
   * @param {string} username
   * @param {string} contraseñaPlana
   * @returns {Promise<Usuario>}
   */
  async autenticar(username, contraseñaPlana) {
    const usuario = this.#repositorioUsuarios.buscar(username)
    const valida = usuario !== null && await usuario.verificarContraseña(contraseñaPlana)

    if (!valida) {
      throw new AuthenticationError("Usuario o contraseña incorrectos")
    }

    return usuario
  }


  async eliminar(usuarioAEliminar, adminLogueado) {
    if (usuarioAEliminar === adminLogueado) {
      throw new ConflictError("No se puede eliminar tu propia cuenta de administrador.")
    }

    return await this.#repositorioUsuarios.eliminar(usuarioAEliminar)
  }
}
