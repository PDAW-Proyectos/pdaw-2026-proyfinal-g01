import { Router } from "express"
import { controladorUsuarios } from "../container.js"

const router = Router()

router.post("/registro", controladorUsuarios.registrar)
router.post("/login", controladorUsuarios.login)
router.post("/logout", controladorUsuarios.logout)

export default router