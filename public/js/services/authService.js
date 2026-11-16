import { api } from '../api.js'

export const authService = {
  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async obtenerUsuarioActual() {
    try {
      const data = await api('/api/usuarios/me')
      return data?.usuario ?? null
    } catch {
      return null
    }
  },

  /**
   * Inicia sesión con credenciales.
   */
  async login(credenciales) {
    return await api('/api/usuarios/login', {
      method: 'POST',
      body: credenciales,
    })
  },

  /**
   * Registra un nuevo usuario.
   */
  async registro(datosUsuario) {
    return await api('/api/usuarios/registro', {
      method: 'POST',
      body: datosUsuario,
    })
  },

  /**
   * Cierra la sesión activa en el servidor.
   */
  async logout() {
    try {
      await api('/api/usuarios/logout', { method: 'POST' })
    } catch (err) {
      console.warn('Error durante la petición de logout:', err)
    }
  },
}