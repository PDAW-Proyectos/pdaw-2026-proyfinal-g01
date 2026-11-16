// Crea un elemento <li> con un botón de Bootstrap configurado segun su estado
function crearBotonPagina(texto, paginaDestino, { deshabilitado = false, activa = false, ariaLabel = '' } = {}) {
  const li = document.createElement('li')
  li.className = 'page-item'
  if (deshabilitado) li.classList.add('disabled')
  if (activa) li.classList.add('active')

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'page-link'
  btn.textContent = texto
  if (ariaLabel) btn.setAttribute('aria-label', ariaLabel)

  if (!deshabilitado && !activa) {
    btn.dataset.page = paginaDestino
  } else {
    btn.disabled = true
  }

  li.appendChild(btn)
  return li
}

// Muestra u oculta la barra de paginación, actualiza el resumen y arma los botones
export function renderizarPaginacion({ contenedor, info, lista }, paginacion) {
  lista.replaceChildren()

  if (paginacion.totalPaginas <= 1) {
    contenedor.classList.add('d-none')
    return
  }

  contenedor.classList.remove('d-none')
  info.textContent = `Página ${paginacion.paginaActual} de ${paginacion.totalPaginas} (${paginacion.totalEntradas} resultados)`

  lista.appendChild(
    crearBotonPagina('Anterior', paginacion.paginaActual - 1, {
      deshabilitado: !paginacion.tieneAnterior,
      ariaLabel: 'Página anterior',
    })
  )

  for (let i = 1; i <= paginacion.totalPaginas; i++) {
    lista.appendChild(
      crearBotonPagina(String(i), i, {
        activa: i === paginacion.paginaActual,
      })
    )
  }

  lista.appendChild(
    crearBotonPagina('Siguiente', paginacion.paginaActual + 1, {
      deshabilitado: !paginacion.tieneSiguiente,
      ariaLabel: 'Página siguiente',
    })
  )
}

// Escucha los clics en los botones de página y ejecuta el callback con el número elegido
export function inicializarEventosPaginacion(lista, alCambiarPagina) {
  lista.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-page]')
    if (!boton) return

    alCambiarPagina(Number(boton.dataset.page))
  })
}