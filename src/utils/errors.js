export class ConflictError extends Error {
  /** Un error pesonalizado para decir que la clave ingresada ya esta en uso por otro objeto.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje)
    this.name = "ConflictError"
    this.statusCode = 409
  }
}

export class NotFoundError extends Error {
  /** Un error pesonalizado para decir que no se encontro el objeto asociado a la key.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje)
    this.name = "NotFoundError"
    this.statusCode = 404
  }
}

export class ValidationError extends Error {
  /** Un error pesonalizado para decir que el dato no es valido.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}
