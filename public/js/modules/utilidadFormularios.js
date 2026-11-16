export function setError(form, name, message) {
  const field = form.elements[name]
  if (field) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false')
    field.classList.toggle('is-invalid', Boolean(message))
  }

  const errorElement = document.getElementById(`error-${name}`)
  if (errorElement) {
    if (message) {
      errorElement.classList.add('text-danger', 'd-block')
    } else {
      errorElement.classList.remove('text-danger', 'd-block')
    }
    errorElement.textContent = message ?? ''
  }
}

export function clearErrors(form) {
  Array.from(form.elements).forEach((field) => {
    if (field.name) setError(form, field.name, null)
  })
}

export function marcarBotonExito(btn, texto) {
  btn.classList.remove('theme-primary', 'btn-solid')
  btn.classList.add('btn-success', 'fw-bold', 'opacity-100', 'shadow')

  const iconoCheck = document.createElement('i')
  iconoCheck.classList.add('bi', 'bi-check-circle-fill', 'me-2')
  btn.replaceChildren(iconoCheck, texto)
}

export function inicializarTogglePassword(buttonId, inputId) {
  const showPasswordButton = document.getElementById(buttonId)
  const password = document.getElementById(inputId)

  showPasswordButton?.addEventListener('click', () => {
    const esOculta = password.type === 'password'
    password.type = esOculta ? 'text' : 'password'

    const icono = showPasswordButton.querySelector('i')
    icono?.classList.toggle('bi-eye', !esOculta)
    icono?.classList.toggle('bi-eye-slash', esOculta)
  })
}