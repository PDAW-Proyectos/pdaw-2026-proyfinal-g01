# Lecciones Aprendidas — YuGiKi!

Este documento reúne lo que fuimos aprendiendo como equipo (**Grupo-01**) a lo largo del desarrollo de **YuGiKi!**, tanto en lo técnico como en la forma de organizar el trabajo.

---

## 1. Arquitectura y organización del código

### Separar responsabilidades desde el principio ahorra dolores de cabeza
Al arrancar, era tentador resolver todo dentro de las rutas o los controladores para ver resultados rápido. Sin embargo, a medida que crecieron las reglas del juego (límites de cartas por mazo, banlist, separación entre Main Deck y Extra Deck), el código empezaba a volverse difícil de seguir. Separar el proyecto en capas claras (**Rutas → Controladores → Servicios → Repositorios → Modelos**) hizo mucho más fácil encontrar dónde iba cada cosa, reutilizar lógica sin copiar y pegar, y escribir pruebas sin tener que levantar toda la aplicación.

### Cuidar qué datos salen hacia afuera
Trabajar con campos privados (`#`) en nuestras clases (`Usuario`, `Mazo`, `Carta`) y definir métodos específicos para guardar en disco (`toJSON()`) y para responder al cliente (`toDTO()`) nos ayudó a mantener el orden. Así evitamos mandar por error datos internos (como la contraseña encriptada de un usuario) y pudimos darle a cada tipo de carta el formato justo que necesitaba el frontend.

---

## 2. Integración con servicios externos y archivos locales

### No dar por sentado que una API externa siempre responde igual o sin límites
Cuando conectamos la descarga de imágenes con **YGOPRODeck**, nos encontramos con que al cargar una página con muchas cartas se disparaban mcuhas de peticiones juntas. Esto podía superar el límite de velocidad de la API externa y terminar con la "IP BAN" o hacer que el servidor descargara dos veces la misma imagen al mismo tiempo. Implementar una cola que regula la velocidad de descarga y evita peticiones duplicadas.

---

## 3. Validaciones, errores y seguridad

### Validar antes de procesar simplifica todo lo demás
En lugar de llenar los controladores de `if` para revisar si faltaba un campo o si un ID era negativo, usar esquemas de validación con **Ajv** antes de entrar a la lógica de negocio dejó los controladores mucho más limpios y aseguró que los mensajes de error hacia el usuario fueran claros y consistentes en toda la API.

### Pensar la seguridad desde el diseño
Manejar las sesiones desde el servidor con cookies protegidas (`httpOnly`) y encriptar las contraseñas con `bcrypt` nos permitió resolver el inicio de sesión y los permisos por rol (`usuario` y `admin`) de forma segura, sin exponer información sensible en el almacenamiento del navegador.

---

## 4. Trabajo en equipo, pruebas y documentación

### Los tests y el linter son aliados, no un trámite final
Incorporar pruebas automatizadas con **Jest** y reglas de estilo con **ESLint** en un mismo comando (`npm run verificar`) nos ayudó a detectar errores cuando tocábamos código viejo para agregar funcionalidades nuevas, evitando romper cosas que ya funcionaban.

### Documentar a medida que se construye
Al revisar los documentos sobre el cierre del proyecto, notamos varios desfasajes entre lo que habíamos escrito al principio y cómo había evolucionado realmente el código (nuevos endpoints, cambios en permisos y atributos de clases). Nos llevamos como aprendizaje que actualizar los diagramas y el contrato de la API en el mismo momento en que se modifica el código evita trabajar doble al final y mantiene a todo el equipo alineado.