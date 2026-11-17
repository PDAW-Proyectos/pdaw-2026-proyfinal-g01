import { obtenerUrlImagen } from "./renderizadorCartas.js"
import { crearUrlDetalleCarta, enlazarNavegacionCarta } from "../modules/navegacionCarta.js"

const LIMITE_RESULTADOS_DEFECTO = 10

function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontró el elemento requerido #${id}.`)
  }
  return elemento
}

function crearElementoMensaje(texto, clase = "fg-2 text-center my-4") {
  const mensaje = document.createElement("p")
  mensaje.className = clase
  mensaje.textContent = texto
  return mensaje
}

/**
 * Construye un ítem de resultado de carta con imagen a la izquierda y texto a la derecha.
 * @param {Object} carta
 * @param {Object} opciones
 * @returns {HTMLAnchorElement | HTMLButtonElement}
 */
export function crearElementoResultadoCarta(carta, {
  claseItem = "list-group-item list-group-item-action d-flex align-items-center gap-3 sm:gap-4 py-3",
  claseImagen = "list-card flex-shrink-0 border border-primary",
  claseInfo = "min-w-0 flex-grow-1",
  claseNombre = "fw-bold fs-lg d-block",
  claseTipo = "fg-2 d-block mt-1",
  usarEnlace = true,
  onSelect
} = {}) {
  const esEnlace = usarEnlace && !onSelect
  const elemento = document.createElement(esEnlace ? "a" : "button")
  elemento.className = claseItem

  if (esEnlace) {
    elemento.href = crearUrlDetalleCarta(carta)
  } else {
    elemento.type = "button"
  }

  const imagen = document.createElement("img")
  imagen.className = claseImagen
  imagen.src = obtenerUrlImagen(carta, "small")
  imagen.alt = ""
  imagen.loading = "lazy"

  const informacion = document.createElement("div")
  informacion.className = claseInfo

  const nombre = document.createElement("span")
  nombre.className = claseNombre
  nombre.textContent = carta.name
  informacion.append(nombre)

  const textoTipo = [carta.race, carta.type].filter(Boolean).join(" / ")
  if (textoTipo) {
    const tipo = document.createElement("small")
    tipo.className = claseTipo
    tipo.textContent = textoTipo
    informacion.append(tipo)
  }

  elemento.append(imagen, informacion)

  if (onSelect) {
    elemento.setAttribute("role", "option")
    elemento.addEventListener("click", () => onSelect(carta))
  } else if (!esEnlace) {
    enlazarNavegacionCarta(elemento, carta)
  }

  return elemento
}

/**
 * Renderiza una lista limitada de resultados de cartas dentro de un contenedor.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} cartas
 * @param {Object} [opciones]
 */
export function renderizarListaResultados(contenedor, cartas, {
  limite = LIMITE_RESULTADOS_DEFECTO,
  claseLista = "list-group list-group-flush",
  claseMensaje = "fg-2 text-center my-4",
  claseAviso = "fg-2 fs-sm text-center my-3 mb-1",
  mensajeVacio = "No se encontraron cartas.",
  ...opcionesItem
} = {}) {
  if (cartas.length === 0) {
    contenedor.replaceChildren(crearElementoMensaje(mensajeVacio, claseMensaje))
    return
  }

  const fragmento = document.createDocumentFragment()
  const lista = document.createElement("div")
  lista.className = claseLista

  for (const carta of cartas.slice(0, limite)) {
    lista.append(crearElementoResultadoCarta(carta, opcionesItem))
  }

  fragmento.append(lista)

  if (cartas.length > limite) {
    fragmento.append(
      crearElementoMensaje(`Se muestran ${limite} de ${cartas.length} resultados.`, claseAviso)
    )
  }

  contenedor.replaceChildren(fragmento)
}

/**
 * Crea un renderizador desacoplado para el diálogo modal de búsqueda (#searchDialog).
 * @param {HTMLElement} contenedorResultados
 * @param {Object} [opciones]
 */
