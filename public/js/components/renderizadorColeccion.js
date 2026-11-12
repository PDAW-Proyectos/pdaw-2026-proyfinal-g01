import { obtenerUrlImagen } from "./renderizadorCartas.js"

let temporizadorToast

function obtenerElemento(id) {
  const elemento = document.getElementById(id)
  if (!elemento) {
    throw new Error(`No se encontró el elemento requerido #${id}.`)
  }
  return elemento
}

function renderizarVacio(contenedor, mensaje) {
  const estado = document.createElement("p")
  estado.className = "empty-deck-message"
  estado.textContent = mensaje
  contenedor.replaceChildren(estado)
}

function renderizarContador(elemento, cantidad, limite) {
  const maximo = document.createElement("span")
  maximo.textContent = `/${limite}`
  elemento.replaceChildren(document.createTextNode(String(cantidad)), maximo)
  elemento.classList.toggle("limit-warning", cantidad >= limite)
}

function crearTarjetaMazo(carta, nombreMazo, onRemove) {
  const tarjeta = document.createElement("article")
  tarjeta.className = "deck-card"

  const imagen = document.createElement("img")
  imagen.src = obtenerUrlImagen(carta, "small")
  imagen.alt = carta.name
  imagen.loading = "lazy"

  const nombre = document.createElement("div")
  nombre.className = "deck-card-name"
  nombre.textContent = carta.name

  const quitar = document.createElement("button")
  quitar.type = "button"
  quitar.className = "deck-card-remove"
  quitar.textContent = "Quitar"
  quitar.setAttribute("aria-label", `Quitar ${carta.name} de ${nombreMazo}`)
  quitar.addEventListener("click", () => onRemove(carta))

  tarjeta.append(imagen, nombre, quitar)
  return tarjeta
}

function renderizarCartasRecientes(contenedor, cartas, limite, nombreMazo, onRemove) {
  if (!Array.isArray(cartas)) {
    throw new Error("La respuesta del servidor no contiene una lista de cartas válida.")
  }
  if (cartas.length === 0) {
    renderizarVacio(contenedor, "Todavía no agregaste cartas a esta sección.")
    return
  }

  const fragmento = document.createDocumentFragment()
  cartas.slice(-limite).reverse().forEach((carta) => {
    fragmento.append(crearTarjetaMazo(carta, nombreMazo, onRemove))
  })
  contenedor.replaceChildren(fragmento)
}

/**
 * Dibuja la lista del usuario y conecta cada mazo con su acción de selección.
 * @param {Array<Object>} mazos
 * @param {Object|null} mazoActivo
 * @param {(mazo: Object) => void} onSelect
 */
export function renderizarListaMazos(mazos, mazoActivo, onSelect) {
  const lista = obtenerElemento("deck-list")
  if (mazos.length === 0) {
    const estado = document.createElement("li")
    estado.className = "deck-status"
    estado.textContent = "Todavía no creaste mazos."
    lista.replaceChildren(estado)
    return
  }

  const fragmento = document.createDocumentFragment()
  mazos.forEach((mazo) => {
    const item = document.createElement("li")
    item.className = "deck-item"
    item.classList.toggle("active", mazo.id === mazoActivo?.id)

    const seleccionar = document.createElement("button")
    seleccionar.type = "button"
    seleccionar.className = "deck-select"
    seleccionar.textContent = mazo.nombre
    seleccionar.setAttribute("aria-pressed", String(mazo.id === mazoActivo?.id))
    seleccionar.addEventListener("click", () => onSelect(mazo))

    const cantidad = document.createElement("span")
    cantidad.className = "deck-size"
    cantidad.textContent = `${(mazo.mainDeck ?? []).length}/60`

    item.append(seleccionar, cantidad)
    fragmento.append(item)
  })
  lista.replaceChildren(fragmento)
}

/**
 * Actualiza el editor y limita las cartas visibles a las entradas más recientes.
 * @param {Object|null} mazo
 * @param {(carta: Object) => void} onRemove
 */
