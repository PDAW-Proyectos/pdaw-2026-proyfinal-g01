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
  },

  async obtenerPaginados({ pagina = 1, limite = 10, username = '' } = {}) {
  const params = new URLSearchParams({
    pagina: String(pagina),
    limite: String(limite),
  })

  if (username.trim()) {
    params.set('username', username.trim())
  }

  const response = await fetch(`/api/usuarios?${params.toString()}`, {
    credentials: 'include',
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener los usuarios.')
  }

  return data // { datos: [...], paginacion: { ... } }
}
}