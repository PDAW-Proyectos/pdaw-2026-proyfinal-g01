import { Mazo, MAX_MAIN_DECK, MAX_EXTRA_DECK } from "../../src/models/Mazo.js"
import { ValidationError } from "../../src/utils/errors.js"

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

const datosMazoBase = (extra = {}) => ({
  id: 1,
  username: "yugi",
  nombre: "Mazo Blue-Eyes",
  mainDeck: [100, 101, 102],
  extraDeck: [200, 201],
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
      const main61 = Array.from({ length: MAX_MAIN_DECK + 1 }, (_, i) => i + 1)
      expect(() => new Mazo(datosMazoBase({ mainDeck: main61 }))).toThrow(ValidationError)
    })

    test("lanza ValidationError si se inicializa con más de 15 cartas en extraDeck", () => {
      const extra16 = Array.from({ length: MAX_EXTRA_DECK + 1 }, (_, i) => i + 1)
      expect(() => new Mazo(datosMazoBase({ extraDeck: extra16 }))).toThrow(ValidationError)
    })

    test("mainDeck y extraDeck devuelven copias para mantener encapsulamiento", () => {
      const mazo = new Mazo(datosMazoBase())
      mazo.mainDeck.push(999)
      mazo.extraDeck.push(888)
      expect(mazo.mainDeck).toEqual([100, 101, 102])
      expect(mazo.extraDeck).toEqual([200, 201])
    })
  })

  describe("valido()", () => {
    test("devuelve false si mainDeck tiene menos del mínimo (40 cartas)", () => {
      const mazo39 = new Mazo({
        id: 1,
        username: "yugi",
        nombre: "Incompleto",
        mainDeck: Array.from({ length: 39 }, (_, i) => i + 1)
      })
      expect(mazo39.valido()).toBe(false)
    })

    test("devuelve true si mainDeck tiene al menos 40 cartas", () => {
      const mazo40 = new Mazo({
        id: 1,
        username: "yugi",
        nombre: "Completo",
        mainDeck: Array.from({ length: 40 }, (_, i) => i + 1)
      })
      expect(mazo40.valido()).toBe(true)
    })
  })

  describe("agregarCarta()", () => {
    test("agrega una carta al mainDeck o extraDeck según el destino", () => {
      const mazo = new Mazo({ id: 1, username: "yugi", nombre: "Mazo" })

      mazo.agregarCarta(500, "none", "main")
      mazo.agregarCarta(700, "none", "extra")

      expect(mazo.mainDeck).toEqual([500])
      expect(mazo.extraDeck).toEqual([700])
    })

    test("respeta los límites de copias según la banlist", () => {
      const mazo = new Mazo({ id: 1, username: "yugi", nombre: "Mazo" })

      // Forbidden: 0 copias permitidas
      expect(() => mazo.agregarCarta(10, "Forbidden", "main")).toThrow(ValidationError)

      // Limited: máximo 1 copia
      mazo.agregarCarta(20, "Limited", "main")
      expect(() => mazo.agregarCarta(20, "Limited", "main")).toThrow(ValidationError)

      // Semi-Limited: máximo 2 copias
      mazo.agregarCarta(30, "Semi-Limited", "main")
      mazo.agregarCarta(30, "Semi-Limited", "main")
      expect(() => mazo.agregarCarta(30, "Semi-Limited", "main")).toThrow(ValidationError)

      // Default (none): máximo 3 copias sumando main y extra deck
      mazo.agregarCarta(40, "none", "main")
      mazo.agregarCarta(40, "none", "main")
      mazo.agregarCarta(40, "none", "extra")
      expect(() => mazo.agregarCarta(40, "none", "main")).toThrow(ValidationError)
    })

    test("lanza ValidationError si se intenta exceder la capacidad máxima de mainDeck o extraDeck", () => {
      const main60 = Array.from({ length: 60 }, (_, i) => i + 1)
      const extra15 = Array.from({ length: 15 }, (_, i) => i + 100)
      const mazo = new Mazo(datosMazoBase({ mainDeck: main60, extraDeck: extra15 }))

      expect(() => mazo.agregarCarta(999, "none", "main")).toThrow(ValidationError)
      expect(() => mazo.agregarCarta(888, "none", "extra")).toThrow(ValidationError)
    })
  })

  describe("eliminarCarta()", () => {
    test("elimina una carta existente del mazo (mainDeck o extraDeck)", () => {
      const mazo = new Mazo(datosMazoBase({ mainDeck: [100, 101], extraDeck: [200] }))

      expect(mazo.eliminarCarta(101)).toBe(true)
      expect(mazo.mainDeck).toEqual([100])

      expect(mazo.eliminarCarta(200)).toBe(true)
      expect(mazo.extraDeck).toEqual([])
    })

    test("elimina solo una copia cuando hay duplicados", () => {
      const mazo = new Mazo(datosMazoBase({ mainDeck: [100, 100, 100] }))
      expect(mazo.eliminarCarta(100)).toBe(true)
      expect(mazo.mainDeck).toEqual([100, 100])
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
