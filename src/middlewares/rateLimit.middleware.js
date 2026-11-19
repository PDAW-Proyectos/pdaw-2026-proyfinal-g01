import { rateLimit } from "express-rate-limit"
import { AppError } from "../utils/errors.js"

const crearManejadorLimite = (mensaje) => (req, res, next) => {
  next(
    new AppError(mensaje, {
      statusCode: 429,
      title: "Límite de solicitudes excedido",
    })
  )
}

/** Limitador general para las rutas bajo /api (1200 solicitudes por minuto por IP). */
export const limitadorApi = rateLimit({
  windowMs: 60 * 1000,
  limit: 1200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: crearManejadorLimite(
    "Demasiadas solicitudes a la API. Intentá nuevamente en unos instantes."
  ),
})

/** Limitador estricto para /api/usuarios/login (5 intentos fallidos cada 5 minutos por IP). */
export const limitadorLogin = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: crearManejadorLimite(
    "Demasiados intentos de inicio de sesión. Intentá nuevamente en unos minutos."
  ),
})
