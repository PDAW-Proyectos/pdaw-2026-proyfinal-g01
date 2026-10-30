import { readFile, writeFile } from "node:fs/promises"
import { Usuario } from '../models/Usuario.js'

export class RepositorioUsuarios {
  #ruta
  #usuarios
  /**
   * @param {string} ruta Ruta al archivo JSON de usuarios
   */
  constructor(ruta) {
    this.#ruta = ruta
    this.#usuarios = []
  }

  //Getters
  get usuarios() { return [...this.#usuarios] }

  //Metodos
  async cargar() {
    try {
      let usuarios = await readFile(this.#ruta, "utf-8")
      const datosCrudos = JSON.parse(usuarios)

      this.#usuarios = datosCrudos.map((d) => Usuario.fromJSON(d))
    } catch (e) {
      if (e.code === "ENOENT") { // aún no existe el archivo: no hay datos
        this.#usuarios = []
        await this.guardar()
      }else{
        throw e
      } 
    }
  }

  async guardar() {
      await writeFile(this.#ruta, JSON.stringify(this.#usuarios),"utf-8")
  }

  async agregar(datos){
      if (this.buscar(datos.username)) {
        throw new Error("El username ya está registrado")
      }
      const usuario = Usuario.fromJSON(datos)
      this.#usuarios.push(usuario)
      await this.guardar()
      return usuario
  }

  async eliminar(username) {
    const usuario = this.buscar(username)
    if (!usuario) return false

    this.#usuarios.splice(this.#usuarios.indexOf(usuario), 1)
    await this.guardar()
    return true
  }

  async buscar(username) {
    await this.cargar()
    const buscado = String(username ?? "").trim().toLowerCase()
    return this.#usuarios.find((u) => String(u.username ?? "").trim().toLowerCase() === buscado) ?? null
  }
}