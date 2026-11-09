import { jest } from "@jest/globals"
import bcrypt from "bcryptjs"
import { Usuario } from "../src/models/Usuario.js"


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

  describe("constructor y getters", () => {
    test("asigna correctamente nombre, username, contraseña y rol", () => {
      const usuario = new Usuario(datosUsuarioBase())

      expect(usuario.nombre).toBe("Yugi Muto")
      expect(usuario.username).toBe("yugi")
      expect(usuario.contraseña).toBe("hashed_password_123")
      expect(usuario.rol).toBe("usuario")
    })

    test("recorta espacios en blanco al inicio y final del nombre y username", () => {
      const usuario = new Usuario(
        datosUsuarioBase({ nombre: "   Seto Kaiba   ", username: "  kaiba_corp  " })
      )

      expect(usuario.nombre).toBe("Seto Kaiba")
      expect(usuario.username).toBe("kaiba_corp")
    })

    test("asigna el rol 'usuario' por defecto si no se provee uno", () => {
      const datosSinRol = {
        nombre: "Joey Wheeler",
        username: "joey",
        contraseña: "hashed_password_123"
      }
      
      const usuario = new Usuario(datosSinRol)

      expect(usuario.rol).toBe("usuario")
    })
  })

  describe("toJSON", () => {
    test("devuelve un objeto plano con los datos del usuario para su serialización", () => {
      const datos = datosUsuarioBase()
      const usuario = new Usuario(datos)

      expect(usuario.toJSON()).toEqual({
        nombre: "Yugi Muto",
        username: "yugi",
        contraseña: "hashed_password_123",
        rol: "usuario"
      })
    })
  })

  describe("fromJSON", () => {
    test("reconstruye y devuelve una instancia de Usuario a partir de un objeto plano", () => {
      const datos = datosUsuarioBase()
      const usuario = Usuario.fromJSON(datos)

      expect(usuario).toBeInstanceOf(Usuario)
      expect(usuario.nombre).toBe("Yugi Muto")
      expect(usuario.username).toBe("yugi")
      expect(usuario.rol).toBe("usuario")
    })
  })

  describe("verificarContraseña", () => {
    test("devuelve true si bcrypt.compare aprueba la contraseña plana", async () => {
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true)
      
      const usuario = new Usuario(datosUsuarioBase())
      
      const resultado = await usuario.verificarContraseña("mi_password_real")

      expect(resultado).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith("mi_password_real", "hashed_password_123")
    })

    test("devuelve false si bcrypt.compare rechaza la contraseña plana", async () => {
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false)
      
      const usuario = new Usuario(datosUsuarioBase())
      
      const resultado = await usuario.verificarContraseña("password_incorrecta")

      expect(resultado).toBe(false)
      expect(bcrypt.compare).toHaveBeenCalledWith("password_incorrecta", "hashed_password_123")
    })
  })
})