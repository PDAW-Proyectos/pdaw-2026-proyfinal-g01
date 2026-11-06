import { Router } from "express"
import { controladorImagenes } from "../utils/container.js"

const router = Router()

router.get("/:id", controladorImagenes.obtenerImagen)

export default router
