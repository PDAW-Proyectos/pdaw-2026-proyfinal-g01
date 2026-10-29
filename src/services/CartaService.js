import { Carta } from "../models/Carta/Carta.js"
import { CartaMonstruo } from "../models/Carta/CartaMonstruo.js"
import { CartaPendulo } from "../models/Carta/CartaPendulo.js"
import { CartaLink } from "../models/Carta/CartaLink.js"
import { CartaRepository } from "../repositories/CartaRepository.js"

export class CartaService {
    constructor(){
        this.cartaRepository = new CartaRepository()
    }

    // Crea una instancia de la clase correspondiente según frameType.
    crearCarta(data) {
        switch (data.frameType) {
            case "link":
                return new CartaLink(data)

            case "normal_pendulum":
            case "effect_pendulum":
            case "pendulum":
                return new CartaPendulo(data)

            case "normal":
            case "effect":
            case "fusion":
            case "synchro":
            case "xyz":
            case "ritual":
            case "token":
                return new CartaMonstruo(data)

            default:
                return new Carta(data)
        }
    }

    // Obtiene todas las cartas y las convierte en instancias de sus clases.
    async obtenerTodas() {
        const datos = await this.cartaRepository.obtenerTodas()

        return datos.map(data => this.crearCarta(data))
    }

    // Busca una carta por su nombre, ignorando mayúsculas y minúsculas.
    async obtenerPorNombre(name) {
        const cartas = await this.obtenerTodas()

        return cartas.find(
            carta => carta.name.toLowerCase() === name.trim().toLowerCase()
        )
    }
}