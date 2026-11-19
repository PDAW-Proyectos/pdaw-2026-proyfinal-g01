import { AuthenticationError, AuthorizationError } from "../utils/errors.js";
import { servicioUsuarios } from "../utils/container.js";

export function requiereAutenticacion(req, res, next) {
  if (!req.session?.username) {
    return next(new AuthenticationError("Es necesario iniciar sesión"));
  }
  // Consulta a la capa de servicio
  const usuario = servicioUsuarios.buscarPorUsername(req.session.username);
  if (!usuario) {
    return req.session.destroy(() => {
      res.clearCookie("wiki.sid");
      return next(new AuthenticationError("La cuenta ya no existe o fue eliminada"));
    });
  }
  req.session.rol = usuario.rol;
  next();
}

export function requiereRol(rolRequerido) {
  return (req, res, next) => {
    requiereAutenticacion(req, res, (err) => {
      if (err) return next(err);
      if (req.session.rol !== rolRequerido) {
        return next(new AuthorizationError("Sin permisos"));
      }
      next();
    });
  };
}