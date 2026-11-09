import { readFile, rm, mkdir, access, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import bcrypt from "bcryptjs"
import { RepositorioUsuarios } from "../src/repositories/RepositorioUsuarios.js"
import { RepositorioMazos } from "../src/repositories/RepositorioMazos.js"
import { ServicioUsuarios } from "../src/services/ServicioUsuarios.js"
import { AuthenticationError, ConflictError } from "../src/utils/errors.js"
import { Usuario } from "../src/models/Usuario.js"


// Configuracion de la base de datos temporal
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "dataTest")
const rutaDbUsuarios = path.join(carpetaDataTest, "usuariosTempTest.json")
const rutaDbMazos = path.join(carpetaDataTest, "mazosTempTest.json")

//indica si un archivo del disco existe. 
const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

const sembrarDb = (ruta, datos) => writeFile(ruta, JSON.stringify(datos), "utf8")

describe("ServicioUsuarios + Repositorios (Test Temporal de Integración)", () => {
  let repoUsuarios
  let repoMazos
  let servicio

  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  beforeEach(async () => {
    await rm(rutaDbUsuarios, { force: true })
    await rm(rutaDbMazos, { force: true })

    await sembrarDb(rutaDbUsuarios, {})
    await sembrarDb(rutaDbMazos, {})

    repoUsuarios = new RepositorioUsuarios(rutaDbUsuarios)
    repoMazos = new RepositorioMazos(rutaDbMazos)
    
    await repoUsuarios.cargar()
    await repoMazos.cargar()

    servicio = new ServicioUsuarios(repoUsuarios, repoMazos)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await rm(rutaDbUsuarios, { force: true })
    await rm(rutaDbMazos, { force: true })
  })

  describe("registrarUsuario", () => {
    test("hashea la contraseña, guarda en el archivo temporal y devuelve el usuario", async () => {
      const hashSimulado = "hash_falso_123"
      const hashSpy = jest.spyOn(bcrypt, "hash").mockResolvedValue(hashSimulado)

      const datosRegistro = { nombre: "Yugi", username: "yugi_moto", contraseña: "password123" }
      const resultado = await servicio.registrarUsuario(datosRegistro)


      expect(resultado).toBeInstanceOf(Usuario)
      expect(resultado.username).toBe("yugi_moto")
      expect(resultado.rol).toBe("usuario")

      expect(hashSpy).toHaveBeenCalledWith("password123", 10)

      expect(await existe(rutaDbUsuarios)).toBe(true)
      const contenidoDisco = JSON.parse(await readFile(rutaDbUsuarios, "utf8"))
      expect(contenidoDisco["yugi_moto"]).toBeDefined()
      expect(contenidoDisco["yugi_moto"].contraseña).toBe(hashSimulado)
    })
  })

  describe("autenticarUsuario", () => {
    test("devuelve el usuario si las credenciales son correctas (usando bcrypt real)", async () => {
      // Para este test usaremos bcrypt real. Creamos un hash real para guardarlo en la DB temporal.
      const hashReal = await bcrypt.hash("mi_secreto", 10)
      await sembrarDb(rutaDbUsuarios, {
        "kaiba": { nombre: "Seto", username: "kaiba", contraseña: hashReal, rol: "usuario" }
      })
      await repoUsuarios.cargar() // Recargamos para que lea lo que acabamos de sembrar

      const resultado = await servicio.autenticarUsuario("kaiba", "mi_secreto")

      expect(resultado).toBeInstanceOf(Usuario)
      expect(resultado.username).toBe("kaiba")
    })

    test("lanza AuthenticationError si el usuario no existe", async () => {
      await expect(servicio.autenticarUsuario("fantasma", "1234")).rejects.toThrow(AuthenticationError)
    })

    test("lanza AuthenticationError si la contraseña es incorrecta", async () => {
      const hashReal = await bcrypt.hash("mi_secreto", 10)
      await sembrarDb(rutaDbUsuarios, {
        "kaiba": { nombre: "Seto", username: "kaiba", contraseña: hashReal, rol: "usuario" }
      })
      await repoUsuarios.cargar()

      await expect(servicio.autenticarUsuario("kaiba", "clave_equivocada")).rejects.toThrow(AuthenticationError)
    })
  })

  describe("eliminarUsuario", () => {
    test("elimina al usuario del archivo de usuarios y borra todos sus mazos del archivo de mazos", async () => {
      // se simbran 2 usuarios y 3 mazos (2 del usuario a eliminar, 1 de otro)
      await sembrarDb(rutaDbUsuarios, {
        "joey": { nombre: "Joey", username: "joey", contraseña: "hash", rol: "usuario" },
        "admin": { nombre: "Admin", username: "admin", contraseña: "hash", rol: "admin" }
      })
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "joey", nombre: "Mazo Suerte", mainDeck: [], extraDeck: [] },
        "2": { id: 2, username: "joey", nombre: "Mazo Guerreros", mainDeck: [], extraDeck: [] },
        "3": { id: 3, username: "admin", nombre: "Mazo Dioses", mainDeck: [], extraDeck: [] }
      })
      

      await repoUsuarios.cargar()
      await repoMazos.cargar()

      const resultado = await servicio.eliminarUsuario("joey", "admin")

      expect(resultado).toBe(true)

      const usuariosEnDisco = JSON.parse(await readFile(rutaDbUsuarios, "utf8"))
      expect(usuariosEnDisco["joey"]).toBeUndefined()
      expect(usuariosEnDisco["admin"]).toBeDefined()

      const mazosEnDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(mazosEnDisco["1"]).toBeUndefined()
      expect(mazosEnDisco["2"]).toBeUndefined()
      expect(mazosEnDisco["3"].username).toBe("admin")
    })

    test("lanza ConflictError si el administrador intenta eliminarse a sí mismo y no altera los archivos", async () => {
      await sembrarDb(rutaDbUsuarios, {
        "admin": { nombre: "Admin", username: "admin", contraseña: "hash", rol: "admin" }
      })
      await repoUsuarios.cargar()

      await expect(
        servicio.eliminarUsuario("admin", "admin")
      ).rejects.toThrow(ConflictError)

      const usuariosEnDisco = JSON.parse(await readFile(rutaDbUsuarios, "utf8"))
      expect(usuariosEnDisco["admin"]).toBeDefined()
    })
  })
})