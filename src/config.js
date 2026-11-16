import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RUTA_DATA = path.resolve(__dirname, "..", "data")

// Rutas por defecto a la base de datos local
const RUTA_USUARIOS = path.resolve(RUTA_DATA, "usuarios.json")
const RUTA_MAZOS = path.resolve(RUTA_DATA, "mazos.json")
const RUTA_MAZOS_POPULARES = path.resolve(RUTA_DATA, "mazosPopulares.json")
const RUTA_CARTAS = path.resolve(RUTA_DATA, "cartas.json")
const RUTA_IMAGENES = path.resolve(RUTA_DATA, "imagenes")

/** Lee, valida y congela la configuración de la aplicación desde las variables de entorno.
 * En producción falla rápido si falta alguna variable obligatoria.
 * @param {NodeJS.ProcessEnv} [env=process.env]
 */
function loadConfig(env = process.env) {
  const entorno = env.NODE_ENV || "development"
  const production = entorno === "production"
  const missing = []

  const required = (name, devDefault) => {
    const valor = env[name]
    if (typeof valor === "string" && valor.trim() !== "") return valor
    if (production) missing.push(name)
    return devDefault
  }

  const port = env.PORT === undefined || env.PORT === "" ? 3000 : Number(env.PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un entero entre 1 y 65535.")
  }

  const config = {
    env: entorno,
    production,
    port,
    sessionSecret: required("SESSION_SECRET", "solo-para-desarrollo"),
    logLevel: env.LOG_LEVEL || (production ? "info" : "debug"),
    rutas: Object.freeze({
      data: RUTA_DATA,
      usuarios: RUTA_USUARIOS,
      mazos: RUTA_MAZOS,
      mazosPopulares: RUTA_MAZOS_POPULARES,
      cartas: RUTA_CARTAS,
      imagenes: RUTA_IMAGENES,
    }),
  }

  if (missing.length) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(", ")}`)
  }

  return Object.freeze(config)
}

export const config = loadConfig()
