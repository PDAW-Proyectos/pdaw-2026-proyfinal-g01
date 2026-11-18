import { ApiError } from "../api.js"
import { renderizarListaTabla } from "../components/listaTabla.js"
import { crearMazoLista } from "../components/mazo/mazoLista.js"
import {
  inicializarEventosPaginacion,
  renderizarPaginacion
} from "../components/paginacion.js"
import { listarMazos } from "../services/servicioMazos.js"

const paginaEl = document.getElementById("community-decks-page")
const estadoEl = document.getElementById("decks-status")
const listaEl = document.getElementById("community-decks-list")
const paginacionEl = document.getElementById("decks-pagination")

let paginaActual = 1
let controladorCarga = null

function actualizarEstado(mensaje = "", { esError = false } = {}) {
  if (!estadoEl) return
  estadoEl.textContent = mensaje
  estadoEl.classList.toggle("fg-danger", esError)
  estadoEl.classList.toggle("fg-2", !esError)
  estadoEl.hidden = !mensaje
}

async function cargarMazos(pagina = 1) {
  controladorCarga?.abort()
  controladorCarga = new AbortController()
  const { signal } = controladorCarga

  paginaActual = Math.max(1, Number(pagina) || 1)
  paginaEl?.setAttribute("aria-busy", "true")
  actualizarEstado("Cargando mazos...")

  try {
    const { datos, paginacion } = await listarMazos(paginaActual, { signal })
    paginaActual = paginacion?.paginaActual ?? paginaActual

    renderizarListaTabla(listaEl, datos, {
      crearFila: crearMazoLista,
      mensajeVacio: "Todavía no hay mazos creados por la comunidad.",
      claseVacio: "text-center py-6 fg-2 border-0",
      claseTabla: "table table-borderless align-middle mb-0",
      claseCelda: "px-0 py-2 border-0"
    })

    renderizarPaginacion(paginacionEl, paginacion)
    actualizarEstado("")
  } catch (error) {
    if (error?.name === "AbortError") return

    if (error instanceof ApiError && error.status === 404 && paginaActual > 1) {
      await cargarMazos(paginaActual - 1)
      return
    }

    console.error("No se pudieron cargar los mazos de la comunidad:", error)
    listaEl?.replaceChildren()
    renderizarPaginacion(paginacionEl, null)
    actualizarEstado(
      error.message || "No se pudieron cargar los mazos de la comunidad.",
      { esError: true }
    )
  } finally {
    if (!signal.aborted) {
      paginaEl?.setAttribute("aria-busy", "false")
    }
  }
}

inicializarEventosPaginacion(paginacionEl, (nuevaPagina) => {
  void cargarMazos(nuevaPagina)
  window.scrollTo({ top: 0, behavior: "smooth" })
})

void cargarMazos(1)
