const NIVELES = { debug: 10, info: 20, warn: 30, error: 40 }

// Algunas claves extra por si las dudas
const CLAVES_SENSIBLES = new Set([
  "contraseña",
  "passwordhash",
  "token",
  "authorization",
  "cookie",
  "secret",
])

/** Recorre un valor a cualquier profundidad y oculta las claves sensibles.
 * @param {*} valor
 * @returns {*}
 */
export function redact(valor) {
  if (Array.isArray(valor)) {
    return valor.map(redact)
  }

  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, val]) => [
        clave,
        CLAVES_SENSIBLES.has(clave.toLowerCase()) ? "[OCULTO]" : redact(val),
      ])
    )
  }

  return valor
}

/** Crea un logger estructurado en formato JSON de una linea por evento.
 * @param {string} [nivelConfigurado=process.env.LOG_LEVEL ?? "info"]
 */
export function createLogger(nivelConfigurado = process.env.LOG_LEVEL ?? "info") {
  const nivelMinimo = NIVELES[nivelConfigurado.toLowerCase()] ?? NIVELES.info

  function registrar(level, msg, meta = {}) {
    if (NIVELES[level] < nivelMinimo) return

    const entrada = {
      level,
      time: new Date().toISOString(),
      msg,
      ...redact(meta),
    }

    const linea = JSON.stringify(entrada)
    if (level === "error") {
      console.error(linea)
    } else if (level === "warn") {
      console.warn(linea)
    } else {
      console.log(linea)
    }
  }

  return {
    debug: (msg, meta) => registrar("debug", msg, meta),
    info: (msg, meta) => registrar("info", msg, meta),
    warn: (msg, meta) => registrar("warn", msg, meta),
    error: (msg, meta) => registrar("error", msg, meta),
  }
}

export const logger = createLogger()
