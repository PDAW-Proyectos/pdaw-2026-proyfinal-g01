import { Router } from "express"
import { controladorUsuarios } from "../utils/container.js"

const router = Router()

router.post("/registro", controladorUsuarios.registrar)
router.post("/login", controladorUsuarios.login)
router.post("/logout", controladorUsuarios.logout)

export default router