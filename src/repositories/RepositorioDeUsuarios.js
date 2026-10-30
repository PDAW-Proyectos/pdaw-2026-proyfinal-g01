import { readFile, writeFile } from "node:fs/promises"
import { Usuario } from '../models/Usuario.js'

export class RepositorioDeUsuarios {
  #ruta
  /**
   * @param {string} ruta Ruta al archivo JSON de usuarios
   */
  constructor(ruta) {
    this.#ruta = ruta
  }

  //Metodos
  async cargar() {
    let usuarios;
    try {
      usuarios = await readFile(this.#ruta, "utf-8");
    } catch (e) {
      if (e.code === "ENOENT") return []; // aún no existe el archivo: no hay datos
      throw e;
    }
    return JSON.parse(usuarios).map((d) => Usuario.fromJSON(d))
  }

  async guardar(usuarios) {
      await writeFile(this.#ruta, JSON.stringify(usuarios),"utf-8");
  }

  async crear(usuario){
      const usuarios = await this.cargar();
      usuarios.push(usuario);
      await this.guardar(usuarios)
      return usuario
  }

  async buscarPorNombre(username) {
    const buscado = String(username ?? "").trim().toLowerCase();
    return (await this.cargar()).find((u) => String(u.username ?? "").trim().toLowerCase() === buscado);
  }
}