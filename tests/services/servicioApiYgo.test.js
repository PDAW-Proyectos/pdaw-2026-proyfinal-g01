import { jest } from "@jest/globals"
import { descargarCartas, descargarImagen } from "../../src/services/ServicioApiYgo.js"
import { ExternalApiError, NotFoundError, ValidationError, TimeoutError } from "../../src/utils/errors.js"

describe("ServicioApiYgo", () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("descargarCartas", () => {
    test("devuelve el arreglo data del payload cuando la API responde 200 con JSON", async () => {
      const mockCartas = [{ id: 100, name: "Dark Magician" }]

      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json; charset=utf-8" },
        json: async () => ({ data: mockCartas })
      })

      const resultado = await descargarCartas()
      expect(resultado).toEqual(mockCartas)
    })

    test("lanza ExternalApiError si el payload viene vacío o sin propiedad data", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ data: [] })
      })

      await expect(descargarCartas()).rejects.toThrow(ExternalApiError)
    })

    test("lanza NotFoundError si la API devuelve status 404", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => "application/json" }
      })

      await expect(descargarCartas()).rejects.toThrow(NotFoundError)
    })

    test("lanza ExternalApiError si la API devuelve status 500", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
        headers: { get: () => "application/json" }
      })

      await expect(descargarCartas()).rejects.toThrow(ExternalApiError)
    })

    test("lanza ExternalApiError si el Content-Type no es application/json", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "text/html" },
        json: async () => ({ data: [{ id: 1 }] })
      })

      await expect(descargarCartas()).rejects.toThrow(ExternalApiError)
    })

    test("lanza TimeoutError si la petición es abortada por tiempo de espera", async () => {
      const timeoutError = new Error("The operation was aborted")
      timeoutError.name = "TimeoutError"

      jest.spyOn(global, "fetch").mockRejectedValue(timeoutError)

      await expect(descargarCartas()).rejects.toThrow(TimeoutError)
    })
  })

  describe("descargarImagen", () => {
    test("devuelve un Buffer con los bytes de la imagen cuando la respuesta es 200", async () => {
      const mockBytes = Buffer.from("image-binary-data")

      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => mockBytes
      })

      const buffer = await descargarImagen("https://images.ygoprodeck.com/100.jpg")
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer).toEqual(mockBytes)
    })

    test("lanza ValidationError si la URL no es válida o no inicia con http", async () => {
      await expect(descargarImagen("ftp://invalido.jpg")).rejects.toThrow(ValidationError)
      await expect(descargarImagen("")).rejects.toThrow(ValidationError)
    })

    test("lanza NotFoundError si la imagen no existe en la API (404)", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => "image/jpeg" }
      })

      await expect(descargarImagen("https://images.ygoprodeck.com/999.jpg")).rejects.toThrow(NotFoundError)
    })

    test("lanza ExternalApiError si el Content-Type devuelto no es de imagen", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "text/html" },
        arrayBuffer: async () => Buffer.from("<html>Error</html>")
      })

      await expect(descargarImagen("https://images.ygoprodeck.com/100.jpg")).rejects.toThrow(ExternalApiError)
    })

    test("lanza ExternalApiError si el buffer descargado está vacío", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "image/jpeg" },
        arrayBuffer: async () => Buffer.alloc(0)
      })

      await expect(descargarImagen("https://images.ygoprodeck.com/100.jpg")).rejects.toThrow(ExternalApiError)
    })
  })
})
