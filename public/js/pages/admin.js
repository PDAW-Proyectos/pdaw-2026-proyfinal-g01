import { authService } from '../services/authService.js'
import { servicioUsuarios } from '../services/servicioUsuarios.js'
import { renderizarTablaUsuarios, actualizarContadorUsuarios } from '../components/renderizadorUsuarios.js'
import { renderizarPaginacion, inicializarEventosPaginacion } from '../components/renderizadorPaginacion.js'

const USUARIOS_POR_PAGINA = 10

const tablaBody = document.getElementById('tabla-usuarios')
const statusDiv = document.getElementById('status-mensaje')
const contadorSpan = document.getElementById('contador-usuarios')
const inputFiltroUsername = document.getElementById('filtro-username')

const elementosPaginacion = {
  contenedor: document.getElementById('contenedor-paginacion'),
  info: document.getElementById('info-paginacion'),
  lista: document.getElementById('lista-paginacion'),
}

const modalElement = document.getElementById('modal-confirmar-eliminacion')
const modalUsernameSpan = document.getElementById('modal-username')
const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar')
const modalEliminar = new window.bootstrap.Modal(modalElement)

let adminActual = null
let usuarioSeleccionado = null
let textoFiltro = ''
let paginaActual = 1
let timeoutBusqueda = null

// Se usa para mostrar o oculta alertas de estado, arriba de la tabla
function mostrarMensaje(texto, tipo = 'info') {
  if (!texto) {
    statusDiv.textContent = ''
    statusDiv.className = 'mb-3'
    return
  }
  statusDiv.textContent = texto
  statusDiv.className = `alert alert-${tipo} mb-3`
}

// Pide los usuarios paginados/filtrados al backend y actualiza la tabla y los controles
async function cargarUsuarios() {
  try {
    const { datos, paginacion } = await servicioUsuarios.obtenerPaginados({
      pagina: paginaActual,
      limite: USUARIOS_POR_PAGINA,
      username: textoFiltro,
    })

    paginaActual = paginacion.paginaActual
    actualizarContadorUsuarios(contadorSpan, paginacion.totalEntradas)
    renderizarTablaUsuarios(tablaBody, datos, {
      usernameActual: adminActual.username,
      textoFiltro,
    })
    renderizarPaginacion(elementosPaginacion, paginacion)
  } catch (err) {
    if (paginaActual > 1) {
      paginaActual -= 1
      await cargarUsuarios()
      return
    }
    tablaBody.replaceChildren()
    elementosPaginacion.contenedor.classList.add('d-none')
    mostrarMensaje(err.message || 'Error al cargar la lista de usuarios.', 'danger')
  }
}

// Filtra por username esperando 300ms tras escribir y reinicia a la página 1
inputFiltroUsername.addEventListener('input', (e) => { //se puede hacer con click
  clearTimeout(timeoutBusqueda)
  timeoutBusqueda = setTimeout(() => {
    textoFiltro = e.target.value
    paginaActual = 1
    cargarUsuarios()
  }, 300)
})

// Cambia de pagina y recarga la tabla al hacer clic en la barra de paginacion
inicializarEventosPaginacion(elementosPaginacion.lista, (nuevaPagina) => {
  paginaActual = nuevaPagina
  cargarUsuarios()
})

// Abre el modal de confirmación y guarda el username de la fila seleccionada
tablaBody.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-action="eliminar"]')
  if (!boton || boton.disabled) return

  usuarioSeleccionado = boton.dataset.username
  modalUsernameSpan.textContent = usuarioSeleccionado
  btnConfirmarEliminar.disabled = false
  btnConfirmarEliminar.textContent = 'Eliminar usuario'
  modalEliminar.show()
})

// Ejecuta la eliminación en el backend, refresca la lista y cierra el modal
btnConfirmarEliminar.addEventListener('click', async () => {
  if (!usuarioSeleccionado) return

  const username = usuarioSeleccionado
  btnConfirmarEliminar.disabled = true
  btnConfirmarEliminar.textContent = 'Eliminando...'
  mostrarMensaje('')

  try {
    await servicioUsuarios.eliminar(username)
    await cargarUsuarios()
    mostrarMensaje(`Usuario "${username}" eliminado con éxito.`, 'success')
  } catch (err) {
    mostrarMensaje(err.message || 'No se pudo eliminar el usuario.', 'danger')
  } finally {
    usuarioSeleccionado = null
    document.activeElement?.blur()
    modalEliminar.hide()
  }
})

// Verifica que el usuario logueado sea admin y dispara la carga inicial del panel
async function inicializarPanel() {
  adminActual = await authService.obtenerUsuarioActual()
  if (!adminActual || adminActual.rol !== 'admin') {
    window.location.assign('index.html')
    return
  }

  await cargarUsuarios()
}

inicializarPanel()