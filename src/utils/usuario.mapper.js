//Asegura que el hash de la contraseña nunca viaje al cliente web.
export class UsuarioMapper {
  static toDTO(usuario) {
    return {
      nombre: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol,
      mazos: usuario.mazos
    }
  }
}
