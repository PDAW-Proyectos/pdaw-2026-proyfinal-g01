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