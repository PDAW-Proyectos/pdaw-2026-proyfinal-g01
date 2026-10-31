import { Router } from "express"
import { controladorMazos } from "../container.js"

const router = Router()

// Muchas de las rutas son nuevas tenemos que añadirlas a la tabla
router.get("/", controladorMazos.listarMazos)
router.get("/:id", controladorMazos.obtenerMazo)
router.get("/:id/detallado", controladorMazos.obtenerMazoDetallado)
router.get("/:id/precio", controladorMazos.obtenerPrecioTotal)

router.post("/", controladorMazos.crearMazo)
router.put("/:id", controladorMazos.actualizarMazo)
router.delete("/:id", controladorMazos.eliminarMazo)

router.post("/:id/cartas", controladorMazos.agregarCarta)
router.delete("/:id/cartas/:idCarta", controladorMazos.eliminarCarta)

export default router
