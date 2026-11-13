import { readFile, writeFile } from "node:fs/promises"
import { Mazo } from "../models/Mazo.js"

/** Repositorio encargado de persistir y cachear en memoria los mazos populares
 * descargados semanalmente desde las APIs externas. */
export class RepositorioMazosPopulares {
  /** @type {string} */
  #ruta
  /** @type {Map<number, Mazo>} */
  #mazos

  /**
   * @param {string} ruta
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#mazos = new Map()
  }

  /** @returns {string} */
  get ruta() { return this.#ruta }

  /** @returns {Map<number, Mazo>} */
  get mazos() { return this.#mazos }

  /** @returns {number} */
  cantidadTotal() {
    return this.#mazos.size
  }

  /** Busca un mazo popular por su ID.
   * @param {number} id
   * @returns {Mazo | null}
   */
  buscar(id) {
    return this.#mazos.get(id) ?? null
  }

  /** Reemplaza todos los mazos populares en memoria y los persiste en disco.
   * @param {Array<Object>} arrayMazos
   */
  async guardar(arrayMazos = []) {
    this.#mazos = new Map()

    for (const dataMazo of arrayMazos) {
      const mazo = Mazo.fromJSON(dataMazo)
      this.#mazos.set(mazo.id, mazo)
    }

    await writeFile(
      this.#ruta,
      JSON.stringify(Object.fromEntries(this.#mazos)),
      "utf8"
    )
  }

  /** Carga los mazos populares desde disco hacia memoria. */
  async cargar() {
    try {
      const contenido = await readFile(this.#ruta, "utf8")
      const data = JSON.parse(contenido)

      this.#mazos = new Map()
      for (const dataMazo of Object.values(data)) {
        const mazo = Mazo.fromJSON(dataMazo)
        this.#mazos.set(mazo.id, mazo)
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        this.#mazos = new Map()
        await this.guardar()
      } else {
        throw error
      }
    }
  }
}
