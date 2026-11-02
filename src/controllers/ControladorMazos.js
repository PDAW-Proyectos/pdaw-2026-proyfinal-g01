import { ServicioMazos } from "../services/ServicioMazos.js"

export class ControladorMazos {
  #servicioMazos

  /**
   * @param {ServicioMazos} servicioMazos
   * @throws TypeError si el parametro no es una instancia de ServicioMazos.
   */
  constructor(servicioMazos) {
    if (!(servicioMazos instanceof ServicioMazos)) {
      throw new TypeError("El controlador se tiene que crear con un ServicioMazos")
    }

    this.#servicioMazos = servicioMazos
  }

  /** Verifica que el parametro o campo exista en la peticion. */
  #validarParametro(valor, nombreCampo) {
    if (valor === undefined || valor === null) {
      throw new ValidationError(`Falta el parametro obligatorio "${nombreCampo}".`)
    }
  }

  listarMazos = (req, res, next) => {
    try {
      const mazos = this.#servicioMazos.listarMazos()

      res.status(200).json(mazos)
    } catch (error) {
      next(error)
    }
  }

  obtenerMazo = (req, res, next) => {
    try {
      const { id } = req.params
      this.#validarParametro(id, "id")
      const mazo = this.#servicioMazos.obtenerMazo(id)

      res.status(200).json(mazo)
    } catch (error) {
      next(error)
    }
  }

  obtenerMazoDetallado = (req, res, next) => {
    try {
      const { id } = req.params
      this.#validarParametro(id, "id")
      const mazoDetallado = this.#servicioMazos.obtenerMazoDetallado(id)

      res.status(200).json(mazoDetallado)
    } catch (error) {
      next(error)
    }
  }

  obtenerPrecioTotal = (req, res, next) => {
    try {
      const { id } = req.params
      this.#validarParametro(id, "id")
      const precioTotal = this.#servicioMazos.precioTotal(id)

      res.status(200).json({ id: Number(id), precioTotal })
    } catch (error) {
      next(error)
    }
  }

  crearMazo = async (req, res, next) => {
    try {
      const nuevoMazo = await this.#servicioMazos.crearMazo(req.body)

      res.status(201).json(nuevoMazo)
    } catch (error) {
      next(error)
    }
  }

  actualizarMazo = async (req, res, next) => {
    try {
      const { id } = req.params
      this.#validarParametro(id, "id")
      this.#validarParametro(req.body, "body")
      const mazoActualizado = await this.#servicioMazos.actualizarMazo(id, req.body)

      res.status(200).json(mazoActualizado)
    } catch (error) {
      next(error)
    }
  }

  eliminarMazo = async (req, res, next) => {
    try {
      const { id } = req.params
      this.#validarParametro(id, "id")
      await this.#servicioMazos.eliminarMazo(id)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  agregarCarta = async (req, res, next) => {
    try {
      const { id } = req.params
      const idCarta = req.body?.idCarta
      this.#validarParametro(id, "id")
      this.#validarParametro(idCarta, "idCarta")
      const mazoActualizado = await this.#servicioMazos.agregarCarta(id, idCarta)

      res.status(200).json(mazoActualizado)
    } catch (error) {
      next(error)
    }
  }

  eliminarCarta = async (req, res, next) => {
    try {
      const { id, idCarta } = req.params
      this.#validarParametro(id, "id")
      this.#validarParametro(idCarta, "idCarta")
      const mazoActualizado = await this.#servicioMazos.eliminarCarta(id, idCarta)

      res.status(200).json(mazoActualizado)
    } catch (error) {
      next(error)
    }
  }
}
