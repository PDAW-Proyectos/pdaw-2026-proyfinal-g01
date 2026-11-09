import { Router } from "express"
import { controladorUsuarios } from "../utils/container.js"
import { requiereAutenticacion, requiereRol } from "../middlewares/seguridad.middleware.js"
import { validar } from "../middlewares/validacion.middleware.js"
import { esquemasUsuarios } from "../schemas/usuarios.schema.js"

const router = Router()

router.post("/registro", validar(esquemasUsuarios.registro, "body"), controladorUsuarios.registrar)
router.post("/login", validar(esquemasUsuarios.login, "body"), controladorUsuarios.login)
router.post("/logout", requiereAutenticacion, controladorUsuarios.logout)

router.delete(
  "/:username",
  requiereRol("admin"),
  validar(esquemasUsuarios.parametroUsername, "params"),
  controladorUsuarios.eliminar
)

export default router
