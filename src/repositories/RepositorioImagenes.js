import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises"
import path from "node:path"

export class RepositorioImagenes {
  /** @type {string} */
  #rutaBase
  /** @type {string} */
  #rutaFull
  /** @type {string} */
  #rutaSmall
  /** @type {Set<Number>} */
  #imagenesFull
  /** @type {Set<Number>} */
  #imagenesSmall

  /**
   * @param {string} rutaBase Directorio base donde se guardaran las carpetas full y small
   */
  constructor(rutaBase) {
    this.#rutaBase = rutaBase
    this.#rutaFull = path.join(rutaBase, "full")
    this.#rutaSmall = path.join(rutaBase, "small")
    this.#imagenesFull = new Set()
    this.#imagenesSmall = new Set()
  }

  // Getters
  /** Copia del Set de IDs de imagenes completas descargadas
   * @returns {Set<Number>}
   */
  get imagenesFull() {
    return new Set(this.#imagenesFull)
  }

  /** Copia del Set de IDs de imagenes pequenas descargadas
   * @returns {Set<Number>}
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

  /** Inicializa las carpetas y carga las listas de imagenes full y small existentes en disco */
  async cargar() {
    this.#imagenesFull = await this.#escanearCarpeta(this.#rutaFull)
    this.#imagenesSmall = await this.#escanearCarpeta(this.#rutaSmall)
  }

  /** Verifica rapidamente en memoria si la imagen ya esta descargada
   * @param {Number} id
   * @param {"full" | "small"} tipo
   * @returns {boolean}
   */
  tiene(id, tipo = "full") {
    const lista = tipo === "small" ? this.#imagenesSmall : this.#imagenesFull
    return lista.has(Number(id))
  }

  /** Busca y devuelve el Buffer de la imagen si existe en disco.
   * Si estaba en la lista pero el archivo fue borrado o esta vacio, corrige la lista y retorna null.
   * @param {Number} id
   * @param {"full" | "small"} tipo
   * @returns {Promise<Buffer | null>}
   */
  async buscar(id, tipo = "full") {
    const numId = Number(id)
    const lista = tipo === "small" ? this.#imagenesSmall : this.#imagenesFull
    const carpeta = tipo === "small" ? this.#rutaSmall : this.#rutaFull

    if (!lista.has(numId)) return null

    const rutaArchivo = path.join(carpeta, `${numId}.jpg`)
    try {
      const buffer = await readFile(rutaArchivo)
      if (buffer.length === 0) {
        lista.delete(numId)
        await unlink(rutaArchivo).catch(() => {})
        return null
      }
      return buffer
    } catch (error) {
      if (error.code === "ENOENT") {
        // Auto-correccion: estaba en el Set pero no en el disco
        lista.delete(numId)
        return null
      }
      throw error
    }
  }

  /** Guarda una imagen de forma atomica en disco y registra su ID en la lista correspondiente
   * @param {Number} id
   * @param {Buffer} buffer
   * @param {"full" | "small"} tipo
   */
  async guardar(id, buffer, tipo = "full") {
    if (!buffer || buffer.length === 0) {
      throw new Error(`El buffer de la imagen ${id} (${tipo}) esta vacio.`)
    }

    const numId = Number(id)
    const lista = tipo === "small" ? this.#imagenesSmall : this.#imagenesFull
    const carpeta = tipo === "small" ? this.#rutaSmall : this.#rutaFull

    const rutaTemporal = path.join(carpeta, `${numId}.jpg.tmp`)
    const rutaFinal = path.join(carpeta, `${numId}.jpg`)

    // Escritura atomica: primero temporal, luego renombrar
    await writeFile(rutaTemporal, buffer)
    await rename(rutaTemporal, rutaFinal)

    // Recien cuando el archivo completo existe en disco, se agrega a la lista
    lista.add(numId)
  }
}
