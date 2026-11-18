import { buscarCartas } from "../services/servicioCartas.js"
import { leerFiltrosCartas } from "../utils/utilidadesCartas.js"
import {
  crearCartaBusquedaRapida,
  renderizarErrorBusquedaRapida
} from "../components/cartaBusquedaRapida.js"
import { renderizarListaTabla } from "../components/listaTabla.js"
import { mostrarSkeletons } from "../components/skeletonCarta.js"

const ESPERA_MS = 250
const MIN_CARACTERES = 2
const LIMITE_RAPIDO = 10
const entradasInicializadas = new WeakSet()

function mostrarMensaje(contenedor, texto, clase = "fg-2 text-center my-4") {
  const p = document.createElement("p")
  p.className = clase
  p.textContent = texto
  contenedor.replaceChildren(p)
}

/**
 * Cierra el dropdown de búsqueda rápida y limpia sus resultados.
 */
export function cerrarDropdownBusqueda(
  dropdown = document.getElementById("search-dropdown"),
  resultados = document.getElementById("search-results"),
  carga = document.getElementById("search-loading")
) {
  carga?.classList.remove("active")
  resultados?.classList.remove("active")
  resultados?.replaceChildren()
  dropdown?.classList.remove("active")
}

/**
 * Inicializa un buscador rápido de cartas (para el diálogo del navbar o el dropdown del mazo).
 * Usa `cartaBusquedaRapida` junto con `listaTabla` para los resultados y `skeletonCarta` mientras carga.
 */
export function inicializarBusquedaRapida({
  entrada,
  resultados,
  filtros = {},
  boton,
  dropdown,
  dialog,
  limite = LIMITE_RAPIDO,
  minCaracteres = MIN_CARACTERES,
  esperaMs = ESPERA_MS,
  onSelect
} = {}) {
  if (!entrada || !resultados || entradasInicializadas.has(entrada)) return null
  entradasInicializadas.add(entrada)

  const raizFiltros = dialog ?? dropdown?.parentElement ?? null
  let temporizador
  let abortController

  function limpiarEstado() {
    clearTimeout(temporizador)
    abortController?.abort()
    if (dropdown) {
      cerrarDropdownBusqueda(dropdown, resultados)
    } else {
      mostrarMensaje(resultados, "Escribe para comenzar a buscar cartas...")
    }
  }

  async function buscar() {
    clearTimeout(temporizador)
    abortController?.abort()

    const parametros = leerFiltrosCartas(entrada, filtros, raizFiltros)
    const tieneFiltrosExtra = Object.keys(parametros).some((k) => k !== "name")
    if ((parametros.name?.length ?? 0) < minCaracteres && !tieneFiltrosExtra) {
      limpiarEstado()
      return
    }

    abortController = new AbortController()
    if (dropdown) {
      dropdown.classList.add("active")
      resultados.classList.add("active")
    }
    mostrarSkeletons(resultados, 3, { tamano: "list" })

    try {
      const cartas = await buscarCartas(parametros, { signal: abortController.signal })
      if (!Array.isArray(cartas)) {
        renderizarErrorBusquedaRapida(resultados)
        return
      }

      renderizarListaTabla(resultados, cartas.slice(0, limite), {
        crearFila: (carta) => crearCartaBusquedaRapida(carta, { onSelect }),
        mensajeVacio: "No se encontraron cartas.",
        claseCelda: "p-0 border-0"
      })
    } catch (error) {
      if (error.name === "AbortError") return
      renderizarErrorBusquedaRapida(resultados)
    }
  }

  entrada.addEventListener("input", () => {
    clearTimeout(temporizador)
    temporizador = setTimeout(buscar, esperaMs)
  })

  entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault()
      void buscar()
    } else if (evento.key === "Escape" && dropdown) {
      limpiarEstado()
    }
  })

  boton?.addEventListener("click", () => void buscar())

  for (const control of Object.values(filtros)) {
    control?.addEventListener("change", () => void buscar())
  }
  raizFiltros?.querySelectorAll("[data-card-filter]").forEach((el) => {
    el.addEventListener("change", () => void buscar())
  })

  if (dialog) {
    dialog.addEventListener("shown.bs.dialog", () => entrada.focus())
    dialog.addEventListener("hidden.bs.dialog", () => abortController?.abort())
  }

  if (dropdown) {
    document.addEventListener("click", (evento) => {
      if (!dropdown.parentElement?.contains(evento.target)) {
        limpiarEstado()
      }
    })
  }

  return { buscar, limpiar: limpiarEstado }
}

/** Conecta el diálogo de búsqueda rápida de la navbar (#searchDialog). */
export function inicializarBusquedaDialogo(opciones = {}) {
  return inicializarBusquedaRapida({
    dialog: document.getElementById("searchDialog"),
    entrada: document.getElementById("navbarSearchInput"),
    resultados: document.getElementById("searchResults"),
    ...opciones
  })
}

/** Conecta el dropdown de búsqueda rápida (por ejemplo en el constructor de mazos). */
export function inicializarBusquedaDropdown(opciones = {}) {
  return inicializarBusquedaRapida({
    entrada: document.getElementById("search-input"),
    boton: document.getElementById("search-button"),
    dropdown: document.getElementById("search-dropdown"),
    resultados: document.getElementById("search-results"),
    ...opciones
  })
}
