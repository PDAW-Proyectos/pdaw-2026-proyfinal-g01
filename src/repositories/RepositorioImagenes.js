import { mkdir ,readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

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
    this.#rutaFull = path.join(ruta, "full")
    this.#rutaSmall = path.join(ruta, "small")
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
        this.#borrarArchivo(rutaArchivo)
        continue
      }

      // Todavia existe algunas posibilidades de que si en tiempo de ejecucion se eliminan archivos
      // stat(rutaArchivo) puede tirar error
      const info = await stat(rutaArchivo)
      if (info.size > 0) {
        const id = Number(archivo.replace(".jpg", ""))
        idsValidos.add(id)
      } else {
        this.#borrarArchivo(rutaArchivo)
      }
    }

    return idsValidos
  }

  /** Intena borrar un archivo con la ruta dada y si no puede ignora el error */
  async #borrarArchivo(ruta) {
    await unlink(ruta).catch(() => {})
  }

  /**
   * @param {Number} id
   */
  buscar(id, tipo = "full") {
    const setIds = tipo === "small" ? this.#imagenesSmall : this.#imagenesFull
    const carpeta = tipo === "small" ? this.#rutaSmall : this.#rutaFull

    if (!setIds.has(id)) return null

    return path.join(carpeta, `${id}.jpg`)
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
  async agregar(id, buffer, tipo = "full") {
    const numId = Number(id)
    const lista = tipo === "small" ? this.#imagenesSmall : this.#imagenesFull
    const carpeta = tipo === "small" ? this.#rutaSmall : this.#rutaFull
    const rutaFinal = path.resolve(carpeta, `${numId}.jpg`)

    // Si ya fue descargada previamente, no la volvemos a escribir
    if (lista.has(numId)) return rutaFinal

    if (!buffer || buffer.length === 0) {
      throw new Error(`El buffer de la imagen ${id} (${tipo}) esta vacio.`)
    }

    const rutaTemporal = path.resolve(carpeta, `${numId}.jpg.tmp`)

    await writeFile(rutaTemporal, buffer)
    await rename(rutaTemporal, rutaFinal)

    lista.add(numId)
    return rutaFinal
  }
}
