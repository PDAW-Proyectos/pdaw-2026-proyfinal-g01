/**
 * Crea una tarjeta skeleton para representar una carta
 * mientras se obtienen los datos del servidor.
 *
 * @returns {HTMLElement} Elemento HTML de la tarjeta skeleton.
 */
function crearSkeleton() {
  const tarjeta = document.createElement("article")
  tarjeta.className = "card-skeleton"
  tarjeta.setAttribute("aria-hidden", "true")

  const imagen = document.createElement("div")
  imagen.className = "skeleton-image"

  const contenido = document.createElement("div")
  contenido.className = "skeleton-content"

  const nombre = document.createElement("div")
  nombre.className = "skeleton-line skeleton-name"

  const tipo = document.createElement("div")
  tipo.className = "skeleton-line skeleton-type"

  contenido.append(nombre, tipo)
  tarjeta.append(imagen, contenido)

  return tarjeta
}

/**
 * Genera y muestra una cantidad determinada de tarjetas skeleton.
 *
 * Reemplaza el contenido anterior del contenedor.
 *
 * @param {HTMLElement} grid - Contenedor de las cartas.
 * @param {number} cantidad - Cantidad de skeletons a generar.
 * @returns {void}
 */
export function mostrarSkeletons(grid, cantidad = 20) {
  const fragmento = document.createDocumentFragment()

  for (let i = 0; i < cantidad; i++) {
    fragmento.append(crearSkeleton())
  }

  grid.replaceChildren(fragmento)
}