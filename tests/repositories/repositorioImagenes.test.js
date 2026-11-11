import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioImagenes } from "../../src/repositories/RepositorioImagenes.js"
import { ValidationError } from "../../src/utils/errors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaBaseImagenes = path.join(carpetaDataTest, "imagenesRepoTest")

const bufferFalso = Buffer.from("fake-jpeg-binary-data")

const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

beforeAll(async () => {
  await mkdir(carpetaDataTest, { recursive: true })
})

beforeEach(async () => {
  await rm(rutaBaseImagenes, { force: true, recursive: true })
})

afterAll(async () => {
  await rm(rutaBaseImagenes, { force: true, recursive: true })
})

describe("RepositorioImagenes", () => {
  describe("cargar", () => {
    test("escanea carpetas full y small cargando IDs válidos e ignorando archivos vacíos o no-jpg", async () => {
      const rutaFull = path.join(rutaBaseImagenes, "full")
      const rutaSmall = path.join(rutaBaseImagenes, "small")
      await mkdir(rutaFull, { recursive: true })
      await mkdir(rutaSmall, { recursive: true })

      // Archivos válidos
      await writeFile(path.join(rutaFull, "100.jpg"), bufferFalso)
      await writeFile(path.join(rutaSmall, "100.jpg"), bufferFalso)
      await writeFile(path.join(rutaSmall, "200.jpg"), bufferFalso)

      // Archivo vacío (0 bytes) y archivo que no es jpg
      await writeFile(path.join(rutaFull, "300.jpg"), Buffer.alloc(0))
      await writeFile(path.join(rutaFull, "ignore.txt"), "texto")

      const repo = new RepositorioImagenes(rutaBaseImagenes)
      await repo.cargar()

      expect(repo.imagenesFull.has(100)).toBe(true)
      expect(repo.imagenesFull.has(300)).toBe(false)
      expect(repo.imagenesSmall.has(100)).toBe(true)
      expect(repo.imagenesSmall.has(200)).toBe(true)

      // Archivo no .jpg y el archivo vacío de 0 bytes deben haber sido eliminados
      expect(await existe(path.join(rutaFull, "ignore.txt"))).toBe(false)
      expect(await existe(path.join(rutaFull, "300.jpg"))).toBe(false)
    })
  })

  describe("buscar", () => {
    test("devuelve la ruta absoluta si la imagen existe en el set y en disco", async () => {
      const repo = new RepositorioImagenes(rutaBaseImagenes)
      await repo.cargar()
      await repo.agregar(100, bufferFalso, "full")

      const rutaEncontrada = await repo.buscar(100, "full")
      expect(rutaEncontrada).toBe(path.join(repo.rutaFull, "100.jpg"))
      expect(await existe(rutaEncontrada)).toBe(true)
    })

    test("devuelve null si la imagen no ha sido descargada", async () => {
      const repo = new RepositorioImagenes(rutaBaseImagenes)
      await repo.cargar()

      expect(await repo.buscar(999, "full")).toBeNull()
      expect(await repo.buscar(999, "small")).toBeNull()
    })

    test("lanza ValidationError si se busca con un tipo no válido", async () => {
      const repo = new RepositorioImagenes(rutaBaseImagenes)
      await repo.cargar()

      await expect(repo.buscar(100, "thumbnail")).rejects.toThrow(ValidationError)
    })
  })

  describe("agregar", () => {
    test("guarda el buffer en disco atómicamente y actualiza el Set correspondiente", async () => {
      const repo = new RepositorioImagenes(rutaBaseImagenes)
      await repo.cargar()

      const ruta = await repo.agregar(500, bufferFalso, "small")
      expect(ruta).toBe(path.join(repo.rutaSmall, "500.jpg"))
      expect(repo.imagenesSmall.has(500)).toBe(true)

      const contenido = await readFile(ruta)
      expect(contenido).toEqual(bufferFalso)
    })

    test("si la imagen ya existe en el Set, retorna la ruta sin volver a escribir", async () => {
      const repo = new RepositorioImagenes(rutaBaseImagenes)
      await repo.cargar()

      const ruta1 = await repo.agregar(100, bufferFalso, "full")
      const ruta2 = await repo.agregar(100, Buffer.from("otro-contenido"), "full")

      expect(ruta1).toBe(ruta2)
      // El contenido original no debió sobreescribirse
      const contenido = await readFile(ruta1)
      expect(contenido).toEqual(bufferFalso)
    })

    test("lanza ValidationError si el buffer está vacío", async () => {
      const repo = new RepositorioImagenes(rutaBaseImagenes)
      await repo.cargar()

      await expect(repo.agregar(100, Buffer.alloc(0), "full")).rejects.toThrow(ValidationError)
    })
  })
})
