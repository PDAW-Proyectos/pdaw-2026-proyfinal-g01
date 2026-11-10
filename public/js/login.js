import { api } from './api.js'

const form = document.getElementById('form-login')
const btnSubmit = form.querySelector('button[type="submit"]')
const statusDiv = document.getElementById('status-mensaje')

// Manejo de errores por campo (clase 13 - WCAG)
function setError(name, message) {
    const field = form.elements[name]
    if (field) {
        field.setAttribute('aria-invalid', message ? 'true' : 'false')
    }
    const errorElement = document.getElementById(`error-${name}`)
    if (errorElement) {
        errorElement.textContent = message ?? ''
    }
    // · aria-invalid marca el campo  
    // · Nunca borrar los datos ante un error
}

// Limpiar la interfaz antes de cada intento
function clearErrors() {
    //agarra todos los elementos de un form y los convierte en un array
    Array.from(form.elements).forEach(field => {
        //recorre el array busca a los elementos que tengan el atributo name
        //si los tiene con setError se les envia null y eso borra el texto de small
        if (field.name) setError(field.name, null)
    })
    statusDiv.textContent = ''
    statusDiv.className = 'mb-3 fw-bold' // Reset clases base
}

form.addEventListener('submit', async (event) => {
    event.preventDefault()
    
    btnSubmit.disabled = true
    clearErrors()
    
    statusDiv.textContent = 'Verificando credenciales...'
    statusDiv.classList.add('text-info')

    try {
        const data = Object.fromEntries(new FormData(form))

        await api('/api/usuarios/login', { method: 'POST', body: data })

        statusDiv.textContent = '¡Inicio de sesión exitoso! Redirigiendo...'
        statusDiv.classList.replace('text-info', 'text-success')
        
        window.location.assign('/')
        
    } catch (err) {
        statusDiv.textContent = ''
        statusDiv.classList.replace('text-info', 'text-danger')
        
        if (err.fieldErrors?.length) {
            // Errores especificos de validacion
            err.fieldErrors.forEach(({ campo, mensaje }) => setError(campo, mensaje))
            statusDiv.textContent = 'Por favor, revisa los datos ingresados.'
        } else {
            // Error general (credenciales incorrectas, servidor caído)
            statusDiv.textContent = err.message
        }
    } finally {
        btnSubmit.disabled = false 
    }
})