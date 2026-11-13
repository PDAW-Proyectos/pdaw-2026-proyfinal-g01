import { Router } from "express"
import { controladorMazos } from "../utils/container.js"
import { requiereRol, requiereAutenticacion } from "../middlewares/seguridad.middleware.js"
import { validar } from "../middlewares/validacion.middleware.js"
import { esquemasMazos } from "../schemas/mazos.schema.js"

const router = Router()

function requiereSesionParaMazos(req, res, next) {
  if (req.query.all === "true") {
    return next()
  }
  return requiereAutenticacion(req, res, next)
}

// Muchas de las rutas son nuevas tenemos que añadirlas a la tabla
router.get("/", validar(esquemasMazos.queryListar, "query"), requiereSesionParaMazos, controladorMazos.listarMazos)
router.get("/populares", controladorMazos.listarMazosPopulares)
router.get("/populares/:id", validar(esquemasMazos.parametroId, "params"), controladorMazos.obtenerMazoPopular)
router.get("/:id", validar(esquemasMazos.parametroId, "params"), controladorMazos.obtenerMazo)

router.post(
  "/",
  requiereRol("usuario"),
  validar(esquemasMazos.crear, "body"),
  controladorMazos.crearMazo
)
router.patch(
  "/:id",
  requiereRol("usuario"),
  validar(esquemasMazos.parametroId, "params"),
  validar(esquemasMazos.actualizar, "body"),
  controladorMazos.actualizarMazo
)
router.delete(
  "/:id",
  requiereRol("usuario"),
  validar(esquemasMazos.parametroId, "params"),
  controladorMazos.eliminarMazo
)

router.post(
  "/:id/cartas",
  requiereRol("usuario"),
  validar(esquemasMazos.parametroId, "params"),
  validar(esquemasMazos.agregarCarta, "body"),
  controladorMazos.agregarCarta
)
router.delete(
  "/:id/cartas/:idCarta",
  requiereRol("usuario"),
  validar(esquemasMazos.parametrosMazoYCarta, "params"),
  controladorMazos.eliminarCarta
)

export default router
