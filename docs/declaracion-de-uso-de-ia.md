## Herramientas utilizadas
| Herramienta | Versión o plan | Integrantes |
| ----------- | -------------- | ----------- |
| Antigravity | gemini 4 | Facundo |
| Antigravity | gemini 4 | Joaquin |
| Antigravity | gemini 4 | Franco |

## Usos

### Facundo
| Tarea | Qué se pidió | Qué se adoptó | Cómo se verificó |
| ------ | ----------- | ------------- | ---------------- |
| Pruebas | La creacion de test usando jest | El codigo generado en la carpeta tests | Se leyeron las prubas de los test a medida que se iban generando (Se implementaba funcion, se documentaba y se pedia la generacion del test) |
| Ideacion | Consejos en el modelado de entidades de dominio | La idea de solo usar usuarios y no tener una subclase admin( el resto de consejos se descartaron) | Se leyo el documento generado |
| Refactorizacion | Separcion de funcionalidades implementadas en un mismo script en diferentes | Varios scripts con pocas lineas basados en el codigo previamente implementado | Se leyeron y testearon dichos scripts |
| Documentacion | Creacion de la primera documentacion del api nuestro | El archivo endpoints.md | Se genero por una descripcion de otra documentacion y el mismo codigo, ademas de leerlo para ayudar en la implementacion despues |
| Generacion de codigo(server) | Maquetas de clases basadas en clases existentes | Scripts para clases basadas en implementaciones previamentes hechas (ej: genera repositorioImagenes basandote en repositorioCartas) | Se siguio agregando funcionalidad a la clase y depurando todos los errores a mano y con investigacion con ia |
| Generacion de codigo(frontend) | El estilizado usando bootstrap 6 | Se reescribio casi todo el estilizado del frontend usando ia para generar la idea principal | Visualmente viendo que este bien la pagina y sacando del html todas las cosas que sobraban y encontraba |

ideación y UX · depuración · pruebas · refactorización · documentación

### Joaquín
| Tarea | Qué se pidió | Qué se adoptó | Cómo se verificó |
| ------ | ----------- | ------------- | ---------------- |
| Ideas y UX | Opciones para manejar las sesiones y los errores de login | Usar cookies httpOnly en vez de localStorage y mensajes genéricos si fallan los datos | Probando el login y cierre de sesión en el navegador y mirando la cookie en las DevTools |
| Depuracion | Ayuda para encontrar por qué fallaban los middlewares de permisos y no se guardaba la sesión a tiempo | Cambié el orden de los middlewares en Express y agregué req.session.save() antes de responder en el login | Haciendo peticiones seguidas y viendo que las rutas protegidas tiraran 401/403 sin sesión |
| Pruebas | Qué casos raros o bordes tener en cuenta para probar el registro y el login | Una lista con casos como usuarios repetidos o datos mal armados.| Corriendo los tests y probando cada error  desde la página y con el cliente HTTP |
| Refactorizacion | Cómo separar el encriptado y validación de usuarios para no tener todo mezclado en las rutas | Moví el hasheo con bcrypt y la validación al servicio/modelo, dejando las rutas solo con el esquema | Revisando el código línea por línea y probando que todo siguiera andando igual |
| Documentacion | Una plantilla base para anotar los endpoints de login, registro y sus errores | El formato de ejemplo de los JSON de ida y vuelta. | Probando cada ruta contra el servidor para ver que coincidiera con lo que anoté |

ideación y UX · depuración · pruebas · refactorización · documentación

### Franco
| Tarea | Qué se pidió | Qué se adoptó | Cómo se verificó |
| ------ | ----------- | ------------- | ---------------- |
| Diseño | Creacion de componentes de las distintas paginas y animaciones | Usar diseño responsive de bootstrap y css | Usando las DevTool y visualizando la pagina |
| Depuracion | Ayuda para encontrar errores en codigo | Soluciones de problemaa de visualizacion en el navegador | Cambiando el diseño de los componentes y volviendo a preguntar a la ia para la solucion de errores |
| Modularizacion | Ayuda para modularizar el codigo para los script | Separacion en carpetas para los componentes modulos y paginas | Probando las funciones con el navegador |
| Generacion codigo(cliente) | Generacion de codigo para usar las API del server | Funciones reutilizables para la parte del cliente | Haciendo pruebas y uso de la consola para lo errores |

diseño · depuración · modularizacion · documentación

## Compromiso
Todas las personas del equipo comprendemos el código del repositorio,
podemos explicarlo y modificarlo sin asistencia, y las partes generadas
o sugeridas fueron revisadas, probadas y adaptadas por el equipo.
