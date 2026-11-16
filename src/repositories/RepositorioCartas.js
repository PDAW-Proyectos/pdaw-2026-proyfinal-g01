import { readFile, writeFile } from "node:fs/promises"
import { CartaFactory } from "../models/carta/CartaFactory.js"

export class RepositorioCartas {
  /** @type {string} */
  #ruta
  /** @type {Map <number, import("../models/carta/Carta.js").Carta>} */
  #cartas
  /** @type {Map <string, import("../models/carta/Carta.js").Carta>} */
  #cartasPorNombre

  /** Requiere una ruta a la base de data y crea el map de cartas vacio.
   * @param {string} ruta
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#cartas = new Map()
    this.#cartasPorNombre = new Map()
  }

  // Getters
  get ruta() { return this.#ruta }

  /**
   * @returns {Map <Number, import("../models/carta/Carta.js").Carta>}
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
   * @returns {import("../models/carta/Carta.js").Carta | null}
   */
  buscar(id) {
    return this.#cartas.get(id) ?? null
  }

  /** Busca una carta por su nombre exacto (insensible a mayusculas/minusculas).
   * @param {string} nombre
   * @returns {import("../models/carta/Carta.js").Carta | null}
   */
  buscarPorNombre(nombre) {
    if (typeof nombre !== "string") {
      return null
    }
    return this.#cartasPorNombre.get(nombre.toLowerCase()) ?? null
  }

  /**  */
  async guardar(arrayCarta = []) {
    for (const dataCarta of arrayCarta) {
      const carta = CartaFactory.fromJSON(dataCarta)
      this.#cartas.set(carta.id, carta)
      this.#cartasPorNombre.set(carta.name.toLowerCase(), carta)
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
      for (const dataCarta of Object.values(data)) {
        const carta = CartaFactory.fromJSON(dataCarta)
        this.#cartas.set(carta.id, carta)
        this.#cartasPorNombre.set(carta.name.toLowerCase(), carta)
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        this.#cartas = new Map()
        this.#cartasPorNombre = new Map()
        await this.guardar()
      } else {
        throw error
      }
    }
  }
}
