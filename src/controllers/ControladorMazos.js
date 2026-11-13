import { ServicioMazos } from "../services/ServicioMazos.js"
import { ServicioMazosPopulares } from "../services/ServicioMazosPopulares.js"

export class ControladorMazos {
  #servicioMazos
  #servicioMazosPopulares

  /**
   * @param {ServicioMazos} servicioMazos
   * @param {ServicioMazosPopulares} servicioMazosPopulares
   * @throws TypeError si los parametros no son instancias validas.
   */
  constructor(servicioMazos, servicioMazosPopulares) {
    if (!(servicioMazos instanceof ServicioMazos)) {
      throw new TypeError("El controlador se tiene que crear con un ServicioMazos")
    }
    if (!(servicioMazosPopulares instanceof ServicioMazosPopulares)) {
      throw new TypeError("El controlador se tiene que crear con un ServicioMazosPopulares")
    }

    this.#servicioMazos = servicioMazos
    this.#servicioMazosPopulares = servicioMazosPopulares
  }

  listarMazos = (req, res, next) => {
    try {
      const username = req.query.all === "true" ? undefined : req.session.username

      const mazos = this.#servicioMazos.listarMazos(username, req.query.page)

      res.status(200).json(mazos)
    } catch (error) {
      next(error)
    }
  }

  listarMazosPopulares = (req, res, next) => {
    try {
      const mazos = this.#servicioMazosPopulares.listarMazosPopulares()

      res.status(200).json(mazos)
    } catch (error) {
      next(error)
    }
  }

  obtenerMazoPopular = (req, res, next) => {
    try {
      const { id } = req.params
      const mazo = this.#servicioMazosPopulares.obtenerMazoPopular(id)

      res.status(200).json(mazo)
    } catch (error) {
      next(error)
    }
  }

  obtenerMazo = (req, res, next) => {
    try {
      const { id } = req.params
      const mazo = this.#servicioMazos.obtenerMazo(id)

      res.status(200).json(mazo)
    } catch (error) {
      next(error)
    }
  }

  crearMazo = async (req, res, next) => {
    try {
      // se obliga a que el dueño sea el usuario autenticado, evitando suplantacion
      const datosMazo = {
        ...req.body,
        username: req.session.username
      }

      const nuevoMazo = await this.#servicioMazos.crearMazo(datosMazo)

      res.status(201).json(nuevoMazo)
    } catch (error) {
      next(error)
    }
  }

  actualizarMazo = async (req, res, next) => {
    try {
      const { id } = req.params
      const username = req.session.username

      const mazoActualizado = await this.#servicioMazos.actualizarMazo(id, req.body, username)

      res.status(200).json(mazoActualizado)
    } catch (error) {
      next(error)
    }
  }

  eliminarMazo = async (req, res, next) => {
    try {
      const { id } = req.params
      const username = req.session.username

      await this.#servicioMazos.eliminarMazo(id, username)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  agregarCarta = async (req, res, next) => {
    try {
      const { id } = req.params
      const { idCarta } = req.body
      const username = req.session.username

      const mazoActualizado = await this.#servicioMazos.agregarCarta(id, idCarta, username)

      res.status(200).json(mazoActualizado)
    } catch (error) {
      next(error)
    }
  }

  eliminarCarta = async (req, res, next) => {
    try {
      const { id, idCarta } = req.params
      const username = req.session.username

      const mazoActualizado = await this.#servicioMazos.eliminarCarta(id, idCarta, username)

      res.status(200).json(mazoActualizado)
    } catch (error) {
      next(error)
    }
  }
}
