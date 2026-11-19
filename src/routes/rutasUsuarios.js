import { Router } from "express"
import { controladorUsuarios } from "../utils/container.js"
import { requiereAutenticacion, requiereRol } from "../middlewares/seguridad.middleware.js"
import { validar } from "../middlewares/validacion.middleware.js"
import { limitadorLogin } from "../middlewares/rateLimit.middleware.js"
import { esquemasUsuarios } from "../schemas/usuarios.schema.js"

const router = Router()

router.get("/me", requiereAutenticacion, controladorUsuarios.obtenerPerfil)
router.get("/", requiereRol("admin"),validar(esquemasUsuarios.consultaUsuarios, "query") , controladorUsuarios.listar)
router.post("/registro", validar(esquemasUsuarios.registro, "body"), controladorUsuarios.registrar)
router.post("/login", limitadorLogin, validar(esquemasUsuarios.login, "body"), controladorUsuarios.login)
router.post("/logout", requiereAutenticacion, controladorUsuarios.logout)


router.delete(
  "/:username",
  requiereRol("admin"),
  validar(esquemasUsuarios.parametroUsername, "params"),
  controladorUsuarios.eliminar
)

export default router
