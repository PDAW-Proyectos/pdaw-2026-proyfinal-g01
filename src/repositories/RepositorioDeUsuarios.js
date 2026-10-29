import fs from 'fs/promises'
import path from 'path'
import { Usuario } from '../models/Usuario.js'

const filePath = path.resolve('src/data/usuarios.json')

//esta funcion se va a modificar cuando usemos una base de DATOS
// Función auxiliar para leer el archivo JSON de la base de datos
async function leerBaseDeDatos() {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // Si el archivo no existe, se inicializa vacio 
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify([], null, 2))
      return []
    }
    throw error
  }
}
//esta funcion se va a modificar cuando usemos una base de DATOS
// Función auxiliar para escribir en el archivo JSON
async function guardarBaseDeDatos(data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function buscarPorNombre(username) {
  const usuarios = await leerBaseDeDatos()
  const data = usuarios.find(u => u.username === username)
  if (!data) return null
  return Usuario.fromJSON(data)
}

export async function guardar(usuarioInstance) {
  const usuarios = await leerBaseDeDatos()
  const dataToSave = usuarioInstance.toJSON()

  const index = usuarios.findIndex(u => u.username === dataToSave.username)
  if (index >= 0) {
    usuarios[index] = dataToSave
  } else {
    usuarios.push(dataToSave)
  }

  await guardarBaseDeDatos(usuarios)
  return usuarioInstance
}