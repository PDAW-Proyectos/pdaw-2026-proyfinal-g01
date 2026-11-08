import { ServicioImagenes } from "../services/ServicioImagenes.js"

export class ControladorImagenes {
  #servicioImagenes

  /**
   * @param {ServicioImagenes} servicioImagenes
   * @throws TypeError si el parametro no es una instancia de ServicioImagenes.
   */
  constructor(servicioImagenes) {
    if (!(servicioImagenes instanceof ServicioImagenes)) {
      throw new TypeError("El controlador se tiene que crear con un ServicioImagenes")
    }

    this.#servicioImagenes = servicioImagenes
  }

  obtenerImagen = async (req, res, next) => {
    try {
      const { id } = req.params
      const { tipo } = req.query
      const rutaImagen = await this.#servicioImagenes.obtenerImagen(id, tipo)

      res.status(200).sendFile(rutaImagen)
    } catch (error) {
      next(error)
    }
  }
}
