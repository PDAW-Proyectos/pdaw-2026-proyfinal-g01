import { Router } from "express"
import { controladorCartas } from "../utils/container.js"

const router = Router()

router.get("/", controladorCartas.listarCartas)
router.get("/:id", controladorCartas.obtenerCarta)

export default router
