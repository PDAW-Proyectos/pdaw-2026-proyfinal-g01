import bcrypt from "bcryptjs"
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js"
import { RepositorioMazos } from "../repositories/RepositorioMazos.js"
import { AuthenticationError, ConflictError, NotFoundError } from "../utils/errors.js"
import { Usuario } from "../models/Usuario.js"

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
    const usuario = this.#repositorioUsuarios.buscar(usuarioAEliminar)
    if (!usuario) {
      throw new NotFoundError(`El usuario "${usuarioAEliminar}" no existe.`)
    }

    //borrado de los mazos en la base de datos
    for (const idMazo of usuario.mazos) {
      try {
        await this.#repositorioMazos.eliminar(idMazo)
      } catch (error) {
        //ignoro si el mazo ya no existe 
      }
    }

    return await this.#repositorioUsuarios.eliminar(usuarioAEliminar)
  }

obtenerMazosDeUsuario(username) {
    const usuario = this.#repositorioUsuarios.buscar(username)
    if (!usuario) {
      throw new NotFoundError(`El usuario "${username}" no existe.`)
    }
    //retorna un arreglo de objetos mazo completos y si no tiene nada retorna un arreglo vacio
    return usuario.mazos
      .map(idMazo => this.#repositorioMazos.buscar(idMazo))
      .filter(mazo => mazo !== null)
  }
}