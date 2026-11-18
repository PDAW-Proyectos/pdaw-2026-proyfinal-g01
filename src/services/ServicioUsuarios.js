import bcrypt from "bcryptjs";
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js";
import { RepositorioMazos } from "../repositories/RepositorioMazos.js";
import { AuthenticationError, ConflictError } from "../utils/errors.js";
import { paginar } from "../utils/paginacion.js";

const USERNAMES_RESERVADOS = new Set(["meta"]);

export class ServicioUsuarios {
  #repositorioUsuarios;
  #repositorioMazos;

  /**
   * @param {RepositorioUsuarios} repositorioUsuarios
   * @param {RepositorioMazos} repositorioMazos
   */
  constructor(repositorioUsuarios, repositorioMazos) {
    // Validaciones
    if (!(repositorioUsuarios instanceof RepositorioUsuarios)) {
      throw new TypeError(
        "El servicio se tiene que crear con un RepositorioUsuarios",
      );
    }
    if (!(repositorioMazos instanceof RepositorioMazos)) {
      throw new TypeError(
        "El servicio se tiene que crear con un RepositorioMazos",
      );
    }

    this.#repositorioUsuarios = repositorioUsuarios;
    this.#repositorioMazos = repositorioMazos;
  }

  /** Crea el usuario administrador por defecto si no existe en el repositorio.
   * @param {Object} [credenciales]
   */
  async inicializarAdmin({
    nombre = "Administrador",
    username = "admin1234",
    contraseña = "admin1234",
  } = {}) {
    if (this.#repositorioUsuarios.buscar(username)) {
      return;
    }

    const contraseñaHash = await bcrypt.hash(contraseña, 10);
    await this.#repositorioUsuarios.agregar({
      nombre,
      username,
      contraseña: contraseñaHash,
      rol: "admin",
    });
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
    const usernameNormalizado = username.trim().toLowerCase()
    if (USERNAMES_RESERVADOS.has(usernameNormalizado)) {
      throw new ConflictError(`El nombre de usuario "${username.trim()}" esta reservado y no esta disponible.`)
    }

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
    const usuario = this.#repositorioUsuarios.buscar(username);
    const valida =
      usuario !== null && (await usuario.verificarContraseña(contraseñaPlana));

    if (!valida) {
      throw new AuthenticationError("Usuario o contraseña incorrectos");
    }

    return usuario;
  }

  async eliminarUsuario(usuarioAEliminar, adminLogueado) {
    const usernameLimpio = usuarioAEliminar.trim();
    if (usernameLimpio === adminLogueado) {
      throw new ConflictError(
        "No se puede eliminar tu propia cuenta de administrador.",
      );
    }

    await this.#repositorioUsuarios.eliminar(usernameLimpio);
    await this.#repositorioMazos.eliminarPorUsername(usernameLimpio);

    return true;
  }

  async obtenerUsuarios({ username = "", pagina = 1, limite = 10 } = {}) {
    const registros = this.#repositorioUsuarios.obtenerTodos();
    //Verifico si u es una instancia de la clase Usuario comprobando que tenga definido el método toDTO.
    let usuarios = registros.map((u) =>
      typeof u.toDTO === "function" ? u.toDTO() : u,
    );

    //filtro por nombre
    const termino = username.trim().toLowerCase();
    if (termino) {
      usuarios = usuarios.filter((u) =>
        (u.username ?? "").toLowerCase().includes(termino),
      );
    }

    if (usuarios.length === 0) {
      return {
        datos: [],
        paginacion: {
          paginaActual: 1,
          totalPaginas: 0,
          totalEntradas: 0,
          tieneAnterior: false,
          tieneSiguiente: false,
        },
      };
    }

    return paginar(usuarios, Number(limite), Number(pagina));
  }
}
