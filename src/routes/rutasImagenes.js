import { Router } from "express"
import { controladorImagenes } from "../utils/container.js"
import { validar } from "../middlewares/validacion.middleware.js"
import { esquemasImagenes } from "../schemas/imagenes.schema.js"

const router = Router()

router.get(
  "/:id",
  validar(esquemasImagenes.parametroId, "params"),
  validar(esquemasImagenes.queryTipo, "query"),
  controladorImagenes.obtenerImagen
)

export default router
