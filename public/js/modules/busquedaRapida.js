import { buscarCartasPaginadas } from "../services/servicioCartas.js"
import {
  enlazarFiltrosInmediatos,
  inicializarFiltrosDialogoBusqueda,
  inicializarLimitesFiltrosNumericos,
  leerFiltrosCartas
} from "./filtrosBusqueda.js"

const ESPERA_MS = 250
const MIN_CARACTERES = 2
const LIMITE_RAPIDO = 10
const entradasInicializadas = new WeakSet()

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
 * Asigna la funcionalidad de búsqueda rápida y filtrado a una barra de búsqueda ya presente
 * en el HTML y devuelve el arreglo de cartas encontradas a `alRecibirResultados(cartas, resultados, paginacion)`.
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
  alLimpiar,
  alIniciarCarga,
  alRecibirResultados,
  alOcurrirError
} = {}) {
  if (!entrada || !resultados || entradasInicializadas.has(entrada)) return null
  entradasInicializadas.add(entrada)

  let temporizador
  let abortController

  const footerResultados = dialog?.querySelector("#searchResultsFooter") ?? null
  const contadorResultados = dialog?.querySelector("#searchResultsCount") ?? null

  const controladorFiltrosDialogo = inicializarFiltrosDialogoBusqueda({
    dialog,
    alCambiarFiltros: () => void buscar()
  })
  const raizFiltros = controladorFiltrosDialogo
    ? null
    : (dialog ?? dropdown?.parentElement ?? null)

  function ocultarContadorResultados() {
    if (contadorResultados) {
      contadorResultados.textContent = ""
    }
    footerResultados?.classList.add("d-none")
  }

  function actualizarContadorResultados(mostradas, total) {
    if (!footerResultados || !contadorResultados) return
    contadorResultados.textContent = `Mostrando ${mostradas}/${total}`
    footerResultados.classList.remove("d-none")
  }

  function limpiarEstado() {
    clearTimeout(temporizador)
    abortController?.abort()
    ocultarContadorResultados()
    if (dropdown) {
      cerrarDropdownBusqueda(dropdown, resultados)
    } else {
      alLimpiar?.(resultados)
    }
  }

  async function buscar() {
    clearTimeout(temporizador)
    abortController?.abort()

    const parametros = controladorFiltrosDialogo
      ? {
          ...(entrada.value?.trim() ? { name: entrada.value.trim() } : {}),
          ...controladorFiltrosDialogo.obtenerFiltrosAplicados()
        }
      : leerFiltrosCartas(entrada, filtros, raizFiltros)

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
    ocultarContadorResultados()
    alIniciarCarga?.(resultados)

    try {
      const { datos, paginacion } = await buscarCartasPaginadas(parametros, {
        signal: abortController.signal
      })
      if (!Array.isArray(datos)) {
        ocultarContadorResultados()
        alOcurrirError?.(resultados)
        return
      }

      const cartasVisibles = datos.slice(0, limite)
      const totalResultados = paginacion?.totalEntradas ?? datos.length
      actualizarContadorResultados(cartasVisibles.length, totalResultados)
      alRecibirResultados?.(cartasVisibles, resultados, paginacion)
    } catch (error) {
      if (error.name === "AbortError") return
      ocultarContadorResultados()
      alOcurrirError?.(resultados, error)
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

  if (!controladorFiltrosDialogo) {
    inicializarLimitesFiltrosNumericos(raizFiltros)
    enlazarFiltrosInmediatos({
      filtros,
      contenedorFiltros: raizFiltros,
      alCambiar: () => void buscar()
    })
  }

  if (dialog) {
    dialog.addEventListener("shown.bs.dialog", () => entrada.focus())
    dialog.addEventListener("hidden.bs.dialog", () => {
      controladorFiltrosDialogo?.cerrarMenus()
      abortController?.abort()
    })
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
export function inicializarBusquedaRapidaDialogo(opciones = {}) {
  return inicializarBusquedaRapida({
    dialog: document.getElementById("searchDialog"),
    entrada: document.getElementById("navbarSearchInput"),
    resultados: document.getElementById("searchResults"),
    ...opciones
  })
}

/** Conecta el dropdown de búsqueda rápida (por ejemplo en el constructor de mazos). */
export function inicializarBusquedaRapidaDropdown(opciones = {}) {
  return inicializarBusquedaRapida({
    entrada: document.getElementById("search-input"),
    boton: document.getElementById("search-button"),
    dropdown: document.getElementById("search-dropdown"),
    resultados: document.getElementById("search-results"),
    ...opciones
  })
}
