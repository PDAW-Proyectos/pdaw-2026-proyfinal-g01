import { authService } from '../services/authService.js'
import { marcarBotonExito, inicializarTogglePassword } from '../modules/utilidadFormularios.js'

const form = document.getElementById('form-login')
const btnSubmit = form.querySelector('button[type="submit"]')
const textoOriginalBtn = btnSubmit.textContent
const statusDiv = document.getElementById('status-mensaje')

inicializarTogglePassword('show-password', 'contraseña')

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
    marcarBotonExito(btnSubmit, 'Iniciando sesión...')

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

