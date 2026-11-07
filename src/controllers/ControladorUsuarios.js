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

      const usuario = await this.#servicioUsuarios.registrarUsuario({ nombre, username, contraseña })

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

      const usuario = await this.#servicioUsuarios.autenticarUsuario(username, contraseña)
      const regenerate = (req) =>
        new Promise((ok, fail) => req.session.regenerate((e) => (e ? fail(e) : ok())))

      // La logica de req.session se agregara aca
      await regenerate(req)
      req.session.username = usuario.username
      req.session.rol = usuario.rol
      res.status(200).json(UsuarioMapper.toDTO(usuario))
    } catch (error) {
      next(error)
    }
  }

  logout = async (req, res, next) => {
    try{
      const destroy = (req) =>
            new Promise((ok, fail) => req.session.destroy((error) => error ? fail(error) : ok()))

      await destroy(req)
      res.clearCookie('wiki.sid').status(200).end()
    }catch(error){
      next(error)
    }
  }

  eliminar = async (req, res, next) => {
    try {
      const usuarioAEliminar = req.params.username
      const usuarioSesionActual = req.session.username
      this.#validarParametro(usuarioAEliminar, "username en URL")

      //le paso a servicio usuarios para que verifique que no sea el mismo usuario admin de la sesion el que se quiere eliminar a si mismo
      await this.#servicioUsuarios.eliminarUsuario(usuarioAEliminar,usuarioSesionActual)

      res.status(200).json({ mensaje: "Usuario eliminado con éxito" })
    } catch (error) {
      next(error)
    }
  }
}
