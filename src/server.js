import app from "./app.js"
import { logger } from "./utils/logger.js"

// Declaracion del puerto
const port = Number(process.env.PORT ?? 3000)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT debe ser un entero entre 1 y 65535.")
}

// Iniciación del server
const server = app.listen(port, () => {
  logger.info("servidor iniciado", { port, url: `http://localhost:${port}` })
})

// Error al iniciar el server
server.on("error", (error) => {
  logger.error("error al iniciar el servidor", { stack: error.stack })
  process.exit(1)
})

// Ultimo recurso: errores no capturados del proceso
process.on("unhandledRejection", (reason) => {
  logger.error("promesa rechazada sin manejar", { reason: String(reason) })
})

process.on("uncaughtException", (err) => {
  logger.error("excepcion no capturada", { stack: err.stack })
  process.exit(1)
})

process.on("SIGTERM", () => {
  logger.info("apagado ordenado")
  server.close(() => process.exit(0))
})
