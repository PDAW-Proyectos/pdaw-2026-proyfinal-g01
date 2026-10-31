import { ServicioUsuarios } from "../services/ServicioUsuarios.js"
import { ValidationError } from "../utils/errors.js"
import { UsuarioMapper } from "../utils/usuario.mapper.js"

export class ControladorUsuarios {
  #servicioUsuarios

  /**
   * @param {ServicioUsuarios} servicioUsuarios
   * @throws TypeError si el parametro no es una instancia de ServicioUsuarios.
   */
  constructor(servicioUsuarios) {
    if (!(servicioUsuarios instanceof ServicioUsuarios)) {
      throw new TypeError("El controlador se tiene que crear con un ServicioUsuarios")
    }

    this.#servicioUsuarios = servicioUsuarios
  }

  /** Verifica que el parametro o campo exista en la peticion. */
  #validarParametro(valor, nombreCampo) {
    if (valor === undefined || valor === null) {
      throw new ValidationError(`Falta el parametro obligatorio "${nombreCampo}".`)
    }
  }

  registrar = async (req, res, next) => {
    try {
      const { nombre, username, contraseña } = req.body
      
      this.#validarParametro(nombre, "nombre")
      this.#validarParametro(username, "username")
      this.#validarParametro(contraseña, "contraseña")

      const usuario = await this.#servicioUsuarios.registrar({ nombre, username, contraseña })

      res.status(201).json(UsuarioMapper.toDTO(usuario))
    } catch (error) {
      next(error)
    }
  }

  login = async (req, res, next) => {
    try {
      const { username, contraseña } = req.body
      
      this.#validarParametro(username, "username")
      this.#validarParametro(contraseña, "contraseña")

      const usuario = await this.#servicioUsuarios.autenticar(username, contraseña)

      // La logica de req.session se agregara aca
      res.status(200).json(UsuarioMapper.toDTO(usuario))
    } catch (error) {
      next(error)
    }
  }
}