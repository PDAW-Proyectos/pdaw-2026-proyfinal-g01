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

export class AuthenticationError extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = "AuthenticationError";
    this.statusCode = 401; //
  }
}

export class AuthorizationError extends Error {
  /** Un error personalizado para decir que el usuario autenticado no tiene los permisos necesarios.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje);
    this.name = "AuthorizationError";
    this.statusCode = 403;
  }
}

export class ExternalApiError extends Error {
  /** Un error personalizado para indicar un fallo al comunicarse con la API externa.
   * @param {string} mensaje
   * @param {Number} [statusCode=502]
   */
  constructor(mensaje) {
    super(mensaje)
    this.name = "ExternalApiError"
    this.statusCode = 502
  }
}

export class DatabaseError extends Error {
  /** Un error personalizado para indicar un fallo al leer o actualizar la base de datos local.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje)
    this.name = "DatabaseError"
    this.statusCode = 500
  }
}
