import { obtenerMaxCopiasCarta } from "../../utils/utilidadesCartas.js"

/**
 * Crea los botones para incrementar, decrementar o eliminar una carta
 * ya presente dentro del constructor de mazos y les asigna sus eventos.
 *
 * @param {Object} carta
 * @param {Object} [opciones]
 * @param {number} [opciones.cantidad=1]
 * @param {string} [opciones.nombreMazo="el mazo"]
 * @param {number} [opciones.totalZona=0]
 * @param {number} [opciones.limiteZona=60]
 * @param {boolean} [opciones.mutando=false]
 * @param {(carta: Object) => void} [opciones.onAdd]
 * @param {(carta: Object) => void} [opciones.onRemove]
 * @returns {HTMLDivElement}
 */
export function crearControlesCartaMazo(
  carta,
  {
    cantidad = 1,
    nombreMazo = "el mazo",
    totalZona = 0,
    limiteZona = 60,
    mutando = false,
    onAdd,
    onRemove
  } = {}
) {
  const controles = document.createElement("div")
  controles.className = "d-flex gap-2 w-100 mt-2"

  const btnDisminuir = document.createElement("button")
  btnDisminuir.type = "button"
  btnDisminuir.disabled = Boolean(mutando)

  if (cantidad === 1) {
    btnDisminuir.className =
      "btn-solid theme-danger flex-fill d-flex justify-content-center align-items-center"
    btnDisminuir.setAttribute("aria-label", `Eliminar ${carta.name} de ${nombreMazo}`)
    btnDisminuir.title = "Eliminar carta del mazo"

    const iconoEliminar = document.createElement("i")
    iconoEliminar.className = "bi bi-trash"
    iconoEliminar.setAttribute("aria-hidden", "true")
    btnDisminuir.append(iconoEliminar)
  } else {
    btnDisminuir.className =
      "btn-outline theme-primary flex-fill d-flex justify-content-center align-items-center"
    btnDisminuir.setAttribute("aria-label", `Quitar una copia de ${carta.name} de ${nombreMazo}`)
    btnDisminuir.title = "Quitar una copia"

    const iconoRestar = document.createElement("i")
    iconoRestar.className = "bi bi-dash-lg"
    iconoRestar.setAttribute("aria-hidden", "true")
    btnDisminuir.append(iconoRestar)
  }
  btnDisminuir.addEventListener("click", () => onRemove?.(carta))

  const btnAgregar = document.createElement("button")
  btnAgregar.type = "button"
  btnAgregar.className =
    "btn-solid theme-primary flex-fill d-flex justify-content-center align-items-center"
  btnAgregar.setAttribute("aria-label", `Agregar una copia de ${carta.name} a ${nombreMazo}`)
  btnAgregar.title = "Agregar una copia"
  btnAgregar.disabled =
    Boolean(mutando) ||
    cantidad >= obtenerMaxCopiasCarta(carta) ||
    totalZona >= limiteZona

  const iconoSumar = document.createElement("i")
  iconoSumar.className = "bi bi-plus-lg"
  iconoSumar.setAttribute("aria-hidden", "true")
  btnAgregar.append(iconoSumar)
  btnAgregar.addEventListener("click", () => onAdd?.(carta))

  controles.append(btnDisminuir, btnAgregar)
  return controles
}
