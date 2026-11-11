import { jest } from "@jest/globals"
import bcrypt from "bcryptjs"
import { Usuario } from "../../src/models/Usuario.js"

const datosUsuarioBase = (extra = {}) => ({
  nombre: "Yugi Muto",
  username: "yugi",
  contraseña: "hashed_password_123",
  rol: "usuario",
  ...extra
})

describe("Usuario", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("constructor y valores por defecto", () => {
    test("recorta espacios en blanco en nombre y username", () => {
      const usuario = new Usuario(
        datosUsuarioBase({ nombre: "   Seto Kaiba   ", username: "  kaiba_corp  " })
      )
      expect(usuario.nombre).toBe("Seto Kaiba")
      expect(usuario.username).toBe("kaiba_corp")
    })

    test("asigna el rol 'usuario' por defecto si no se provee uno", () => {
      const usuario = new Usuario({
        nombre: "Joey Wheeler",
        username: "joey",
        contraseña: "hashed_password_123"
      })
      expect(usuario.rol).toBe("usuario")
    })
  })

  describe("verificarContraseña", () => {
    test("devuelve true si la contraseña coincide con el hash", async () => {
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true)
      const usuario = new Usuario(datosUsuarioBase())

      const resultado = await usuario.verificarContraseña("mi_password")
      expect(resultado).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith("mi_password", "hashed_password_123")
    })

    test("devuelve false si la contraseña no coincide con el hash", async () => {
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false)
      const usuario = new Usuario(datosUsuarioBase())

      const resultado = await usuario.verificarContraseña("password_incorrecta")
      expect(resultado).toBe(false)
      expect(bcrypt.compare).toHaveBeenCalledWith("password_incorrecta", "hashed_password_123")
    })
  })

  describe("serialización (toJSON, fromJSON, toDTO)", () => {
    test("toJSON y fromJSON serializan y reconstruyen la instancia", () => {
      const datos = datosUsuarioBase()
      const usuario = new Usuario(datos)

      expect(usuario.toJSON()).toEqual(datos)

      const reconstruido = Usuario.fromJSON(datos)
      expect(reconstruido).toBeInstanceOf(Usuario)
      expect(reconstruido.toJSON()).toEqual(datos)
    })

    test("toDTO omite la contraseña para enviar datos seguros al cliente", () => {
      const usuario = new Usuario(datosUsuarioBase())
      expect(usuario.toDTO()).toEqual({
        nombre: "Yugi Muto",
        username: "yugi",
        rol: "usuario"
      })
      expect(usuario.toDTO()).not.toHaveProperty("contraseña")
    })
  })
})
