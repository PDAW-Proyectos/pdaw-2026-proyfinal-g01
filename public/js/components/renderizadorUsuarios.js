// Actualiza el contenedor que muestra la cantidad de usuarios
export function actualizarContadorUsuarios(contadorSpan, totalEntradas) {
  contadorSpan.textContent = `${totalEntradas} ${totalEntradas === 1 ? 'usuario' : 'usuarios'}`
}

// Limpia la tabla y dibuja las filas de usuarios (o un mensaje si está vacía)
export function renderizarTablaUsuarios(tablaBody, usuarios, { usernameActual, textoFiltro = '' } = {}) {
  tablaBody.replaceChildren()

  if (!usuarios.length) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.colSpan = 4
    td.className = 'text-center py-4 text-muted'
    td.textContent = textoFiltro.trim()
      ? 'No se encontraron usuarios con ese username.'
      : 'No hay usuarios registrados.'
    tr.appendChild(td)
    tablaBody.appendChild(tr)
    return
  }

  usuarios.forEach((usuario) => {
    const tr = document.createElement('tr')

    const tdNombre = document.createElement('td')
    tdNombre.textContent = usuario.nombre ?? '-'

    const tdUsername = document.createElement('td')
    tdUsername.className = 'fw-semibold'
    tdUsername.textContent = usuario.username

    const tdRol = document.createElement('td')
    const badge = document.createElement('span')
    badge.className = usuario.rol === 'admin' ? 'badge bg-warning text-dark' : 'badge bg-secondary'
    badge.textContent = usuario.rol
    tdRol.appendChild(badge)

    const tdAcciones = document.createElement('td')
    tdAcciones.className = 'text-end'

    const esMismoUsuario = usuario.username === usernameActual
    const btnEliminar = document.createElement('button')
    btnEliminar.type = 'button'
    btnEliminar.className = 'btn btn-sm btn-outline-danger'
    btnEliminar.textContent = esMismoUsuario ? 'Tu cuenta' : 'Eliminar'
    btnEliminar.disabled = esMismoUsuario

    if (!esMismoUsuario) {
      btnEliminar.dataset.action = 'eliminar'
      btnEliminar.dataset.username = usuario.username
    }

    tdAcciones.appendChild(btnEliminar)
    tr.append(tdNombre, tdUsername, tdRol, tdAcciones)
    tablaBody.appendChild(tr)
  })
}