export function crearRenderizadorDialogoBusqueda(contenedorResultados, {
  limite = LIMITE_RESULTADOS_DEFECTO,
  mensajeInicial = "Escribe para comenzar a buscar cartas...",
  onSelect
} = {}) {
  return {
    mostrarInicial() {
      contenedorResultados.replaceChildren(crearElementoMensaje(mensajeInicial))
    },

    mostrarCargando() {
      const estado = document.createElement("div")
      estado.className = "d-flex justify-content-center align-items-center gap-2 my-4 fg-2"
      estado.setAttribute("role", "status")

      const spinner = document.createElement("div")
      spinner.className = "spinner-border spinner-sm fg-primary"
      spinner.setAttribute("aria-hidden", "true")

      const texto = document.createElement("span")
      texto.textContent = "Buscando cartas..."

      estado.append(spinner, texto)
      contenedorResultados.replaceChildren(estado)
    },

    mostrarResultados(cartas) {
      renderizarListaResultados(contenedorResultados, cartas, {
        limite,
        usarEnlace: true,
        onSelect
      })
    },

    mostrarError() {
      contenedorResultados.replaceChildren(
        crearElementoMensaje(
          "No se pudieron cargar los resultados. Inténtalo de nuevo.",
          "fg-danger text-center my-4"
        )
      )
    }
  }
}

function obtenerElementosDropdown() {
  return {
    dropdown: obtenerElemento("search-dropdown"),
    carga: obtenerElemento("search-loading"),
    resultados: obtenerElemento("search-results"),
    entrada: obtenerElemento("search-input")
  }
}

function actualizarVisibilidadDropdown({ dropdown, entrada }, visible) {
  dropdown.classList.toggle("active", visible)
  entrada.setAttribute("aria-expanded", String(visible))
}

/** Muestra el spinner de búsqueda dentro del dropdown de colección. */
export function mostrarCargaBusqueda() {
  const elementos = obtenerElementosDropdown()
  actualizarVisibilidadDropdown(elementos, true)
  elementos.carga.classList.add("active")
  elementos.resultados.classList.remove("active")
  elementos.resultados.replaceChildren()
}

/**
 * Presenta las cartas encontradas en el dropdown de colección usando nodos DOM y texto seguro.
 * @param {Array<Object>} cartas
 * @param {(carta: Object) => void} [onSelect] Acción para usar el resultado en lugar de navegar al detalle.
 */
export function renderizarResultadosBusqueda(cartas, onSelect) {
  const elementos = obtenerElementosDropdown()
  elementos.carga.classList.remove("active")

  renderizarListaResultados(elementos.resultados, cartas, {
    limite: LIMITE_RESULTADOS_DEFECTO,
    claseLista: "d-flex flex-column",
    claseItem: "search-result-item",
    claseImagen: "search-result-image",
    claseInfo: "search-result-info",
    claseNombre: "search-result-name",
    claseTipo: "search-result-type",
    claseMensaje: "no-results",
    claseAviso: "no-results",
    usarEnlace: false,
    onSelect
  })

  elementos.resultados.classList.add("active")
  actualizarVisibilidadDropdown(elementos, true)
}

/** Oculta el spinner y comunica un error sin descartar los controles de búsqueda. */
export function mostrarErrorBusqueda() {
  const elementos = obtenerElementosDropdown()
  elementos.carga.classList.remove("active")
  elementos.resultados.replaceChildren(
    crearElementoMensaje("No se pudieron cargar los resultados. Intentalo de nuevo.", "no-results")
  )
  elementos.resultados.classList.add("active")
  actualizarVisibilidadDropdown(elementos, true)
}

/** Cierra el dropdown y limpia sus resultados y estado de carga. */
export function cerrarDropdownBusqueda() {
  const elementos = obtenerElementosDropdown()
  elementos.carga.classList.remove("active")
  elementos.resultados.classList.remove("active")
  elementos.resultados.replaceChildren()
  actualizarVisibilidadDropdown(elementos, false)
}
