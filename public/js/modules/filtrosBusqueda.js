import { Collapse, Combobox } from "../bootstrap/bootstrap.bundle.min.js"

export const LIMITES_FILTROS_NUMERICOS = Object.freeze({
  level: Object.freeze({ min: 0, max: 13 }),
  scale: Object.freeze({ min: 0, max: 13 }),
  linkval: Object.freeze({ min: 1, max: 6 })
})

/**
 * Lee los filtros de búsqueda de cartas desde un input, un mapa de controles y/o
 * elementos con atributo `[data-card-filter]`.
 * @param {HTMLInputElement|null} entrada
 * @param {Record<string, HTMLInputElement|HTMLSelectElement>} [filtros]
 * @param {HTMLElement|null} [contenedorFiltros]
 * @returns {Record<string, string>}
 */
export function leerFiltrosCartas(
  entrada,
  filtros = {},
  contenedorFiltros = null
) {
  const resultado = {}
  const nombre = entrada?.value?.trim()
  if (nombre) resultado.name = nombre

  const controles = { ...filtros }
  if (contenedorFiltros) {
    for (const el of contenedorFiltros.querySelectorAll("[data-card-filter]")) {
      controles[el.dataset.cardFilter] = el
    }
  }

  for (const [clave, control] of Object.entries(controles)) {
    const valor = control?.value?.trim()
    if (valor && valor !== "all" && valor !== "none") {
      resultado[clave] = valor
    }
  }

  return resultado
}

/**
 * Lee los valores no vacíos de un formulario de filtros (incluidos inputs ocultos de Combobox).
 * @param {HTMLFormElement|null} formulario
 * @returns {Record<string, string>}
 */
export function leerFiltrosFormulario(formulario) {
  if (!formulario) return {}

  const resultado = {}
  const datos = new FormData(formulario)

  for (const [clave, valorCrudo] of datos.entries()) {
    const valor = String(valorCrudo).trim()
    if (valor && valor !== "all" && valor !== "none") {
      resultado[clave] = valor
    }
  }

  return resultado
}

/**
 * Restringe el valor numérico de un input de filtro al intervalo `[min, max]`.
 * Si está vacío o no es un número finito válido, no altera su contenido.
 * @param {HTMLInputElement|null} input
 * @param {number} min
 * @param {number} max
 */
export function limitarValorFiltroNumerico(input, min, max) {
  const texto = input?.value?.trim()
  if (!texto) return

  const numero = Number(texto)
  if (!Number.isFinite(numero)) return

  const limitado = Math.min(max, Math.max(min, Math.trunc(numero)))
  if (String(limitado) !== texto) {
    input.value = String(limitado)
  }
}

/**
 * Conecta la limitación automática de rango para los filtros numéricos acotados
 * (`level`, `scale`, `linkval`) dentro de un contenedor o formulario.
 * @param {ParentNode|null} contenedor
 * @param {Record<string, {min: number, max: number}>} [limites=LIMITES_FILTROS_NUMERICOS]
 */
export function inicializarLimitesFiltrosNumericos(
  contenedor,
  limites = LIMITES_FILTROS_NUMERICOS
) {
  if (!contenedor) return

  for (const [campo, { min, max }] of Object.entries(limites)) {
    const input = contenedor.querySelector(
      `[data-card-filter="${campo}"], [name="${campo}"]`
    )
    if (!input) continue

    const aplicarLimite = () => limitarValorFiltroNumerico(input, min, max)
    input.addEventListener("input", aplicarLimite)
    input.addEventListener("change", aplicarLimite)
  }
}

/**
 * Conecta eventos `change` inmediatos sobre un mapa de controles y/o elementos `[data-card-filter]`.
 * @param {Object} opciones
 * @param {Record<string, HTMLElement|null>} [opciones.filtros]
 * @param {ParentNode|null} [opciones.contenedorFiltros]
 * @param {() => void} [opciones.alCambiar]
 */
export function enlazarFiltrosInmediatos({
  filtros = {},
  contenedorFiltros = null,
  alCambiar
} = {}) {
  for (const control of Object.values(filtros)) {
    control?.addEventListener("change", () => alCambiar?.())
  }
  contenedorFiltros?.querySelectorAll("[data-card-filter]").forEach((el) => {
    el.addEventListener("change", () => alCambiar?.())
  })
}

/**
 * Inicializa el acordeón de filtros, los Combobox de Bootstrap 6, el clamping numérico
 * y los botones de aplicar/limpiar dentro del diálogo de búsqueda rápida (`#searchDialog`).
 * @param {Object} opciones
 * @param {HTMLDialogElement|null} opciones.dialog
 * @param {(filtros: Record<string, string>) => void} [opciones.alCambiarFiltros]
 */
