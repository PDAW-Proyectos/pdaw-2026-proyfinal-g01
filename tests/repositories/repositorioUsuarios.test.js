import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioUsuarios } from "../../src/repositories/RepositorioUsuarios.js"
import { Usuario } from "../../src/models/Usuario.js"
import { NotFoundError, ConflictError } from "../../src/utils/errors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
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
  await rm(rutaDb, { force: true })
})

describe("RepositorioUsuarios", () => {
  describe("cargar y guardar", () => {
    test("carga usuarios existentes desde el archivo .json", async () => {
      const u1 = crearDatosUsuario("yugi")
      const u2 = crearDatosUsuario("kaiba", { rol: "admin" })
      await sembrarDb({ yugi: u1, kaiba: u2 })

      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(2)
      expect(repo.buscar("yugi")).toBeInstanceOf(Usuario)
      expect(repo.buscar("kaiba").rol).toBe("admin")
    })

    test("crea un archivo vacío si no existe", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(await existe(rutaDb)).toBe(true)
      expect(await leerDb()).toEqual({})
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("propaga SyntaxError si el archivo contiene JSON inválido", async () => {
      await writeFile(rutaDb, "invalido", "utf8")
      const repo = new RepositorioUsuarios(rutaDb)

      await expect(repo.cargar()).rejects.toThrow(SyntaxError)
    })

    test("guarda el contenido indexado por username en disco", async () => {
      const u1 = crearDatosUsuario("yugi")
      await sembrarDb({ yugi: u1 })

      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()
      await rm(rutaDb)

      await repo.guardar()
      expect(await leerDb()).toEqual({ yugi: u1 })
    })
  })

  describe("buscar", () => {
    test("devuelve el usuario buscado o null si no existe o el argumento es inválido", async () => {
      await sembrarDb({ yugi: crearDatosUsuario("yugi") })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      expect(repo.buscar("yugi")).toBeInstanceOf(Usuario)
      expect(repo.buscar("inexistente")).toBeNull()
      expect(repo.buscar(123)).toBeNull()
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

      const enDisco = await leerDb()
      expect(enDisco.joey).toEqual(input)
    })

    test("lanza ConflictError si el username ya está registrado", async () => {
      await sembrarDb({ yugi: crearDatosUsuario("yugi") })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      await expect(repo.agregar(crearDatosUsuario("yugi"))).rejects.toThrow(ConflictError)
    })
  })

  describe("actualizar", () => {
    test("actualiza los datos del usuario y persiste los cambios", async () => {
      const original = crearDatosUsuario("yugi", { nombre: "Yugi Inicial" })
      await sembrarDb({ yugi: original })

      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      const resultado = await repo.actualizar({ username: "yugi", nombre: "Yugi Actualizado" })
      expect(resultado.nombre).toBe("Yugi Actualizado")

      const enDisco = await leerDb()
      expect(enDisco.yugi.nombre).toBe("Yugi Actualizado")
    })

    test("lanza NotFoundError si el usuario a actualizar no existe", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      await expect(repo.actualizar({ username: "fantasma", nombre: "X" })).rejects.toThrow(NotFoundError)
    })
  })

  describe("eliminar", () => {
    test("elimina el usuario del repositorio y del disco", async () => {
      await sembrarDb({
        yugi: crearDatosUsuario("yugi"),
        kaiba: crearDatosUsuario("kaiba")
      })
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      const resultado = await repo.eliminar("yugi")
      expect(resultado).toBe(true)
      expect(repo.buscar("yugi")).toBeNull()

      const enDisco = await leerDb()
      expect(enDisco.yugi).toBeUndefined()
      expect(enDisco.kaiba).toBeDefined()
    })

    test("lanza NotFoundError si el usuario a eliminar no existe", async () => {
      const repo = new RepositorioUsuarios(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar("fantasma")).rejects.toThrow(NotFoundError)
    })
  })
})
