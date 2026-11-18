# Registro de Decisiones de Arquitectura (ADR)

Este documento resume las decisiones técnicas más importantes que tomamos durante el desarrollo de **YuGiKi!**, explicando qué problema queríamos resolver, qué opciones evaluamos y qué ventajas o limitaciones trae cada elección.

---

## ADR-001: Guardar los datos en archivos JSON locales con carga en memoria

- **Estado:** Aceptada
- **Contexto:** La aplicación necesita guardar el catálogo de cartas, los mazos creados por los usuarios, los mazos populares, las cuentas registradas y las imágenes descargadas, pero queríamos que el proyecto pudiera ejecutarse fácilmente en cualquier computadora sin tener que instalar ni configurar una base de datos compleja, la cual nos podria retrasar mucho, investigar por nuetra cuenta.
- **Alternativas evaluadas:**
  1. **Usar una base de datos externa:** Si bien ofrece herramientas avanzadas para manejar grandes volúmenes de datos, no era un requisito de la cursada y obligaba a instalar y configurar un motor de base de datos aparte para poder levantar el proyecto.
  2. **Guardar los datos en archivos JSON locales y mantenerlos en memoria mientras corre el servidor (elegida):** Al iniciar la aplicación, los repositorios leen los archivos de la carpeta `data/` y los cargan en memoria para responder rápido, guardando los cambios en disco cada vez que se crea, modifica o elimina algo.
- **Decisión:** Implementar una capa de repositorios que trabaja con archivos JSON en disco (`cartas.json`, `mazos.json`, `usuarios.json`) y mantiene copias ordenadas en memoria para agilizar las búsquedas. En el caso de las imágenes, primero se guardan en un archivo temporal y luego se renombran para evitar que queden archivos rotos si el servidor se detiene a mitad de una descarga.
- **Consecuencias:**
  - **Positivas:** El proyecto arranca al instante con `npm start` sin depender de servicios externos, las consultas son muy rápidas y los datos son fáciles de revisar o respaldar.
  - **Negativas / Trade-offs:** Como los datos activos viven en la memoria de un único servidor, esta solución no está pensada para ejecutar varias copias del servidor al mismo tiempo compartiendo información.

---

## ADR-002: Inicio de sesión mediante sesiones en el servidor y cookies seguras (`httpOnly`)

- **Estado:** Aceptada
- **Contexto:** La plataforma tiene distintos niveles de permiso (visitantes que solo navegan, usuarios registrados que arman mazos y administradores que gestionan cuentas) y necesitábamos mantener la sesión abierta de forma segura sin complicar el código del navegador.
- **Alternativas evaluadas:**
  1. **JWT (JSON Web Tokens) guardado en el navegador (evaluada, no utilizada):** Evita guardar sesiones en la memoria del servidor, pero requiere manejar tokens manualmente en el frontend, expone el token si se guarda en `localStorage` y dificulta invalidar una sesión de inmediato cuando el usuario cierra sesión o un administrador elimina la cuenta.
  2. **Guardar un token de acceso en el almacenamiento del navegador (`localStorage`):** Es muy facil de implementar, pero deja el permiso expuesto a ser leído por código malicioso si llegara a haber un fallo de seguridad en la página, y hace más difícil cerrar una sesión de inmediato desde el servidor.
  3. **Sesiones guardadas en el servidor con una cookie protegida (`httpOnly`) (elegida):** El servidor recuerda quién inició sesión y le entrega al navegador una cookie (`wiki.sid`) que el navegador envía automáticamente en cada consulta, pero a la que el código JavaScript de la página no puede acceder.
- **Decisión:** Utilizar el manejo de sesiones de Express (`express-session`) con la cookie `wiki.sid` protegida (`httpOnly: true`, `sameSite: "lax"` y una duración de 1 hora), combinada con contraseñas encriptadas mediante `bcrypt` y filtros de seguridad en las rutas según el rol del usuario.
- **Consecuencias:**
  - **Positivas:** Protege las sesiones contra robo desde el navegador, permite cerrar la sesión de forma inmediata al hacer logout y simplifica las peticiones desde el frontend.
  - **Negativas / Trade-offs:** Como las sesiones se guardan en la memoria del servidor, si el proceso se reinicia los usuarios deben volver a iniciar sesión.

---

## ADR-003: Descarga de imágenes a medida que se piden, con control de velocidad

- **Estado:** Aceptada
- **Contexto:** El catálogo completo de Yu-Gi-Oh! tiene más de 13.000 cartas en dos tamaños distintos. Descargar todas las imágenes juntas desde el principio ocuparía demasiado espacio en disco y podría hacer que la API externa (YGOPRODeck) bloquee nuestras peticiones por superar su límite de 20 descargas por segundo.
- **Alternativas evaluadas:**
  1. **Cargar las imágenes directamente desde la web externa en cada visita:** No ocupa espacio en nuestro servidor, pero hace que la página dependa siempre de la velocidad y disponibilidad del servicio externo.
  2. **Descargar todas las imágenes juntas al iniciar el sistema:** Permite tener todo disponible sin internet, pero demora mucho tiempo en la primera instalación y guarda miles de imágenes que probablemente nadie consulte.
  3. **Descargar cada imagen la primera vez que alguien la pide y guardarla en disco (elegida):** El servidor revisa si ya tiene la imagen guardada; si la tiene, la entrega al instante, y si no, la descarga una sola vez y la conserva para futuros usuarios.
- **Decisión:** Armar una cola de descargas en `ServicioImagenes.js` que limita las peticiones a un máximo de 12 por segundo (respetando con margen el límite de la API externa) y evita descargar dos veces la misma carta si varios usuarios la piden al mismo tiempo, guardando el resultado en `data/imagenes/`.
- **Consecuencias:**
  - **Positivas:** Evita bloqueos por exceso de peticiones, ahorra espacio en disco descargando solo las cartas que realmente se usan y acelera mucho la carga en visitas posteriores.
  - **Negativas / Trade-offs:** La primera persona que consulta una carta nueva nota una pequeña espera mientras se descarga la imagen, y la carpeta de imágenes va creciendo con el uso.