// Esta clase encapsula la logica de los errores para devolver el staturs con su mensaje y codigo,
// se tiene que iniciar en la app.js al final y usar en los catch de los controladores con la
// funcion next(error)

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode ?? 500
  const mensaje = statusCode === 500 ? "Error interno del servidor" : err.message

  if (statusCode === 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    error: err.name ?? "Error",
    mensaje: mensaje,
  })
}
