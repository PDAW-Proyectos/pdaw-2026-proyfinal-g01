/** Clase base para los errores operacionales de la aplicacion. */
export class AppError extends Error {
  /** @param {string} mensaje
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

/** Un error personalizado para decir que la clave ingresada ya esta en uso por otro objeto. */
export class ConflictError extends AppError {
  /** @param {string} mensaje */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 409,
      title: "Conflicto con el estado actual",
    })
  }
}

/** Un error personalizado para decir que no se encontro el objeto asociado a la key. */
export class NotFoundError extends AppError {
  /** @param {string} mensaje */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 404,
      title: "No encontrado",
    })
  }
}

/** Un error personalizado para decir que el dato no es valido. */
export class ValidationError extends AppError {
  /** @param {string} mensaje
   * @param {Array <{campo: string, mensaje: string}>} [details]
   */
  constructor(mensaje, details) {
    super(mensaje, {
      statusCode: 400,
      title: "Datos invalidos",
      details,
    })
  }
}

/** Un error personalizado para indicar falta de autenticacion o credenciales invalidas. */
export class AuthenticationError extends AppError {
  /** @param {string} mensaje */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 401,
      title: "No autenticado",
    })
  }
}

/** Un error personalizado para decir que el usuario autenticado no tiene los permisos necesarios. */
export class AuthorizationError extends AppError {
  /** @param {string} mensaje */
  constructor(mensaje) {
    super(mensaje, {
      statusCode: 403,
      title: "Sin permisos",
    })
  }
}

/** Un error personalizado para indicar un fallo al comunicarse con la API externa. */
export class ExternalApiError extends AppError {
  /** @param {string} mensaje
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

/** Un error personalizado para indicar que se agoto el tiempo de espera al comunicarse con un servicio externo. */
export class TimeoutError extends AppError {
  /** @param {string} mensaje
   * @param {Error} [cause]
   */
  constructor(mensaje, cause) {
    super(mensaje, {
      statusCode: 504,
      title: "Tiempo de espera agotado",
      cause,
    })
  }
}

/** Un error personalizado para indicar un fallo al leer o actualizar la base de datos local. */
export class DatabaseError extends AppError {
  /** @param {string} mensaje
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
