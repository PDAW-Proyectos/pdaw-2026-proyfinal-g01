import { CartaService } from "../services/CartaService.js"

export class CartaController {
    constructor() {
        this.cartaService = new CartaService()
    }

    // GET /api/cartas
    async obtenerTodas(req, res) {
        try {
            const cartas = await this.cartaService.obtenerTodas()
            return res.status(200).json(cartas)
        } catch (error) {
            console.error("Error al obtener las cartas:", error)
            return res.status(500).json({
                error: "Error interno al obtener las cartas"
            })
        }
    }

    // GET /api/cartas/:name
    async obtenerPorNombre(req, res) {
        try {
            const { name } = req.params
            const carta = await this.cartaService.obtenerPorNombre(name)
            if (!carta) {
                return res.status(404).json({
                    error: "Carta no encontrada"
                })
            }
            return res.status(200).json(carta)
        } catch (error) {
            console.error("Error al buscar la carta:", error)
            return res.status(500).json({
                error: "Error interno al buscar la carta"
            })
        }
    }
}