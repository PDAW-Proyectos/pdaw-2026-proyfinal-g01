import { readFile, writeFile } from "node:fs/promises"
import { Usuario } from '../models/Usuario.js'

export class UsuariosRepositorio {
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

  #crearUsuario(datos) {
      let user = new Usuario(datos.nombre, datos.username, datos.contraseña)
      user.mazos = datos.mazos ?? user.mazos
      return user;
  }

  async agregar(datos){
      if (this.buscarPorNombre(datos.username)) {
        throw new Error("El username ya está registrado");
      }
      const usuario = this.#crearUsuario(datos)
      this.#usuarios.push(usuario)
      await this.guardar()
      return usuario
  }

  async eliminar(username) {
    const usuario = this.buscarPorNombre(username);
    if (!usuario) return false;

    this.#usuarios.splice(this.#usuarios.indexOf(usuario), 1);
    await this.guardar();
    return true;
  }

  async buscarPorNombre(username) {
    const buscado = String(username ?? "").trim().toLowerCase()
    return (await this.cargar()).find((u) => String(u.username ?? "").trim().toLowerCase() === buscado)
  }
}