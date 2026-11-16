import { writeFile, rm, mkdir, utimes } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { jest } from "@jest/globals"
import { ProgramadorDescargas } from "../../src/utils/ProgramadorDescargas.js"
import { DatabaseError } from "../../src/utils/errors.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "..", "dataTest")
const rutaDb1 = path.join(carpetaDataTest, "programadorTest1.json")
const rutaDb2 = path.join(carpetaDataTest, "programadorTest2.json")

const crearServicioMock = (ruta, vacioInicial = true) => {
  let vacio = vacioInicial
  return {
    get ruta() {
      return ruta
    },
    estaVacio: jest.fn(() => vacio),
    actualizarCache: jest.fn(),
    descargar: jest.fn(async () => {
      vacio = false
      await writeFile(ruta, JSON.stringify({ ok: true }), "utf8")
    })
  }
}

describe("ProgramadorDescargas", () => {
  beforeAll(async () => {
    jest.restoreAllMocks()
    await mkdir(carpetaDataTest, { recursive: true })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await rm(rutaDb1, { force: true })
    await rm(rutaDb2, { force: true })
  })

  describe("constructor", () => {
    test("lanza TypeError si no recibe un arreglo no vacío", () => {
      expect(() => new ProgramadorDescargas()).toThrow(TypeError)
      expect(() => new ProgramadorDescargas([])).toThrow(TypeError)
      expect(() => new ProgramadorDescargas("invalido")).toThrow(TypeError)
    })
  })

  describe("iniciar", () => {
    test("descarga datos y actualiza la caché para todos los servicios cuyos repositorios estén vacíos", async () => {
      const servicio1 = crearServicioMock(rutaDb1, true)
      const servicio2 = crearServicioMock(rutaDb2, true)

      const programador = new ProgramadorDescargas([servicio1, servicio2])
      await programador.iniciar()

      expect(servicio1.descargar).toHaveBeenCalledTimes(1)
      expect(servicio1.actualizarCache).toHaveBeenCalledTimes(1)
      expect(servicio2.descargar).toHaveBeenCalledTimes(1)
      expect(servicio2.actualizarCache).toHaveBeenCalledTimes(1)
    })

    test("no vuelve a descargar si el archivo tiene menos de 1 semana (pero sí actualiza caché), y vuelve a descargar cuando supera 1 semana", async () => {
      const servicio = crearServicioMock(rutaDb1, true)
      const programador = new ProgramadorDescargas([servicio])

      await programador.iniciar()
      expect(servicio.descargar).toHaveBeenCalledTimes(1)
      expect(servicio.actualizarCache).toHaveBeenCalledTimes(1)

      // Menos de 1 semana: no descarga de nuevo, pero actualiza la caché desde el repositorio
      await programador.iniciar()
      expect(servicio.descargar).toHaveBeenCalledTimes(1)
      expect(servicio.actualizarCache).toHaveBeenCalledTimes(2)

      // Simular que el archivo fue modificado hace 8 días
      const haceOchoDias = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      await utimes(rutaDb1, haceOchoDias, haceOchoDias)

      await programador.iniciar()
      expect(servicio.descargar).toHaveBeenCalledTimes(2)
      expect(servicio.actualizarCache).toHaveBeenCalledTimes(3)
    })

    test("reintenta hasta 3 veces si descargar() falla y lanza DatabaseError al agotarse los intentos", async () => {
      const servicioFalla = {
        get ruta() {
          return rutaDb1
        },
        estaVacio: jest.fn(() => true),
        actualizarCache: jest.fn(),
        descargar: jest.fn(async () => {
          throw new Error("Fallo de red")
        })
      }

      const programador = new ProgramadorDescargas([servicioFalla])

      await expect(programador.iniciar()).rejects.toThrow(DatabaseError)
      expect(servicioFalla.descargar).toHaveBeenCalledTimes(3)
      expect(servicioFalla.actualizarCache).not.toHaveBeenCalled()
    })

    test("lanza DatabaseError si no puede obtener stats del archivo cuando no está vacío", async () => {
      const servicioSinArchivo = {
        get ruta() {
          return path.join(carpetaDataTest, "noExiste.json")
        },
        estaVacio: jest.fn(() => false),
        actualizarCache: jest.fn(),
        descargar: jest.fn()
      }

      const programador = new ProgramadorDescargas([servicioSinArchivo])

      await expect(programador.iniciar()).rejects.toThrow(DatabaseError)
      expect(servicioSinArchivo.descargar).not.toHaveBeenCalled()
      expect(servicioSinArchivo.actualizarCache).not.toHaveBeenCalled()
    })
  })
})
