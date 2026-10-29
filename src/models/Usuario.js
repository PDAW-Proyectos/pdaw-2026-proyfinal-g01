import bcrypt from "bcryptjs";
export class Usuario {
  /** @type {string} */
  #nombre;
  /** @type {string} */
  #username;
  /** @type {string} */
  #contraseña;
  /** @type {Array <Number>} */
  #mazos;

  constructor({ nombre, username, contraseña, mazos = [] }) {
    this.#nombre = nombre;
    this.#username = username;
    this.#contraseña = contraseña;
    this.#mazos = [...mazos];
  }

  // Getters
  /** Nombre del usuario. */
  get nombre() {
    return this.#nombre;
  }

  /** Username del usuario. */
  get username() {
    return this.#username;
  }

  /** Mazos del usuario. */
  get mazos() {
    return [...this.#mazos];
  }

  // Methods
  static fromJSON(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new TypeError('fromJSON espera un objeto plano válido');
  }
  return new Usuario(data);
}

  /**
   * Serializa la entidad para respuestas o almacenamiento público (sin la contraseña).
   */
  toJSON() {
    return {
      nombre: this.#nombre,
      username: this.#username,
      mazos: [...this.#mazos],
    };
  }

  /**
   * Retorna los datos completos (incluyendo el hash de la contraseña)
   * únicamente cuando el repositorio necesita persistir todo en el archivo JSON.
   */
  toPersistenceJSON() {
    return {
      nombre: this.#nombre,
      username: this.#username,
      contraseña: this.#contraseña,
      mazos: [...this.#mazos],
    };
  }

  /** Obtiene el identificador de un mazo especifico.
   * @param {Number} idMazo
   * @returns {Number | undefined}
   */
  obtenerMazo(idMazo) {
    return this.#mazos.find((id) => id === idMazo);
  }

  /** Agrega el identificador de un Mazo a la lista del usuario.
   * @param {Number} idMazo
   */
  agregarMazo(idMazo) {
    this.#mazos.push(idMazo);
  }

  /**
   * Encapsula la comparación de contraseñas dentro de la propia clase.
   * @param {string} contraseñaPlana
   * @returns {Promise<boolean>}
   */
  async verificarContraseña(contraseñaPlana) {
    return await bcrypt.compare(contraseñaPlana, this.#contraseña);
  }

  /** Elimina un mazo de la lista del usuario segun su ID.
   *
   * @param {Number} idMazo
   */
  eliminarMazo(idMazo) {
    this.#mazos = this.#mazos.filter((id) => id !== idMazo);
  }
}
