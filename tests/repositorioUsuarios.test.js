import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioUsuarios } from "../src/repositories/RepositorioUsuarios.js"
import { Usuario } from "../src/models/Usuario.js"
import { NotFoundError, ConflictError } from "../src/utils/errors.js"


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "dataTest")
const rutaDb = path.join(carpetaDataTest, "usuariosTest.json")

const sembrarDb = (datos) => writeFile(rutaDb, JSON.stringify(datos), "utf8")

const leerDb = async () => JSON.parse(await readFile(rutaDb, "utf8"))

const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

const crearDatosUsuario = (username = "yugi", extras = {}) => ({
  nombre: "Yugi Muto",
  username,
  contraseña: "hashed_password",
  rol: "usuario",
  ...extras,
})

beforeAll(async () => {
  await mkdir(carpetaDataTest, { recursive: true })
})

beforeEach(async () => {
  await rm(rutaDb, { force: true })
})

afterAll(async () => {
  // Limpia el disco al terminar
  await rm(rutaDb, { force: true })
})

describe("RepositorioUsuarios", () => {
  describe("constructor y getters", () => {
    test("arranca sin usuarios y asigna la ruta", () => {
      const repo = new RepositorioUsuarios(rutaDb)
      
      expect(repo.ruta).toBe(rutaDb)
      expect(repo.usuarios).toBeInstanceOf(Map)
      expect(repo.usuarios.size).toBe(0)
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("el getter 'usuarios' devuelve el mapa con los usuarios cargados", async () => {
      const u1 = crearDatosUsuario("yugi")
      await sembrarDb({ yugi: u1 })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      const mapa = repo.usuarios

      expect(mapa).toBeInstanceOf(Map)
      expect(mapa.size).toBe(1)
      expect(mapa.get("yugi").toJSON()).toEqual(u1)
    })
  })

  describe("guardar", () => {
    test("escribe en el .json el contenido del repositorio indexado por username", async () => {
      const u1 = crearDatosUsuario("yugi")
      const u2 = crearDatosUsuario("kaiba")
      await sembrarDb({ yugi: u1, kaiba: u2 })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      await rm(rutaDb) 
      await repo.guardar() 

      expect(await leerDb()).toEqual({ yugi: u1, kaiba: u2 })
    })
  })

  describe("cargar", () => {
    test("carga los usuarios desde un .json existente", async () => {
      const u1 = crearDatosUsuario("yugi")
      const u2 = crearDatosUsuario("kaiba", { rol: "admin" })
      await sembrarDb({ yugi: u1, kaiba: u2 })
      
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(2)
      expect(repo.buscar("yugi")).toBeInstanceOf(Usuario)
      expect(repo.buscar("kaiba").rol).toBe("admin")
    })

    test("si el archivo no existe (ENOENT), crea un archivo vacío", async () => {
      const repo = new RepositorioUsuarios(rutaDb)

      await repo.cargar()

      expect(await existe(rutaDb)).toBe(true)
      expect(await leerDb()).toEqual({})
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("si el archivo tiene JSON inválido, propaga el error (SyntaxError)", async () => {
      await writeFile(rutaDb, "esto no es json", "utf8")
      const repo = new RepositorioUsuarios(rutaDb)

      await expect(repo.cargar()).rejects.toThrow(SyntaxError)
    })

    test("si ocurre un error distinto de ENOENT, lo propaga", async () => {
      const repo = new RepositorioUsuarios(carpetaDataTest) 

      await expect(repo.cargar()).rejects.toMatchObject({ code: "EISDIR" })
    })
  })

  describe("cantidadTotal", () => {
    test("devuelve 0 si el repositorio está vacío", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(0)
    })

    test("devuelve la cantidad exacta de usuarios en el sistema", async () => {
      await sembrarDb({
        yugi: crearDatosUsuario("yugi"),
        kaiba: crearDatosUsuario("kaiba"),
        joey: crearDatosUsuario("joey"),
      })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(3)
    })
  })

  describe("buscar", () => {
    test("devuelve el usuario correspondiente al username buscado", async () => {
      const u1 = crearDatosUsuario("yugi")
      await sembrarDb({ yugi: u1 })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      const encontrado = repo.buscar("yugi")

      expect(encontrado).toBeInstanceOf(Usuario)
      expect(encontrado.toJSON()).toEqual(u1)
    })

    test("devuelve null si no encuentra el username", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(repo.buscar("fantasma")).toBeNull()
    })

    test("devuelve null si el argumento no es un string", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(repo.buscar(123)).toBeNull()
      expect(repo.buscar(null)).toBeNull()
      expect(repo.buscar({})).toBeNull()
    })
  })

  describe("agregar", () => {
    test("agrega un nuevo usuario, lo persiste en disco y devuelve la instancia", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      const input = crearDatosUsuario("joey")
      const resultado = await repo.agregar(input)

      expect(resultado).toBeInstanceOf(Usuario)
      expect(resultado.username).toBe("joey")
      
      expect(repo.buscar("joey")).toBeDefined()
      expect(repo.cantidadTotal()).toBe(1)
      
      expect(await leerDb()).toEqual({ joey: input })
    })

    test("lanza ConflictError si se intenta agregar un username que ya existe", async () => {
      const u1 = crearDatosUsuario("yugi")
      await sembrarDb({ yugi: u1 })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      await expect(repo.agregar(crearDatosUsuario("yugi"))).rejects.toThrow(ConflictError)
      
      expect(repo.cantidadTotal()).toBe(1)
    })
  })

  describe("actualizar", () => {
    test("actualiza los campos dados, conserva el resto, lo persiste y devuelve el Usuario", async () => {
      const original = crearDatosUsuario("yugi", { nombre: "Yugi Antiguo", rol: "usuario" })
      await sembrarDb({ yugi: original })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      const cambios = { username: "yugi", nombre: "Yugi Rey de los Duelos", rol: "admin" }
      const esperado = { ...original, ...cambios }

      const resultado = await repo.actualizar(cambios)

      expect(resultado).toBeInstanceOf(Usuario)
      expect(resultado.toJSON()).toEqual(esperado)
      
      expect(repo.buscar("yugi").toJSON()).toEqual(esperado)
      expect(await leerDb()).toEqual({ yugi: esperado })
    })

    test("lanza NotFoundError si se intenta actualizar un usuario inexistente y no toca el archivo", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      await expect(repo.actualizar({ username: "fantasma", nombre: "Nuevo" })).rejects.toThrow(NotFoundError)
    })
  })

  describe("eliminar", () => {
    test("elimina el usuario por username, actualiza el disco y devuelve true", async () => {
      const u1 = crearDatosUsuario("yugi")
      const u2 = crearDatosUsuario("kaiba")
      await sembrarDb({ yugi: u1, kaiba: u2 })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      const resultado = await repo.eliminar("yugi")

      expect(resultado).toBe(true)
      expect(repo.buscar("yugi")).toBeNull()
      expect(repo.cantidadTotal()).toBe(1)
      expect(await leerDb()).toEqual({ kaiba: u2 })
    })

    test("lanza NotFoundError si se intenta eliminar un username que no existe", async () => {
      const u1 = crearDatosUsuario("yugi")
      await sembrarDb({ yugi: u1 })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar("fantasma")).rejects.toThrow(NotFoundError)
      
      expect(repo.cantidadTotal()).toBe(1)
      expect(await leerDb()).toEqual({ yugi: u1 })
    })
  })
})
