import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioCartas } from "../src/repositories/RepositorioCartas.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "dataTest")
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
  describe("constructor y getters", () => {
    test("arranca sin cartas y asigna la ruta correctamente", () => {
      const repo = new RepositorioCartas(rutaDb)
      
      expect(repo.ruta).toBe(rutaDb)
      expect(repo.cartas).toBeInstanceOf(Map)
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("el getter 'cartas' devuelve una copia profunda", async () => {
      const carta1 = crearDatosCarta(100)
      await sembrarDb({ 100: carta1 })
      
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      const copia = repo.cartas
      copia.delete(100) 

      expect(repo.cantidadTotal()).toBe(1)
      expect(repo.buscar(100).name).toBe("Carta Prueba")
    })
  })

  describe("cargar", () => {
    test("carga las cartas desde un .json existente y puebla el mapa convirtiéndolas con CartaFactory", async () => {
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
    test("si se llama sin argumentos, guarda el estado actual del mapa en disco", async () => {
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

    test("si se le pasa un array de datos, los convierte, los agrega al mapa y persiste todo en disco", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar() 

      const nuevasCartas = [
        crearDatosCarta(500, "Blue-Eyes White Dragon"),
        crearDatosCarta(600, "Exodia")
      ]

      await repo.guardar(nuevasCartas)

      expect(repo.cantidadTotal()).toBe(2)
      expect(repo.buscar(500).name).toBe("Blue-Eyes White Dragon")

      const dataEnDisco = await leerDb()
      expect(dataEnDisco["500"].name).toBe("Blue-Eyes White Dragon")
      expect(dataEnDisco["600"].name).toBe("Exodia")
    })
  })

  describe("buscar", () => {
    test("devuelve la carta correspondiente mediante CartaFactory", async () => {
      const c1 = crearDatosCarta(777, "Red-Eyes B. Dragon")
      await sembrarDb({ 777: c1 })
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      const resultado = repo.buscar(777)

      // Comprobamos que trajo la información y que la pasó por el factory (debería tener el método toJSON)
      expect(resultado.id).toBe(777)
      expect(resultado.name).toBe("Red-Eyes B. Dragon")
      expect(typeof resultado.toJSON).toBe("function")
    })

    test("devuelve null si la carta no existe", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      expect(repo.buscar(9999)).toBeNull()
    })
  })

  describe("cantidadTotal", () => {
    test("devuelve 0 si no hay cartas", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("devuelve la cantidad exacta tras cargar", async () => {
      await sembrarDb({
        10: crearDatosCarta(10),
        20: crearDatosCarta(20),
        30: crearDatosCarta(30)
      })
      const repo = new RepositorioCartas(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(3)
    })
  })
})