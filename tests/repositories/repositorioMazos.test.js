import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioMazos, MAX_MAZOS } from "../../src/repositories/RepositorioMazos.js"
import { Mazo } from "../../src/models/Mazo.js"
import { NotFoundError, ValidationError } from "../../src/utils/errors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDb = path.join(carpetaDataTest, "mazosTest.json")

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

const crearDatosMazo = (id, extras = {}) => ({
  id,
  username: "yugi",
  nombre: `Mazo ${id}`,
  mainDeck: [{ id: 100, cantidad: 1 }, { id: 101, cantidad: 1 }],
  extraDeck: [{ id: 200, cantidad: 1 }],
  ...extras,
})

const crearInputMazo = (nombre = "Mazo Nuevo", extras = {}) => ({
  username: "yugi",
  nombre,
  mainDeck: [{ id: 100, cantidad: 1 }, { id: 101, cantidad: 1 }],
  extraDeck: [{ id: 200, cantidad: 1 }],
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

describe("RepositorioMazos", () => {
  describe("cargar y guardar", () => {
    test("carga mazos existentes e indexa por id y por username", async () => {
      const mazo1 = crearDatosMazo(1, { username: "yugi" })
      const mazo2 = crearDatosMazo(2, { username: "kaiba" })
      const mazo3 = crearDatosMazo(3, { username: "yugi" })
      await sembrarDb({ 1: mazo1, 2: mazo2, 3: mazo3 })

      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(3)
      expect(repo.buscar(1)).toBeInstanceOf(Mazo)
      expect(repo.buscarPorUsername("yugi")).toEqual([1, 3])
      expect(repo.buscarPorUsername("kaiba")).toEqual([2])
    })

    test("crea un archivo vacío si no existe previamente", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(await existe(rutaDb)).toBe(true)
      expect(await leerDb()).toEqual({})
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("propaga SyntaxError si el archivo tiene JSON inválido", async () => {
      await writeFile(rutaDb, "no-json", "utf8")
      const repo = new RepositorioMazos(rutaDb)

      await expect(repo.cargar()).rejects.toThrow(SyntaxError)
    })

    test("guarda el contenido indexado por id en disco", async () => {
      const mazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: mazo1 })

      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()
      await rm(rutaDb)

      await repo.guardar()
      expect(await leerDb()).toEqual({ 1: mazo1 })
    })
  })

  describe("buscar y buscarPorUsername", () => {
    test("devuelve el mazo por id o null si no existe", async () => {
      await sembrarDb({ 1: crearDatosMazo(1) })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.buscar(1)).toBeInstanceOf(Mazo)
      expect(repo.buscar(999)).toBeNull()
    })

    test("devuelve null si el usuario no tiene mazos o el username es inválido", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.buscarPorUsername("inexistente")).toBeNull()
      expect(repo.buscarPorUsername(null)).toBeNull()
    })
  })

  describe("agregar", () => {
    test("asigna id autoincremental, indexa por username y persiste en disco", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const input = crearInputMazo("Primer Mazo")
      const creado = await repo.agregar(input)

      expect(creado.id).toBe(1)
      expect(creado.nombre).toBe("Primer Mazo")
      expect(repo.buscar(1).nombre).toBe("Primer Mazo")
      expect(repo.buscarPorUsername("yugi")).toEqual([1])

      const enDisco = await leerDb()
      expect(enDisco["1"].nombre).toBe("Primer Mazo")
    })

    test("calcula el siguiente id considerando huecos en los ids existentes", async () => {
      await sembrarDb({ 2: crearDatosMazo(2), 7: crearDatosMazo(7) })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const nuevo = await repo.agregar(crearInputMazo("Mazo 8"))
      expect(nuevo.id).toBe(8)
    })

    test("lanza ValidationError si un usuario supera el límite de 10 mazos", async () => {
      const mazos = Object.fromEntries(
        Array.from({ length: MAX_MAZOS }, (_, i) => [i + 1, crearDatosMazo(i + 1, { username: "yugi" })])
      )
      await sembrarDb(mazos)

      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(
        repo.agregar(crearInputMazo("Mazo 11", { username: "yugi" }))
      ).rejects.toThrow(ValidationError)

      // Otro usuario sí puede agregar
      const mazoKaiba = await repo.agregar(crearInputMazo("Mazo Kaiba", { username: "kaiba" }))
      expect(mazoKaiba.username).toBe("kaiba")
    })
  })

  describe("actualizar", () => {
    test("actualiza los datos del mazo y persiste los cambios", async () => {
      const mazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: mazo1 })

      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const actualizado = await repo.actualizar({ id: 1, nombre: "Nuevo Nombre" })
      expect(actualizado.nombre).toBe("Nuevo Nombre")

      const enDisco = await leerDb()
      expect(enDisco["1"].nombre).toBe("Nuevo Nombre")
    })

    test("lanza NotFoundError si el mazo a actualizar no existe", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(repo.actualizar({ id: 99, nombre: "X" })).rejects.toThrow(NotFoundError)
    })
  })

  describe("eliminar y eliminarPorUsername", () => {
    test("elimina un mazo por id y actualiza el índice por username y el disco", async () => {
      await sembrarDb({
        1: crearDatosMazo(1, { username: "yugi" }),
        2: crearDatosMazo(2, { username: "yugi" })
      })

      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const eliminado = await repo.eliminar(1)
      expect(eliminado).toBe(true)
      expect(repo.buscar(1)).toBeNull()
      expect(repo.buscarPorUsername("yugi")).toEqual([2])

      const enDisco = await leerDb()
      expect(enDisco["1"]).toBeUndefined()
      expect(enDisco["2"]).toBeDefined()
    })

    test("lanza NotFoundError si el id a eliminar no existe", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar(99)).rejects.toThrow(NotFoundError)
    })

    test("eliminarPorUsername elimina todos los mazos del usuario", async () => {
      await sembrarDb({
        1: crearDatosMazo(1, { username: "yugi" }),
        2: crearDatosMazo(2, { username: "yugi" }),
        3: crearDatosMazo(3, { username: "kaiba" })
      })

      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const resultado = await repo.eliminarPorUsername("yugi")
      expect(resultado).toBe(true)
      expect(repo.buscar(1)).toBeNull()
      expect(repo.buscar(2)).toBeNull()
      expect(repo.buscar(3)).not.toBeNull()
      expect(repo.buscarPorUsername("yugi")).toBeNull()

      const enDisco = await leerDb()
      expect(Object.keys(enDisco)).toEqual(["3"])
    })

    test("eliminarPorUsername devuelve false si el usuario no tenía mazos", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(await repo.eliminarPorUsername("inexistente")).toBe(false)
    })
  })
})
