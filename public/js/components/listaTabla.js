/** Obtiene o crea el `<tbody>` donde se insertarán las filas de la tabla. */
function obtenerCuerpoTabla(contenedor, claseTabla) {
  if (contenedor.tagName === "TBODY") {
    return contenedor
  }

  if (contenedor.tagName === "TABLE") {
    let tbody = contenedor.querySelector("tbody")
    if (!tbody) {
      tbody = document.createElement("tbody")
      contenedor.append(tbody)
    }
    return tbody
  }

  const tabla = document.createElement("table")
  tabla.className = claseTabla
  const tbody = document.createElement("tbody")
  tabla.append(tbody)
  contenedor.replaceChildren(tabla)
  return tbody
}

/** Convierte un elemento, arreglo de celdas o fila en un `<tr>`. */
function normalizarFilaTabla(entradaFila, claseCelda = "") {
  if (entradaFila?.tagName === "TR") {
    return entradaFila
  }

  const tr = document.createElement("tr")

  if (Array.isArray(entradaFila)) {
    for (const celda of entradaFila) {
      if (celda?.tagName === "TD" || celda?.tagName === "TH") {
        tr.append(celda)
      } else {
        const td = document.createElement("td")
        if (claseCelda) td.className = claseCelda
        td.append(celda ?? "")
        tr.append(td)
      }
    }
    return tr
  }

  const td = document.createElement("td")
  if (claseCelda) td.className = claseCelda
  if (entradaFila !== null && entradaFila !== undefined) {
    td.append(entradaFila)
  }
  tr.append(td)
  return tr
}

/** Renderiza un arreglo de elementos dentro de una tabla (`<table>` / `<tbody>`). */
export function renderizarListaTabla(
  contenedor,
  items = [],
  {
    crearFila = (item) => item,
    columnas = 1,
    mensajeVacio = "No hay elementos para mostrar.",
    claseVacio = "text-center py-4 text-muted fg-2",
    claseTabla = "table table-hover align-middle mb-0",
    claseCelda = ""
  } = {}
) {
  if (!contenedor) return

  const tbody = obtenerCuerpoTabla(contenedor, claseTabla)
  tbody.replaceChildren()

  if (!Array.isArray(items) || items.length === 0) {
    const tr = document.createElement("tr")
    const td = document.createElement("td")
    td.colSpan = columnas
    td.className = claseVacio
    td.textContent = mensajeVacio
    tr.append(td)
    tbody.append(tr)
    return
  }

  const fragmento = document.createDocumentFragment()
  items.forEach((item, indice) => {
    const fila = crearFila(item, indice)
    if (fila) {
      fragmento.append(normalizarFilaTabla(fila, claseCelda))
    }
  })

  tbody.append(fragmento)
}
