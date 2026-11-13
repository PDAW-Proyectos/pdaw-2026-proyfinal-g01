import { jest } from "@jest/globals"
import {
  descargarCartas,
  descargarImagen,
  descargarMazosPopulares
} from "../../src/services/ServicioApiYgo.js"
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

  describe("descargarMazosPopulares", () => {
    test("descarga el top de mazos y sus cartas desde YuGiOhMeta con fallback a MasterDuelMeta", async () => {
      const fetchSpy = jest
        .spyOn(global, "fetch")
        // 1. Lista de top mazos en MasterDuelMeta
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => "application/json; charset=utf-8" },
          json: async () => [
            { _id: "1", name: "Dracotail", tournamentPower: 14.8, tournamentPowerTrend: 1.2 },
            { _id: "2", name: "Snake-Eye Fiendsmith", tournamentPower: 11.4, tournamentPowerTrend: -0.5 }
          ]
        })
        // 2. Cartas de "Dracotail" encontradas en YuGiOhMeta (deckBreakdownTCG.cards)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => [
            {
              deckBreakdownTCG: {
                cards: [
                  { card: { name: "Ash Blossom & Joyous Spring" }, at: 3 }
                ]
              }
            }
          ]
        })
        // 3. "Snake-Eye Fiendsmith" sin datos en YuGiOhMeta -> activa fallback
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => []
        })
        // 4. Fallback MasterDuelMeta (sampleDeck.main + sampleDeck.extra)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => [
            {
              deckBreakdown: {
                sampleDeck: {
                  main: [{ card: { name: "Snake-Eye Ash" }, amount: 3 }],
                  extra: [{ card: { name: "Promethean Princess" }, amount: 1 }]
                }
              }
            }
          ]
        })

      const resultado = await descargarMazosPopulares()

      expect(resultado).toEqual([
        {
          nombre: "Dracotail",
          cartas: [{ name: "Ash Blossom & Joyous Spring", amount: 3 }]
        },
        {
          nombre: "Snake-Eye Fiendsmith",
          cartas: [
            { name: "Snake-Eye Ash", amount: 3 },
            { name: "Promethean Princess", amount: 1 }
          ]
        }
      ])
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://www.yugiohmeta.com/api/v1/deck-types?name=Snake-Eye%20Fiendsmith&limit=1&aggregate=aboveThresh",
        expect.any(Object)
      )
    })

    test("lanza ExternalApiError si el arreglo de mazos populares viene vacío", async () => {
      jest.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => []
      })

      await expect(descargarMazosPopulares()).rejects.toThrow(ExternalApiError)
    })
  })
})
