import { Dialog } from "../bootstrap/bootstrap.bundle.min.js"
import { authService } from "../services/servicioAutentificacion.js"
import { servicioUsuarios } from "../services/servicioUsuarios.js"
import { renderizarListaTabla } from "../components/listaTabla.js"
import {
  actualizarContadorUsuarios,
  crearFilaUsuario
} from "../components/usuarioTablaAdmin.js"
import {
  renderizarPaginacion,
  inicializarEventosPaginacion
} from "../components/paginacion.js"
import { cerrarDialogoBootstrap } from "../utils/utilidadesDominio.js"

const USUARIOS_POR_PAGINA = 10

const tablaBody = document.getElementById("tabla-usuarios")
const statusDiv = document.getElementById("status-mensaje")
const contadorSpan = document.getElementById("contador-usuarios")
const inputFiltroUsername = document.getElementById("filtro-username")

const elementosPaginacion = {
  contenedor: document.getElementById("contenedor-paginacion"),
  info: document.getElementById("info-paginacion"),
  lista: document.getElementById("lista-paginacion")
}

const modalElement = document.getElementById("modal-confirmar-eliminacion")
const modalUsernameSpan = document.getElementById("modal-username")
const btnConfirmarEliminar = document.getElementById("btn-confirmar-eliminar")

const ClaseDialogo = Dialog ?? globalThis.bootstrap?.Dialog
const dialogEliminar =
  modalElement && ClaseDialogo ? ClaseDialogo.getOrCreateInstance(modalElement) : null

let adminActual = null
let usuarioSeleccionado = null
let textoFiltro = ""
let paginaActual = 1
let timeoutBusqueda = null
let controladorCarga = null

function abrirDialogoEliminar() {
  if (!modalElement) return
  if (dialogEliminar) {
    dialogEliminar.show()
  } else if (!modalElement.open) {
    modalElement.showModal?.()
  }
}

// Se usa para mostrar u ocultar alertas de estado, arriba de la tabla
function mostrarMensaje(texto, tipo = "info") {
  if (!texto) {
    statusDiv.textContent = ""
    statusDiv.className = "mb-3"
    return
  }
  statusDiv.textContent = texto
  statusDiv.className = `alert theme-${tipo} mb-3`
}

// Pide los usuarios paginados/filtrados al backend y actualiza la tabla y los controles
async function cargarUsuarios() {
  controladorCarga?.abort()
  controladorCarga = new AbortController()
  const { signal } = controladorCarga

  try {
    const { datos, paginacion } = await servicioUsuarios.obtenerPaginados(
      {
        pagina: paginaActual,
        limite: USUARIOS_POR_PAGINA,
        username: textoFiltro
      },
      { signal }
    )

    paginaActual = paginacion.paginaActual
    actualizarContadorUsuarios(contadorSpan, paginacion.totalEntradas)
    renderizarListaTabla(tablaBody, datos, {
      crearFila: (usuario) =>
        crearFilaUsuario(usuario, { usernameActual: adminActual.username }),
      columnas: 4,
      claseVacio: "text-center py-4 fg-2",
      mensajeVacio: textoFiltro.trim()
        ? "No se encontraron usuarios con ese username."
        : "No hay usuarios registrados."
    })
    renderizarPaginacion(elementosPaginacion, paginacion)
  } catch (err) {
    if (err?.name === "AbortError") return

    if (err?.status === 401 || err?.status === 403) {
      window.location.assign("index.html")
      return
    }

    if (paginaActual > 1 && (!err?.status || err.status === 404)) {
      paginaActual -= 1
      await cargarUsuarios()
      return
    }

    renderizarListaTabla(tablaBody, [], {
      columnas: 4,
      claseVacio: "text-center py-4 fg-2",
      mensajeVacio: "No se pudieron cargar los usuarios."
    })
    renderizarPaginacion(elementosPaginacion, null)
    mostrarMensaje(err.message || "Error al cargar la lista de usuarios.", "danger")
  }
}

// Filtra por username esperando 300ms tras escribir y reinicia a la página 1
inputFiltroUsername.addEventListener("input", (e) => {
  clearTimeout(timeoutBusqueda)
  timeoutBusqueda = setTimeout(() => {
    textoFiltro = e.target.value
    paginaActual = 1
    void cargarUsuarios()
  }, 300)
})

// Cambia de pagina y recarga la tabla al hacer clic en la barra de paginacion
inicializarEventosPaginacion(elementosPaginacion.lista, (nuevaPagina) => {
  paginaActual = nuevaPagina
  void cargarUsuarios()
})

// Abre el dialog de confirmación y guarda el username de la fila seleccionada
tablaBody.addEventListener("click", (e) => {
  const boton = e.target.closest('[data-action="eliminar"]')
  if (!boton || boton.disabled) return

  usuarioSeleccionado = boton.dataset.username
  modalUsernameSpan.textContent = usuarioSeleccionado
  btnConfirmarEliminar.disabled = false
  btnConfirmarEliminar.textContent = "Eliminar usuario"
  abrirDialogoEliminar()
})

modalElement?.addEventListener("hidden.bs.dialog", () => {
  usuarioSeleccionado = null
})

// Ejecuta la eliminación en el backend, refresca la lista y cierra el dialog
btnConfirmarEliminar.addEventListener("click", async () => {
  if (!usuarioSeleccionado) return

  const username = usuarioSeleccionado
  btnConfirmarEliminar.disabled = true
  btnConfirmarEliminar.textContent = "Eliminando..."
  mostrarMensaje("")

  try {
    await servicioUsuarios.eliminar(username)
    await cargarUsuarios()
    mostrarMensaje(`Usuario "${username}" eliminado con éxito.`, "success")
  } catch (err) {
    mostrarMensaje(err.message || "No se pudo eliminar el usuario.", "danger")
  } finally {
    usuarioSeleccionado = null
    document.activeElement?.blur()
    cerrarDialogoBootstrap(modalElement)
  }
})

// Verifica que el usuario logueado sea admin y dispara la carga inicial del panel
async function inicializarPanel() {
  adminActual = await authService.obtenerUsuarioActual()
  if (!adminActual || adminActual.rol !== "admin") {
    window.location.assign("index.html")
    return
  }

  await cargarUsuarios()
}

void inicializarPanel()
