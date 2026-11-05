import { mkdir, access, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioCartas } from "../src/repositories/RepositorioCartas.js"
import { RepositorioImagenes } from "../src/repositories/RepositorioImagenes.js"
import { ServicioImagenes } from "../src/services/ServicioImagenes.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "dataTest")
const rutaCartasTest = path.join(carpetaDataTest, "cartas15Test.json")
const rutaImagenesTest = path.join(carpetaDataTest, "imagenes")

// 15 cartas reales de Yu-Gi-Oh! para probar la descarga concurrente y el rate limit (12 por segundo)
const IDS_15_CARTAS = [
  46986414, // Dark Magician
  89631139, // Blue-Eyes White Dragon
  74677422, // Red-Eyes Black Dragon
  55144522, // Pot of Greed
  83764718, // Monster Reborn
  44095762, // Mirror Force
  5318639,  // Mystical Space Typhoon
  12580477, // Raigeki
  40640057, // Kuriboh
  70781052, // Summoned Skull
  6368038,  // Gaia The Fierce Knight
  28279543, // Curse of Dragon
  68540058, // Celtic Guardian
  33396948, // Exodia the Forbidden One
  7902349   // Left Arm of the Forbidden One
]

const crearDatosCartasReales = () =>
  IDS_15_CARTAS.map((id, index) => ({
    id,
    name: `Carta Test ${index + 1} (${id})`,
    type: "Normal Monster",
    frameType: "normal",
    desc: "Carta de prueba para test de descarga de imagenes.",
    atk: 1000,
    def: 1000,
    level: 4,
    race: "Spellcaster",
    attribute: "DARK",
    card_images: [
      {
        id,
        image_url: `https://images.ygoprodeck.com/images/cards/${id}.jpg`,
        image_url_small: `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`
      }
    ],
    card_prices: [
      {
        ebay_price: "1.00",
        amazon_price: "1.00"
      }
    ]
  }))

const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

describe("ServicioImagenes con API Real (15 imagenes concurrentes)", () => {
  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  test("solicita 15 imagenes al mismo tiempo, respeta el limite de 12/s y las guarda en dataTest/imagenes", async () => {
    const repoCartas = new RepositorioCartas(rutaCartasTest)
    await repoCartas.cargar()
    await repoCartas.guardar(crearDatosCartasReales())

    const repoImagenes = new RepositorioImagenes(rutaImagenesTest)
    await repoImagenes.cargar()

    const servicioImagenes = new ServicioImagenes(repoImagenes, repoCartas)

    const inicioMs = Date.now()

    // Lanzamos las 15 peticiones de descarga al mismo tiempo
    const promesas = IDS_15_CARTAS.map((id) =>
      servicioImagenes.obtenerImagen(id, "small")
    )
    const rutasGuardadas = await Promise.all(promesas)

    const duracionTotalMs = Date.now() - inicioMs
    console.log(`Tiempo total para descargar 15 imagenes: ${duracionTotalMs} ms`)

    // Con 15 tickets y un intervalo de 84ms (14 esperas entre el ticket 1 y el 15):
    // 14 * 84ms = 1176ms minimo, por lo que no pueden descargarse las 15 en menos de 1 segundo
    expect(duracionTotalMs).toBeGreaterThanOrEqual(1100)
    expect(rutasGuardadas).toHaveLength(15)

    // Verificamos que las 15 imagenes se hayan guardado en dataTest/imagenes/small con tamaño > 0
    for (const id of IDS_15_CARTAS) {
      const rutaEsperada = path.join(rutaImagenesTest, "small", `${id}.jpg`)
      expect(await existe(rutaEsperada)).toBe(true)

      const info = await stat(rutaEsperada)
      expect(info.size).toBeGreaterThan(0)
    }

    expect(repoImagenes.imagenesSmall.size).toBe(15)
  }, 30000)
})
