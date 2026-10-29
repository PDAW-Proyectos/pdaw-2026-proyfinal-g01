import { readFile } from "node:fs/promises"

export class CartaRepository {

    // Obtiene todas las cartas almacenadas en el archivo JSON.
    async obtenerTodas() {
        const ruta = new URL("../../data/cartas.json", import.meta.url)
        const contenido = await readFile(ruta, "utf8")

        return JSON.parse(contenido)
    }
}