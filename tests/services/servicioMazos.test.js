import { readFile, rm, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import { RepositorioMazos } from "../../src/repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../../src/repositories/RepositorioCartas.js"
import { ServicioMazos } from "../../src/services/ServicioMazos.js"
import { AuthorizationError, NotFoundError } from "../../src/utils/errors.js"
import { Mazo } from "../../src/models/Mazo.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDbMazos = path.join(carpetaDataTest, "mazosServicioTest.json")
const rutaDbCartas = path.join(carpetaDataTest, "cartasServicioMazoTest.json")

const sembrarDb = (ruta, datos) => writeFile(ruta, JSON.stringify(datos), "utf8")

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

describe("ServicioMazos", () => {
  let repoMazos
  let repoCartas
  let servicio

  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  beforeEach(async () => {
    await rm(rutaDbMazos, { force: true })
    await rm(rutaDbCartas, { force: true })

    await sembrarDb(rutaDbCartas, cartasMock)

    repoMazos = new RepositorioMazos(rutaDbMazos)
    repoCartas = new RepositorioCartas(rutaDbCartas)

    await repoMazos.cargar()
    await repoCartas.cargar()

    servicio = new ServicioMazos(repoMazos, repoCartas)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await rm(rutaDbMazos, { force: true })
    await rm(rutaDbCartas, { force: true })
  })

  describe("constructor", () => {
    test("lanza TypeError si no se inyectan las instancias requeridas", () => {
      expect(() => new ServicioMazos({}, repoCartas)).toThrow(TypeError)
      expect(() => new ServicioMazos(repoMazos, {})).toThrow(TypeError)
    })
  })

  describe("listarMazos", () => {
    test("lista todos los mazos paginados si no se especifica usuario", async () => {
      await sembrarDb(rutaDbMazos, {
        1: { id: 1, username: "yugi", nombre: "Mazo 1", mainDeck: [], extraDeck: [] },
        2: { id: 2, username: "kaiba", nombre: "Mazo 2", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      const resultado = servicio.listarMazos()
      expect(resultado.datos).toHaveLength(2)
      expect(resultado.paginacion.totalMazos).toBe(2)
    })

    test("lista solo los mazos del usuario especificado", async () => {
      await sembrarDb(rutaDbMazos, {
        1: { id: 1, username: "yugi", nombre: "Mazo 1", mainDeck: [], extraDeck: [] },
        2: { id: 2, username: "kaiba", nombre: "Mazo 2", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      const resultado = servicio.listarMazos("yugi")
      expect(resultado.datos).toHaveLength(1)
      expect(resultado.datos[0].username).toBe("yugi")
    })

    test("lanza NotFoundError si el usuario no tiene ningún mazo", () => {
      expect(() => servicio.listarMazos("inexistente")).toThrow(NotFoundError)
    })
  })

  describe("obtenerMazo", () => {
    test("obtiene el mazo con objetos { carta, cantidad } y calcula precioTotal", async () => {
      await sembrarDb(rutaDbMazos, {
        1: {
          id: 1,
          username: "yugi",
          nombre: "Mazo Yugi",
          mainDeck: [{ id: 100, cantidad: 3 }, { id: 200, cantidad: 1 }],
          extraDeck: [{ id: 300, cantidad: 2 }]
        }
      })
      await repoMazos.cargar()

      const mazo = servicio.obtenerMazo(1)

      expect(mazo.id).toBe(1)
      expect(mazo.nombre).toBe("Mazo Yugi")
      expect(mazo.mainDeck[0]).toEqual({
        carta: expect.objectContaining({ id: 100, name: "Dark Magician" }),
        cantidad: 3
      })
      expect(mazo.mainDeck[0].carta.cantidad).toBeUndefined()
      expect(mazo.extraDeck[0]).toEqual({
        carta: expect.objectContaining({ id: 300, name: "Decode Talker" }),
        cantidad: 2
      })
      // 3 * 2.00 + 1 * 5.00 + 2 * 3.50 = 6 + 5 + 7 = 18.00
      expect(mazo.precioTotal).toBe(18)
    })

    test("lanza NotFoundError si el mazo no existe", () => {
      expect(() => servicio.obtenerMazo(999)).toThrow(NotFoundError)
    })
  })

  describe("crearMazo, actualizarMazo y eliminarMazo (control de permisos)", () => {
    test("crea un mazo y lo persiste", async () => {
      const nuevo = await servicio.crearMazo({
        username: "yugi",
        nombre: "Nuevo Mazo",
        mainDeck: [],
        extraDeck: []
      })

      expect(nuevo).toBeInstanceOf(Mazo)
      expect(nuevo.nombre).toBe("Nuevo Mazo")

      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].nombre).toBe("Nuevo Mazo")
    })

    test("actualiza el mazo solo si el solicitante es el dueño", async () => {
      await sembrarDb(rutaDbMazos, {
        1: { id: 1, username: "yugi", nombre: "Original", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      const actualizado = await servicio.actualizarMazo(1, { nombre: "Renombrado" }, "yugi")
      expect(actualizado.nombre).toBe("Renombrado")

      await expect(
        servicio.actualizarMazo(1, { nombre: "Intruso" }, "kaiba")
      ).rejects.toThrow(AuthorizationError)
    })

    test("elimina el mazo solo si el solicitante es el dueño", async () => {
      await sembrarDb(rutaDbMazos, {
        1: { id: 1, username: "yugi", nombre: "Por Borrar", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      await expect(servicio.eliminarMazo(1, "kaiba")).rejects.toThrow(AuthorizationError)

      await servicio.eliminarMazo(1, "yugi")
      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"]).toBeUndefined()
    })
  })

  describe("agregarCarta y eliminarCarta", () => {
    beforeEach(async () => {
      await sembrarDb(rutaDbMazos, {
        1: { id: 1, username: "yugi", nombre: "Mazo", mainDeck: [{ id: 100, cantidad: 2 }], extraDeck: [] }
      })
      await repoMazos.cargar()
    })

    test("dirige automáticamente cartas Link al Extra Deck según frameType", async () => {
      await servicio.agregarCarta(1, 300, "yugi")

      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].extraDeck).toEqual([{ id: 300, cantidad: 1 }])
    })

    test("incrementa cantidad si se agrega otra copia de la misma carta", async () => {
      await servicio.agregarCarta(1, 100, "yugi")

      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].mainDeck).toEqual([{ id: 100, cantidad: 3 }])
    })

    test("lanza NotFoundError si se intenta agregar una carta inexistente en RepositorioCartas", async () => {
      await expect(servicio.agregarCarta(1, 99999, "yugi")).rejects.toThrow(NotFoundError)
    })

    test("decrementa una copia al eliminarCarta y elimina la entrada si llega a 0", async () => {
      await servicio.eliminarCarta(1, 100, "yugi")
      let enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].mainDeck).toEqual([{ id: 100, cantidad: 1 }])

      await servicio.eliminarCarta(1, 100, "yugi")
      enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].mainDeck).toEqual([])
    })

    test("lanza NotFoundError si la carta a eliminar no está en el mazo", async () => {
      await expect(servicio.eliminarCarta(1, 200, "yugi")).rejects.toThrow(NotFoundError)
    })

    test("lanza AuthorizationError si otro usuario intenta modificar las cartas del mazo", async () => {
      await expect(servicio.agregarCarta(1, 100, "kaiba")).rejects.toThrow(AuthorizationError)
      await expect(servicio.eliminarCarta(1, 100, "kaiba")).rejects.toThrow(AuthorizationError)
    })
  })
})
