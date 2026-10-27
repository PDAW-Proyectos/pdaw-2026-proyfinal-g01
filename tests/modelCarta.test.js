import { Carta } from "../src/models/carta/Carta.js"
import { CartaMonstruo } from "../src/models/carta/CartaMonstruo.js"
import { CartaPendulo } from "../src/models/carta/CartaPendulo.js"
import { CartaLink } from "../src/models/carta/CartaLink.js"
import { CartaFactory } from "../src/models/carta/CartaFactory.js"

// ---------------------------------------------------------------------------
// Datos de prueba reutilizables (se generan nuevos objetos en cada llamada
// para que ningún test modifique los datos de otro)
// ---------------------------------------------------------------------------

/** Datos base que comparten todas las cartas. */
const datosBase = (extra = {}) => ({
  id: 1001,
  name: "Carta de prueba",
  type: "Normal Monster",
  frameType: "normal",
  race: "Dragon",
  desc: "Descripcion de prueba",
  card_images: [
    { image_url: "https://img/1.jpg", image_url_small: "https://img/1_small.jpg" },
    { image_url: "https://img/2.jpg", image_url_small: "https://img/2_small.jpg" }
  ],
  card_prices: [{ ebay_price: "1.50", amazon_price: "2.00", cardmarket_price: "0.50" }],
  ...extra
})

/** Datos de una carta de magia (Carta simple). */
const datosMagia = (extra = {}) =>
  datosBase({ name: "Pot of Greed", type: "Spell Card", frameType: "spell", race: "Normal", ...extra })

/** Datos de una carta monstruo. */
const datosMonstruo = (extra = {}) =>
  datosBase({ atk: 2500, def: 2100, level: 7, attribute: "DARK", ...extra })

/** Datos de una carta péndulo. */
const datosPendulo = (extra = {}) =>
  datosMonstruo({ frameType: "effect_pendulum", scale: 4, ...extra })

/** Datos de una carta link. */
const datosLink = (extra = {}) =>
  datosBase({
    type: "Link Monster",
    frameType: "link",
    atk: 2300,
    attribute: "LIGHT",
    linkval: 3,
    linkmarkers: ["Top", "Bottom-Left", "Bottom-Right"],
    ...extra
  })

// ---------------------------------------------------------------------------
// Carta
// ---------------------------------------------------------------------------
describe("Carta", () => {
  describe("constructor y getters", () => {
    test("asigna correctamente los atributos básicos", () => {
      const carta = new Carta(datosMagia())

      expect(carta.id).toBe(1001)
      expect(carta.name).toBe("Pot of Greed")
      expect(carta.type).toBe("Spell Card")
      expect(carta.frameType).toBe("spell")
      expect(carta.race).toBe("Normal")
      expect(carta.descripcion).toBe("Descripcion de prueba")
    })

    test("copia solo image_url e image_url_small de cada imagen", () => {
      const datos = datosMagia()
      datos.card_images[0].id = 999 // propiedad extra que no debe copiarse
      const carta = new Carta(datos)

      expect(carta.card_images).toEqual([
        { image_url: "https://img/1.jpg", image_url_small: "https://img/1_small.jpg" },
        { image_url: "https://img/2.jpg", image_url_small: "https://img/2_small.jpg" }
      ])
    })

    test("guarda solo ebay_price y amazon_price del primer precio", () => {
      const carta = new Carta(datosMagia())

      expect(carta.card_prices).toEqual({ ebay_price: "1.50", amazon_price: "2.00" })
    })

    test("card_images devuelve una copia y no la lista interna", () => {
      const carta = new Carta(datosMagia())
      const imagenes = carta.card_images
      imagenes.push({ image_url: "x", image_url_small: "y" })

      expect(carta.card_images).toHaveLength(2)
    })

    test("acepta una lista de imágenes vacía", () => {
      const carta = new Carta(datosMagia({ card_images: [] }))

      expect(carta.card_images).toEqual([])
    })

    test("guarda la información de banlist cuando se proporciona", () => {
      const carta = new Carta(datosMagia({ banlist_info: { ban_tcg: "Banned" } }))

      expect(carta.banlist_info).toEqual({ ban_tcg: "Banned" })
    })

    test("banlist_info es un objeto vacío cuando no se proporciona", () => {
      const carta = new Carta(datosMagia())

      expect(carta.banlist_info).toEqual({})
    })

    test("banlist_info devuelve una copia y no el objeto interno", () => {
      const carta = new Carta(datosMagia({ banlist_info: { ban_tcg: "Banned" } }))
      const banlist = carta.banlist_info
      banlist.ban_tcg = "Unlimited"

      expect(carta.banlist_info).toEqual({ ban_tcg: "Banned" })
    })

    test("card_prices devuelve una copia y no el objeto interno", () => {
      const carta = new Carta(datosMagia())
      const precios = carta.card_prices
      precios.ebay_price = "999"

      expect(carta.card_prices.ebay_price).toBe("1.50")
    })

    test("lanza un error si falta card_images", () => {
      expect(() => new Carta(datosMagia({ card_images: undefined }))).toThrow()
    })

    test("lanza un error si falta card_prices", () => {
      expect(() => new Carta(datosMagia({ card_prices: undefined }))).toThrow()
    })
  })

  describe("toJSON()", () => {
    test("devuelve un objeto con todos los atributos de la carta", () => {
      const json = new Carta(datosMagia()).toJSON()

      expect(json).toEqual({
        id: 1001,
        name: "Pot of Greed",
        type: "Spell Card",
        frameType: "spell",
        race: "Normal",
        desc: "Descripcion de prueba",
        card_images: [
          { image_url: "https://img/1.jpg", image_url_small: "https://img/1_small.jpg" },
          { image_url: "https://img/2.jpg", image_url_small: "https://img/2_small.jpg" }
        ],
        card_prices: { ebay_price: "1.50", amazon_price: "2.00" }
      })
    })

    test("no incluye banlist_info si la carta no la tiene", () => {
      const json = new Carta(datosMagia()).toJSON()

      expect(json).not.toHaveProperty("banlist_info")
    })

    test("no incluye banlist_info si se proporciona un objeto vacío", () => {
      const json = new Carta(datosMagia({ banlist_info: {} })).toJSON()

      expect(json).not.toHaveProperty("banlist_info")
    })

    test("incluye banlist_info si la carta la tiene", () => {
      const json = new Carta(datosMagia({ banlist_info: { ban_tcg: "Limited" } })).toJSON()

      expect(json.banlist_info).toEqual({ ban_tcg: "Limited" })
    })

    test("es compatible con JSON.stringify", () => {
      const carta = new Carta(datosMagia())
      const texto = JSON.stringify(carta)

      expect(JSON.parse(texto).name).toBe("Pot of Greed")
    })
  })
})

