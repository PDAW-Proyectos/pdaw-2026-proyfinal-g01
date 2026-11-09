import { readFile, writeFile } from "node:fs/promises"
import { CartaFactory } from "../models/carta/CartaFactory.js"

export class RepositorioCartas {
  /** @type {} */
  #ruta
  /** @type {Map <id, Carta>} */
  #cartas

  /** Requiere una ruta a la base de data y crea el map de cartas vacio.
   * @param {string} ruta
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#cartas = new Map()
  }

  // Getters
  get ruta() { return this.#ruta }

  /**
   * @returns {Map <Number, Carta>}
   */
  get cartas() { return this.#cartas }

  // Methods
  /** Calcula el total de cartas en el repositorio
   * @returns {Number}
   */
  cantidadTotal() {
    return this.#cartas.size
  }

  /**
   * @param {Number} id
   * @returns {Carta | null}
   */
  buscar(id) {
    return this.#cartas.get(id) ?? null
  }

  /**  */
  async guardar(arrayCarta = []) {
    for (const dataCarta of arrayCarta) {
      const carta = CartaFactory.fromJSON(dataCarta)
      this.#cartas.set(carta.id, carta)
    }

    await writeFile(
      this.#ruta,
      JSON.stringify(Object.fromEntries(this.#cartas)),
      "utf8"
    )
  }

  /**  */
  async cargar() {
    try {
      const contenido = await readFile(this.#ruta, "utf8")
      const data = JSON.parse(contenido)
      for (const dataCarta of  Object.values(data)) {
        this.#cartas.set(dataCarta.id, CartaFactory.fromJSON(dataCarta))
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        this.#cartas = new Map()
        await this.guardar()
      } else {
        throw error
      }
    }
  }
}
