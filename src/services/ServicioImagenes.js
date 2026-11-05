import { RepositorioImagenes } from "../repositories/RepositorioImagenes.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { descargarImagen } from "../clients/ClienteApiYgo.js"
import { NotFoundError } from "../utils/errors.js"

// No se debe poner a mas de 20 por segundo
const MAX_DESCARGAS_POR_SEGUNDO = 12
// Uso ceil porque redondea para arriba osea que la espera es siempre mas larga por si las dudas
const INTERVALO_MS = Math.ceil(1000 / MAX_DESCARGAS_POR_SEGUNDO)

const cola = []
let llamandoTurnos = false
// Guarda las promesas de las imagenes que ya estan en la fila o descargandose ahora mismo
const descargasEnCurso = new Map()

function llamarSiguienteTurno() {
  if (cola.length === 0) {
    llamandoTurnos = false
    return
  }

  llamandoTurnos = true
  // Saca la funcion para resolver la promesa y la resuelve para terminar la espera de la funcion
  const resolve = cola.shift()
  resolve()

  setTimeout(llamarSiguienteTurno, INTERVALO_MS).unref()
}

function esperarTurno() {
  // Se guarda una referencia a la funcion resolve de la promesa porque no se puede llamar Promise.resolve()
  const promesaTurno = new Promise((resolve) => {
    cola.push(resolve)
  })

  if (!llamandoTurnos) {
    llamarSiguienteTurno()
  }

  return promesaTurno
}

export class ServicioImagenes {
  #repositorioImagenes
  #repositorioCartas

  /**
   * @param {RepositorioImagenes} repositorioImagenes
   * @param {RepositorioCartas} repositorioCartas
   */
  constructor(repositorioImagenes, repositorioCartas) {
    if (!(repositorioImagenes instanceof RepositorioImagenes)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioImagenes")
    }
    if (!(repositorioCartas instanceof RepositorioCartas)) {
      throw new TypeError("El servicio se tiene que crear con un RepositorioCartas")
    }

    this.#repositorioImagenes = repositorioImagenes
    this.#repositorioCartas = repositorioCartas
  }

  async #descargarYGuardar(id, tipo, urlImagen) {
    // Aca se espera a la promesa que se completa cuando recibe el resolve
    await esperarTurno()

    const buffer = await descargarImagen(urlImagen)
    return await this.#repositorioImagenes.agregar(id, buffer, tipo)
  }

  /** Obtiene la ruta local de la imagen de una carta. Si no existe en disco, espera su turno
   * de descarga y la guarda en el repositorio.
   * @param {Number} idCarta
   * @param {"full" | "small"} [tipo="full"]
   * @returns {Promise<string>} Ruta absoluta del archivo de imagen
   */
  async obtenerImagen(idCarta, tipo = "full") {
    const id = Number(idCarta)

    const rutaExistente = await this.#repositorioImagenes.buscar(id, tipo)
    if (rutaExistente) {
      return rutaExistente
    }

    // Creo la clave para chequear que no se este procesando y si se esta procesando le asigno
    // al return la misma promesa que se esta procesando
    const clave = `${id}-${tipo}`
    if (descargasEnCurso.has(clave)) {
      return await descargasEnCurso.get(clave)
    }

    const carta = this.#repositorioCartas.buscar(id)
    if (!carta) {
      throw new NotFoundError(`La carta asociada al id "${idCarta}" no existe.`)
    }

    const datosImagen = carta.card_images?.[0]
    const urlImagen = tipo === "small" ? datosImagen?.image_url_small : datosImagen?.image_url

    // Lo llamo en una funcion async para seguir con la funcion
    const promesaDescarga = this.#descargarYGuardar(id, tipo, urlImagen)
    descargasEnCurso.set(clave, promesaDescarga)

    try {
      return await promesaDescarga
    } finally {
      // finally siempre se ejecuta incluso si termina la funcion
      descargasEnCurso.delete(clave)
    }
  }
}
