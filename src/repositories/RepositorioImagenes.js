import { mkdir ,readdir, rename, stat, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { ValidationError } from "../utils/errors.js"

const TIPOS_IMAGENES = ["full", "small"]

export class RepositorioImagenes {
  /** @type {string} */
  #rutaFull
  /** @type {string} */
  #rutaSmall
  /** @type {Set <Number>} */
  #imagenesFull
  /** @type {Set <Number>} */
  #imagenesSmall

  /**
   * @param {string} ruta Directorio base donde se guardaran las carpetas full y small
   */
  constructor(ruta) {
    // .resolve() hace que la ruta sea absoluta que es necesario para que express use .sendFile
    this.#rutaFull = path.resolve(ruta, "full")
    this.#rutaSmall = path.resolve(ruta, "small")
    this.#imagenesFull = new Set()
    this.#imagenesSmall = new Set()
  }

  // Getters
  /** Copia del Set de los ids de imagenes completas descargadas
   * @returns {Set <Number>}
   */
  get imagenesFull() {
    return new Set(this.#imagenesFull)
  }

  /** Copia del Set de los ids de imagenes pequeñas descargadas
   * @returns {Set <Number>}
   */
  get imagenesSmall() {
    return new Set(this.#imagenesSmall)
  }

  // Methods
  /** Escanea una carpeta y devuelve un Set con los IDs cuyos archivos existen y no estan vacios */
  async #escanearCarpeta(ruta) {
    await mkdir(ruta, { recursive: true })
    const archivos = await readdir(ruta)
    const idsValidos = new Set()

    for (const archivo of archivos) {
      const rutaArchivo = path.join(ruta, archivo)

      // Elimino los archivos que no sean .jpg
      if (!archivo.endsWith(".jpg")) {
        await this.#borrarArchivo(rutaArchivo)
        continue
      }

      // Todavia existe algunas posibilidades de que si en tiempo de ejecucion se eliminan archivos
      // stat(rutaArchivo) puede tirar error
      const info = await stat(rutaArchivo)
      if (info.size > 0) {
        const id = Number(archivo.replace(".jpg", ""))
        idsValidos.add(id)
      } else {
        await this.#borrarArchivo(rutaArchivo)
      }
    }

    return idsValidos
  }

  /** Intena borrar un archivo con la ruta dada y si no puede ignora el error */
  async #borrarArchivo(ruta) {
    await unlink(ruta).catch(() => {})
  }

  #validarTipo(tipo) {
    if (!TIPOS_IMAGENES.includes(tipo)) {
      throw new ValidationError("El tipo de imagen buscado no existe.")
    }

    const setIds = tipo === "small" ? this.#imagenesSmall : this.#imagenesFull
    const carpeta = tipo === "small" ? this.#rutaSmall : this.#rutaFull

    return {setIds, carpeta}
  }

  /** El buscar chequea que la imagen exista antes de devolverla porque es necesario porque
   * la misma exista para poder ser utilizada.
   * @param {Number} id
   */
  async buscar(id, tipo) {
    const { setIds, carpeta} = this.#validarTipo(tipo)

    if (!setIds.has(id)) return null

    const rutaArchivo = path.join(carpeta, `${id}.jpg`)
    try {
      const info = await stat(rutaArchivo)
      if (info.size === 0) {
        setIds.delete(id)
        await this.#borrarArchivo(rutaArchivo)
        return null
      }
      return rutaArchivo
    } catch (error) {
      if (error.code === "ENOENT") {
        setIds.delete(id)
        return null
      }
      throw error
    }
  }

  /** Inicializa las carpetas y carga las listas de imagenes full y small existentes en disco */
  async cargar() {
    this.#imagenesFull = await this.#escanearCarpeta(this.#rutaFull)
    this.#imagenesSmall = await this.#escanearCarpeta(this.#rutaSmall)
  }

  /** Guarda una imagen en disco si no estaba ya descargada y retorna su ruta.
   * @param {Number} id
   * @param {Buffer} buffer
   * @param {"full" | "small"} tipo
   * @returns {Promise<string>} Ruta absoluta de la imagen guardada
   */
  async agregar(id, buffer, tipo) {
    const { setIds, carpeta} = this.#validarTipo(tipo)
    const rutaArchivo = path.join(carpeta, `${id}.jpg`)

    // Si ya fue descargada previamente, no la volvemos a escribir
    if (setIds.has(id)) return rutaArchivo

    if (!buffer || buffer.length === 0) {
      throw new ValidationError(`El buffer de la imagen ${id} (${tipo}) esta vacio.`)
    }

    // La ruta temporal es usada para asegurar que la img se termine de guardar antes de nombrarse
    // .jpg, para que todas las imagenes .jpg sean imagenes completas aunque se corte el server en
    // pleno guardado
    const rutaTemporal = path.join(carpeta, `${id}.jpg.tmp`)
    await writeFile(rutaTemporal, buffer)
    await rename(rutaTemporal, rutaArchivo)

    setIds.add(id)
    return rutaArchivo
  }
}
