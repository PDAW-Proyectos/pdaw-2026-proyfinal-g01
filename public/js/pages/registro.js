import { authService } from '../services/authService.js'

const form = document.getElementById('form-registro')
const btnSubmit = form.querySelector('button[type="submit"]')
const textoOriginalBtn = btnSubmit.textContent

function setError(name, message) {
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

function clearErrors() {
  Array.from(form.elements).forEach((field) => {
    if (field.name) setError(field.name, null)
  })
}

function validarFormulario(data) {
  const errores = []

  if (!data.nombre?.trim()) {
    errores.push({ campo: 'nombre', mensaje: 'Ingresa tu nombre.' })
  }

  if (!data.username?.trim()) {
    errores.push({ campo: 'username', mensaje: 'Ingresa un usuario.' })
  }

  if (!data.contraseña) {
    errores.push({ campo: 'contraseña', mensaje: 'Ingresa una contraseña.' })
  } else if (data.contraseña.length < 6) {
    errores.push({ campo: 'contraseña', mensaje: 'Mínimo 6 caracteres.' })
  }

  if (!data['confirm-password']) {
    errores.push({ campo: 'confirm-password', mensaje: 'Confirma tu contraseña.' })
  } else if (data.contraseña !== data['confirm-password']) {
    errores.push({ campo: 'confirm-password', mensaje: 'No coinciden.' })
  }

  if (!data.terminos) {
    errores.push({ campo: 'terminos', mensaje: 'Debes aceptar los términos.' })
  }

  return errores
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  btnSubmit.disabled = true
  clearErrors()

  let redirigiendo = false

  try {
    const data = Object.fromEntries(new FormData(form))
    const erroresCliente = validarFormulario(data)

    if (erroresCliente.length > 0) {
      const errorObj = new Error('Errores de validación en el cliente')
      errorObj.fieldErrors = erroresCliente
      throw errorObj
    }

    const datos = {
      nombre: data.nombre.trim(),
      username: data.username.trim(),
      contraseña: data.contraseña,
    }

    btnSubmit.textContent = 'Creando cuenta...'

    await authService.registro(datos)

    redirigiendo = true
    btnSubmit.textContent = '¡Cuenta creada!'
    btnSubmit.classList.remove('theme-primary', 'btn-solid')
    btnSubmit.classList.add('btn-success', 'fw-bold', 'opacity-100', 'shadow')

    const iconoCheck = document.createElement('i')
    iconoCheck.classList.add('bi', 'bi-check-circle-fill', 'me-2')
    btnSubmit.replaceChildren(iconoCheck, '¡Usuario creado!')

    setTimeout(() => {
      window.location.assign('login.html')
    }, 1500)
  } catch (err) {
    if (err.status === 409) {
      err.fieldErrors = [{ campo: 'username', mensaje: 'El usuario ya existe.' }]
    }

    if (err.fieldErrors?.length) {
      err.fieldErrors.forEach(({ campo, mensaje }) => setError(campo, mensaje))
      form.elements[err.fieldErrors[0].campo]?.focus()
    } else {
      alert(err.message || 'Error al crear la cuenta.')
    }
  } finally {
    if (!redirigiendo) {
      btnSubmit.disabled = false
      btnSubmit.textContent = textoOriginalBtn
    }
  }
})