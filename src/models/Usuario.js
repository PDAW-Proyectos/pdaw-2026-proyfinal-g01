export class Usuario {
  /** @type {string} */
  #nombre
  /** @type {string} */
  #username
  /** @type {string} */
  #contraseña
  /** @type {Array <Number>} */
  #mazos

  constructor({ nombre, username, contraseña, mazos = [] }) {
    this.#nombre = nombre
    this.#username = username
    this.#contraseña = contraseña
    this.#mazos = [...mazos]
  }

  // Getters
  /** Nombre del usuario. */
  get nombre() { return this.#nombre }

  /** Username del usuario. */
  get username() { return this.#username }

  /** Contraseña del usuario. */
  get contraseña() { return this.#contraseña }

  /** Mazos del usuario. */
  get mazos() { return [...this.#mazos] }

  // Methods}
  /** Crea una instancia de Usuario a partir de un objeto JSON.
   * @param {Object} data
   * @returns {Usuario}
   */
  static fromJSON(data) {
    return new Usuario(JSON.parse(data))
  }

  /** Comvierte el usuario en un objeto JSON para almacenarlo.
   * @returns {Object}
   */
  toJSON() {
    return {
      nombre: this.#nombre,
      username: this.#username,
      contraseña: this.#contraseña,
      mazos: this.#mazos
    }
  }
  /** Obtiene el identificador de un mazo especifico.
   * @param {Number} idMazo 
   * @returns {Number | undefined}
   */
  obtenerMazo(idMazo){
    return this.#mazos.find(id => id === idMazo)
  }
  
  /** Agrega el identificador de un Mazo a la lista del usuario.
   * @param {Number} idMazo
   */
  agregarMazo(idMazo){
    this.#mazos.push(idMazo)
  }

  /** Elimina un mazo de la lista del usuario segun su ID.
   * 
   * @param {Number} idMazo 
   */
  eliminarMazo(idMazo){
    this.#mazos = this.#mazos.filter(id => id !== idMazo)
  }
}