import { authService } from '../services/authService.js'

const form = document.getElementById('form-registro')
const btnSubmit = form.querySelector('button[type="submit"]')
const statusDiv = document.getElementById('status-mensaje')
const resumenErrores = document.getElementById('resumen-errores')
const listaErrores = document.getElementById('lista-errores')

function setError(name, message) {
  const field = form.elements[name]
  if (field) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false')
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

function showSummary(errores) {
  listaErrores.replaceChildren()
  errores.forEach(({ campo, mensaje }) => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = `#${campo}`
    a.textContent = mensaje
    li.appendChild(a)
    listaErrores.appendChild(li)
  })
  resumenErrores.hidden = false
  resumenErrores.focus()
}

function clearErrors() {
  Array.from(form.elements).forEach((field) => {
    if (field.name) setError(field.name, null)
  })
  statusDiv.textContent = ''
  statusDiv.className = 'mb-3 fw-bold text-center'
  resumenErrores.hidden = true
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  btnSubmit.disabled = true
  clearErrors()

  try {
    const data = Object.fromEntries(new FormData(form))
    const erroresCliente = []

    // Validación en el cliente
    if (data.contraseña !== data['confirm-password']) {
      erroresCliente.push({ campo: 'confirm-password', mensaje: 'Las contraseñas no coinciden.' })
    }
    if (!data.terminos) {
      erroresCliente.push({ campo: 'terminos', mensaje: 'Debe aceptar los Términos y Condiciones.' })
    }

    if (erroresCliente.length > 0) {
      const errorObj = new Error('Errores de validación en el cliente')
      errorObj.fieldErrors = erroresCliente
      throw errorObj
    }

    delete data['confirm-password']
    delete data['terminos']

    statusDiv.textContent = 'Creando cuenta...'
    statusDiv.classList.add('text-info')

    await authService.registro(data)

    statusDiv.textContent = '¡Cuenta creada con éxito! Redirigiendo al login...'
    statusDiv.classList.replace('text-info', 'text-success')

    setTimeout(() => {
      window.location.assign('login.html')
    }, 1500)
  } catch (err) {
    statusDiv.textContent = ''
    statusDiv.classList.remove('text-info')

    if (err.status === 409) {
      err.fieldErrors = [{ campo: 'username', mensaje: err.message }]
    }

    if (err.fieldErrors?.length) {
      err.fieldErrors.forEach(({ campo, mensaje }) => setError(campo, mensaje))
      showSummary(err.fieldErrors)
    } else {
      statusDiv.classList.add('text-danger')
      statusDiv.textContent = err.message
    }
  } finally {
    btnSubmit.disabled = false
  }
})