// ---------------------------------------------------------------------------
// CartaFactory
// ---------------------------------------------------------------------------
describe("CartaFactory", () => {
  test.each([
    ["spell", Carta],
    ["trap", Carta],
    ["skill", Carta]
  ])("crea una Carta simple para frameType '%s'", (frameType, Clase) => {
    const carta = CartaFactory.fromJSON(datosMagia({ frameType }))

    expect(carta).toBeInstanceOf(Clase)
    expect(carta).not.toBeInstanceOf(CartaMonstruo)
  })

  test.each(["normal", "effect", "fusion", "ritual", "synchro", "xyz"])(
    "crea una CartaMonstruo para frameType '%s'",
    (frameType) => {
      const carta = CartaFactory.fromJSON(datosMonstruo({ frameType }))

      expect(carta).toBeInstanceOf(CartaMonstruo)
      expect(carta).not.toBeInstanceOf(CartaPendulo)
      expect(carta).not.toBeInstanceOf(CartaLink)
    }
  )

  test.each(["normal_pendulum", "effect_pendulum", "xyz_pendulum"])(
    "crea una CartaPendulo para frameType '%s'",
    (frameType) => {
      const carta = CartaFactory.fromJSON(datosPendulo({ frameType }))

      expect(carta).toBeInstanceOf(CartaPendulo)
    }
  )

  test("crea una CartaLink para frameType 'link'", () => {
    const carta = CartaFactory.fromJSON(datosLink())

    expect(carta).toBeInstanceOf(CartaLink)
  })

  test("conserva los datos de la carta creada", () => {
    const carta = CartaFactory.fromJSON(datosMonstruo())

    expect(carta.name).toBe("Carta de prueba")
    expect(carta.atk).toBe(2500)
  })
})

