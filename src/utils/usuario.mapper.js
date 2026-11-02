//Asegura que el hash de la contraseña nunca viaje al cliente web.
export class UsuarioMapper {
  static toDTO(usuario) {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      username: usuario.username,
      mazos: usuario.mazos
    }
  }
}