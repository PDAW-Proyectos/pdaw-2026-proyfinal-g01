import { ServicioUsuarios } from "../services/ServicioUsuarios.js";

export class ControladorUsuarios {
  #servicioUsuarios;

  /**
   * @param {ServicioUsuarios} servicioUsuarios
   * @throws TypeError si el parametro no es una instancia de ServicioUsuarios.
   */
  constructor(servicioUsuarios) {
    if (!(servicioUsuarios instanceof ServicioUsuarios)) {
      throw new TypeError(
        "El controlador se tiene que crear con un ServicioUsuarios",
      );
    }

    this.#servicioUsuarios = servicioUsuarios;
  }

  registrar = async (req, res, next) => {
    try {
      const { nombre, username, contraseña } = req.body;

      const usuario = await this.#servicioUsuarios.registrarUsuario({
        nombre,
        username,
        contraseña,
      });

      res.status(201).json(usuario.toDTO());
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { username, contraseña } = req.body;

      const usuario = await this.#servicioUsuarios.autenticarUsuario(
        username,
        contraseña,
      );
      const regenerate = (req) =>
        new Promise((ok, fail) =>
          req.session.regenerate((e) => (e ? fail(e) : ok())),
        );

      // La logica de req.session se agregara aca
      await regenerate(req);
      req.session.username = usuario.username;
      req.session.rol = usuario.rol;
      res.status(200).json(usuario.toDTO());
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const destroy = (req) =>
        new Promise((ok, fail) =>
          req.session.destroy((error) => (error ? fail(error) : ok())),
        );

      await destroy(req);
      res.clearCookie("wiki.sid").status(200).end();
    } catch (error) {
      next(error);
    }
  };

  eliminar = async (req, res, next) => {
    try {
      const usuarioAEliminar = req.params.username;
      const usuarioSesionActual = req.session.username;

      // le paso a servicio usuarios para que verifique que no sea el mismo usuario admin de la sesion el que se quiere eliminar a si mismo
      await this.#servicioUsuarios.eliminarUsuario(
        usuarioAEliminar,
        usuarioSesionActual,
      );

      res.status(200).json({ mensaje: "Usuario eliminado con éxito" });
    } catch (error) {
      next(error);
    }
  };

  obtenerPerfil = async (req, res, next) => {
    try {
      // Se reconstruye el objeto a partir de los datos del login. 
      res.status(200).json({ 
        usuario: {
          username: req.session.username,
          rol: req.session.rol
        } 
      });
    } catch (error) {
      next(error);
    }
  };
}
