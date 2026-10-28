import { readFile } from "node:fs/promises"
import { Carta } from "../models/Carta/Carta.js"
import { CartaMonstruo } from "../models/Carta/CartaMonstruo.js"
import { CartaPendulo } from "../models/Carta/CartaPendulo.js"
import { CartaLink } from "../models/Carta/CartaLink.js"

export class CartaService {
    // Lee el archivo JSON y devuelve los datos de las cartas.
    async leerCartas() {
        const ruta = new URL("../../data/cartas.json", import.meta.url)
        const contenido = await readFile(ruta, "utf8")

        return JSON.parse(contenido)
    }
    
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

    // Obtiene todas las cartas como instancias de sus clases.
    async obtenerTodas() {
        const datos = await this.leerCartas()

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