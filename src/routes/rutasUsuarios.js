import { Router } from "express"
import { controladorUsuarios } from "../utils/container.js"
import { requiereAutenticacion } from "../middlewares/seguridad.middleware.js";

const router = Router()

router.post("/registro", controladorUsuarios.registrar)
router.post("/login", controladorUsuarios.login)
router.post("/logout",requiereAutenticacion , controladorUsuarios.logout)

// router.delete("/:username", requiereRol("admin"), controladorUsuarios.eliminar);

export default router