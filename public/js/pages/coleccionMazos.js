import { ApiError } from "../api.js"
import {
  crearCartaBusquedaRapida,
  renderizarErrorBusquedaRapida,
  renderizarMensajeBusquedaRapida
} from "../components/carta/cartaBusquedaRapida.js"
import { mostrarSkeletons } from "../components/carta/skeletonCarta.js"
import { renderizarListaTabla } from "../components/listaTabla.js"
import {
  renderizarListaMazos,
  renderizarMazoEditable
} from "../components/mazo/mazoEditable.js"
import { inicializarBusquedaRapidaDialogo } from "../modules/busquedaRapida.js"
import {
  agregarCartaAlMazo,
  crearMazo,
  eliminarMazo,
  listarMazosPropios,
  quitarCartaDelMazo,
  verificarSesionMazos
} from "../services/servicioMazos.js"
import {
  cerrarDialogoBootstrap,
  mostrarToast,
  obtenerElemento
} from "../utils/utilidadesDominio.js"

const MENSAJE_BUSQUEDA_INICIAL =
  "Escribe para buscar cartas y haz clic en una para agregarla al mazo..."

const state = {
  mazos: [],
  mazoActivo: null,
  mutando: false
}

function finalizarCargaColeccion() {
  obtenerElemento("deck-editor").setAttribute("aria-busy", "false")
}

function manejarError(error, accion) {
  console.error(`No se pudo ${accion}:`, error)
  if (error instanceof ApiError && error.status === 401) {
    window.location.assign("login.html")
    return
  }
  mostrarToast(error.message || `No se pudo ${accion}.`, true)
}

function renderizarVista() {
  renderizarListaMazos(state.mazos, state.mazoActivo, seleccionarMazo)
  renderizarMazoEditable(state.mazoActivo, {
    mutando: state.mutando,
    onAdd: agregarCarta,
    onRemove: quitarCarta
  })
}

async function cargarMazos(idPreferido) {
  state.mazos = await listarMazosPropios()
  state.mazoActivo =
    state.mazos.find((mazo) => mazo.id === idPreferido) ??
    state.mazos.find((mazo) => mazo.id === state.mazoActivo?.id) ??
    state.mazos[0] ??
    null
  renderizarVista()
}

function seleccionarMazo(mazo) {
  state.mazoActivo = mazo
  renderizarVista()
}

function establecerMutacion(mutando) {
  state.mutando = mutando
  const botonBusqueda = document.getElementById("deck-search-trigger")
  if (botonBusqueda) {
    botonBusqueda.disabled = mutando
  }
  obtenerElemento("create-deck-form").querySelector('[type="submit"]').disabled = mutando
  obtenerElemento("confirm-delete-deck").disabled = mutando
  renderizarMazoEditable(state.mazoActivo, {
    mutando,
    onAdd: agregarCarta,
    onRemove: quitarCarta
  })
}

async function ejecutarMutacion(operacion, accion = "actualizar el mazo") {
  if (state.mutando) return
  establecerMutacion(true)
  try {
    await operacion()
  } catch (error) {
    manejarError(error, accion)
  } finally {
    establecerMutacion(false)
  }
}

async function crearMazoDesdeFormulario(evento) {
  evento.preventDefault()
  const formulario = obtenerElemento("create-deck-form")
  const nombre = obtenerElemento("newMazoName").value.trim()
  if (!nombre) {
    formulario.reportValidity()
    return
  }

  await ejecutarMutacion(async () => {
    const nuevoMazo = await crearMazo(nombre)
    await cargarMazos(nuevoMazo.id)
    formulario.reset()
    const acordeon = document.getElementById("create-deck-accordion")
    if (acordeon) {
      acordeon.open = false
    }
    mostrarToast(`Se creó el mazo «${nuevoMazo.nombre}».`)
  }, "crear el mazo")
}

async function agregarCarta(carta) {
  if (!carta) return
  const mazo = state.mazoActivo
  if (!mazo) {
    mostrarToast("Primero crea o selecciona un mazo.", true)
    return
  }

  await ejecutarMutacion(async () => {
    await agregarCartaAlMazo(mazo.id, carta.id)
    await cargarMazos(mazo.id)
    mostrarToast(`Se agregó «${carta.name}» al mazo.`)
  }, "agregar la carta al mazo")
}

async function quitarCarta(carta) {
  const mazo = state.mazoActivo
  if (!mazo || !carta) return

  await ejecutarMutacion(async () => {
    await quitarCartaDelMazo(mazo.id, carta.id)
    await cargarMazos(mazo.id)
    mostrarToast(`Se quitó «${carta.name}» del mazo.`)
  }, "quitar la carta del mazo")
}

async function eliminarMazoActivo() {
  const mazo = state.mazoActivo
  if (!mazo) return

  const nombreMazo = mazo.nombre
  await ejecutarMutacion(async () => {
    await eliminarMazo(mazo.id)
    cerrarDialogoBootstrap(obtenerElemento("deleteDeckDialog"))
    state.mazoActivo = null
    await cargarMazos()
    mostrarToast(`Se eliminó el mazo «${nombreMazo}».`)
  }, "eliminar el mazo")
}

function enlazarEventos() {
  obtenerElemento("create-deck-form")
    .addEventListener("submit", crearMazoDesdeFormulario)
  obtenerElemento("confirm-delete-deck")
    .addEventListener("click", eliminarMazoActivo)
  inicializarBusquedaRapidaDialogo({
    alLimpiar: (resultados) =>
      renderizarMensajeBusquedaRapida(resultados, MENSAJE_BUSQUEDA_INICIAL),
    alIniciarCarga: (resultados) =>
      mostrarSkeletons(resultados, 3, { tamano: "list" }),
    alRecibirResultados: (cartas, resultados) =>
      renderizarListaTabla(resultados, cartas, {
        crearFila: (carta) =>
          crearCartaBusquedaRapida(carta, { onSelect: agregarCarta }),
        mensajeVacio: "No se encontraron cartas.",
        claseCelda: "p-0 border-0"
      }),
    alOcurrirError: (resultados) => renderizarErrorBusquedaRapida(resultados)
  })
}

async function inicializarColeccionMazos() {
  try {
    await verificarSesionMazos()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      window.location.assign("login.html")
      return
    }
    manejarError(error, "verificar la sesión")
    finalizarCargaColeccion()
    return
  }

  enlazarEventos()
  try {
    await cargarMazos()
  } catch (error) {
    manejarError(error, "cargar tus mazos")
    finalizarCargaColeccion()
  }
}

void inicializarColeccionMazos()
