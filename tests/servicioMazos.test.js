import { readFile, rm, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import { RepositorioMazos } from "../src/repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../src/repositories/RepositorioCartas.js"
import { ServicioMazos } from "../src/services/ServicioMazos.js"
import { AuthorizationError, NotFoundError } from "../src/utils/errors.js"
import { Mazo } from "../src/models/Mazo.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "dataTest")
const rutaDbMazos = path.join(carpetaDataTest, "mazosTempTest.json")
const rutaDbCartas = path.join(carpetaDataTest, "cartasTempTest.json")

const sembrarDb = (ruta, datos) => writeFile(ruta, JSON.stringify(datos), "utf8")

// Datos falsos de cartas para probar cálculos de precios, banlist y extra deck
const cartasMock = {
  100: { 
    id: 100, name: "Dark Magician", frameType: "normal", 
    card_prices: [{ ebay_price: "2.00", amazon_price: "1.50" }],
    card_images: [{ image_url: "url1", image_url_small: "url1_small" }] 
  },
  200: { 
    id: 200, name: "Pot of Greed", frameType: "spell", 
    banlist_info: { ban_tcg: "Banned" }, 
    card_prices: [{ ebay_price: "5.00", amazon_price: "5.00" }],
    card_images: [{ image_url: "url2", image_url_small: "url2_small" }]
  },
  300: { 
    id: 300, name: "Decode Talker", frameType: "link", 
    card_prices: [{ ebay_price: "1.00", amazon_price: "3.50" }],
    card_images: [{ image_url: "url3", image_url_small: "url3_small" }]
  }
}

describe("ServicioMazos + Repositorios (Test Temporal de Integración)", () => {
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
    test("lanza TypeError si no se inyectan las instancias correctas", () => {
      expect(() => new ServicioMazos({}, repoCartas)).toThrow(TypeError)
      expect(() => new ServicioMazos(repoMazos, {})).toThrow(TypeError)
    })
  })

  describe("listarMazos", () => {
    test("lista todos los mazos si no se pasa username", async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Mazo 1", mainDeck: [], extraDeck: [] },
        "2": { id: 2, username: "kaiba", nombre: "Mazo 2", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      const resultado = servicio.listarMazos()
      expect(resultado.datos).toHaveLength(2)
      expect(resultado.paginacion).toEqual({
        paginaActual: 1,
        totalPaginas: 1,
        totalMazos: 2,
        tieneAnterior: false,
        tieneSiguiente: false
      })
    })

    test("lista solo los mazos del usuario si se pasa username", async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Mazo 1", mainDeck: [], extraDeck: [] },
        "2": { id: 2, username: "kaiba", nombre: "Mazo 2", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      const resultado = servicio.listarMazos("yugi")
      expect(resultado.datos).toHaveLength(1)
      expect(resultado.datos[0].username).toBe("yugi")
      expect(resultado.paginacion).toEqual({
        paginaActual: 1,
        totalPaginas: 1,
        totalMazos: 1,
        tieneAnterior: false,
        tieneSiguiente: false
      })
    })

    test("lanza NotFoundError si el usuario no tiene mazos", () => {
      expect(() => servicio.listarMazos("fantasma")).toThrow(NotFoundError)
    })
  })

  describe("obtenerMazo", () => {
    test("devuelve el mazo con cartas pobladas y calcula el precio total correctamente", async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Mazo Yugi", mainDeck: [100, 200], extraDeck: [300] }
      })
      await repoMazos.cargar()

      const mazo = servicio.obtenerMazo(1)

      expect(mazo.id).toBe(1)
      expect(mazo.nombre).toBe("Mazo Yugi")
      
      // Verifica que las cartas se poblaron con la info real de la DB de cartas
      expect(mazo.mainDeck[0].name).toBe("Dark Magician")
      expect(mazo.extraDeck[0].name).toBe("Decode Talker")
      
      // Verifica cálculo del precio
      expect(mazo.precioTotal).toBe(10.5)
    })

    test("lanza NotFoundError si el mazo no existe", () => {
      expect(() => servicio.obtenerMazo(99)).toThrow(NotFoundError)
    })
  })

  describe("crearMazo y actualizarMazo", () => {
    test("crea un mazo y lo guarda en el archivo", async () => {
      const datos = { username: "yugi", nombre: "Nuevo Mazo", mainDeck: [], extraDeck: [] }
      
      const nuevoMazo = await servicio.crearMazo(datos)

      expect(nuevoMazo).toBeInstanceOf(Mazo)
      expect(nuevoMazo.nombre).toBe("Nuevo Mazo")

      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"]).toBeDefined()
      expect(enDisco["1"].nombre).toBe("Nuevo Mazo")
    })

    test("actualiza un mazo si el usuario es el dueño", async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Viejo", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      const mazoActualizado = await servicio.actualizarMazo(1, { nombre: "Renombrado" }, "yugi")

      expect(mazoActualizado.nombre).toBe("Renombrado")
      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].nombre).toBe("Renombrado")
    })

    test("lanza AuthorizationError si otro usuario intenta actualizar el mazo", async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Viejo", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      await expect(
        servicio.actualizarMazo(1, { nombre: "Robado" }, "kaiba")
      ).rejects.toThrow(AuthorizationError)
    })
  })

  describe("eliminarMazo", () => {
    test("elimina el mazo si es el dueño", async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Mazo 1", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      await servicio.eliminarMazo(1, "yugi")

      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"]).toBeUndefined()
    })

    test("lanza AuthorizationError si intenta eliminar el mazo de otro", async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Mazo 1", mainDeck: [], extraDeck: [] }
      })
      await repoMazos.cargar()

      await expect(servicio.eliminarMazo(1, "kaiba")).rejects.toThrow(AuthorizationError)
    })
  })

  describe("agregarCarta y eliminarCarta", () => {
    beforeEach(async () => {
      await sembrarDb(rutaDbMazos, {
        "1": { id: 1, username: "yugi", nombre: "Mazo", mainDeck: [100], extraDeck: [] }
      })
      await repoMazos.cargar()
    })

    test("agrega carta al Main Deck e incluye info de la banlist si corresponde", async () => {
      await servicio.agregarCarta(1, 200, "yugi") 
      
      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].mainDeck).toContain(200)
    })

    test("agrega carta al Extra Deck basándose en el frameType de la API", async () => {
      await servicio.agregarCarta(1, 300, "yugi") 
      
      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].extraDeck).toContain(300) 
    })

    test("elimina una carta existente en el mazo", async () => {
      await servicio.eliminarCarta(1, 100, "yugi") 
      
      const enDisco = JSON.parse(await readFile(rutaDbMazos, "utf8"))
      expect(enDisco["1"].mainDeck).not.toContain(100)
    })

    test("lanza NotFoundError si se intenta agregar una carta que no existe en el RepositorioCartas", async () => {
      await expect(servicio.agregarCarta(1, 9999, "yugi")).rejects.toThrow(NotFoundError)
    })

    test("lanza NotFoundError si se intenta eliminar una carta que el mazo no posee", async () => {
      await expect(servicio.eliminarCarta(1, 200, "yugi")).rejects.toThrow(NotFoundError)
    })
  })
})
