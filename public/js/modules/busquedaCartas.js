import { buscarCartas } from "../services/cartaApi.js"
import {
  cerrarDropdownBusqueda,
  crearRenderizadorDialogoBusqueda,
  mostrarCargaBusqueda,
  mostrarErrorBusqueda,
  renderizarResultadosBusqueda
} from "../components/renderizadorBusqueda.js"

const DEMORA_SPINNER_MS = 150
const ESPERA_ENTRE_TECLAS_MS = 250
const LONGITUD_MINIMA_BUSQUEDA = 2
const LIMITE_RESULTADOS_DIALOGO = 10

const entradasInicializadas = new WeakSet()

function coincideTipo(carta, filtro) {
  if (filtro === "link") return carta.type?.toLowerCase().includes("link") ?? false
  if (filtro === "monster") return carta.type?.toLowerCase().includes("monster") ?? false
  if (filtro === "pendulum") return carta.type?.toLowerCase().includes("pendulum") ?? false
  return true
}

/**
 * Crea un controlador genérico de búsqueda con espera entre teclas,
 * cancelación por AbortController y spinner diferido.
 */
export function crearControladorBusqueda({
  entrada,
  obtenerFiltros = (nombre) => ({ name: nombre }),
  minCaracteres = LONGITUD_MINIMA_BUSQUEDA,
  esperaMs = ESPERA_ENTRE_TECLAS_MS,
  demoraCargaMs = DEMORA_SPINNER_MS,
  filtrarResultados,
  cancelarConEscape = false,
  onVacio,
  onInicioCarga,
  onResultados,
  onError,
  onCancelar
}) {
  let esperaEscritura
  let temporizadorCarga
  let solicitudActiva
  let idBusqueda = 0

  function limpiarTemporizadoresYSolicitud() {
    clearTimeout(esperaEscritura)
    clearTimeout(temporizadorCarga)
    solicitudActiva?.abort()
    solicitudActiva = undefined
  }

  function cancelar({ notificar = false } = {}) {
    limpiarTemporizadoresYSolicitud()
    idBusqueda++
    if (notificar) {
      onCancelar?.()
    }
  }

  async function buscar() {
    limpiarTemporizadoresYSolicitud()
    const idActual = ++idBusqueda
    const nombre = entrada.value.trim()

    if (nombre.length < minCaracteres) {
      onVacio?.()
      return
    }

    const controlador = new AbortController()
    solicitudActiva = controlador
    temporizadorCarga = setTimeout(() => {
      if (idActual === idBusqueda) {
        onInicioCarga?.()
      }
    }, demoraCargaMs)

    try {
      const cartas = await buscarCartas(
        obtenerFiltros(nombre),
        { signal: controlador.signal }
      )

      if (idActual !== idBusqueda) return

      clearTimeout(temporizadorCarga)
      const resultados = filtrarResultados ? filtrarResultados(cartas) : cartas
      onResultados?.(resultados)
    } catch (error) {
      if (error.name === "AbortError" || idActual !== idBusqueda) return

      clearTimeout(temporizadorCarga)
      console.error("No se pudo completar la búsqueda de cartas:", error)
      onError?.(error)
    } finally {
      if (idActual === idBusqueda) {
        solicitudActiva = undefined
      }
    }
  }

  entrada.addEventListener("input", () => {
    cancelar({ notificar: true })
    if (entrada.value.trim().length < minCaracteres) {
      onVacio?.()
      return
    }
    esperaEscritura = setTimeout(buscar, esperaMs)
  })

  entrada.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault()
      void buscar()
    } else if (cancelarConEscape && evento.key === "Escape") {
      cancelar({ notificar: true })
    }
  })

  return { buscar, cancelar }
}

/**
 * Conecta el diálogo modal de búsqueda (#searchDialog) con la búsqueda por nombre.
 * Es idempotente: múltiples llamadas sobre la misma entrada no duplican listeners.
 */
export function inicializarBusquedaDialogo({
  dialog = document.getElementById("searchDialog"),
  entrada = document.getElementById("navbarSearchInput"),
  resultados = document.getElementById("searchResults"),
  limite = LIMITE_RESULTADOS_DIALOGO,
  onSelect
} = {}) {
  if (!entrada || !resultados) return null
  if (entradasInicializadas.has(entrada)) return null
  entradasInicializadas.add(entrada)

  const renderizador = crearRenderizadorDialogoBusqueda(resultados, { limite, onSelect })

  const controlador = crearControladorBusqueda({
    entrada,
    onVacio: () => renderizador.mostrarInicial(),
    onInicioCarga: () => renderizador.mostrarCargando(),
    onResultados: (cartas) => renderizador.mostrarResultados(cartas),
    onError: () => renderizador.mostrarError()
  })

  if (dialog) {
    dialog.addEventListener("shown.bs.dialog", () => {
      entrada.focus()
    })

    dialog.addEventListener("hidden.bs.dialog", () => {
      controlador.cancelar()
      if (entrada.value.trim().length < LONGITUD_MINIMA_BUSQUEDA) {
        renderizador.mostrarInicial()
      }
    })
  }

  return controlador
}

function inicializarBusquedaDropdown({ onSelect } = {}) {
  const entrada = document.getElementById("search-input")
  const boton = document.getElementById("search-button")
  const filtroTipo = document.getElementById("search-type-filter")
  const filtroRaza = document.getElementById("search-race-filter")
  const dropdown = document.getElementById("search-dropdown")

  if (!entrada || !boton || !dropdown) return null
  if (entradasInicializadas.has(entrada)) return null
  entradasInicializadas.add(entrada)

  const controlador = crearControladorBusqueda({
    entrada,
    obtenerFiltros: (nombre) => ({
      name: nombre,
      race: filtroRaza?.value
    }),
    filtrarResultados: (cartas) =>
      cartas.filter((carta) => coincideTipo(carta, filtroTipo?.value ?? "all")),
    cancelarConEscape: true,
    onVacio: () => cerrarDropdownBusqueda(),
    onInicioCarga: () => mostrarCargaBusqueda(),
    onResultados: (cartas) => renderizarResultadosBusqueda(cartas, onSelect),
    onError: () => mostrarErrorBusqueda(),
    onCancelar: () => cerrarDropdownBusqueda()
  })

  boton.addEventListener("click", () => {
    void controlador.buscar()
  })
  filtroTipo?.addEventListener("change", () => {
    void controlador.buscar()
  })
  filtroRaza?.addEventListener("change", () => {
    void controlador.buscar()
  })
  document.addEventListener("click", (evento) => {
    if (!dropdown.parentElement?.contains(evento.target)) {
      controlador.cancelar({ notificar: true })
    }
  })

  return controlador
}

/**
 * Conecta la búsqueda con el catálogo de cartas (dropdown o diálogo modal).
 * Espera 250ms después de la escritura, cancela solicitudes obsoletas y muestra el spinner
 * solo si la consulta tarda más que el intervalo configurado.
 */
export function inicializarBusquedaCartas({ onSelect } = {}) {
  const tieneDropdown =
    document.getElementById("search-input") &&
    document.getElementById("search-button") &&
    document.getElementById("search-dropdown")
  const tieneDialogo =
    document.getElementById("navbarSearchInput") &&
    document.getElementById("searchResults")

  if (!tieneDropdown && !tieneDialogo) {
    throw new Error("No se encontraron todos los controles de búsqueda de cartas.")
  }

  if (tieneDropdown) {
    inicializarBusquedaDropdown({ onSelect })
  }

  if (tieneDialogo) {
    inicializarBusquedaDialogo({ onSelect })
  }
}
