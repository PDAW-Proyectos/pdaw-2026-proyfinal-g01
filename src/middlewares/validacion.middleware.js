import Ajv from "ajv"
import { ValidationError } from "../utils/errors.js"

const ajv = new Ajv({ allErrors: true })

const TRADUCCIONES_AJV = {
  required: (campo) => `Falta el parametro obligatorio "${campo}".`,
  additionalProperties: (campo) => `El parametro "${campo}" no esta permitido.`,
  type: (campo, params) => `El campo "${campo}" debe ser de tipo ${params.type}.`,
  minLength: (campo, params) => `El campo "${campo}" debe tener al menos ${params.limit} caracteres.`,
  pattern: (campo) => `El campo "${campo}" tiene un formato invalido o esta vacio.`,
  minimum: (campo, params) => `El campo "${campo}" debe ser mayor o igual a ${params.limit}.`,
  maxItems: (campo, params) => `El campo "${campo}" no puede tener mas de ${params.limit} elementos.`,
  minProperties: (_, params) => `Se debe enviar al menos ${params.limit} campo para actualizar.`,
  enum: (campo, params) => `El campo "${campo}" debe ser uno de los siguientes valores: ${params.allowedValues.join(", ")}.`,
}

/** Extrae el nombre legible del campo que fallo en la validacion de Ajv.
 * @returns {string}
 */
function obtenerNombreCampo(error) {
  if (error.keyword === "required") {
    return error.params.missingProperty
  }
  if (error.keyword === "additionalProperties") {
    return error.params.additionalProperty
  }

  const ruta = error.instancePath.replace(/^\//, "").replace(/\//g, ".")
  return ruta || "peticion"
}

/** Traduce un error de Ajv a un mensaje claro en español.
 *
 * @returns {string}
 */
export function formatearErrorAjv(error) {
  const campo = obtenerNombreCampo(error)
  const traductor = TRADUCCIONES_AJV[error.keyword]

  return traductor ? traductor(campo, error.params) : `El campo "${campo}" no es valido.`
}

/** Crea un middleware de Express que valida req[origen] contra un JSON Schema.
 * Compila el esquema una sola vez al registrar la ruta.
 * @param {Object} esquema - JSON Schema a validar
 * @param {"body" | "params" | "query"} [origen="body"] - Propiedad de req a validar
 */
export function validar(esquema, origen = "body") {
  const validarEsquema = ajv.compile(esquema)

  return (req, res, next) => {
    const datos = req[origen] ?? {}
    const esValido = validarEsquema(datos)

    if (!esValido) {
      const detalles = validarEsquema.errors.map((error) => ({
        campo: obtenerNombreCampo(error),
        mensaje: formatearErrorAjv(error),
      }))
      return next(new ValidationError(detalles[0].mensaje, detalles))
    }

    next()
  }
}
