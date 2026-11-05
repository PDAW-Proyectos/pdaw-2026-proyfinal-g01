import { mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioCartas } from "../src/repositories/RepositorioCartas.js"
import { ServicioCartas } from "../src/services/ServicioCartas.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDbReal = path.join(carpetaDataTest, "cartasApiReal.json")

const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

describe("ServicioCartas con API Real de YGOPRODeck", () => {
  beforeAll(async () => {
    await mkdir(carpetaDataTest, { recursive: true })
  })

  test("descarga todas las cartas reales de la API y conserva dataTest/cartasApiReal.json", async () => {
    const repo = new RepositorioCartas(rutaDbReal)
    await repo.cargar()

    const servicio = new ServicioCartas(repo)
    await servicio.cargarCartas()

    // Verifica que se hayan descargado miles de cartas reales y que el archivo quede en disco
    expect(repo.cantidadTotal()).toBeGreaterThan(10000)
    expect(await existe(rutaDbReal)).toBe(true)

    // Verifica una carta conocida (Dark Magician - ID 46986414)
    const darkMagician = repo.buscar(46986414)
    expect(darkMagician).not.toBeNull()
    expect(darkMagician.name).toBe("Dark Magician")
  }, 30000)
})
