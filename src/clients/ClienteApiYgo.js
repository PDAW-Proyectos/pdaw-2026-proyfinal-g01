import { ExternalApiError, NotFoundError, ValidationError } from "../utils/errors.js"

const URL_CARTAS = "https://db.ygoprodeck.com/api/v7/cardinfo.php"

// Las validaciones de este codigo fueron basadas en un codigo de stackoverflow, para saber que chequear
/** Realiza el fetch y valida el estado HTTP y el Content-Type de la respuesta.
 * @param {string} url
 * @param {string} tipoEsperado (ej. "application/json" o "image/")
 * @returns {Promise<Response>}
 */
async function realizarPeticion(url, tipoEsperado) {
  if (typeof url !== "string" || !url.startsWith("http")) {
    throw new ValidationError("La URL proporcionada no es valida.")
  }

  const respuesta = await fetch(url)
  if (respuesta.status === 400 || respuesta.status === 404) {
    throw new NotFoundError(`Recurso no encontrado en la API externa: ${url}`)
  }
  if (!respuesta.ok) {
    throw new ExternalApiError(`Error al comunicarse con la API externa (HTTP ${respuesta.status}).`)
  }

  const contentType = respuesta.headers.get("content-type") ?? ""
  if (!contentType.includes(tipoEsperado)) {
    throw new ExternalApiError(`Se esperaba contenido '${tipoEsperado}' pero se recibio '${contentType}'.`)
  }

  return respuesta
}

export async function descargarCartas() {
  const respuesta = await realizarPeticion(URL_CARTAS, "application/json")
  const payload = await respuesta.json()

  if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) {
    throw new ExternalApiError("El payload devuelto por la API esta vacio.")
  }

  // payload es como se llama a los datos esenciales que vienen en la respuesta de la api,
  // y en este caso .data es el nombre del array como lo trae la api de yugi
  return payload.data
}

export async function descargarImagen(urlImagen) {
  const respuesta = await realizarPeticion(urlImagen, "image/")
  const buffer = Buffer.from(await respuesta.arrayBuffer())

  if (buffer.length === 0) {
    throw new ExternalApiError("El buffer de la imagen descargada esta vacio.")
  }

  // buffer es como se le llama a un dato cargado no un json o un string
  return buffer
}
