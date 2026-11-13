import { api } from '../api.js'

export const servicioUsuarios = {
  /**
   * Obtiene la lista completa de usuarios (requiere el rol de admin).
   */
  async obtenerTodos() {
    return await api('/api/usuarios')
  },

  /**
   * Elimina a un usuario y sus mazos que estan asociados por username.
   */
  async eliminar(username) {
    return await api(`/api/usuarios/${encodeURIComponent(username)}`, {
      method: 'DELETE'
    })
  }
}