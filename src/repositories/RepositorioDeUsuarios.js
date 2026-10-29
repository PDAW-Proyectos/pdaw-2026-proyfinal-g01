import fs from 'fs/promises'
import path from 'path'
import { Usuario } from '../models/Usuario.js'

export class RepositorioDeUsuarios {
  #ruta

  /**
   * @param {string} [ruta] Ruta al archivo JSON de usuarios
   */
  constructor(ruta = path.resolve('src/data/usuarios.json')) { //despues se cambia la ruta a la base de datos
    this.#ruta = ruta
  }

  // Métodos auxiliares privados
  async #leerBaseDeDatos() {
    try {
      const data = await fs.readFile(this.#ruta, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.writeFile(this.#ruta, JSON.stringify([], null, 2))
        return []
      }
      throw error
    }
  }

  async #guardarBaseDeDatos(data) {
    await fs.writeFile(this.#ruta, JSON.stringify(data, null, 2), 'utf-8')
  }

  // Métodos públicos
  async buscarPorNombre(username) {
    const usuarios = await this.#leerBaseDeDatos()
    const data = usuarios.find(u => u.username === username)
    if (!data) return null
    return Usuario.fromJSON(data)
  }

  async guardar(instanciaDeUsuario) {
    const usuarios = await this.#leerBaseDeDatos()
    const datosParaGuardar = instanciaDeUsuario.toJSON()

    const index = usuarios.findIndex(u => u.username === datosParaGuardar.username)
    if (index >= 0) {
      usuarios[index] = datosParaGuardar
    } else {
      usuarios.push(datosParaGuardar)
    }

    await this.#guardarBaseDeDatos(usuarios)
    return instanciaDeUsuario
  }
}