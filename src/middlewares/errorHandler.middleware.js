// Esta clase encapsula la logica de los errores para devolver el status con su mensaje y codigo,
// se tiene que iniciar en la app.js al final y usar en los catch de los controladores con la
// funcion next(error)

import { randomUUID } from "node:crypto"
import { AppError } from "../utils/errors.js"
import { logger as defaultLogger } from "../utils/logger.js"

/** Middleware que asigna un identificador unico a cada solicitud (X-Request-Id)
 * y registra el evento al finalizar la respuesta.
 * @param {Object} [customLogger=defaultLogger]
 */
export function requestContext(customLogger = defaultLogger) {
  return (req, res, next) => {
    req.id = req.get("X-Request-Id") || randomUUID()
    res.set("X-Request-Id", req.id)
    const inicio = Date.now()

    res.on("finish", () => {
      customLogger.info("solicitud", {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - inicio,
      })
    })

    next()
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const esOperacionalConocido = err instanceof AppError && err.statusCode !== 500
  const statusCode = err.statusCode ?? 500
  const ctx = {
    requestId: req.id,
    status: statusCode,
    url: req.originalUrl,
  }

  if (statusCode >= 500) {
    defaultLogger.error(err.message, {
      ...ctx,
      stack: err.stack,
      ...(err.cause && { cause: String(err.cause) }),
    })
  } else {
    defaultLogger.warn(err.message, ctx)
  }

  const title = esOperacionalConocido ? err.title : "Error interno"
  const detail = esOperacionalConocido ? err.message : "Ocurrió un error inesperado."

  res
    .status(statusCode)
    .type("application/problem+json")
    .json({
      type: "about:blank",
      title,
      status: statusCode,
      detail,
      instance: req.originalUrl,
      requestId: req.id,
      ...(err.details && { errores: err.details }),
      error: err.name ?? "Error",
      mensaje: detail,
    })
}
