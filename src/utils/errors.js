export class AppError extends Error {
  /** Clase base para los errores operacionales de la aplicacion.
   * @param {string} mensaje
   * @param {Object} [options={}]
   * @param {number} [options.statusCode=500]
   * @param {string} [options.title="Error interno"]
   * @param {Array|Object} [options.details]
   * @param {Error} [options.cause]
   */
  constructor(mensaje, options = {}) {
    const { statusCode = 500, title = "Error interno", details, cause } = options
    super(mensaje, { cause })
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.title = title
    this.details = details
  }
}

export class ConflictError extends AppError {
  /** Un error personalizado para decir que la clave ingresada ya esta en uso por otro objeto.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 409,
      title: "Conflicto con el estado actual",
    })
  }
}

export class NotFoundError extends AppError {
  /** Un error personalizado para decir que no se encontro el objeto asociado a la key.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 404,
      title: "No encontrado",
    })
  }
}

export class ValidationError extends AppError {
  /** Un error personalizado para decir que el dato no es valido.
   * @param {string} mensaje
   * @param {Array<{campo: string, mensaje: string}>} [details]
   */
  constructor(mensaje, details) {
    super(mensaje, {
      statusCode: 400,
      title: "Datos invalidos",
      details,
    })
  }
}

export class AuthenticationError extends AppError {
  /** Un error personalizado para indicar falta de autenticacion o credenciales invalidas.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 401,
      title: "No autenticado",
    })
  }
}

export class AuthorizationError extends AppError {
  /** Un error personalizado para decir que el usuario autenticado no tiene los permisos necesarios.
   * @param {string} mensaje
   */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 403,
      title: "Sin permisos",
    })
  }
}

export class ExternalApiError extends AppError {
  /** Un error personalizado para indicar un fallo al comunicarse con la API externa.
   * @param {string} mensaje
   * @param {Error} [cause]
   */
  constructor(mensaje, cause) {
    super(mensaje, {
      statusCode: 502,
      title: "Servicio externo no disponible",
      cause,
    })
  }
}

export class DatabaseError extends AppError {
  /** Un error personalizado para indicar un fallo al leer o actualizar la base de datos local.
   * @param {string} mensaje
   * @param {Error} [cause]
   */
  constructor(mensaje, cause) {
    super(mensaje, {
      statusCode: 500,
      title: "Error interno",
      cause,
    })
  }
}
