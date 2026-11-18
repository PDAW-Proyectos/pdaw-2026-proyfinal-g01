import { Combobox } from "../bootstrap/bootstrap.bundle.min.js"
import { buscarCartasPaginadas } from "../services/servicioCartas.js"
import {
  enlazarFiltrosInmediatos,
  inicializarLimitesFiltrosNumericos,
  leerFiltrosCartas
} from "./filtrosBusqueda.js"

const ESPERA_MS = 250

/**
 * Conecta los controles de búsqueda, filtrado y ordenamiento ya presentes en el HTML
 * con el servicio de cartas paginadas y devuelve `{ datos, paginacion }` a través de callbacks.
 */
export function crearBusquedaCartas({
  contenedor = document.getElementById("cardsGrid"),
  entrada,
  botonBuscar,
  filtros = {},
  contenedorFiltros,
  obtenerFiltros,
  comboboxOrden = document.getElementById("catalogSortCombobox"),
  selectAlfabetico,
  selectPrecio,
  obtenerOrden,
  esperaMs = ESPERA_MS,
  buscarAlIniciar = true,
  alIniciarCarga,
  alRecibirResultados,
  alOcurrirError,
  alFinalizarCarga
} = {}) {
  if (!contenedor) return null

  const ClaseCombobox = Combobox ?? globalThis.bootstrap?.Combobox
  if (comboboxOrden && ClaseCombobox) {
    ClaseCombobox.getOrCreateInstance(comboboxOrden)
  }

  let paginaActual = 1
  let paginacionActual = null
  let solicitudActual = 0
  let temporizador
  let abortController

  function leerOrdenCombobox() {
    if (!comboboxOrden) return ""

    const instancia = ClaseCombobox?.getInstance(comboboxOrden)
    const valorInputOculto =
      instancia?._hiddenInput?.value ??
      (comboboxOrden.previousElementSibling?.type === "hidden"
        ? comboboxOrden.previousElementSibling.value
        : "")
    if (valorInputOculto) return valorInputOculto.trim()

    const menu =
      instancia?._menu ??
      (comboboxOrden.nextElementSibling?.classList?.contains("menu")
        ? comboboxOrden.nextElementSibling
        : null)
    const itemSeleccionado = menu?.querySelector(".menu-item.selected")
    return itemSeleccionado?.dataset?.bsValue?.trim() ?? ""
  }

  let ordenCombobox = leerOrdenCombobox()

  function resolverOrden() {
    if (obtenerOrden) return obtenerOrden()
    const ordenActualCombobox = ordenCombobox || leerOrdenCombobox()
    if (ordenActualCombobox) return ordenActualCombobox
    if (selectAlfabetico?.value && selectAlfabetico.value !== "none") {
      return selectAlfabetico.value
    }
    if (selectPrecio?.value && selectPrecio.value !== "none") {
      return selectPrecio.value
    }
    return undefined
  }

  async function cargarPagina(pagina = 1) {
    clearTimeout(temporizador)
    abortController?.abort()
    abortController = new AbortController()

    const idSolicitud = ++solicitudActual
    contenedor.setAttribute("aria-busy", "true")
    alIniciarCarga?.({ contenedor, paginacionActual })

    const parametros = {
      ...(obtenerFiltros ? obtenerFiltros() : {}),
      ...leerFiltrosCartas(entrada, filtros, contenedorFiltros)
    }
    parametros.page = pagina
    const orden = resolverOrden()
    if (orden) parametros.orden = orden

    try {
      const resultado = await buscarCartasPaginadas(parametros, {
        signal: abortController.signal
      })
      if (idSolicitud !== solicitudActual) return

      paginaActual = resultado.paginacion.paginaActual
      paginacionActual = resultado.paginacion
      alRecibirResultados?.(resultado.datos, resultado.paginacion, contenedor)
    } catch (error) {
      if (error.name === "AbortError" || idSolicitud !== solicitudActual) return
      console.error("No se pudieron cargar las cartas:", error)
      alOcurrirError?.(error, contenedor)
    } finally {
      if (idSolicitud === solicitudActual) {
        contenedor.setAttribute("aria-busy", "false")
        alFinalizarCarga?.(paginacionActual, contenedor)
      }
    }
  }

  entrada?.addEventListener("input", () => {
    clearTimeout(temporizador)
    temporizador = setTimeout(() => void cargarPagina(1), esperaMs)
  })

  entrada?.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault()
      void cargarPagina(1)
    }
  })

  botonBuscar?.addEventListener("click", () => void cargarPagina(1))

  inicializarLimitesFiltrosNumericos(contenedorFiltros)
  enlazarFiltrosInmediatos({
    filtros,
    contenedorFiltros,
    alCambiar: () => void cargarPagina(1)
  })

  comboboxOrden?.addEventListener("change.bs.combobox", (evento) => {
    ordenCombobox = (
      evento.value ??
      evento.detail?.value ??
      leerOrdenCombobox() ??
      ""
    ).trim()
    void cargarPagina(1)
  })

  selectAlfabetico?.addEventListener("change", () => {
    if (selectAlfabetico.value !== "none" && selectPrecio) {
      selectPrecio.value = "none"
    }
    void cargarPagina(1)
  })

  selectPrecio?.addEventListener("change", () => {
    if (selectPrecio.value !== "none" && selectAlfabetico) {
      selectAlfabetico.value = "none"
    }
    void cargarPagina(1)
  })

  if (buscarAlIniciar) {
    void cargarPagina(1)
  }

  return {
    buscar: () => cargarPagina(1),
    cargarPagina,
    paginaAnterior: () => {
      if (paginacionActual?.tieneAnterior) return cargarPagina(paginaActual - 1)
    },
    paginaSiguiente: () => {
      if (paginacionActual?.tieneSiguiente) return cargarPagina(paginaActual + 1)
    }
  }
}
