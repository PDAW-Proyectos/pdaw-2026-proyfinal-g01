import { authService } from '../services/authService.js'

const form = document.getElementById('form-login')
const btnSubmit = form.querySelector('button[type="submit"]')
const statusDiv = document.getElementById('status-mensaje')

function setError(name, message) {
  const field = form.elements[name]
  if (field) {
    field.setAttribute('aria-invalid', message ? 'true' : 'false')
  }
  const errorElement = document.getElementById(`error-${name}`)
  if (errorElement) {
    errorElement.textContent = message ?? ''
  }
}

function clearErrors() {
  Array.from(form.elements).forEach((field) => {
    if (field.name) setError(field.name, null)
  })
  statusDiv.textContent = ''
  statusDiv.className = 'mb-3 fw-bold'
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  btnSubmit.disabled = true
  clearErrors()

  statusDiv.textContent = 'Verificando credenciales...'
  statusDiv.classList.add('text-info')

  try {
    const data = Object.fromEntries(new FormData(form))

    await authService.login(data)

    statusDiv.textContent = '¡Inicio de sesión exitoso! Redirigiendo...'
    statusDiv.classList.replace('text-info', 'text-success')

    window.location.assign('index.html')
  } catch (err) {
    statusDiv.textContent = ''
    statusDiv.classList.replace('text-info', 'text-danger')

    if (err.fieldErrors?.length) {
      err.fieldErrors.forEach(({ campo, mensaje }) => setError(campo, mensaje))
      statusDiv.textContent = 'Por favor, revisa los datos ingresados.'
    } else {
      statusDiv.textContent = err.message
    }
  } finally {
    btnSubmit.disabled = false
  }
})

//Show contraseña
const password = document.getElementById("contraseña");

function togglePassword(){

    if (password.type === "password") {
        password.type = "text";
    } else {
        password.type = "password";
    }
}

const showPasswordButton = document.getElementById("show-password");
showPasswordButton.addEventListener("click", togglePassword);