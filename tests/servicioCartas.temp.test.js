import { readFile, rm, mkdir, access, utimes } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import { RepositorioCartas } from "../src/repositories/RepositorioCartas.js"
import { ServicioCartas } from "../src/services/ServicioCartas.js"
import { DatabaseError } from "../src/utils/errors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "dataTest")
const rutaDb = path.join(carpetaDataTest, "cartasTempTest.json")

/** Payload simulando la respuesta real de https://db.ygoprodeck.com/api/v7/cardinfo.php */
const payloadApiMock = () => ({
  data: [
    {
      id: 46986414,
      name: "Dark Magician",
      type: "Normal Monster",
      frameType: "normal",
      desc: "The ultimate wizard in terms of attack and defense.",
      atk: 2500,
      def: 2100,
      level: 7,
      race: "Spellcaster",
      attribute: "DARK",
      archetype: "Dark Magician", // campo extra de la API que debe ser ignorado
      card_images: [
        {
          id: 46986414,
          image_url: "https://images.ygoprodeck.com/images/cards/46986414.jpg",
          image_url_small: "https://images.ygoprodeck.com/images/cards_small/46986414.jpg",
          image_url_cropped: "https://images.ygoprodeck.com/images/cards_cropped/46986414.jpg"
        }
      ],
      card_prices: [
        {
          cardmarket_price: "0.02",
          tcgplayer_price: "0.15",
          ebay_price: "1.99",
          amazon_price: "2.50",
          coolstuffinc_price: "0.99"
        }
      ]
    },
    {
      id: 55144522,
      name: "Pot of Greed",
      type: "Spell Card",
      frameType: "spell",
      desc: "Draw 2 cards.",
      race: "Normal",
      banlist_info: { ban_tcg: "Banned" },
      card_images: [
        {
          id: 55144522,
          image_url: "https://images.ygoprodeck.com/images/cards/55144522.jpg",
          image_url_small: "https://images.ygoprodeck.com/images/cards_small/55144522.jpg"
        }
      ],
      card_prices: [
        {
          ebay_price: "3.00",
          amazon_price: "4.00"
        }
      ]
    }
  ]
})

const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

describe("ServicioCartas + RepositorioCartas (Test Temporal)", () => {
  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await rm(rutaDb, { force: true })
  })

  test("crea la base de datos y guarda las cartas cuando el repositorio está vacío", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json; charset=utf-8" },
      json: async () => payloadApiMock()
    })

    const repo = new RepositorioCartas(rutaDb)
    await repo.cargar() // No existe el archivo aún, queda en 0 cartas
    expect(repo.cantidadTotal()).toBe(0)

    const servicio = new ServicioCartas(repo)
    await servicio.cargarCartas()

    // 1. Verifica que se cargaron las cartas en memoria en RepositorioCartas
    expect(repo.cantidadTotal()).toBe(2)
    const darkMagician = repo.buscar(46986414)
    expect(darkMagician.name).toBe("Dark Magician")
    expect(darkMagician.atk).toBe(2500)
    expect(darkMagician.card_prices).toEqual([{ ebay_price: "1.99", amazon_price: "2.50" }])

    // 2. Verifica que el archivo JSON se escribió correctamente en disco
    expect(await existe(rutaDb)).toBe(true)
    const contenidoDisco = JSON.parse(await readFile(rutaDb, "utf8"))
    expect(Object.keys(contenidoDisco)).toHaveLength(2)
    expect(contenidoDisco["46986414"].name).toBe("Dark Magician")
    expect(contenidoDisco["55144522"].banlist_info).toEqual({ ban_tcg: "Banned" })
  })

  test("no vuelve a descargar de la API si la base ya tiene cartas y tiene menos de 1 semana", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => payloadApiMock()
    })

    const repo = new RepositorioCartas(rutaDb)
    await repo.cargar()
    const servicio = new ServicioCartas(repo)

    // Primera carga: descarga de la API
    await servicio.cargarCartas()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Segunda carga inmediata: el archivo es reciente (< 1 semana), no debe llamar a fetch
    await servicio.cargarCartas()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  test("vuelve a descargar de la API si el archivo en disco tiene más de 1 semana", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => payloadApiMock()
    })

    const repo = new RepositorioCartas(rutaDb)
    await repo.cargar()
    const servicio = new ServicioCartas(repo)

    await servicio.cargarCartas()
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    // Simulamos que el archivo fue modificado hace 8 días
    const haceOchoDias = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    await utimes(rutaDb, haceOchoDias, haceOchoDias)

    await servicio.cargarCartas()
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  test("reintenta hasta 3 veces si falla la API y lanza DatabaseError al agotar intentos", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: () => "application/json" }
    })

    const repo = new RepositorioCartas(rutaDb)
    await repo.cargar()
    const servicio = new ServicioCartas(repo)

    await expect(servicio.cargarCartas()).rejects.toThrow(DatabaseError)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })
})
