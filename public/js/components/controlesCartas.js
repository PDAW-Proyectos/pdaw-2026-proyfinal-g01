export function inicializarControlesCartas({
  grid,
  selectAlfabetico,
  selectPrecio,
  botonAnterior,
  botonSiguiente,
  estadoPaginacion,
  onCambiarOrden,
  onPaginaAnterior,
  onPaginaSiguiente
}){
    function obtenerOrden() {
        return selectAlfabetico.value !== "none"
            ? selectAlfabetico.value
            : selectPrecio.value !== "none"
            ? selectPrecio.value
            : undefined
    }

    function actualizarPaginacion(paginacion, cargando) {
        botonAnterior.disabled =
        cargando || !paginacion?.tieneAnterior

        botonSiguiente.disabled =
        cargando || !paginacion?.tieneSiguiente

        estadoPaginacion.textContent = paginacion
        ? `Página ${paginacion.paginaActual} de ${paginacion.totalPaginas} · ${paginacion.totalEntradas} cartas`
        : ""
    }

    // Girar tarjetas mediante clic.
    grid.addEventListener("click", (evento) => {
        if (evento.target.closest(".btn-details")) return

        const tarjeta = evento.target.closest(".card-flip")
        tarjeta?.classList.toggle("flipped")
    })

    // Girar tarjetas mediante teclado.
    grid.addEventListener("keydown", (evento) => {
        if (evento.target.closest(".btn-details")) return

        if (evento.key !== "Enter" && evento.key !== " ") return

        const tarjeta = evento.target.closest(".card-flip")
        if (!tarjeta) return

        evento.preventDefault()
        tarjeta.classList.toggle("flipped")
    })

    // Orden alfabético.
    selectAlfabetico.addEventListener("change", () => {
        if (selectAlfabetico.value !== "none") {
        selectPrecio.value = "none"
        }

        onCambiarOrden()
    })

    // Orden por precio.
    selectPrecio.addEventListener("change", () => {
        if (selectPrecio.value !== "none") {
        selectAlfabetico.value = "none"
        }

        onCambiarOrden()
    })

    // Página anterior.
    botonAnterior.addEventListener("click", () => {
        onPaginaAnterior()
    })

    // Página siguiente.
    botonSiguiente.addEventListener("click", () => {
        onPaginaSiguiente()
    })

    return {
        obtenerOrden,
        actualizarPaginacion
    }
}