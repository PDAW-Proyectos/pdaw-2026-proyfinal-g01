import Ajv from "ajv"
import { ValidationError } from "../utils/errors.js"

const ajv = new Ajv()

/** Extrae el nombre legible del campo que fallo en la validacion de Ajv.
 *
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

  switch (error.keyword) {
    case "required":
      return `Falta el parametro obligatorio "${campo}".`
    case "additionalProperties":
      return `El parametro "${campo}" no esta permitido.`
    case "type":
      return `El campo "${campo}" debe ser de tipo ${error.params.type}.`
    case "minLength":
      return `El campo "${campo}" debe tener al menos ${error.params.limit} caracteres.`
    case "pattern":
      return `El campo "${campo}" tiene un formato invalido o esta vacio.`
    case "minimum":
      return `El campo "${campo}" debe ser mayor o igual a ${error.params.limit}.`
    case "maxItems":
      return `El campo "${campo}" no puede tener mas de ${error.params.limit} elementos.`
    case "minProperties":
      return `Se debe enviar al menos ${error.params.limit} campo para actualizar.`
    case "enum":
      return `El campo "${campo}" debe ser uno de los siguientes valores: ${error.params.allowedValues.join(", ")}.`
    default:
      return `El campo "${campo}" no es valido.`
  }
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
      const primerError = validarEsquema.errors[0]
      return next(new ValidationError(formatearErrorAjv(primerError)))
    }

    next()
  }
}
