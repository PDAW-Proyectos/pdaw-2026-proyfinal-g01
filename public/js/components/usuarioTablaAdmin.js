/**
 * Actualiza el contenedor que muestra la cantidad de usuarios.
 * @param {HTMLElement} contadorSpan
 * @param {number} totalEntradas
 */
export function actualizarContadorUsuarios(contadorSpan, totalEntradas) {
  contadorSpan.textContent = `${totalEntradas} ${totalEntradas === 1 ? "usuario" : "usuarios"}`
}

/**
 * Crea una fila (`<tr>`) con los datos y acciones de un usuario para la tabla de administración.
 * @param {Object} usuario
 * @param {{usernameActual?: string}} [opciones]
 * @returns {HTMLTableRowElement}
 */
export function crearFilaUsuario(usuario, { usernameActual } = {}) {
  const tr = document.createElement("tr")

  const tdNombre = document.createElement("td")
  tdNombre.textContent = usuario.nombre ?? "-"

  const tdUsername = document.createElement("td")
  tdUsername.className = "fw-semibold"
  tdUsername.textContent = usuario.username

  const tdRol = document.createElement("td")
  const badge = document.createElement("span")
  badge.className =
    usuario.rol === "admin"
      ? "badge theme-warning rounded-1"
      : "badge theme-secondary rounded-1"
  badge.textContent = usuario.rol
  tdRol.append(badge)

  const tdAcciones = document.createElement("td")
  tdAcciones.className = "text-end"

  const esMismoUsuario = usuario.username === usernameActual
  const btnEliminar = document.createElement("button")
  btnEliminar.type = "button"
  btnEliminar.className = "btn-outline btn-sm theme-danger"
  btnEliminar.textContent = esMismoUsuario ? "Tu cuenta" : "Eliminar"
  btnEliminar.disabled = esMismoUsuario

  if (!esMismoUsuario) {
    btnEliminar.dataset.action = "eliminar"
    btnEliminar.dataset.username = usuario.username
  }

  tdAcciones.append(btnEliminar)
  tr.append(tdNombre, tdUsername, tdRol, tdAcciones)
  return tr
}
