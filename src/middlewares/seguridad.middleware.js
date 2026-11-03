/* // Autenticación: carga el usuario de la sesión (si existe).
app.use((req, res, next) => {
req.user = req.session.userId ? users.findById(req.session.userId) : null;
next();
});
const requireAuth = (req, res, next) =>
req.user ? next() : res.status(401).json({ error: 'Es necesario iniciar sesión' });
// Autorización por rol: una función que DEVUELVE un middleware.
const requireRole = (role) => (req, res, next) => {
if (!req.user) return res.status(401).json({ error: 'Es necesario iniciar sesión' });
if (req.user.role !== role) return res.status(403).json({ error: 'Sin permisos' });
next();
}; */
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