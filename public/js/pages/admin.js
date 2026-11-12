import { authService } from '../services/authService.js'
import { servicioUsuarios } from '../services/servicioUsuarios.js'

const tablaBody = document.getElementById('tabla-usuarios')
const statusDiv = document.getElementById('status-mensaje')
const contadorSpan = document.getElementById('contador-usuarios')

const modalElement = document.getElementById('modal-confirmar-eliminacion')
const modalUsernameSpan = document.getElementById('modal-username')
const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar')
const modalEliminar = new window.bootstrap.Modal(modalElement)

let adminActual = null
let listaUsuarios = []
let usuarioSeleccionado = null

function mostrarMensaje(texto, tipo = 'info') {
  if (!texto) {
    statusDiv.textContent = ''
    statusDiv.className = 'mb-3'
    return
  }
  statusDiv.textContent = texto
  statusDiv.className = `alert alert-${tipo} mb-3`
}

function actualizarContador() {
  const total = listaUsuarios.length
  contadorSpan.textContent = `${total} ${total === 1 ? 'usuario' : 'usuarios'}`
}

function abrirModalEliminacion(username) {
  usuarioSeleccionado = username
  modalUsernameSpan.textContent = username
  btnConfirmarEliminar.disabled = false
  btnConfirmarEliminar.textContent = 'Eliminar usuario'
  modalEliminar.show()
}

function renderizarTabla() {
  tablaBody.replaceChildren()
  actualizarContador()

  if (!listaUsuarios.length) {
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.colSpan = 4
    td.className = 'text-center py-4 text-muted'
    td.textContent = 'No hay usuarios registrados.'
    tr.appendChild(td)
    tablaBody.appendChild(tr)
    return
  }

  listaUsuarios.forEach((usuario) => {
    const tr = document.createElement('tr')

    // Nombre
    const tdNombre = document.createElement('td')
    tdNombre.textContent = usuario.nombre ?? '-'

    // Username
    const tdUsername = document.createElement('td')
    tdUsername.className = 'fw-semibold'
    tdUsername.textContent = usuario.username

    // Rol
    const tdRol = document.createElement('td')
    const badge = document.createElement('span')
    const esAdmin = usuario.rol === 'admin'
    badge.className = esAdmin ? 'badge bg-warning text-dark' : 'badge bg-secondary'
    badge.textContent = usuario.rol
    tdRol.appendChild(badge)

    // Acciones
    const tdAcciones = document.createElement('td')
    tdAcciones.className = 'text-end'

    const esMismoUsuario = usuario.username === adminActual.username
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

tablaBody.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-action]')
  if (!boton || boton.disabled) return

  if (boton.dataset.action === 'eliminar') {
    abrirModalEliminacion(boton.dataset.username)
  }
})

btnConfirmarEliminar.addEventListener('click', async () => {
  if (!usuarioSeleccionado) return

  const username = usuarioSeleccionado
  btnConfirmarEliminar.disabled = true
  btnConfirmarEliminar.textContent = 'Eliminando...'
  mostrarMensaje('')

  try {
    await servicioUsuarios.eliminar(username)
    listaUsuarios = listaUsuarios.filter((u) => u.username !== username)
    renderizarTabla()
    mostrarMensaje(`Usuario "${username}" eliminado con éxito.`, 'success')
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo eliminar el usuario.', 'danger')
  } finally {
    usuarioSeleccionado = null
    modalEliminar.hide()
  }
})

async function inicializarPanel() {
  adminActual = await authService.obtenerUsuarioActual()
  if (!adminActual || adminActual.rol !== 'admin') {
    window.location.assign('index.html')
    return
  }

  try {
    listaUsuarios = await servicioUsuarios.obtenerTodos()
    renderizarTabla()
  } catch (err) {
    tablaBody.replaceChildren()
    mostrarMensaje(err.message || 'Error al cargar la lista de usuarios.', 'danger')
  }
}

inicializarPanel()