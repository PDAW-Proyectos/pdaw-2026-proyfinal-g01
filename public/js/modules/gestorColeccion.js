import { Dialog } from "../bootstrap/bootstrap.bundle.min.js"
import { ApiError } from "../api.js"
import { renderizarZonaCartasMazo } from "../components/cartaMazo.js"
import { renderizarInformacionMazo } from "../components/informacionMazo.js"
import { renderizarListaTabla } from "../components/listaTabla.js"
import {
  agregarCartaAlMazo,
  crearMazo,
  eliminarMazo,
  listarMazosPropios,
  quitarCartaDelMazo,
  verificarSesionMazos
} from "../services/servicioMazos.js"
import { obtenerElemento } from "../utils/dom.js"
import {
  LIMITE_EXTRA_DECK,
  LIMITE_MAIN_DECK
} from "../utils/utilidadesMazos.js"
import { cerrarDropdownBusqueda } from "./busquedaCartasRapida.js"
import { inicializarBusquedaCartas } from "./busquedaCartas.js"

const state = {
  mazos: [],
  mazoActivo: null,
  mutando: false
}

let temporizadorToast

function mostrarToast(mensaje, esError = false) {
  const toast = obtenerElemento("toast")
  clearTimeout(temporizadorToast)
  toast.textContent = mensaje
  toast.classList.toggle("error", esError)
  toast.classList.add("visible", "show")
  temporizadorToast = setTimeout(() => {
    toast.classList.remove("visible", "show", "error")
  }, 3200)
}

function finalizarCargaColeccion() {
  obtenerElemento("deck-editor").setAttribute("aria-busy", "false")
}

function renderizarListaMazos(mazos, mazoActivo, onSelect) {
  const lista = obtenerElemento("deck-list")
  renderizarListaTabla(lista, mazos, {
    crearFila: (mazo) => {
      const esActivo = mazo.id === mazoActivo?.id
      const seleccionar = document.createElement("button")
      seleccionar.type = "button"
      seleccionar.className = esActivo
        ? "btn-solid theme-primary w-100 text-start text-truncate"
        : "btn-outline theme-primary w-100 text-start text-truncate"
      seleccionar.textContent = mazo.nombre
      seleccionar.setAttribute("aria-pressed", String(esActivo))
      seleccionar.addEventListener("click", () => onSelect(mazo))
      return seleccionar
    },
    mensajeVacio: "Todavía no creaste mazos.",
    claseVacio: "fg-2 fs-sm text-center py-3 border-0",
    claseTabla: "table table-borderless align-middle mb-0 w-100",
    claseCelda: "px-0 py-1 border-0"
  })
}

function renderizarMazo(mazo, { mutando = false, onAdd, onRemove } = {}) {
  finalizarCargaColeccion()
  renderizarInformacionMazo(mazo, { mutando })

  const mensajeSinMazo = "Crea o selecciona un mazo para agregar cartas."
  renderizarZonaCartasMazo(obtenerElemento("main-cards"), mazo?.mainDeck ?? [], {
    nombreMazo: mazo?.nombre,
    limiteZona: LIMITE_MAIN_DECK,
    mutando,
    mensajeVacio: mazo ? "Todavía no agregaste cartas a esta sección." : mensajeSinMazo,
    onAdd,
    onRemove
  })

  renderizarZonaCartasMazo(obtenerElemento("extra-cards"), mazo?.extraDeck ?? [], {
    nombreMazo: mazo?.nombre,
    limiteZona: LIMITE_EXTRA_DECK,
    mutando,
    mensajeVacio: mazo ? "Todavía no agregaste cartas a esta sección." : mensajeSinMazo,
    onAdd,
    onRemove
  })
}

function cerrarDialogoConfirmacion(dialogo) {
  const ClaseDialogo = Dialog ?? globalThis.bootstrap?.Dialog
  if (ClaseDialogo) {
    ClaseDialogo.getOrCreateInstance(dialogo).hide()
  } else {
    dialogo.close?.()
  }
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
  renderizarMazo(state.mazoActivo, {
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
  obtenerElemento("search-input").disabled = mutando
  obtenerElemento("search-button").disabled = mutando
  obtenerElemento("create-deck-form").querySelector('[type="submit"]').disabled = mutando
  obtenerElemento("confirm-delete-deck").disabled = mutando
  renderizarMazo(state.mazoActivo, {
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
    cerrarDropdownBusqueda()
    mostrarToast("Primero crea o selecciona un mazo.", true)
    return
  }

  await ejecutarMutacion(async () => {
    await agregarCartaAlMazo(mazo.id, carta.id)
    await cargarMazos(mazo.id)
    cerrarDropdownBusqueda()
    obtenerElemento("search-input").value = ""
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
    cerrarDialogoConfirmacion(obtenerElemento("deleteDeckDialog"))
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
  inicializarBusquedaCartas({ onSelect: agregarCarta })
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
