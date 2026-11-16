import { readFile, rm, mkdir, access, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import bcrypt from "bcryptjs"
import { RepositorioUsuarios } from "../../src/repositories/RepositorioUsuarios.js"
import { RepositorioMazos } from "../../src/repositories/RepositorioMazos.js"
import { ServicioUsuarios } from "../../src/services/ServicioUsuarios.js"
import { AuthenticationError, ConflictError } from "../../src/utils/errors.js"
import { Usuario } from "../../src/models/Usuario.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDbUsuarios = path.join(carpetaDataTest, "usuariosServicioTest.json")
const rutaDbMazos = path.join(carpetaDataTest, "mazosServicioUsuarioTest.json")

const sembrarDb = (ruta, datos) => writeFile(ruta, JSON.stringify(datos), "utf8")

const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

describe("ServicioUsuarios", () => {
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

  describe("constructor", () => {
    test("lanza TypeError si no se inyectan las instancias requeridas", () => {
      expect(() => new ServicioUsuarios({}, repoMazos)).toThrow(TypeError)
      expect(() => new ServicioUsuarios(repoUsuarios, {})).toThrow(TypeError)
    })
  })

  describe("registrarUsuario", () => {
    test("hashea la contraseña con bcrypt y persiste el usuario en el repositorio", async () => {
      const hashSimulado = "hash_seguro_123"
      const hashSpy = jest.spyOn(bcrypt, "hash").mockResolvedValue(hashSimulado)

      const nuevoUsuario = await servicio.registrarUsuario({
        nombre: "Yugi",
        username: "yugi_moto",
        contraseña: "password123"
      })

      expect(nuevoUsuario).toBeInstanceOf(Usuario)
      expect(nuevoUsuario.username).toBe("yugi_moto")
      expect(nuevoUsuario.rol).toBe("usuario")
      expect(hashSpy).toHaveBeenCalledWith("password123", 10)

      expect(await existe(rutaDbUsuarios)).toBe(true)
      const enDisco = JSON.parse(await readFile(rutaDbUsuarios, "utf8"))
      expect(enDisco.yugi_moto.contraseña).toBe(hashSimulado)
    })
  })

  describe("autenticarUsuario", () => {
    test("devuelve el usuario si las credenciales son válidas", async () => {
      const hashReal = await bcrypt.hash("secreto", 10)
      await sembrarDb(rutaDbUsuarios, {
        kaiba: { nombre: "Seto", username: "kaiba", contraseña: hashReal, rol: "usuario" }
      })
      await repoUsuarios.cargar()

      const usuario = await servicio.autenticarUsuario("kaiba", "secreto")
      expect(usuario).toBeInstanceOf(Usuario)
      expect(usuario.username).toBe("kaiba")
    })

    test("lanza AuthenticationError si el usuario no existe", async () => {
      await expect(servicio.autenticarUsuario("fantasma", "1234")).rejects.toThrow(AuthenticationError)
    })

    test("lanza AuthenticationError si la contraseña es incorrecta", async () => {
      const hashReal = await bcrypt.hash("secreto", 10)
      await sembrarDb(rutaDbUsuarios, {
        kaiba: { nombre: "Seto", username: "kaiba", contraseña: hashReal, rol: "usuario" }
      })
      await repoUsuarios.cargar()

      await expect(servicio.autenticarUsuario("kaiba", "clave_invalida")).rejects.toThrow(AuthenticationError)
    })
  })

  describe("eliminarUsuario (coordinación con RepositorioMazos)", () => {
    test("elimina el usuario y borra en cascada todos sus mazos asociados", async () => {
      await sembrarDb(rutaDbUsuarios, {
        joey: { nombre: "Joey", username: "joey", contraseña: "hash", rol: "usuario" },
        admin: { nombre: "Admin", username: "admin", contraseña: "hash", rol: "admin" }
      })
      await sembrarDb(rutaDbMazos, {
        1: { id: 1, username: "joey", nombre: "Mazo 1", mainDeck: [], extraDeck: [] },
        2: { id: 2, username: "joey", nombre: "Mazo 2", mainDeck: [], extraDeck: [] },
        3: { id: 3, username: "admin", nombre: "Mazo Admin", mainDeck: [], extraDeck: [] }
      })

      await repoUsuarios.cargar()
      await repoMazos.cargar()

      const resultado = await servicio.eliminarUsuario("joey", "admin")
      expect(resultado).toBe(true)

      const usuariosEnDisco = JSON.parse(await readFile(rutaDbUsuarios, "utf8"))
      expect(usuariosEnDisco.joey).toBeUndefined()
      expect(usuariosEnDisco.admin).toBeDefined()

      const mazosEnDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(mazosEnDisco["1"]).toBeUndefined()
      expect(mazosEnDisco["2"]).toBeUndefined()
      expect(mazosEnDisco["3"].username).toBe("admin")
    })

    test("lanza ConflictError si el administrador intenta eliminarse a sí mismo", async () => {
      await sembrarDb(rutaDbUsuarios, {
        admin: { nombre: "Admin", username: "admin", contraseña: "hash", rol: "admin" }
      })
      await repoUsuarios.cargar()

      await expect(servicio.eliminarUsuario("admin", "admin")).rejects.toThrow(ConflictError)
    })
  })
  describe("obtenerUsuarios", () => {
    test("devuelve datos vacíos y paginación en cero si no hay usuarios registrados", async () => {
      const resultado = await servicio.obtenerUsuarios()

      expect(resultado).toEqual({
        datos: [],
        paginacion: {
          paginaActual: 1,
          totalPaginas: 0,
          totalEntradas: 0,
          tieneAnterior: false,
          tieneSiguiente: false
        }
      })
    })

    test("devuelve los usuarios registrados como DTOs con metadatos de paginación correspondientes", async () => {
      await sembrarDb(rutaDbUsuarios, {
        yugi: { nombre: "Yugi", username: "yugi", contraseña: "hash1", rol: "usuario" },
        admin: { nombre: "Admin", username: "admin", contraseña: "hash2", rol: "admin" }
      })
      await repoUsuarios.cargar()

      const resultado = await servicio.obtenerUsuarios()

      expect(resultado.datos).toHaveLength(2)
      expect(resultado.datos[0]).not.toBeInstanceOf(Usuario)
      expect(resultado.datos[0].contraseña).toBeUndefined()
      expect(resultado.datos.map((u) => u.username)).toEqual(["yugi", "admin"])
      expect(resultado.paginacion).toEqual({
        paginaActual: 1,
        totalPaginas: 1,
        totalEntradas: 2,
        tieneAnterior: false,
        tieneSiguiente: false
      })
    })

    test("filtra usuarios por username sin distinguir mayúsculas o minúsculas", async () => {
      await sembrarDb(rutaDbUsuarios, {
        yugi: { nombre: "Yugi Muto", username: "yugi_moto", contraseña: "hash1", rol: "usuario" },
        kaiba: { nombre: "Seto Kaiba", username: "seto_kaiba", contraseña: "hash2", rol: "usuario" }
      })
      await repoUsuarios.cargar()

      const resultado = await servicio.obtenerUsuarios({ username: "KAIBA" })

      expect(resultado.datos).toHaveLength(1)
      expect(resultado.datos[0].username).toBe("seto_kaiba")
      expect(resultado.paginacion.totalEntradas).toBe(1)
    })

    test("pagina correctamente según los parámetros pagina y limite", async () => {
      await sembrarDb(rutaDbUsuarios, {
        u1: { nombre: "U1", username: "user1", contraseña: "h", rol: "usuario" },
        u2: { nombre: "U2", username: "user2", contraseña: "h", rol: "usuario" },
        u3: { nombre: "U3", username: "user3", contraseña: "h", rol: "usuario" }
      })
      await repoUsuarios.cargar()

      const pagina1 = await servicio.obtenerUsuarios({ pagina: 1, limite: 2 })
      expect(pagina1.datos.map((u) => u.username)).toEqual(["user1", "user2"])
      expect(pagina1.paginacion).toEqual({
        paginaActual: 1,
        totalPaginas: 2,
        totalEntradas: 3,
        tieneAnterior: false,
        tieneSiguiente: true
      })

      const pagina2 = await servicio.obtenerUsuarios({ pagina: 2, limite: 2 })
      expect(pagina2.datos.map((u) => u.username)).toEqual(["user3"])
      expect(pagina2.paginacion).toEqual({
        paginaActual: 2,
        totalPaginas: 2,
        totalEntradas: 3,
        tieneAnterior: true,
        tieneSiguiente: false
      })
    })
  })
})
