import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioCartas } from "../../src/repositories/RepositorioCartas.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDb = path.join(carpetaDataTest, "cartasTest.json")

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

const crearDatosCarta = (id, name = "Carta Prueba") => ({
  id,
  name,
  type: "Normal Monster",
  frameType: "normal",
  desc: "Descripción de prueba",
  atk: 1000,
  def: 1000,
  level: 4,
  race: "Warrior",
  attribute: "EARTH",
  card_images: [{ image_url: "url_img.jpg", image_url_small: "url_small.jpg" }],
  card_prices: [{ ebay_price: "1.00", amazon_price: "1.00" }]
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

describe("RepositorioCartas", () => {
  describe("inicialización", () => {
    test("inicia con el mapa de cartas vacío y asigna la ruta", () => {
      const repo = new RepositorioCartas(rutaDb)
      expect(repo.ruta).toBe(rutaDb)
      expect(repo.cantidadTotal()).toBe(0)
    })
  })

  describe("cargar", () => {
    test("carga cartas desde el archivo .json convirtiéndolas con CartaFactory", async () => {
      const c1 = crearDatosCarta(100, "Dark Magician")
      const c2 = crearDatosCarta(200, "Pot of Greed")
      await sembrarDb({ 100: c1, 200: c2 })

      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(2)
      expect(repo.buscar(100).name).toBe("Dark Magician")
      expect(repo.buscar(200).name).toBe("Pot of Greed")
    })

    test("si el archivo no existe (ENOENT), inicializa el mapa vacío y crea el archivo en disco", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      expect(await existe(rutaDb)).toBe(true)
      expect(await leerDb()).toEqual({})
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("si el archivo tiene un formato JSON inválido, propaga un SyntaxError", async () => {
      await writeFile(rutaDb, "esto no es un json valido", "utf8")
      const repo = new RepositorioCartas(rutaDb)

      await expect(repo.cargar()).rejects.toThrow(SyntaxError)
    })
  })

  describe("guardar", () => {
    test("guarda el estado actual del mapa en disco", async () => {
      const c1 = crearDatosCarta(100)
      await sembrarDb({ 100: c1 })

      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()
      await rm(rutaDb)

      await repo.guardar()

      expect(await existe(rutaDb)).toBe(true)
      const dataEnDisco = await leerDb()
      expect(dataEnDisco["100"].name).toBe(c1.name)
    })

    test("agrega un array de datos al mapa y persiste en disco", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      const nuevasCartas = [
        crearDatosCarta(500, "Blue-Eyes White Dragon"),
        crearDatosCarta(600, "Exodia")
      ]

      await repo.guardar(nuevasCartas)

      expect(repo.cantidadTotal()).toBe(2)
      const dataEnDisco = await leerDb()
      expect(dataEnDisco["500"].name).toBe("Blue-Eyes White Dragon")
      expect(dataEnDisco["600"].name).toBe("Exodia")
    })
  })

  describe("buscar", () => {
    test("devuelve la carta encontrada o null si no existe", async () => {
      const c1 = crearDatosCarta(777, "Red-Eyes B. Dragon")
      await sembrarDb({ 777: c1 })

      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      expect(repo.buscar(777).name).toBe("Red-Eyes B. Dragon")
      expect(repo.buscar(9999)).toBeNull()
    })
  })
})
