const callbacksPaginacion = new WeakMap()

function crearBotonPagina(texto, paginaDestino, { deshabilitado = false, ariaLabel = "" } = {}) {
  const li = document.createElement("li")
  li.className = "page-item"
  if (deshabilitado) li.classList.add("disabled")

  const btn = document.createElement("button")
  btn.type = "button"
  btn.className = "page-link"
  btn.textContent = texto
  if (ariaLabel) btn.setAttribute("aria-label", ariaLabel)

  if (!deshabilitado) {
    btn.dataset.page = String(paginaDestino)
  } else {
    btn.disabled = true
    btn.tabIndex = -1
  }

  li.append(btn)
  return li
}

function crearIndicadorPagina(paginaActual, totalPaginas) {
  const li = document.createElement("li")
  li.className = "page-item active"
  li.setAttribute("aria-current", "page")

  const span = document.createElement("span")
  span.className = "page-link"
  span.setAttribute("aria-live", "polite")
  span.textContent = `Página ${paginaActual} de ${totalPaginas}`

  li.append(span)
  return li
}

function resolverElementosPaginacion(objetivo) {
  if (!objetivo) return { contenedor: null, info: null, lista: null }

  if (objetivo instanceof HTMLElement) {
    if (objetivo.tagName === "UL") {
      objetivo.classList.add("pagination", "theme-primary", "mb-0")
      return { contenedor: objetivo.closest("nav") ?? objetivo, info: null, lista: objetivo }
    }

    let lista = objetivo.querySelector("ul.pagination")
    if (!lista) {
      lista = document.createElement("ul")
      lista.className = "pagination theme-primary justify-content-center mb-0"
      objetivo.replaceChildren(lista)
    }
    return { contenedor: objetivo, info: null, lista }
  }

  const contenedor = objetivo.contenedor ?? null
  const info = objetivo.info ?? null
  let lista = objetivo.lista ?? contenedor?.querySelector("ul.pagination") ?? null

  if (!lista && contenedor) {
    lista = document.createElement("ul")
    lista.className = "pagination theme-primary justify-content-center mb-0"
    contenedor.replaceChildren(lista)
  } else if (lista) {
    lista.classList.add("pagination", "theme-primary", "mb-0")
  }

  return { contenedor, info, lista }
}

/**
 * Escucha los clics en los botones de paginación y ejecuta el callback con el número de página.
 */
export function inicializarEventosPaginacion(objetivo, alCambiarPagina) {
  const { lista } = resolverElementosPaginacion(objetivo)
  if (!lista || typeof alCambiarPagina !== "function") return

  const registrarListener = !callbacksPaginacion.has(lista)
  callbacksPaginacion.set(lista, alCambiarPagina)

  if (registrarListener) {
    lista.addEventListener("click", (evento) => {
      const boton = evento.target.closest("[data-page]")
      if (!boton || boton.disabled) return

      const callback = callbacksPaginacion.get(lista)
      callback?.(Number(boton.dataset.page))
    })
  }
}

/** Renderiza una paginación de Bootstrap 6 (`ul.pagination.theme-primary`) mostrando
 * la página actual y el total de páginas en el centro con botones "Anterior" y "Siguiente" a cada lado.
 */
export function renderizarPaginacion(
  objetivo,
  paginacion,
  {
    cargando = false,
    ocultarSiUnica = Boolean(objetivo?.info),
    alCambiarPagina
  } = {}
) {
  const { contenedor, info, lista } = resolverElementosPaginacion(objetivo)
  if (!lista) return

  if (alCambiarPagina) {
    inicializarEventosPaginacion(lista, alCambiarPagina)
  }

  lista.replaceChildren()

  const totalPaginas = Number(paginacion?.totalPaginas ?? 0)
  if (!paginacion || totalPaginas <= (ocultarSiUnica ? 1 : 0)) {
    if (contenedor && ocultarSiUnica) {
      contenedor.classList.add("d-none")
      contenedor.hidden = true
    }
    if (info) info.textContent = ""
    return
  }

  if (contenedor) {
    contenedor.classList.remove("d-none")
    contenedor.hidden = false
  }

  if (info && paginacion.totalEntradas !== undefined) {
    info.textContent = `Página ${paginacion.paginaActual} de ${totalPaginas} (${paginacion.totalEntradas} resultados)`
  }

  lista.append(
    crearBotonPagina("Anterior", paginacion.paginaActual - 1, {
      deshabilitado: cargando || !paginacion.tieneAnterior,
      ariaLabel: "Página anterior"
    }),
    crearIndicadorPagina(paginacion.paginaActual, totalPaginas),
    crearBotonPagina("Siguiente", paginacion.paginaActual + 1, {
      deshabilitado: cargando || !paginacion.tieneSiguiente,
      ariaLabel: "Página siguiente"
    })
  )
}
