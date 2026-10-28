import bcrypt from 'bcryptjs';
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

  /** Mazos del usuario. */
  get mazos() { return [...this.#mazos] }

  // Methods}
  /* USAR ESTE METODO CUANDO TENGAMOS LA BASE DE DATOS 
  /** Crea una instancia de Usuario a partir de un objeto JSON.
   * @param {Object} data
   * @returns {Usuario}
   
  static fromJSON(data) {
    return new Usuario(JSON.parse(data))
  }  */

  //para la base de datos
  /** Crea una instancia de Usuario a partir de un objeto JSON o de un objeto JavaScript plano.
   * @param {Object|string} data  //para cuando hago las consultas a mi base de datos, que guarda los datos en js
   * @returns {Usuario}
   */
  static fromJSON(data) {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return new Usuario(parsed);
  }


  toJSON() {
    return {
      nombre: this.#nombre,
      username: this.#username,
      contraseña: this.#contraseña,
      mazos: [...this.#mazos]
    };
  }
  //para la api
  toPublicJSON() {
    return {
      nombre: this.#nombre,
      username: this.#username,
      mazos: [...this.#mazos]
    };
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
  eliminarMazo(idMazo){
    this.#mazos = this.#mazos.filter(id => id !== idMazo)
  }
}