export function renderizarMazo(mazo, onRemove) {
  const editor = obtenerElemento("deck-editor")
  editor.setAttribute("aria-busy", "false")

  const mainDeck = mazo?.mainDeck ?? []
  const extraDeck = mazo?.extraDeck ?? []
  obtenerElemento("deck-title").textContent = mazo?.nombre ?? "Mis mazos"
  obtenerElemento("deck-save-status").textContent = mazo
    ? "Los cambios se guardan automáticamente."
    : "Crea un mazo para comenzar."

  renderizarContador(obtenerElemento("main-counter"), mainDeck.length, 60)
  renderizarContador(obtenerElemento("extra-counter"), extraDeck.length, 15)
  obtenerElemento("main-heading").textContent = `Main Deck (${mainDeck.length})`
  obtenerElemento("extra-heading").textContent = `Extra Deck (${extraDeck.length})`

  if (!mazo) {
    renderizarVacio(obtenerElemento("main-cards"), "Crea un mazo para agregar cartas.")
    renderizarVacio(obtenerElemento("extra-cards"), "Crea un mazo para agregar cartas.")
    return
  }

  renderizarCartasRecientes(
    obtenerElemento("main-cards"),
    mainDeck,
    6,
    mazo.nombre,
    onRemove
  )
  renderizarCartasRecientes(
    obtenerElemento("extra-cards"),
    extraDeck,
    4,
    mazo.nombre,
    onRemove
  )
}

/**
 * Presenta la carta seleccionada y ajusta las acciones según el mazo activo.
 * @param {Object|null} carta
 * @param {Object|null} mazo
 * @param {boolean} mutando
 */
export function renderizarCartaSeleccionada(carta, mazo, mutando) {
  const imagen = obtenerElemento("selected-card-image")
  imagen.hidden = !carta
  if (!carta) {
    imagen.removeAttribute("src")
    imagen.alt = ""
    obtenerElemento("selected-card-name").textContent = "Detalle de carta"
    obtenerElemento("selected-card-meta").textContent =
      "Selecciona una carta para agregarla al mazo activo."
    obtenerElemento("selected-card-description").textContent = ""
  } else {
    imagen.src = obtenerUrlImagen(carta, "full")
    imagen.alt = carta.name
    obtenerElemento("selected-card-name").textContent = carta.name
    obtenerElemento("selected-card-meta").textContent =
      [carta.race, carta.type, carta.attribute && `Atributo ${carta.attribute}`]
        .filter(Boolean)
        .join(" · ")
    obtenerElemento("selected-card-description").textContent =
      carta.desc || "Esta carta no tiene una descripción disponible."
  }

  const cartasDelMazo = [...(mazo?.mainDeck ?? []), ...(mazo?.extraDeck ?? [])]
  const estaEnMazo = carta && cartasDelMazo.some((item) => item.id === carta.id)
  obtenerElemento("add-selected-card").disabled = !carta || !mazo || mutando
  obtenerElemento("remove-selected-card").hidden = !estaEnMazo
  obtenerElemento("remove-selected-card").disabled = mutando
}

/** Bloquea controles mientras una operación de escritura está en curso. */
export function actualizarEstadoMutacion(mutando, carta, mazo) {
  obtenerElemento("search-input").disabled = mutando
  obtenerElemento("search-button").disabled = mutando
  obtenerElemento("create-deck-form").querySelector('[type="submit"]').disabled = mutando
  renderizarCartaSeleccionada(carta, mazo, mutando)
}

/** Muestra un mensaje temporal de éxito o error en el toast de la página. */
export function mostrarToast(mensaje, esError = false) {
  const toast = obtenerElemento("toast")
  clearTimeout(temporizadorToast)
  toast.textContent = mensaje
  toast.classList.toggle("error", esError)
  toast.classList.add("visible", "show")
  temporizadorToast = setTimeout(() => {
    toast.classList.remove("visible", "show", "error")
  }, 3200)
}

/** Libera el estado de carga del editor cuando no se pudo iniciar la página. */
export function finalizarCargaColeccion() {
  obtenerElemento("deck-editor").setAttribute("aria-busy", "false")
}
