import { Carta } from "../../src/models/carta/Carta.js"
import { CartaMonstruo } from "../../src/models/carta/CartaMonstruo.js"
import { CartaPendulo } from "../../src/models/carta/CartaPendulo.js"
import { CartaLink } from "../../src/models/carta/CartaLink.js"
import { CartaFactory } from "../../src/models/carta/CartaFactory.js"

// ---------------------------------------------------------------------------
// Generadores de datos de prueba
// ---------------------------------------------------------------------------

const datosBase = (extra = {}) => ({
  id: 1001,
  name: "Carta de prueba",
  type: "Normal Monster",
  frameType: "normal",
  race: "Dragon",
  desc: "Descripcion de prueba",
  card_images: [
    { image_url: "https://img/1.jpg", image_url_small: "https://img/1_small.jpg" }
  ],
  card_prices: [
    { ebay_price: "1.50", amazon_price: "2.00" }
  ],
  ...extra
})

const datosMagia = (extra = {}) =>
  datosBase({ name: "Pot of Greed", type: "Spell Card", frameType: "spell", race: "Normal", ...extra })

const datosMonstruo = (extra = {}) =>
  datosBase({ atk: 2500, def: 2100, level: 7, attribute: "DARK", ...extra })

const datosPendulo = (extra = {}) =>
  datosMonstruo({ frameType: "effect_pendulum", scale: 4, ...extra })

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
// CartaFactory
// ---------------------------------------------------------------------------
describe("CartaFactory", () => {
  test.each([
    ["spell", Carta],
    ["trap", Carta],
    ["skill", Carta]
  ])("crea instancia de Carta base para frameType '%s'", (frameType, Clase) => {
    const carta = CartaFactory.fromJSON(datosMagia({ frameType }))
    expect(carta).toBeInstanceOf(Clase)
    expect(carta).not.toBeInstanceOf(CartaMonstruo)
  })

  test.each(["normal", "effect", "fusion", "ritual", "synchro", "xyz"])(
    "crea CartaMonstruo para frameType '%s'",
    (frameType) => {
      const carta = CartaFactory.fromJSON(datosMonstruo({ frameType }))
      expect(carta).toBeInstanceOf(CartaMonstruo)
      expect(carta).not.toBeInstanceOf(CartaPendulo)
      expect(carta).not.toBeInstanceOf(CartaLink)
    }
  )

  test.each(["normal_pendulum", "effect_pendulum", "xyz_pendulum"])(
    "crea CartaPendulo para frameType '%s'",
    (frameType) => {
      const carta = CartaFactory.fromJSON(datosPendulo({ frameType }))
      expect(carta).toBeInstanceOf(CartaPendulo)
    }
  )

  test("crea CartaLink para frameType 'link'", () => {
    const carta = CartaFactory.fromJSON(datosLink())
    expect(carta).toBeInstanceOf(CartaLink)
  })
})

// ---------------------------------------------------------------------------
// Carta
// ---------------------------------------------------------------------------
describe("Carta", () => {
  describe("cálculo de precio (card_price)", () => {
    test("calcula el mayor precio numérico entre ebay_price y amazon_price", () => {
      const carta = new Carta(datosMagia({
        card_prices: [
          { ebay_price: "1.50", amazon_price: "3.75" },
          { ebay_price: "5.00", amazon_price: "2.10" }
        ]
      }))
      expect(carta.card_price).toBe(5)
    })

    test("devuelve 0 si la lista de precios está vacía", () => {
      const carta = new Carta(datosMagia({ card_prices: [] }))
      expect(carta.card_price).toBe(0)
    })
  })

  describe("serialización (toJSON y toDTO)", () => {
    test("toJSON formatea todos los atributos de persistencia", () => {
      const carta = new Carta(datosMagia({ banlist_info: { ban_tcg: "Limited" } }))
      expect(carta.toJSON()).toEqual({
        id: 1001,
        name: "Pot of Greed",
        type: "Spell Card",
        frameType: "spell",
        race: "Normal",
        desc: "Descripcion de prueba",
        banlist_info: { ban_tcg: "Limited" },
        card_images: [
          { image_url: "https://img/1.jpg", image_url_small: "https://img/1_small.jpg" }
        ],
        card_prices: [
          { ebay_price: "1.50", amazon_price: "2.00" }
        ]
      })
    })

    test("toJSON omite banlist_info si la carta no tiene restricciones", () => {
      const carta = new Carta(datosMagia())
      expect(carta.toJSON()).not.toHaveProperty("banlist_info")
    })

    test("toDTO incluye card_price y omite frameType, card_images y card_prices", () => {
      const carta = new Carta(datosMagia())
      expect(carta.toDTO()).toEqual({
        id: 1001,
        name: "Pot of Greed",
        type: "Spell Card",
        race: "Normal",
        desc: "Descripcion de prueba",
        card_price: 2
      })
    })
  })
})

// ---------------------------------------------------------------------------
// CartaMonstruo
// ---------------------------------------------------------------------------
describe("CartaMonstruo", () => {
  test("asigna def y level en null cuando no se especifican", () => {
    const carta = new CartaMonstruo(datosMonstruo({ def: undefined, level: undefined }))
    expect(carta.def).toBeNull()
    expect(carta.level).toBeNull()
  })

  test("serializa toJSON y toDTO con atributos de monstruo", () => {
    const carta = new CartaMonstruo(datosMonstruo())
    expect(carta.toJSON()).toMatchObject({
      atk: 2500,
      def: 2100,
      level: 7,
      attribute: "DARK"
    })
    expect(carta.toDTO()).toMatchObject({
      atk: 2500,
      def: 2100,
      level: 7,
      attribute: "DARK",
      card_price: 2
    })
  })
})

// ---------------------------------------------------------------------------
// CartaPendulo
// ---------------------------------------------------------------------------
describe("CartaPendulo", () => {
  test("serializa toJSON y toDTO incluyendo escala péndulo", () => {
    const carta = new CartaPendulo(datosPendulo())
    expect(carta.scale).toBe(4)
    expect(carta.toJSON()).toMatchObject({
      scale: 4,
      atk: 2500,
      def: 2100,
      level: 7
    })
    expect(carta.toDTO()).toMatchObject({
      scale: 4,
      card_price: 2
    })
  })
})

// ---------------------------------------------------------------------------
// CartaLink
// ---------------------------------------------------------------------------
describe("CartaLink", () => {
  test("mantiene def y level como null y serializa linkval y linkmarkers", () => {
    const carta = new CartaLink(datosLink())
    expect(carta.def).toBeNull()
    expect(carta.level).toBeNull()
    expect(carta.linkval).toBe(3)
    expect(carta.linkmarkers).toEqual(["Top", "Bottom-Left", "Bottom-Right"])

    expect(carta.toJSON()).toMatchObject({
      linkval: 3,
      linkmarkers: ["Top", "Bottom-Left", "Bottom-Right"],
      def: null,
      level: null
    })
    expect(carta.toDTO()).toMatchObject({
      linkval: 3,
      linkmarkers: ["Top", "Bottom-Left", "Bottom-Right"],
      card_price: 2
    })
  })
})
