import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises"
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
  async #escanearCarpeta(rutaCarpeta) {
    await mkdir(rutaCarpeta, { recursive: true })
    const archivos = await readdir(rutaCarpeta)
    const idsValidos = new Set()

    for (const archivo of archivos) {
      if (!archivo.endsWith(".jpg")) continue

      const rutaArchivo = path.join(rutaCarpeta, archivo)
      const info = await stat(rutaArchivo)

      if (info.size > 0) {
        const id = Number(path.basename(archivo, ".jpg"))
        if (!Number.isNaN(id)) {
          idsValidos.add(id)
        }
      } else {
        // Si quedo un archivo corrupto de 0 bytes, lo limpiamos
        await unlink(rutaArchivo).catch(() => {})
      }
    }

    return idsValidos
  }

  buscar(id, tipo = "full") {
    const numId = Number(id)
    const lista = tipo === "small" ? this.#imagenesSmall : this.#imagenesFull
    const carpeta = tipo === "small" ? this.#rutaSmall : this.#rutaFull

    if (!lista.has(numId)) return null
    return path.join(carpeta, `${numId}.jpg`)
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
