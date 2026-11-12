import { Router } from "express"
import { controladorCartas } from "../utils/container.js"
import { validar } from "../middlewares/validacion.middleware.js"
import { esquemasCartas } from "../schemas/cartas.schema.js"

const router = Router()

router.get("/", validar(esquemasCartas.queryFiltrar, "query"), controladorCartas.listarCartas)
router.get("/populares", controladorCartas.listarCartasPopulares)
router.get("/:id", validar(esquemasCartas.parametroId, "params"), controladorCartas.obtenerCarta)

export default router
