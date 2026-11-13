import { config } from "./config.js"
import app from "./app.js"
import { inicializarContenedor } from "./utils/container.js"
import { logger } from "./utils/logger.js"

// Iniciacion de la base de datos, osea el container
await inicializarContenedor()

// Iniciacion del server
const server = app.listen(config.port, () => {
  logger.info("servidor iniciado", { port: config.port, url: `http://localhost:${config.port}` })
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
