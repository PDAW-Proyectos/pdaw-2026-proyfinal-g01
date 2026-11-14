import { ExternalApiError, NotFoundError, ValidationError, TimeoutError } from "../utils/errors.js"

const TIEMPO_ESPERA_BASE_MS = 5000
const CANTIDAD_MAZOS_POPULARES = 10
const URL_CARTAS = "https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes"
const URL_MDM_MAZOS = "https://www.masterduelmeta.com/api/v1/deck-types"
const URL_YGM_MAZOS = "https://www.yugiohmeta.com/api/v1/deck-types"
const URL_QUERY_MAZOS_POPULARES = `${URL_MDM_MAZOS}?tournamentPower[$gte]=1&limit=${CANTIDAD_MAZOS_POPULARES}&sort=-tournamentPower&fields=name,tournamentPower,tournamentPowerTrend`

function url_query_mazos(paginaBase, nombre) {
  return `${paginaBase}?name=${encodeURIComponent(nombre)}&limit=1&aggregate=aboveThresh`
}

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

  // Intervalo aleatorio entre 1 y 1000 ms sumado al tiempo base de 5 segundos
  const intervaloAleatorio = Math.floor(Math.random() * 1000) + 1
  const tiempoLimite = TIEMPO_ESPERA_BASE_MS + intervaloAleatorio

  let respuesta
  try {
    respuesta = await fetch(url, { signal: AbortSignal.timeout(tiempoLimite) })
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new TimeoutError(`Tiempo de espera agotado al consultar la API externa: ${url}`, error)
    }
    throw error
  }

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

/** Obtiene el desglose de cartas de un mazo desde YuGiOhMeta, o MasterDuelMeta como fallback.
 * @param {string} nombreMazo
 * @returns {Promise<Array<Object>>}
 */
async function descargarCartasDeMazo(nombreMazo) {
  const respuestaYgm = await realizarPeticion(url_query_mazos(URL_YGM_MAZOS, nombreMazo), "application/json")
  let data = await respuestaYgm.json()
  let cartas = data[0]?.deckBreakdownTCG?.cards

  // Primer fallback por si las cartas del tcg no estan disponibles.
  if (!Array.isArray(cartas) || cartas.length === 0) {
    cartas = data[0]?.deckBreakdownOCG?.cards
  }

  // Segundo fallback por si las cartas del ocg no estan disponibles.
  if (!Array.isArray(cartas) || cartas.length === 0) {
    const respuestaMdm = await realizarPeticion(url_query_mazos(URL_MDM_MAZOS, nombreMazo), "application/json")
    data = await respuestaMdm.json()
    const mainDeck = data.deckBreakdown?.sampleDeck?.main ?? []
    const extraDeck = data.deckBreakdown?.sampleDeck?.extra ?? []
    cartas = [...mainDeck, ...extraDeck]
  }

  return cartas
}

/** Descarga los mazos competitivos mas populares y construye un arreglo con el nombre
 * de cada mazo y sus cartas con nombre y cantidad de copias.
 * @returns {Promise <Array <{ nombre: string, cartas: Array <{name: string, amount: Number}}> }>>}
 */
export async function descargarMazosPopulares() {
  const respuesta = await realizarPeticion(URL_QUERY_MAZOS_POPULARES, "application/json")
  const topMazos = await respuesta.json()

  if (!Array.isArray(topMazos) || topMazos.length === 0) {
    throw new ExternalApiError("El payload de mazos populares devuelto por la API esta vacio.")
  }

  const mazosPopulares = []
  for (const mazo of topMazos) {
    const desgloseCartas = await descargarCartasDeMazo(mazo.name)

    const cartas = []
    for (const entrada of desgloseCartas) {
      cartas.push({
        name: entrada.card.name,
        amount: entrada.at ?? entrada.amount,
      })
    }

    mazosPopulares.push({
      nombre: mazo.name,
      cartas
    })
  }

  return mazosPopulares
}
