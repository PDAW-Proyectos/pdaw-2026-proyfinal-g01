import { readFile, rm, mkdir, access, utimes } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import { RepositorioCartas } from "../src/repositories/RepositorioCartas.js"
import { ServicioCartas } from "../src/services/ServicioCartas.js"
import { DatabaseError, NotFoundError } from "../src/utils/errors.js"

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
    },
    {
      id: 16178681,
      name: "Odd-Eyes Pendulum Dragon",
      type: "Pendulum Effect Monster",
      frameType: "effect_pendulum",
      desc: "If this card battles an opponent's monster, any battle damage this card inflicts to your opponent is doubled.",
      atk: 2500,
      def: 2000,
      level: 7,
      scale: 4,
      race: "Dragon",
      attribute: "DARK",
      card_images: [
        {
          id: 16178681,
          image_url: "https://images.ygoprodeck.com/images/cards/16178681.jpg",
          image_url_small: "https://images.ygoprodeck.com/images/cards_small/16178681.jpg"
        }
      ],
      card_prices: [
        {
          ebay_price: "1.20",
          amazon_price: "1.80"
        }
      ]
    },
    {
      id: 1861629,
      name: "Decode Talker",
      type: "Link Monster",
      frameType: "link",
      desc: "2+ Effect Monsters. Gains 500 ATK for each monster it points to.",
      atk: 2300,
      race: "Cyberse",
      attribute: "DARK",
      linkval: 3,
      linkmarkers: ["Top", "Bottom-Left", "Bottom-Right"],
      card_images: [
        {
          id: 1861629,
          image_url: "https://images.ygoprodeck.com/images/cards/1861629.jpg",
          image_url_small: "https://images.ygoprodeck.com/images/cards_small/1861629.jpg"
        }
      ],
      card_prices: [
        {
          ebay_price: "0.99",
          amazon_price: "1.50"
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
    jest.restoreAllMocks()
    await rm(rutaDb, { force: true })
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
    expect(repo.cantidadTotal()).toBe(4)
    const darkMagician = repo.buscar(46986414)
    expect(darkMagician.name).toBe("Dark Magician")
    expect(darkMagician.atk).toBe(2500)
    expect(darkMagician.card_prices).toEqual([{ ebay_price: "1.99", amazon_price: "2.50" }])

    // 2. Verifica que el archivo JSON se escribió correctamente en disco
    expect(await existe(rutaDb)).toBe(true)
    const contenidoDisco = JSON.parse(await readFile(rutaDb, "utf8"))
    expect(Object.keys(contenidoDisco)).toHaveLength(4)
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

  describe("obtenerCarta", () => {
    test("obtiene una carta específica por su ID", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.guardar(payloadApiMock().data)
      const servicio = new ServicioCartas(repo)

      const carta = servicio.obtenerCarta(46986414)
      expect(carta.id).toBe(46986414)
      expect(carta.name).toBe("Dark Magician")
    })

    test("lanza NotFoundError si la carta no existe", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.guardar(payloadApiMock().data)
      const servicio = new ServicioCartas(repo)

      expect(() => servicio.obtenerCarta(99999999)).toThrow(NotFoundError)
    })
  })

  describe("listarCartas", () => {
    test("lista todas las cartas cuando no se pasan filtros", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.guardar(payloadApiMock().data)
      const servicio = new ServicioCartas(repo)

      const resultado = servicio.listarCartas()
      expect(resultado.datos).toHaveLength(4)
      expect(resultado.paginacion).toEqual({
        paginaActual: 1,
        totalPaginas: 1,
        totalCartas: 4,
        tieneAnterior: false,
        tieneSiguiente: false
      })
    })

    test("filtra por los atributos permitidos (name, frameType, race, atk, def, level, attribute, scale, linkval)", async () => {
      const repo = new RepositorioCartas(rutaDb)
      await repo.guardar(payloadApiMock().data)
      const servicio = new ServicioCartas(repo)

      expect(servicio.listarCartas({ name: "magician" }).datos[0].name).toBe("Dark Magician")
      expect(servicio.listarCartas({ frameType: "link" }).datos[0].name).toBe("Decode Talker")
      expect(servicio.listarCartas({ race: "Dragon" }).datos[0].name).toBe("Odd-Eyes Pendulum Dragon")
      expect(servicio.listarCartas({ atk: 2500 }).datos).toHaveLength(2)
      expect(servicio.listarCartas({ atk: 2500, def: 2100 }).datos[0].name).toBe("Dark Magician")
      expect(servicio.listarCartas({ level: 7, scale: 4 }).datos[0].name).toBe("Odd-Eyes Pendulum Dragon")
      expect(servicio.listarCartas({ attribute: "DARK" }).datos).toHaveLength(3)
      expect(servicio.listarCartas({ linkval: 3 }).datos[0].name).toBe("Decode Talker")
    })

    test("lanza NotFoundError cuando ninguna carta coincide con los filtros o el repositorio está vacío", async () => {
      const repo = new RepositorioCartas(rutaDb)
      const servicio = new ServicioCartas(repo)

      expect(() => servicio.listarCartas()).toThrow(NotFoundError)

      await repo.guardar(payloadApiMock().data)
      expect(() => servicio.listarCartas({ name: "Blue-Eyes White Dragon" })).toThrow(NotFoundError)
    })
  })
})
