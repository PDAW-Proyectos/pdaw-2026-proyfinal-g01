import { authService } from '../services/authService.js'

const form = document.getElementById('form-login')
const btnSubmit = form.querySelector('button[type="submit"]')
const textoOriginalBtn = btnSubmit.textContent
const statusDiv = document.getElementById('status-mensaje')

form.addEventListener('submit', async (event) => {
  event.preventDefault()

  btnSubmit.disabled = true
  btnSubmit.textContent = 'Verificando...'
  statusDiv.textContent = ''

  let redirigiendo = false

  try {
    const data = Object.fromEntries(new FormData(form))

    await authService.login(data)

    redirigiendo = true
    btnSubmit.classList.remove('theme-primary', 'btn-solid')
    btnSubmit.classList.add('btn-success', 'fw-bold', 'opacity-100', 'shadow')

    const iconoCheck = document.createElement('i')
    iconoCheck.classList.add('bi', 'bi-check-circle-fill', 'me-2')
    btnSubmit.replaceChildren(iconoCheck, 'Iniciando sesión...')

    setTimeout(() => {
      window.location.assign('index.html')
    }, 1000)
  } catch (err) {
    if (!err.status || err.status >= 500) {
      alert('No se pudo conectar con el servidor. Intenta más tarde.')
    } else {
      statusDiv.className = 'text-center mb-3 fg-danger'
      statusDiv.textContent = err.fieldErrors?.length
        ? 'Por favor, revisa los datos ingresados.'
        : 'Usuario o contraseña incorrecta.'
    }
  } finally {
    if (!redirigiendo) {
      btnSubmit.disabled = false
      btnSubmit.textContent = textoOriginalBtn
    }
  }
})

// Show contraseña
const password = document.getElementById('contraseña')
const showPasswordButton = document.getElementById('show-password')

showPasswordButton?.addEventListener('click', () => {
  const esOculta = password.type === 'password'
  password.type = esOculta ? 'text' : 'password'

  const icono = showPasswordButton.querySelector('i')
  icono?.classList.toggle('bi-eye', !esOculta)
  icono?.classList.toggle('bi-eye-slash', esOculta)
})