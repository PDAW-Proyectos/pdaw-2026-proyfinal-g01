import { Router } from "express"
import { CartaController } from "../controllers/CartaController.js"

const router = Router()
const cartaController = new CartaController()

// Obtiene todas las cartas.
router.get("/", cartaController.obtenerTodas.bind(cartaController))

// Busca una carta por su nombre.
router.get("/:name", cartaController.obtenerPorNombre.bind(cartaController))

export default router