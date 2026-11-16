import { readFile, rm, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioMazosPopulares } from "../../src/repositories/RepositorioMazosPopulares.js"
import { Mazo } from "../../src/models/Mazo.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDbPopulares = path.join(carpetaDataTest, "mazosPopularesRepoTest.json")

describe("RepositorioMazosPopulares", () => {
  let repositorio

  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  beforeEach(async () => {
    await rm(rutaDbPopulares, { force: true })
    repositorio = new RepositorioMazosPopulares(rutaDbPopulares)
  })

  afterEach(async () => {
    await rm(rutaDbPopulares, { force: true })
  })

  test("crea un archivo JSON vacío si no existe al llamar a cargar()", async () => {
    await repositorio.cargar()

    expect(repositorio.cantidadTotal()).toBe(0)
    const contenido = await readFile(rutaDbPopulares, "utf8")
    expect(JSON.parse(contenido)).toEqual({})
  })

  test("guardar() reemplaza los mazos anteriores y los persiste en disco", async () => {
    await repositorio.guardar([
      { id: 1, username: "meta", nombre: "Viejo", mainDeck: [{ id: 100, cantidad: 3 }], extraDeck: [] }
    ])
    expect(repositorio.cantidadTotal()).toBe(1)

    await repositorio.guardar([
      { id: 1, username: "meta", nombre: "Nuevo", mainDeck: [{ id: 200, cantidad: 1 }], extraDeck: [{ id: 300, cantidad: 2 }] }
    ])

    expect(repositorio.cantidadTotal()).toBe(1)
    expect(repositorio.buscar(1)).toBeInstanceOf(Mazo)
    expect(repositorio.buscar(1).nombre).toBe("Nuevo")

    const enDisco = JSON.parse(await readFile(rutaDbPopulares, "utf8"))
    expect(enDisco["1"].nombre).toBe("Nuevo")
    expect(enDisco["1"].mainDeck).toEqual([{ id: 200, cantidad: 1 }])
    expect(enDisco["1"].extraDeck).toEqual([{ id: 300, cantidad: 2 }])
  })

  test("cargar() hidrata los mazos existentes desde disco", async () => {
    await writeFile(
      rutaDbPopulares,
      JSON.stringify({
        1: { id: 1, username: "meta", nombre: "Dracotail", mainDeck: [{ id: 100, cantidad: 3 }], extraDeck: [] }
      }),
      "utf8"
    )

    await repositorio.cargar()
    expect(repositorio.cantidadTotal()).toBe(1)
    expect(repositorio.buscar(1).nombre).toBe("Dracotail")
    expect(repositorio.buscar(999)).toBeNull()
  })
})
