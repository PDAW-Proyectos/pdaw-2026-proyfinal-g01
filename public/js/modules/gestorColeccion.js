import { ApiError } from "../api.js"
import {
  agregarCartaAlMazo,
  crearMazo,
  listarMazosPropios,
  quitarCartaDelMazo,
  verificarSesionMazos
} from "../services/mazosApi.js"
import {
  actualizarEstadoMutacion,
  finalizarCargaColeccion,
  mostrarToast,
  renderizarCartaSeleccionada,
  renderizarListaMazos,
  renderizarMazo
} from "../components/renderizadorColeccion.js"
import { cerrarDropdownBusqueda } from "../components/renderizadorBusqueda.js"
import { inicializarBusquedaCartas } from "./busquedaCartas.js"

const state = {
  mazos: [],
  mazoActivo: null,
  cartaSeleccionada: null,
  mutando: false
}

function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontró el elemento requerido #${id}.`)
  }
  return elemento
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
  renderizarMazo(state.mazoActivo, quitarCarta)
  renderizarCartaSeleccionada(
    state.cartaSeleccionada,
    state.mazoActivo,
    state.mutando
  )
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
  actualizarEstadoMutacion(mutando, state.cartaSeleccionada, state.mazoActivo)
}

async function ejecutarMutacion(operacion) {
  if (state.mutando) return
  establecerMutacion(true)
  try {
    await operacion()
  } catch (error) {
    manejarError(error, "actualizar el mazo")
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
    globalThis.bootstrap.Modal
      .getOrCreateInstance(obtenerElemento("modalAddMazo"))
      .hide()
    mostrarToast(`Se creó el mazo «${nuevoMazo.nombre}».`)
  })
}

function seleccionarCarta(carta) {
  state.cartaSeleccionada = carta
  renderizarCartaSeleccionada(carta, state.mazoActivo, state.mutando)
  cerrarDropdownBusqueda()
}

async function agregarCartaSeleccionada() {
  const carta = state.cartaSeleccionada
  const mazo = state.mazoActivo
  if (!carta) return
  if (!mazo) {
    mostrarToast("Primero crea o selecciona un mazo.", true)
    return
  }

  await ejecutarMutacion(async () => {
    await agregarCartaAlMazo(mazo.id, carta.id)
    await cargarMazos(mazo.id)
    cerrarDropdownBusqueda()
    mostrarToast(`Se agregó «${carta.name}» al mazo.`)
  })
}

async function quitarCarta(carta) {
  const mazo = state.mazoActivo
  if (!mazo) return

  await ejecutarMutacion(async () => {
    await quitarCartaDelMazo(mazo.id, carta.id)
    await cargarMazos(mazo.id)
    mostrarToast(`Se quitó «${carta.name}» del mazo.`)
  })
}

function enlazarEventos() {
  obtenerElemento("create-deck-form")
    .addEventListener("submit", crearMazoDesdeFormulario)
  obtenerElemento("add-selected-card")
    .addEventListener("click", agregarCartaSeleccionada)
  obtenerElemento("remove-selected-card")
    .addEventListener("click", () => {
      if (state.cartaSeleccionada) void quitarCarta(state.cartaSeleccionada)
    })
  inicializarBusquedaCartas({ onSelect: seleccionarCarta })
}

/**
 * Comprueba la sesión y conecta los eventos de la página de colección.
 * Los errores de autenticación redirigen al login; los demás se comunican con toast.
 */
export async function inicializarGestorColeccion() {
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
