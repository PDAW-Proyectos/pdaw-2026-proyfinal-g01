import { readFile, writeFile } from "node:fs/promises"
import { NotFoundError } from "../errors"

const limiteMazos = 10

export class RepositorioMazos {
  /** @type {string} */
  #ruta
  /** @type {Map<username, Array<Number>>} */
  #mazos

  constructor(ruta) {
    this.#ruta = ruta
    this.#mazos = new Map()
  }

  // Getters
  get ruta() { return this.#ruta }

  get mazos() { return new Map(structuredClone([...this.#mazos])) }

  // Methods
  cantidadTotal() {
    return this.#mazos.size
  }

  usuarioCompleto(username) {
    return this.#mazos.get(username).size >= limiteMazos
  }

  buscarUsuario(username) {
    const mazos = this.#mazos.get(username)
    let copia = null
    if (mazos) {
      copia = [...mazos]
    }
    return copia
  }

  async guardar() {
    await writeFile(
      this.#ruta,
      JSON.stringify(Object.fromEntries(this.#mazos)),
      "utf8"
    )
  }

  async cargar() {
    try {
      const contenido = await readFile(this.#ruta, "utf8")
      this.#mazos = new Map(Object.entries(JSON.parse(contenido)))

    } catch (error) {
      if (error.code === "ENOENT") {
        this.mazos = new Map()
        await this.guardar()
      } else {
        throw error
      }
    }
  }

  async agregar(username, idMazo) {
    // Revisar despues para ver si el error deberia largarse en esta clase
    if (this.usuarioCompleto(username)) {
      throw new Error("El Usuario ya tiene completa la lista de Mazos.")
    }

    this.#mazos.get(username).push(idMazo)
    await this.guardar()
    // No se bien que deberia devolver la funcion
    return idMazo
  }

  async eliminar(username, idMazo) {
    const mazosUsuario = this.#mazos.get(username)
    const mazo = mazosUsuario.find((id) => id === idMazo)
    if (!mazo) {
      throw new NotFoundError("Mazo", idMazo)
    }

    mazosUsuario.splice(mazosUsuario.indexOf(mazo), 1)
    await this.guardar()
    return true
  }
}
