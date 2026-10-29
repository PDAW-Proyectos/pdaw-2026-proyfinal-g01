import { Mazo } from "../src/models/Mazo.js"
import { ValidationError } from "../src/errors.js"

// ---------------------------------------------------------------------------
// Datos de prueba reutilizables
// ---------------------------------------------------------------------------

const datosMazoBase = (extra = {}) => ({
  id: 1,
  nombre: "Mazo Blue-Eyes",
  mainDeck: [100, 101, 102],
  extraDeck: [200, 201],
  ...extra,
})

// ---------------------------------------------------------------------------
// Mazo
// ---------------------------------------------------------------------------

describe("Mazo", () => {
  describe("constructor y getters", () => {
    test("asigna correctamente id, nombre, mainDeck y extraDeck", () => {
      const mazo = new Mazo(datosMazoBase())

      expect(mazo.id).toBe(1)
      expect(mazo.nombre).toBe("Mazo Blue-Eyes")
      expect(mazo.mainDeck).toEqual([100, 101, 102])
      expect(mazo.extraDeck).toEqual([200, 201])
    })

    test("recorta espacios en blanco al inicio y final del nombre", () => {
      const mazo = new Mazo(datosMazoBase({ nombre: "   Mazo Dark Magician   " }))

      expect(mazo.nombre).toBe("Mazo Dark Magician")
    })

    test("inicializa mainDeck y extraDeck como arreglos vacíos por defecto", () => {
      const mazo = new Mazo({ id: 1, nombre: "Mazo Vacío" })

      expect(mazo.mainDeck).toEqual([])
      expect(mazo.extraDeck).toEqual([])
    })

    test("mainDeck y extraDeck devuelven copias y no las listas internas", () => {
      const mazo = new Mazo(datosMazoBase())

      mazo.mainDeck.push(999)
      mazo.extraDeck.push(888)

      expect(mazo.mainDeck).toEqual([100, 101, 102])
      expect(mazo.extraDeck).toEqual([200, 201])
    })

    test("modificar los arreglos pasados al constructor no afecta al mazo creado", () => {
      const main = [100, 101]
      const extra = [200]
      const mazo = new Mazo({ id: 1, nombre: "Mazo", mainDeck: main, extraDeck: extra })

      main.push(999)
      extra.push(888)

      expect(mazo.mainDeck).toEqual([100, 101])
      expect(mazo.extraDeck).toEqual([200])
    })

    test.each([0, -1, -50, 1.5, "1", null, undefined, NaN])(
      "lanza ValidationError si el id es inválido (%p)",
      (idInvalido) => {
        expect(() => new Mazo(datosMazoBase({ id: idInvalido }))).toThrow(ValidationError)
      }
    )

    test.each(["", "   ", null, undefined, 123, {}])(
      "lanza ValidationError si el nombre es inválido (%p)",
      (nombreInvalido) => {
        expect(() => new Mazo(datosMazoBase({ nombre: nombreInvalido }))).toThrow(ValidationError)
      }
    )

    test("permite crear un mazo con exactamente 60 cartas en mainDeck y 15 en extraDeck", () => {
      const main60 = Array.from({ length: 60 }, (_, i) => i + 1)
      const extra15 = Array.from({ length: 15 }, (_, i) => i + 100)

      const mazo = new Mazo(datosMazoBase({ mainDeck: main60, extraDeck: extra15 }))

      expect(mazo.mainDeck).toHaveLength(60)
      expect(mazo.extraDeck).toHaveLength(15)
    })

    test("lanza ValidationError si mainDeck supera las 60 cartas", () => {
      const main61 = Array.from({ length: 61 }, (_, i) => i + 1)

      expect(() => new Mazo(datosMazoBase({ mainDeck: main61 }))).toThrow(ValidationError)
    })

    test("lanza ValidationError si extraDeck supera las 15 cartas", () => {
      const extra16 = Array.from({ length: 16 }, (_, i) => i + 1)

      expect(() => new Mazo(datosMazoBase({ extraDeck: extra16 }))).toThrow(ValidationError)
    })
  })

  describe("toJSON y fromJSON", () => {
    test("toJSON devuelve un objeto plano con los datos del mazo", () => {
      const datos = datosMazoBase()
      const mazo = new Mazo(datos)

      expect(mazo.toJSON()).toEqual(datos)
    })

    test("fromJSON reconstruye una instancia de Mazo equivalente", () => {
      const datos = datosMazoBase()
      const mazo = Mazo.fromJSON(datos)

      expect(mazo).toBeInstanceOf(Mazo)
      expect(mazo.toJSON()).toEqual(datos)
    })
  })

  describe("valido()", () => {
    test("devuelve false si mainDeck tiene menos de 40 cartas", () => {
      const mazoVacio = new Mazo({ id: 1, nombre: "Vacío" })
      const mazo39 = new Mazo({
        id: 2,
        nombre: "Casi lleno",
        mainDeck: Array.from({ length: 39 }, (_, i) => i + 1),
      })

      expect(mazoVacio.valido()).toBe(false)
      expect(mazo39.valido()).toBe(false)
    })

    test("devuelve true si mainDeck tiene entre 40 y 60 cartas", () => {
      const mazo40 = new Mazo({
        id: 1,
        nombre: "Mazo 40",
        mainDeck: Array.from({ length: 40 }, (_, i) => i + 1),
      })
      const mazo60 = new Mazo({
        id: 2,
        nombre: "Mazo 60",
        mainDeck: Array.from({ length: 60 }, (_, i) => i + 1),
      })

      expect(mazo40.valido()).toBe(true)
      expect(mazo60.valido()).toBe(true)
    })
  })

  describe("agregarCarta()", () => {
    test("agrega una carta a mainDeck por defecto y devuelve true", () => {
      const mazo = new Mazo({ id: 1, nombre: "Mazo" })

      const resultado = mazo.agregarCarta(500)

      expect(resultado).toBe(true)
      expect(mazo.mainDeck).toEqual([500])
      expect(mazo.extraDeck).toEqual([])
    })

    test("agrega una carta a extraDeck cuando destino es 'extra'", () => {
      const mazo = new Mazo({ id: 1, nombre: "Mazo" })

      const resultado = mazo.agregarCarta(700, "none", "extra")

      expect(resultado).toBe(true)
      expect(mazo.extraDeck).toEqual([700])
      expect(mazo.mainDeck).toEqual([])
    })

    test.each([0, -10, 2.5, "100", null, undefined, NaN])(
      "lanza ValidationError si idCarta no es un entero positivo (%p)",
      (idCartaInvalido) => {
        const mazo = new Mazo({ id: 1, nombre: "Mazo" })

        expect(() => mazo.agregarCarta(idCartaInvalido)).toThrow(ValidationError)
      }
    )

    test("lanza ValidationError si el destino no es 'main' ni 'extra'", () => {
      const mazo = new Mazo({ id: 1, nombre: "Mazo" })

      expect(() => mazo.agregarCarta(100, "none", "side")).toThrow(ValidationError)
    })

    test("lanza ValidationError si banInfo no es un estado válido", () => {
      const mazo = new Mazo({ id: 1, nombre: "Mazo" })

      expect(() => mazo.agregarCarta(100, "EstadoInexistente", "main")).toThrow(ValidationError)
    })

    describe("límites de copias según banlist (MAX_COPIAS_POR_CARTA)", () => {
      test("Forbidden: no permite agregar ni siquiera 1 copia", () => {
        const mazo = new Mazo({ id: 1, nombre: "Mazo" })

        expect(() => mazo.agregarCarta(100, "Forbidden", "main")).toThrow(ValidationError)
        expect(mazo.mainDeck).toEqual([])
      })

      test("Limited: permite hasta 1 copia y rechaza la segunda", () => {
        const mazo = new Mazo({ id: 1, nombre: "Mazo" })

        expect(mazo.agregarCarta(100, "Limited", "main")).toBe(true)
        expect(() => mazo.agregarCarta(100, "Limited", "main")).toThrow(ValidationError)
        expect(mazo.mainDeck).toEqual([100])
      })

      test("Semi-Limited: permite hasta 2 copias y rechaza la tercera", () => {
        const mazo = new Mazo({ id: 1, nombre: "Mazo" })

        expect(mazo.agregarCarta(100, "Semi-Limited", "main")).toBe(true)
        expect(mazo.agregarCarta(100, "Semi-Limited", "main")).toBe(true)
        expect(() => mazo.agregarCarta(100, "Semi-Limited", "main")).toThrow(ValidationError)
        expect(mazo.mainDeck).toEqual([100, 100])
      })

      test("none: permite hasta 3 copias y rechaza la cuarta", () => {
        const mazo = new Mazo({ id: 1, nombre: "Mazo" })

        expect(mazo.agregarCarta(100, "none", "main")).toBe(true)
        expect(mazo.agregarCarta(100, "none", "main")).toBe(true)
        expect(mazo.agregarCarta(100, "none", "main")).toBe(true)
        expect(() => mazo.agregarCarta(100, "none", "main")).toThrow(ValidationError)
        expect(mazo.mainDeck).toEqual([100, 100, 100])
      })

      test("cuenta las copias sumando tanto mainDeck como extraDeck", () => {
        const mazo = new Mazo({
          id: 1,
          nombre: "Mazo",
          mainDeck: [100, 100],
          extraDeck: [100],
        })

        expect(() => mazo.agregarCarta(100, "none", "extra")).toThrow(ValidationError)
      })
    })

    describe("límites de tamaño de mazo", () => {
      test("lanza ValidationError al intentar agregar a mainDeck cuando ya tiene 60 cartas", () => {
        const main60 = Array.from({ length: 60 }, (_, i) => i + 1)
        const mazo = new Mazo({ id: 1, nombre: "Mazo Lleno", mainDeck: main60 })

        expect(() => mazo.agregarCarta(999, "none", "main")).toThrow(ValidationError)
        expect(mazo.mainDeck).toHaveLength(60)
      })

      test("lanza ValidationError al intentar agregar a extraDeck cuando ya tiene 15 cartas", () => {
        const extra15 = Array.from({ length: 15 }, (_, i) => i + 1)
        const mazo = new Mazo({ id: 1, nombre: "Extra Lleno", extraDeck: extra15 })

        expect(() => mazo.agregarCarta(999, "none", "extra")).toThrow(ValidationError)
        expect(mazo.extraDeck).toHaveLength(15)
      })
    })
  })

  describe("eliminarCarta()", () => {
    test("elimina una carta existente en mainDeck y devuelve true", () => {
      const mazo = new Mazo(datosMazoBase({ mainDeck: [100, 101, 102] }))

      expect(mazo.eliminarCarta(101)).toBe(true)
      expect(mazo.mainDeck).toEqual([100, 102])
    })

    test("elimina una carta existente en extraDeck si no está en mainDeck y devuelve true", () => {
      const mazo = new Mazo(datosMazoBase({ mainDeck: [100], extraDeck: [200, 201] }))

      expect(mazo.eliminarCarta(201)).toBe(true)
      expect(mazo.extraDeck).toEqual([200])
    })

    test("elimina solo una copia cuando hay cartas repetidas", () => {
      const mazo = new Mazo(datosMazoBase({ mainDeck: [100, 100, 100] }))

      expect(mazo.eliminarCarta(100)).toBe(true)
      expect(mazo.mainDeck).toEqual([100, 100])
    })

    test("devuelve false si la carta no se encuentra en ningún mazo", () => {
      const mazo = new Mazo(datosMazoBase())

      expect(mazo.eliminarCarta(999)).toBe(false)
      expect(mazo.mainDeck).toEqual([100, 101, 102])
      expect(mazo.extraDeck).toEqual([200, 201])
    })
  })
})
