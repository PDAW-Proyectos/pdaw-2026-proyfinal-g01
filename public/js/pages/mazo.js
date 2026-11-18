import { ApiError } from "../api.js"
import { crearCartaMazo } from "../components/cartaMazo.js"
import { renderizarInformacionMazo } from "../components/informacionMazo.js"
import { renderizarPaginacion } from "../components/paginacion.js"
import { obtenerMazoPorId } from "../services/servicioMazos.js"
import { obtenerElemento } from "../utils/dom.js"
import { contarCartasZona } from "../utils/utilidadesMazos.js"

const CARTAS_POR_PAGINA = {
  main: 16,
  extra: 8
}

const paginas = { main: 1, extra: 1 }
let mazoActual

function renderizarZona(mazo, nombre, pagina) {
  const entradas = mazo[nombre === "main" ? "mainDeck" : "extraDeck"] ?? []
  const totalCartasZona = contarCartasZona(entradas)
  const limite = CARTAS_POR_PAGINA[nombre]
  const totalPaginas = Math.ceil(entradas.length / limite)
  const contenedorCartas = obtenerElemento(`${nombre}-cards`)

  obtenerElemento(`${nombre}-count`).textContent = `${totalCartasZona} cartas`

  if (entradas.length === 0) {
    const vacio = document.createElement("p")
    vacio.className = "deck-empty"
    vacio.textContent = "Este mazo todavía no tiene cartas en esta sección."
    contenedorCartas.replaceChildren(vacio)
  } else {
    const inicio = (pagina - 1) * limite
    const fragmento = document.createDocumentFragment()
    for (const entrada of entradas.slice(inicio, inicio + limite)) {
      fragmento.append(crearCartaMazo(entrada))
    }
    contenedorCartas.replaceChildren(fragmento)
  }

  renderizarPaginacion(
    obtenerElemento(`${nombre}-pagination`),
    {
      paginaActual: pagina,
      totalPaginas,
      totalEntradas: entradas.length,
      tieneAnterior: pagina > 1,
      tieneSiguiente: pagina < totalPaginas
    },
    {
      ocultarSiUnica: true,
      alCambiarPagina: (nuevaPagina) => cambiarPagina(nombre, nuevaPagina)
    }
  )
}

function renderizarDetalleMazo(mazo) {
  renderizarInformacionMazo(mazo)
  renderizarZona(mazo, "main", paginas.main)
  renderizarZona(mazo, "extra", paginas.extra)
  obtenerElemento("deck-content").hidden = false
  obtenerElemento("deck-status").hidden = true
  obtenerElemento("deck-page").setAttribute("aria-busy", "false")
  document.title = `${mazo.nombre} · YuGiKi`
}

function renderizarErrorDetalleMazo(mensaje) {
  obtenerElemento("deck-content").hidden = true
  const estado = obtenerElemento("deck-status")
  estado.textContent = mensaje
  estado.classList.add("deck-load-error")
  estado.hidden = false
  obtenerElemento("deck-page").setAttribute("aria-busy", "false")
}

function cambiarPagina(zona, pagina) {
  paginas[zona] = pagina
  renderizarDetalleMazo(mazoActual)
}

/**
 * Lee el ID de la URL, carga el mazo desde el backend y conecta la paginación.
 */
async function inicializarDetalleMazo() {
  const parametros = new URLSearchParams(window.location.search)
  const idMazo = parametros.get("id")
  const esPopular = parametros.get("popular") === "true"
  if (!idMazo) {
    renderizarErrorDetalleMazo("No se indicó qué mazo se debe mostrar.")
    return
  }

  try {
    mazoActual = await obtenerMazoPorId(idMazo, { popular: esPopular })
    renderizarDetalleMazo(mazoActual)
  } catch (error) {
    console.error("No se pudo cargar el detalle del mazo:", error)
    const mensaje = error instanceof ApiError && error.status === 404
      ? "No se encontró el mazo solicitado."
      : error.message || "No se pudo cargar el detalle del mazo."
    renderizarErrorDetalleMazo(mensaje)
  }
}

void inicializarDetalleMazo()
