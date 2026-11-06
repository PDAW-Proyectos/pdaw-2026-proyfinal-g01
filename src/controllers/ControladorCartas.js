import { ServicioCartas } from "../services/ServicioCartas.js"
import { ValidationError } from "../utils/errors.js"

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

  /** Verifica que el parametro o campo exista en la peticion. */
  #validarParametro(valor, nombreCampo) {
    if (valor === undefined || valor === null) {
      throw new ValidationError(`Falta el parametro obligatorio "${nombreCampo}".`)
    }
  }

  listarCartas = (req, res, next) => {
    try {
      const cartas = this.#servicioCartas.listarCartas(req.query)

      res.status(200).json(cartas)
    } catch (error) {
      next(error)
    }
  }

  obtenerCarta = (req, res, next) => {
    try {
      const { id } = req.params
      this.#validarParametro(id, "id")
      const carta = this.#servicioCartas.obtenerCarta(id)

      res.status(200).json(carta)
    } catch (error) {
      next(error)
    }
  }
}