// ---------------------------------------------------------------------------
// CartaMonstruo
// ---------------------------------------------------------------------------
describe("CartaMonstruo", () => {
  describe("constructor y getters", () => {
    test("es una instancia de Carta", () => {
      const carta = new CartaMonstruo(datosMonstruo())

      expect(carta).toBeInstanceOf(Carta)
    })

    test("hereda los atributos de Carta", () => {
      const carta = new CartaMonstruo(datosMonstruo())

      expect(carta.id).toBe(1001)
      expect(carta.name).toBe("Carta de prueba")
      expect(carta.race).toBe("Dragon")
    })

    test("asigna atk, def, level y attribute", () => {
      const carta = new CartaMonstruo(datosMonstruo())

      expect(carta.atk).toBe(2500)
      expect(carta.def).toBe(2100)
      expect(carta.level).toBe(7)
      expect(carta.attribute).toBe("DARK")
    })

    test("def y level quedan en null si no se proporcionan", () => {
      const carta = new CartaMonstruo(datosMonstruo({ def: undefined, level: undefined }))

      expect(carta.def).toBeNull()
      expect(carta.level).toBeNull()
    })

    test("conserva el valor 0 en atk, def y level", () => {
      const carta = new CartaMonstruo(datosMonstruo({ atk: 0, def: 0, level: 0 }))

      expect(carta.atk).toBe(0)
      expect(carta.def).toBe(0)
      expect(carta.level).toBe(0)
    })
  })

  describe("toJSON()", () => {
    test("incluye los atributos de Carta y los propios del monstruo", () => {
      const json = new CartaMonstruo(datosMonstruo()).toJSON()

      expect(json).toMatchObject({
        id: 1001,
        name: "Carta de prueba",
        type: "Normal Monster",
        frameType: "normal",
        race: "Dragon",
        desc: "Descripcion de prueba",
        atk: 2500,
        def: 2100,
        level: 7,
        attribute: "DARK"
      })
    })

    test("serializa def y level como null cuando no existen", () => {
      const json = new CartaMonstruo(datosMonstruo({ def: undefined, level: undefined })).toJSON()

      expect(json.def).toBeNull()
      expect(json.level).toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// CartaPendulo
// ---------------------------------------------------------------------------
describe("CartaPendulo", () => {
  describe("constructor y getters", () => {
    test("es una instancia de CartaMonstruo y de Carta", () => {
      const carta = new CartaPendulo(datosPendulo())

      expect(carta).toBeInstanceOf(CartaMonstruo)
      expect(carta).toBeInstanceOf(Carta)
    })

    test("asigna la escala péndulo", () => {
      const carta = new CartaPendulo(datosPendulo())

      expect(carta.scale).toBe(4)
    })

    test("hereda los atributos de CartaMonstruo", () => {
      const carta = new CartaPendulo(datosPendulo())

      expect(carta.atk).toBe(2500)
      expect(carta.def).toBe(2100)
      expect(carta.level).toBe(7)
      expect(carta.attribute).toBe("DARK")
    })

    test("conserva la escala 0", () => {
      const carta = new CartaPendulo(datosPendulo({ scale: 0 }))

      expect(carta.scale).toBe(0)
    })
  })

  describe("toJSON()", () => {
    test("incluye la escala además de los atributos heredados", () => {
      const json = new CartaPendulo(datosPendulo()).toJSON()

      expect(json).toMatchObject({
        name: "Carta de prueba",
        frameType: "effect_pendulum",
        atk: 2500,
        def: 2100,
        level: 7,
        attribute: "DARK",
        scale: 4
      })
    })
  })
})

// ---------------------------------------------------------------------------
// CartaLink
// ---------------------------------------------------------------------------
describe("CartaLink", () => {
  describe("constructor y getters", () => {
    test("es una instancia de CartaMonstruo y de Carta", () => {
      const carta = new CartaLink(datosLink())

      expect(carta).toBeInstanceOf(CartaMonstruo)
      expect(carta).toBeInstanceOf(Carta)
    })

    test("asigna linkval y linkmarkers", () => {
      const carta = new CartaLink(datosLink())

      expect(carta.linkval).toBe(3)
      expect(carta.linkmarkers).toEqual(["Top", "Bottom-Left", "Bottom-Right"])
    })

    test("def y level quedan en null porque las cartas link no los tienen", () => {
      const carta = new CartaLink(datosLink())

      expect(carta.def).toBeNull()
      expect(carta.level).toBeNull()
    })

    test("hereda atk y attribute de CartaMonstruo", () => {
      const carta = new CartaLink(datosLink())

      expect(carta.atk).toBe(2300)
      expect(carta.attribute).toBe("LIGHT")
    })

    test("linkmarkers devuelve una copia y no la lista interna", () => {
      const carta = new CartaLink(datosLink())
      const flechas = carta.linkmarkers
      flechas.push("Left")

      expect(carta.linkmarkers).toHaveLength(3)
    })
  })

  describe("toJSON()", () => {
    test("incluye linkval y linkmarkers además de los atributos heredados", () => {
      const json = new CartaLink(datosLink()).toJSON()

      expect(json).toMatchObject({
        name: "Carta de prueba",
        frameType: "link",
        atk: 2300,
        def: null,
        level: null,
        attribute: "LIGHT",
        linkval: 3,
        linkmarkers: ["Top", "Bottom-Left", "Bottom-Right"]
      })
    })
  })
})
