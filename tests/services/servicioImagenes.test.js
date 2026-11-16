import { rm, mkdir, writeFile, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import { RepositorioCartas } from "../../src/repositories/RepositorioCartas.js"
import { RepositorioImagenes } from "../../src/repositories/RepositorioImagenes.js"
import { ServicioImagenes } from "../../src/services/ServicioImagenes.js"
import { NotFoundError } from "../../src/utils/errors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaCartasTest = path.join(carpetaDataTest, "cartasImgTest.json")
const rutaImagenesTest = path.join(carpetaDataTest, "imagenesServicioTest")

const bufferFalso = Buffer.from("fake-image-bytes")

const cartasMock = {
  100: {
    id: 100,
    name: "Dark Magician",
    frameType: "normal",
    type: "Normal Monster",
    race: "Spellcaster",
    desc: "Desc",
    card_images: [
      {
        image_url: "https://images.ygoprodeck.com/full/100.jpg",
        image_url_small: "https://images.ygoprodeck.com/small/100.jpg"
      }
    ],
    card_prices: [{ ebay_price: "1.00", amazon_price: "1.00" }]
  }
}

const sembrarDb = (ruta, datos) => writeFile(ruta, JSON.stringify(datos), "utf8")

const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

describe("ServicioImagenes", () => {
  let repoCartas
  let repoImagenes
  let servicio

  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  beforeEach(async () => {
    jest.restoreAllMocks()
    await rm(rutaCartasTest, { force: true })
    await rm(rutaImagenesTest, { force: true, recursive: true })

    await sembrarDb(rutaCartasTest, cartasMock)

    repoCartas = new RepositorioCartas(rutaCartasTest)
    await repoCartas.cargar()

    repoImagenes = new RepositorioImagenes(rutaImagenesTest)
    await repoImagenes.cargar()

    servicio = new ServicioImagenes(repoImagenes, repoCartas)
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await rm(rutaCartasTest, { force: true })
    await rm(rutaImagenesTest, { force: true, recursive: true })
  })

  describe("constructor", () => {
    test("lanza TypeError si no se inyectan las instancias correctas", () => {
      expect(() => new ServicioImagenes({}, repoCartas)).toThrow(TypeError)
      expect(() => new ServicioImagenes(repoImagenes, {})).toThrow(TypeError)
    })
  })

  describe("obtenerImagen", () => {
    test("devuelve la ruta existente sin descargar si la imagen ya está en caché local", async () => {
      const fetchSpy = jest.spyOn(global, "fetch")

      // Pre-guardamos la imagen en el repositorio
      await repoImagenes.agregar(100, bufferFalso, "full")

      const ruta = await servicio.obtenerImagen(100, "full")
      expect(ruta).toBe(path.join(repoImagenes.rutaFull, "100.jpg"))
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    test("lanza NotFoundError si la carta no existe en RepositorioCartas", async () => {
      await expect(servicio.obtenerImagen(999, "full")).rejects.toThrow(NotFoundError)
    })

    test("descarga la imagen 'full' de la API externa (mock) y la guarda localmente", async () => {
      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => bufferFalso
      })

      const ruta = await servicio.obtenerImagen(100, "full")

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://images.ygoprodeck.com/full/100.jpg",
        expect.any(Object)
      )
      expect(await existe(ruta)).toBe(true)
      expect(repoImagenes.imagenesFull.has(100)).toBe(true)
    })

    test("descarga la imagen 'small' usando la URL correspondiente", async () => {
      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => bufferFalso
      })

      const ruta = await servicio.obtenerImagen(100, "small")

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://images.ygoprodeck.com/small/100.jpg",
        expect.any(Object)
      )
      expect(await existe(ruta)).toBe(true)
      expect(repoImagenes.imagenesSmall.has(100)).toBe(true)
    })

    test("desduplica descargas concurrentes para la misma carta y tipo", async () => {
      const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => bufferFalso
      })

      // Lanzamos dos peticiones concurrentes para la misma imagen
      const [ruta1, ruta2] = await Promise.all([
        servicio.obtenerImagen(100, "full"),
        servicio.obtenerImagen(100, "full")
      ])

      expect(ruta1).toBe(ruta2)
      // Solo debió llamarse a fetch una sola vez
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })
})
