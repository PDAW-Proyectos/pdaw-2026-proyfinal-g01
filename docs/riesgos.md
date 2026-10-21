# Matriz de riesgos

Revisar en cada retrospectiva. Probabilidad e impacto: baja/media/alta.

| Riesgo | Probabilidad | Impacto | Respuesta (acción concreta) | Responsable |
| ------ | :----------: | :-----: | --------------------------- | :---------: |
| Bloqueo de ip por exceder los límites de uso de las imágenes | MEDIA | ALTO | Implementar una paginación para que no cargue todas las fotos | FRONTEND |
| Cartas con datos no actualizados, como el precio | BAJA | BAJO | Actualizar la base de datos semanalmente, para que actualice los atributos necesarios | BACKEND |
| La API externa de YGOPRODeck no responde o está caída | BAJA | MEDIO | Mostrar los datos que tenemos en nuestra base, con un mensaje de su última actualización | BACKEND |
| Las cartas de yugioh tardan en cargar.  | ALTO | MEDIO | Mostrar carta boca abajo o con un icono de carga | FRONTEND |
| Un usuario intenta registrarse con un correo ya registrado | MEDIO | MEDIO | Agregar validación de correo específica, para que no se repita en otro usuario | FRONTEND/ BACKEND |
| Problemas de merge entre los miembros del equipo | MEDIA | MEDIA | Trabajar usando las Branch de GitHub, con nombres claros y definir contratos para escribir codigo mas uniforme | TODOS |
| Vulnerabilidad o fallos en autenticación(Login de Usuarios) | BAJA | ALTO | Utilizar hashing seguro en el backend (ej. bcrypt), no exponer contraseñas en frontend y validar entradas para evitar inyecciones. | BACKEND |
