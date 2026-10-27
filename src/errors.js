export class ConflictError extends Error {
  /** Un error pesonalizado para decir que la clave ingresada ya esta en uso por otro objeto.
   * @param {string} nombreClase
   * @param {string} key
   * @param {*} value
   */
  constructor(nombreClase, key, value) {
    super(`El ${nombreClase} asociado a la llave "${key}" ya existe.`)
    this.name = "ConflictError"
    this.statusCode = 409
  }
}

export class NotFoundError extends Error {
  /** Un error pesonalizado para decir que no se encontro el objeto asociado a la key.
   * @param {string} nombreClase
   * @param {string} key
   */
  constructor(nombreClase, key) {
    super(`El ${nombreClase} asociado a la llave "${key}" no se encontro.`)
    this.name = "NotFoundError"
    this.statusCode = 404
  }
}