export function inicializarFiltrosDialogoBusqueda({
  dialog,
  alCambiarFiltros
} = {}) {
  const formularioFiltros = dialog?.querySelector("#searchFiltersForm") ?? null
  if (!formularioFiltros) return null

  const colapsableFiltros = dialog?.querySelector("#searchFiltersCollapse") ?? null
  const botonToggleFiltros = dialog?.querySelector("#searchFiltersToggleBtn") ?? null
  const botonLimpiarFiltros = dialog?.querySelector("#searchFiltersClearBtn") ?? null
  const comboboxToggles = Array.from(
    formularioFiltros.querySelectorAll('[data-bs-toggle="combobox"]')
  )
  const ClaseCombobox = Combobox ?? globalThis.bootstrap?.Combobox
  const ClaseCollapse = Collapse ?? globalThis.bootstrap?.Collapse

  if (ClaseCombobox) {
    for (const toggle of comboboxToggles) {
      ClaseCombobox.getOrCreateInstance(toggle)
    }
  }

  inicializarLimitesFiltrosNumericos(formularioFiltros)

  let filtrosAplicados = {}

  function cerrarComboboxes() {
    if (!ClaseCombobox) return
    for (const toggle of comboboxToggles) {
      ClaseCombobox.getInstance(toggle)?.hide()
    }
  }

  function limpiarComboboxes() {
    for (const toggle of comboboxToggles) {
      const instancia = ClaseCombobox?.getOrCreateInstance(toggle)
      instancia?.hide()

      const menu = instancia?._menu ?? toggle.nextElementSibling
      if (menu?.classList?.contains("menu")) {
        for (const item of menu.querySelectorAll(".menu-item.selected")) {
          item.classList.remove("selected")
          item.setAttribute("aria-selected", "false")
        }
      }

      const hiddenInput =
        instancia?._hiddenInput ??
        (toggle.previousElementSibling?.type === "hidden"
          ? toggle.previousElementSibling
          : null)
      if (hiddenInput) {
        hiddenInput.value = ""
      }

      const valueDisplay = toggle.querySelector(".combobox-value")
      if (valueDisplay) {
        valueDisplay.textContent = toggle.dataset.bsPlaceholder || ""
        valueDisplay.classList.add("combobox-placeholder")
      }
    }
  }

  function actualizarEstadoBotonFiltros() {
    if (!botonToggleFiltros) return
    const cantidad = Object.keys(filtrosAplicados).length
    botonToggleFiltros.classList.toggle("btn-solid", cantidad > 0)
    botonToggleFiltros.classList.toggle("btn-outline", cantidad === 0)
    if (cantidad > 0) {
      botonToggleFiltros.setAttribute("title", `Filtros (${cantidad} activos)`)
    } else {
      botonToggleFiltros.removeAttribute("title")
    }
  }

  function cerrarColapsableFiltros() {
    if (!colapsableFiltros) return
    cerrarComboboxes()
    colapsableFiltros.classList.remove("is-open")
    if (ClaseCollapse) {
      ClaseCollapse.getOrCreateInstance(colapsableFiltros).hide()
    } else {
      colapsableFiltros.classList.remove("show")
      botonToggleFiltros?.setAttribute("aria-expanded", "false")
    }
  }

  if (colapsableFiltros) {
    if (colapsableFiltros.classList.contains("show")) {
      colapsableFiltros.classList.add("is-open")
    }
    colapsableFiltros.addEventListener("shown.bs.collapse", () => {
      colapsableFiltros.classList.add("is-open")
    })
    colapsableFiltros.addEventListener("hide.bs.collapse", () => {
      cerrarComboboxes()
      colapsableFiltros.classList.remove("is-open")
    })
  }

  formularioFiltros.addEventListener("submit", (evento) => {
    evento.preventDefault()
    for (const [campo, { min, max }] of Object.entries(LIMITES_FILTROS_NUMERICOS)) {
      const input = formularioFiltros.querySelector(
        `[data-card-filter="${campo}"], [name="${campo}"]`
      )
      limitarValorFiltroNumerico(input, min, max)
    }
    if (!formularioFiltros.reportValidity()) return

    filtrosAplicados = leerFiltrosFormulario(formularioFiltros)
    actualizarEstadoBotonFiltros()
    cerrarColapsableFiltros()
    alCambiarFiltros?.({ ...filtrosAplicados })
  })

  botonLimpiarFiltros?.addEventListener("click", () => {
    formularioFiltros.reset()
    limpiarComboboxes()
    filtrosAplicados = {}
    actualizarEstadoBotonFiltros()
    cerrarColapsableFiltros()
    alCambiarFiltros?.({})
  })

  return {
    obtenerFiltrosAplicados: () => ({ ...filtrosAplicados }),
    cerrarMenus: cerrarComboboxes,
    cerrarAcordeon: cerrarColapsableFiltros
  }
}
