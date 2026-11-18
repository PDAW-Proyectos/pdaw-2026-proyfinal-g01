import { obtenerElemento } from "../../utils/utilidadesDominio.js"
import {
  LIMITE_EXTRA_DECK,
  LIMITE_MAIN_DECK
} from "../../utils/utilidadesMazos.js"
import { renderizarZonaCartasMazo } from "../carta/cartaMazo.js"
import { renderizarListaTabla } from "../listaTabla.js"
import { renderizarInformacionMazo } from "./informacionMazo.js"

/**
 * Renderiza la lista lateral de mazos del usuario utilizando `renderizarListaTabla`.
 *
 * @param {Array<Object>} mazos
 * @param {Object|null} mazoActivo
 * @param {(mazo: Object) => void} onSelect
 */
export function renderizarListaMazos(mazos, mazoActivo, onSelect) {
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
      seleccionar.addEventListener("click", () => onSelect?.(mazo))
      return seleccionar
    },
    mensajeVacio: "Todavía no creaste mazos.",
    claseVacio: "fg-2 fs-sm text-center py-3 border-0",
    claseTabla: "table table-borderless align-middle mb-0 w-100",
    claseCelda: "px-0 py-1 border-0"
  })
}

/**
 * Renderiza un mazo en modo editable (colección de mazos):
 * nombre del mazo (sin creador), Main Deck y Extra Deck con `cartaMazo` y
 * `controlesCartaMazo` debajo de cada carta, y el panel de información.
 *
 * @param {Object|null} mazo
 * @param {Object} [opciones]
 * @param {boolean} [opciones.mutando=false]
 * @param {(carta: Object) => void} [opciones.onAdd]
 * @param {(carta: Object) => void} [opciones.onRemove]
 */
export function renderizarMazoEditable(
  mazo,
  { mutando = false, onAdd, onRemove } = {}
) {
  obtenerElemento("deck-editor").setAttribute("aria-busy", "false")

  renderizarInformacionMazo(mazo, {
    mostrarCreador: false,
    tituloPorDefecto: "Mis mazos"
  })

  const estadoGuardado = document.getElementById("deck-save-status")
  if (estadoGuardado) {
    estadoGuardado.textContent = mazo
      ? "Los cambios se guardan automáticamente."
      : "Crea un mazo en el panel izquierdo para comenzar."
  }

  const nombreEliminar = document.getElementById("delete-deck-name")
  if (nombreEliminar) {
    nombreEliminar.textContent = mazo ? `«${mazo.nombre}»` : ""
  }

  const btnEliminarMazo = document.getElementById("delete-deck-btn")
  if (btnEliminarMazo) {
    btnEliminarMazo.disabled = !mazo || Boolean(mutando)
  }

  const mensajeSinMazo = "Crea o selecciona un mazo para agregar cartas."

  renderizarZonaCartasMazo(obtenerElemento("main-cards"), mazo?.mainDeck ?? [], {
    nombreMazo: mazo?.nombre,
    limiteZona: LIMITE_MAIN_DECK,
    editable: true,
    mutando,
    mensajeVacio: mazo ? "Todavía no agregaste cartas a esta sección." : mensajeSinMazo,
    onAdd,
    onRemove
  })

  renderizarZonaCartasMazo(obtenerElemento("extra-cards"), mazo?.extraDeck ?? [], {
    nombreMazo: mazo?.nombre,
    limiteZona: LIMITE_EXTRA_DECK,
    editable: true,
    mutando,
    mensajeVacio: mazo ? "Todavía no agregaste cartas a esta sección." : mensajeSinMazo,
    onAdd,
    onRemove
  })
}
