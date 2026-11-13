import { rm, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import { RepositorioMazosPopulares } from "../../src/repositories/RepositorioMazosPopulares.js"
import { RepositorioCartas } from "../../src/repositories/RepositorioCartas.js"
import { ServicioMazosPopulares } from "../../src/services/ServicioMazosPopulares.js"
import { NotFoundError } from "../../src/utils/errors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDbMazosPopulares = path.join(carpetaDataTest, "mazosPopularesServicioTest.json")
const rutaDbCartas = path.join(carpetaDataTest, "cartasServicioMazosPopularesTest.json")

const cartasMock = {
  100: {
    id: 100,
    name: "Dark Magician",
    frameType: "normal",
    type: "Normal Monster",
    race: "Spellcaster",
    desc: "Desc",
    card_prices: [{ ebay_price: "2.00", amazon_price: "1.50" }],
    card_images: [{ image_url: "url1", image_url_small: "url1_small" }]
  },
  200: {
    id: 200,
    name: "Pot of Greed",
    frameType: "spell",
    type: "Spell Card",
    race: "Normal",
    desc: "Desc",
    banlist_info: { ban_tcg: "Banned" },
    card_prices: [{ ebay_price: "5.00", amazon_price: "5.00" }],
    card_images: [{ image_url: "url2", image_url_small: "url2_small" }]
  },
  300: {
    id: 300,
    name: "Decode Talker",
    frameType: "link",
    type: "Link Monster",
    race: "Cyberse",
    desc: "Desc",
    card_prices: [{ ebay_price: "1.00", amazon_price: "3.50" }],
    card_images: [{ image_url: "url3", image_url_small: "url3_small" }]
  }
}

describe("ServicioMazosPopulares", () => {
  let repoMazosPopulares
  let repoCartas
  let servicio

  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  beforeEach(async () => {
    await rm(rutaDbMazosPopulares, { force: true })
    await rm(rutaDbCartas, { force: true })

    await writeFile(rutaDbCartas, JSON.stringify(cartasMock), "utf8")

    repoMazosPopulares = new RepositorioMazosPopulares(rutaDbMazosPopulares)
    repoCartas = new RepositorioCartas(rutaDbCartas)

    await repoMazosPopulares.cargar()
    await repoCartas.cargar()

    servicio = new ServicioMazosPopulares(repoMazosPopulares, repoCartas)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await rm(rutaDbMazosPopulares, { force: true })
    await rm(rutaDbCartas, { force: true })
  })

  describe("constructor", () => {
    test("lanza TypeError si no se inyectan las instancias requeridas", () => {
      expect(() => new ServicioMazosPopulares({}, repoCartas)).toThrow(TypeError)
      expect(() => new ServicioMazosPopulares(repoMazosPopulares, {})).toThrow(TypeError)
    })
  })

  describe("descargar, actualizarCache, listarMazosPopulares y obtenerMazoPopular", () => {
    test("descarga mazos populares, los hidrata con { carta, cantidad } y restricciones TCG, y actualiza la caché", async () => {
      jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => [{ _id: "1", name: "Dark Magician Meta" }]
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => [{
            deckBreakdownTCG: {
              cards: [
                { card: { name: "Dark Magician" }, at: 3 },
                { card: { name: "Decode Talker" }, at: 1 },
                { card: { name: "Pot of Greed" }, at: 1 },
                { card: { name: "Carta Inexistente" }, at: 2 }
              ]
            }
          }]
        })

      expect(servicio.ruta).toBe(rutaDbMazosPopulares)
      expect(servicio.estaVacio()).toBe(true)

      await servicio.descargar()
      servicio.actualizarCache()

      expect(servicio.estaVacio()).toBe(false)

      const populares = servicio.listarMazosPopulares()
      expect(populares).toHaveLength(1)
      expect(populares[0].id).toBe(1)
      expect(populares[0].nombre).toBe("Dark Magician Meta")
      expect(populares[0].mainDeck).toHaveLength(1)
      expect(populares[0].mainDeck[0]).toEqual({
        carta: expect.objectContaining({ id: 100, name: "Dark Magician" }),
        cantidad: 3
      })
      expect(populares[0].extraDeck).toHaveLength(1)
      expect(populares[0].extraDeck[0]).toEqual({
        carta: expect.objectContaining({ id: 300, name: "Decode Talker" }),
        cantidad: 1
      })
      expect(populares[0].precioTotal).toBe(9.5)

      const detalle = servicio.obtenerMazoPopular(1)
      expect(detalle.nombre).toBe("Dark Magician Meta")
      expect(detalle.mainDeck[0]).toEqual({
        carta: expect.objectContaining({ id: 100, name: "Dark Magician" }),
        cantidad: 3
      })
    })

    test("lanza NotFoundError si no hay mazos populares cargados o el ID popular no existe", () => {
      expect(() => servicio.listarMazosPopulares()).toThrow(NotFoundError)
      expect(() => servicio.obtenerMazoPopular(99)).toThrow(NotFoundError)
    })
  })
})
