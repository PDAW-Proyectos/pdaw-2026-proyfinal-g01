import { stat } from "node:fs/promises"
import { DatabaseError } from "./errors.js"

const UNA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000
const MAX_REINTENTOS = 3

/** Clase encargada de verificar y programar la descarga semanal de datos
 * para una lista de servicios que implementen `descargar()`, `actualizarCache()`, `estaVacio()` y `ruta`.
 */
export class ProgramadorDescargas {
  #servicios

  /**
   * @param {Array<{ descargar: Function, actualizarCache: Function, estaVacio: Function, ruta: string }>} servicios
   */
  constructor(servicios = []) {
    if (!Array.isArray(servicios) || servicios.length === 0) {
      throw new TypeError("El programador debe recibir un arreglo no vacio de servicios")
    }

    this.#servicios = servicios
  }

  /** Ejecuta la descarga de un servicio reintentando una cantidad fija de veces si falla.
   * @param {{ descargar: Function, actualizarCache: Function }} servicio
   */
  async #descargarConReintentos(servicio) {
    let intentos = 1

    while (intentos <= MAX_REINTENTOS) {
      try {
        await servicio.descargar()
        servicio.actualizarCache()
        return
      } catch (error) {
        if (intentos === MAX_REINTENTOS) {
          throw new DatabaseError(`No se pudo actualizar la base de datos tras ${MAX_REINTENTOS} intentos: ${error.message}`)
        }

        intentos++
      }
    }
  }

  /** Verifica si un servicio requiere descarga inmediata, actualiza su cache y programa su actualizacion semanal.
   * @param {{ descargar: Function, actualizarCache: Function, estaVacio: Function, ruta: string }} servicio
   */
  async #sincronizarServicio(servicio) {
    let tiempoTranscurrido = 0

    if (servicio.estaVacio()) {
      await this.#descargarConReintentos(servicio)
    } else {
      try {
        const info = await stat(servicio.ruta)
        tiempoTranscurrido = Date.now() - info.mtimeMs
      } catch (error) {
        throw new DatabaseError(`No se pudo conseguir las stats de la base de datos: ${error.message}`)
      }

      if (tiempoTranscurrido >= UNA_SEMANA_MS) {
        await this.#descargarConReintentos(servicio)
        tiempoTranscurrido = 0
      } else {
        servicio.actualizarCache()
      }
    }

    // .unref() evita que el timer bloquee el cierre de Jest o Node
    if (tiempoTranscurrido > 0) {
      setTimeout(() => { this.#sincronizarServicio(servicio) }, (UNA_SEMANA_MS - tiempoTranscurrido)).unref()
    } else {
      setInterval(() => { this.#descargarConReintentos(servicio) }, UNA_SEMANA_MS).unref()
    }
  }

  /** Inicia la sincronizacion y programacion semanal para todos los servicios registrados. */
  async iniciar() {
    for (const servicio of this.#servicios) {
      await this.#sincronizarServicio(servicio)
    }
  }
}
