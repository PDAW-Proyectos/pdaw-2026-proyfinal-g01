import { AuthenticationError, AuthorizationError } from "../utils/errors.js";
//Middlewares universales para cualquier ruta, leen informacion de req.session

export const requiereAutenticacion = (req, res, next) => {
  if (!req.session || !req.session.username) {
    return next(new AuthenticationError("Es necesario iniciar sesión"));
  }
  next();
};

export const requiereRol = (rolRequerido) => {
  return (req, res, next) => {
    // Se valida que exista la session
    if (!req.session || !req.session.username) {
      return next(new AuthenticationError("Es necesario iniciar sesión"));
    }
    
    // verifico que el rol guardado coincida
    if (req.session.rol !== rolRequerido) {
      return next(new AuthorizationError("Sin permisos"));
    }
    next();
  };
};