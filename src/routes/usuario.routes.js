import { Router } from "express"
import { controladorUsuarios } from "../container.js"

const router = Router()

router.post("/registro", controladorUsuarios.registrar)
router.post("/login", controladorUsuarios.login)

export default router