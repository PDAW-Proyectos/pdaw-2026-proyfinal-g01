import { ServicioCartas } from "../services/ServicioCartas.js"

export class ControladorCartas {
  #servicioCartas

  /**
   * @param {ServicioCartas} servicioCartas
   * @throws TypeError si el parametro no es una instancia de ServicioCartas.
   */
  constructor(servicioCartas) {
    if (!(servicioCartas instanceof ServicioCartas)) {
      throw new TypeError("El controlador se tiene que crear con un ServicioCartas")
    }

    this.#servicioCartas = servicioCartas
  }

  listarCartas = (req, res, next) => {
    try {
      const resultado = this.#servicioCartas.listarCartas(req.query)

      res.status(200).json({
        ...resultado,
        datos: resultado.datos.map((carta) => carta.toDTO())
      })
    } catch (error) {
      next(error)
    }
  }

  listarCartasPopulares = (req, res, next) => {
    try {
      const cartas = this.#servicioCartas.listarCartasPopulares()

      res.status(200).json(cartas.map((carta) => carta.toDTO()))
    } catch (error) {
      next(error)
    }
  }

  obtenerCarta = (req, res, next) => {
    try {
      const { id } = req.params
      const carta = this.#servicioCartas.obtenerCarta(id)

      res.status(200).json(carta.toDTO())
    } catch (error) {
      next(error)
    }
  }
}
