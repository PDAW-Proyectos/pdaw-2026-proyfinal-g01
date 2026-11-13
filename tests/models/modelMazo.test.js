import { Mazo, MAX_MAIN_DECK, MAX_EXTRA_DECK } from "../../src/models/Mazo.js"
import { ValidationError } from "../../src/utils/errors.js"

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

const datosMazoBase = (extra = {}) => ({
  id: 1,
  username: "yugi",
  nombre: "Mazo Blue-Eyes",
  mainDeck: [{ id: 100, cantidad: 1 }, { id: 101, cantidad: 1 }, { id: 102, cantidad: 1 }],
  extraDeck: [{ id: 200, cantidad: 1 }, { id: 201, cantidad: 1 }],
  ...extra
})

// ---------------------------------------------------------------------------
// Mazo
// ---------------------------------------------------------------------------

describe("Mazo", () => {
  describe("constructor y validaciones iniciales", () => {
    test("recorta espacios en blanco en username y nombre", () => {
      const mazo = new Mazo(
        datosMazoBase({ username: "   kaiba   ", nombre: "   Mazo Dragones   " })
      )
      expect(mazo.username).toBe("kaiba")
      expect(mazo.nombre).toBe("Mazo Dragones")
    })

    test("inicializa mainDeck y extraDeck vacíos por defecto", () => {
      const mazo = new Mazo({ id: 1, username: "yugi", nombre: "Mazo Inicial" })
      expect(mazo.mainDeck).toEqual([])
      expect(mazo.extraDeck).toEqual([])
    })

    test("lanza ValidationError si se inicializa con más de 60 cartas en mainDeck", () => {
      const main61 = Array.from({ length: MAX_MAIN_DECK + 1 }, (_, i) => ({ id: i + 1, cantidad: 1 }))
      expect(() => new Mazo(datosMazoBase({ mainDeck: main61 }))).toThrow(ValidationError)
    })

    test("lanza ValidationError si se inicializa con más de 15 cartas en extraDeck", () => {
      const extra16 = Array.from({ length: MAX_EXTRA_DECK + 1 }, (_, i) => ({ id: i + 1, cantidad: 1 }))
      expect(() => new Mazo(datosMazoBase({ extraDeck: extra16 }))).toThrow(ValidationError)
    })

    test("mainDeck y extraDeck devuelven copias para mantener encapsulamiento", () => {
      const mazo = new Mazo(datosMazoBase())
      mazo.mainDeck.push({ id: 999, cantidad: 1 })
      mazo.extraDeck.push({ id: 888, cantidad: 1 })
      mazo.mainDeck[0].cantidad = 99
      expect(mazo.mainDeck).toEqual([{ id: 100, cantidad: 1 }, { id: 101, cantidad: 1 }, { id: 102, cantidad: 1 }])
      expect(mazo.extraDeck).toEqual([{ id: 200, cantidad: 1 }, { id: 201, cantidad: 1 }])
    })
  })

  describe("valido()", () => {
    test("devuelve false si mainDeck tiene menos del mínimo (40 cartas)", () => {
      const mazo39 = new Mazo({
        id: 1,
        username: "yugi",
        nombre: "Incompleto",
        mainDeck: Array.from({ length: 13 }, (_, i) => ({ id: i + 1, cantidad: 3 }))
      })
      expect(mazo39.valido()).toBe(false)
    })

    test("devuelve true si mainDeck tiene al menos 40 cartas sumando las cantidades", () => {
      const mazo40 = new Mazo({
        id: 1,
        username: "yugi",
        nombre: "Completo",
        mainDeck: [
          ...Array.from({ length: 13 }, (_, i) => ({ id: i + 1, cantidad: 3 })),
          { id: 14, cantidad: 1 }
        ]
      })
      expect(mazo40.valido()).toBe(true)
    })
  })

  describe("agregarCarta()", () => {
    test("agrega cartas con cantidad incremental al mainDeck o extraDeck según su frameType", () => {
      const mazo = new Mazo({ id: 1, username: "yugi", nombre: "Mazo" })

      mazo.agregarCarta({ id: 500, frameType: "normal" })
      mazo.agregarCarta({ id: 500, frameType: "normal" })
      mazo.agregarCarta({ id: 700, frameType: "link" })

      expect(mazo.mainDeck).toEqual([{ id: 500, cantidad: 2 }])
      expect(mazo.extraDeck).toEqual([{ id: 700, cantidad: 1 }])
    })

    test("respeta los límites de copias según la banlist", () => {
      const mazo = new Mazo({ id: 1, username: "yugi", nombre: "Mazo" })

      // Forbidden: 0 copias permitidas
      expect(() => mazo.agregarCarta({ id: 10, frameType: "normal", banlist_info: { ban_tcg: "Forbidden" } })).toThrow(ValidationError)

      // Limited: máximo 1 copia
      mazo.agregarCarta({ id: 20, frameType: "normal", banlist_info: { ban_tcg: "Limited" } })
      expect(() => mazo.agregarCarta({ id: 20, frameType: "normal", banlist_info: { ban_tcg: "Limited" } })).toThrow(ValidationError)

      // Semi-Limited: máximo 2 copias
      mazo.agregarCarta({ id: 30, frameType: "normal", banlist_info: { ban_tcg: "Semi-Limited" } })
      mazo.agregarCarta({ id: 30, frameType: "normal", banlist_info: { ban_tcg: "Semi-Limited" } })
      expect(() => mazo.agregarCarta({ id: 30, frameType: "normal", banlist_info: { ban_tcg: "Semi-Limited" } })).toThrow(ValidationError)

      // Default (sin banlist_info): máximo 3 copias sumando main y extra deck
      mazo.agregarCarta({ id: 40, frameType: "normal" })
      mazo.agregarCarta({ id: 40, frameType: "normal" })
      mazo.agregarCarta({ id: 40, frameType: "fusion" })
      expect(() => mazo.agregarCarta({ id: 40, frameType: "normal" })).toThrow(ValidationError)
    })

    test("lanza ValidationError si se intenta exceder la capacidad máxima de mainDeck o extraDeck", () => {
      const main60 = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, cantidad: 3 }))
      const extra15 = Array.from({ length: 5 }, (_, i) => ({ id: i + 100, cantidad: 3 }))
      const mazo = new Mazo(datosMazoBase({ mainDeck: main60, extraDeck: extra15 }))

      expect(() => mazo.agregarCarta({ id: 999, frameType: "normal" })).toThrow(ValidationError)
      expect(() => mazo.agregarCarta({ id: 888, frameType: "synchro" })).toThrow(ValidationError)
    })
  })

  describe("eliminarCarta()", () => {
    test("elimina una carta existente del mazo (mainDeck o extraDeck)", () => {
      const mazo = new Mazo(datosMazoBase({
        mainDeck: [{ id: 100, cantidad: 1 }, { id: 101, cantidad: 1 }],
        extraDeck: [{ id: 200, cantidad: 1 }]
      }))

      expect(mazo.eliminarCarta(101)).toBe(true)
      expect(mazo.mainDeck).toEqual([{ id: 100, cantidad: 1 }])

      expect(mazo.eliminarCarta(200)).toBe(true)
      expect(mazo.extraDeck).toEqual([])
    })

    test("decrementa la cantidad en 1 cuando hay múltiples copias", () => {
      const mazo = new Mazo(datosMazoBase({ mainDeck: [{ id: 100, cantidad: 3 }] }))
      expect(mazo.eliminarCarta(100)).toBe(true)
      expect(mazo.mainDeck).toEqual([{ id: 100, cantidad: 2 }])
    })

    test("devuelve false si la carta no se encuentra en el mazo", () => {
      const mazo = new Mazo(datosMazoBase())
      expect(mazo.eliminarCarta(9999)).toBe(false)
    })
  })

  describe("serialización (toJSON y fromJSON)", () => {
    test("serializa a objeto plano y deserializa conservando los datos", () => {
      const datos = datosMazoBase()
      const mazo = new Mazo(datos)
      const json = mazo.toJSON()

      expect(json).toEqual(datos)

      const mazoReconstruido = Mazo.fromJSON(json)
      expect(mazoReconstruido).toBeInstanceOf(Mazo)
      expect(mazoReconstruido.toJSON()).toEqual(datos)
    })
  })
})
