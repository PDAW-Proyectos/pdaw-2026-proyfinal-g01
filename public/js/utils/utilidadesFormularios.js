/**
 * Asigna o limpia un mensaje de error en un campo de formulario.
 * @param {HTMLFormElement} form
 * @param {string} name
 * @param {string|null} message
 */
export function setError(form, name, message) {
  const field = form.elements[name]
  if (field) {
    field.setAttribute("aria-invalid", message ? "true" : "false")
    field.classList.toggle("is-invalid", Boolean(message))
  }

  const errorElement = document.getElementById(`error-${name}`)
  if (errorElement) {
    if (message) {
      errorElement.classList.add("text-danger", "d-block")
    } else {
      errorElement.classList.remove("text-danger", "d-block")
    }
    errorElement.textContent = message ?? ""
  }
}

/**
 * Limpia los errores de todos los campos de un formulario.
 * @param {HTMLFormElement} form
 */
export function clearErrors(form) {
  Array.from(form.elements).forEach((field) => {
    if (field.name) setError(form, field.name, null)
  })
}

/**
 * Marca un botón de envío con estado visual de éxito.
 * @param {HTMLButtonElement} btn
 * @param {string} texto
 */
export function marcarBotonExito(btn, texto) {
  btn.classList.remove("theme-primary", "btn-solid")
  btn.classList.add("btn-success", "fw-bold", "opacity-100", "shadow")

  const iconoCheck = document.createElement("i")
  iconoCheck.classList.add("bi", "bi-check-circle-fill", "me-2")
  btn.replaceChildren(iconoCheck, texto)
}
