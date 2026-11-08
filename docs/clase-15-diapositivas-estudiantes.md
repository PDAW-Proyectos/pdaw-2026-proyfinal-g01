Universidad Nacional del Sur
Departamento de Ciencias e Ingeniería de la Computación
Tecnicatura Universitaria en Programación Web y Móvil
15
7513 · PROYECTO DE DESARROLLO DE APLICACIONES WEB
Manejo de errores y registro de
eventos
Errores operacionales y de programación, manejo centralizado,
formato estándar, registro estructurado y experiencia de usuario
Clase 15 · Semana 4 · Jueves · Sprint 3
Dr. Mario Leiva · 2026

CLASE 15
Errores operacionales y errores de programación
Operacionales (esperables) De programación (defectos)
• Datos inválidos, recurso inexistente • Acceso a undefined, tipo incorrecto
• Regla de negocio violada • Promesa sin await, caso no previsto
• Servicio externo caído o lento • No se "manejan": se corrigen
• Se manejan: mensaje claro y código 4xx o • Respuesta 500 genérica y registro
502 detallado
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 2

01
Manejo centralizado de errores
Un único lugar decide cómo se responde y se registra
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 3

MANEJO CENTRALIZADO DE ERRORES
Manejo disperso frente a centralizado
DISPERSO CENTRALIZADO
codigo/antes/app.js codigo/src/app.js
app.get('/api/libros/:id', (req, res) => { app.get('/api/libros/:id', (req, res) => {
try { const book = books.find(...);
if (!book) throw new NotFoundError('Libro');
const book = books.find(...);
res.json(book);
res.json({ titulo: book.title });
});
} catch (err) {
console.log('error', err);
// Al final, una sola vez:
res.status(500).send(err.stack);
app.use(notFound);
}
app.use(errorHandler(logger));
});
// otra ruta: 200 con { ok: false }
// otra ruta: 500 con { message }
Las rutas lanzan errores con significado; el middleware decide código, formato y registro
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 4

MANEJO CENTRALIZADO DE ERRORES
Jerarquía de errores de la aplicación
Cada error conoce su código y
codigo/src/errors.js 1
título
class AppError extends Error {
constructor(message, options = {}) {
const { status = 500, title = 'Error interno', details, cause } = options;
super(message, { cause }); // cause: el error original
this.name = this.constructor.name;
Object.assign(this, { status, title, details });
cause conserva el error
} 2
} original
class NotFoundError extends AppError {
constructor(what) {
super(`${what} no encontrado`, { status: 404, title: 'No encontrado' });
}
}
Polimorfismo: el middleware
3
class ExternalServiceError extends AppError {
no pregunta el tipo
constructor(service, cause) {
super(`Servicio ${service} no disponible`, { status: 502, cause });
}
}
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 5

MANEJO CENTRALIZADO DE ERRORES
Errores asíncronos en Express 5
codigo/src/app.js
// Express 5: si la función async rechaza, el error llega solo
// al manejador de errores. No hace falta try/catch ni next(err).
app.get('/api/externo', async () => {
try {
await externalService();
} catch (cause) {
throw new ExternalServiceError('de catálogo', cause); // se traduce
}
});
// En Express 4 era necesario capturar y llamar a next:
// app.get('/x', async (req, res, next) => {
// try { ... } catch (err) { next(err); }
// });
1 · Promesas rechazadas llegan al middleware 2 · try/catch solo para traducir el error 3 · Express 4 requería next(err)
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 6

MANEJO CENTRALIZADO DE ERRORES
Middleware de manejo de errores
Errores conocidos: su mensaje
codigo/src/middlewares.js 1
| function | errorHandler(logger, { exposeStack = false                               | } = {}) {              |
| -------- | ------------------------------------------------------------------------ | ---------------------- |
| return   | (err, req, res, next) => {          // cuatro parámetros                 |                        |
| const    | known = normalize(err);            // AppError o null                    |                        |
| const    | status = known?.status ?? 500;                                           |                        |
| const    | ctx = { requestId: req.id, status };                                     |                        |
| if       | (status >= 500) logger.error(err.message, { ...ctx, stack: err.stack }); |                        |
| else     | logger.warn(known.message, ctx);                                         | Desconocidos: mensaje  |
2
genérico
res.status(status).type('application/problem+json').json({
title: known?.title ?? 'Error interno',
status,
detail: known?.message ?? 'Ocurrió un error inesperado.',
instance: req.originalUrl,
requestId: req.id,
...(known?.details && { errores: known.details }),
...(exposeStack && !known && { stack: err.stack }), 5xx como error; 4xx como
3
});
advertencia
};
}
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 7

MANEJO CENTRALIZADO DE ERRORES
Formato estándar de error: RFC 9457
Tipo de contenido propio
1
HTTP/1.1 409 Conflict
Content-Type: application/problem+json
X-Request-Id: 3f9c2a1e-7b4d-4c1a-9e8f-2d6b5a0c1e77
{
"type": "about:blank", title: categoría; detail: este
2
"title": "Conflicto con el estado actual", caso
"status": 409,
"detail": "No quedan ejemplares de \"Pro Git\"",
"instance": "/api/prestamos",
"requestId": "3f9c2a1e-7b4d-4c1a-9e8f-2d6b5a0c1e77"
} Campos de extensión:
3
requestId, errores
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 8

MANEJO CENTRALIZADO DE ERRORES
Qué nunca debe llegar al cliente
• Trazas de pila y rutas de archivos del servidor
Desarrollo frente a producción
• Mensajes internos de librerías o de la base de datos
En desarrollo, la traza ayuda a
• Datos de otros usuarios depurar. En producción, el detalle
va al registro y el cliente recibe un
• Si una cuenta existe o no
código de solicitud para informarlo.
• Versiones de software y configuración
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 9

02
Registro de eventos
Lo que permite diagnosticar sin acceso a la máquina
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 10

REGISTRO DE EVENTOS
Niveles de registro
Nivel Cuándo Ejemplo
debug Detalle útil solo al depurar Parámetros de una consulta externa
info Eventos normales relevantes Servidor iniciado; préstamo registrado
warn Algo anómalo pero manejado 409 por regla de negocio; reintento externo
error Falla que requiere atención 500 por un defecto; servicio externo caído
En producción se registra desde info; LOG_LEVEL=debug se activa solo para investigar
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 11

REGISTRO DE EVENTOS
console.log frente a registro estructurado
TEXTO LIBRE UNA LÍNEA JSON POR EVENTO
error en prestamo TypeError: Cannot read {"level":"error","time":"2026-10-15T14:02:11Z",
properties of undefined (reading 'maxLoans') "msg":"Cannot read properties of undefined",
at /app/src/app.js:42:30 "requestId":"3f9c2a1e…","stack":"TypeError…"}
{"level":"info","time":"2026-10-15T14:02:11Z",
solicitud ok
"msg":"solicitud","requestId":"3f9c2a1e…",
prestamo creado
"method":"GET","url":"/api/defecto",
"status":500,"ms":3}
El registro estructurado se filtra y se busca por campo: nivel, requestId, ruta, estado
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 12

REGISTRO DE EVENTOS
Identificador de solicitud
codigo/src/middlewares.js
function requestContext(logger) {
return (req, res, next) => {
req.id = req.get('X-Request-Id') || randomUUID();
res.set('X-Request-Id', req.id); // viaja en la respuesta
const start = Date.now();
res.on('finish', () => logger.info('solicitud', {
requestId: req.id, method: req.method, url: req.originalUrl,
status: res.statusCode, ms: Date.now() - start,
}));
next();
};
}
1 · Reutiliza el id del proxy si existe 2 · Se devuelve al cliente 3 · Une respuesta y líneas del registro
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 13

REGISTRO DE EVENTOS
Qué registrar y qué no
Registrar No registrar
Inicio y apagado del servidor, con configuración no
Contraseñas, hashes, tokens, claves de API
sensible
Cada solicitud: método, ruta, estado, duración Cookies de sesión y cabecera Authorization
Errores con requestId y traza Cuerpos completos de solicitudes
Llamadas a servicios externos y sus tiempos Datos personales completos (DNI, domicilio)
Eventos de negocio relevantes (préstamo, devolución) Información que el usuario no consintió compartir
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 14

REGISTRO DE EVENTOS
Redacción de datos sensibles
Lista de claves sensibles
codigo/src/logger.js 1
const SENSITIVE = new Set(['password', 'passwordhash', 'token',
'authorization', 'cookie', 'secret']);
function redact(value) {
if (Array.isArray(value)) return value.map(redact);
if (value && typeof value === 'object') { Recorre a cualquier
2
return Object.fromEntries(Object.entries(value).map(([k, v]) => profundidad
[k, SENSITIVE.has(k.toLowerCase()) ? '[OCULTO]' : redact(v)]));
}
return value;
}
logger.info('intento de inicio de sesión', { body: req.body }); Defensa ante descuidos
3
// {"msg":"intento de inicio de sesión",
// "body":{"email":"a@x.test","password":"[OCULTO]"}}
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 15

03
Errores en el proceso y en el cliente
Último recurso y experiencia de usuario
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 16

ERRORES EN EL PROCESO Y EN EL CLIENTE
Último recurso: errores no capturados del proceso
codigo/src/server.js
process.on('unhandledRejection', (reason) => {
logger.error('promesa rechazada sin manejar', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
logger.error('excepción no capturada', { stack: err.stack });
process.exit(1); // estado incierto: la plataforma reinicia el proceso
});
process.on('SIGTERM', () => { // la plataforma pide detener el servicio
logger.info('apagado ordenado');
server.close(() => process.exit(0));
});
1 · Registrar antes de morir 2 · Reiniciar ante estado incierto 3 · Apagado ordenado con SIGTERM
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 17

ERRORES EN EL PROCESO Y EN EL CLIENTE
Manejo de errores en el cliente
public/js (ejemplo)
function handleApiError(err) {
switch (true) {
case err.status === 0: return showStatus('Sin conexión. Verifique su red.');
case err.status === 400: return showFieldErrors(err.fieldErrors);
case err.status === 401: return location.assign('/login.html');
case err.status === 403: return showStatus('No tiene permisos para esta acción.');
case err.status === 404: return showStatus('El recurso ya no existe.');
case err.status === 409: return showStatus(err.message); // regla de negocio
default:
return showStatus(`Ocurrió un error. Código para informar: ${err.requestId}`);
}
}
1 · Una función para toda la interfaz 2 · Cada código, una acción distinta 3 · 5xx: código de solicitud para soporte
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 18

ERRORES EN EL PROCESO Y EN EL CLIENTE
Del error a la experiencia de usuario
Situación Lo que ve la persona Acción sugerida
Dato inválido (400) Mensaje junto al campo Corregir y reenviar
Sin sesión (401) Pantalla de inicio de sesión Ingresar y volver
Devolver un préstamo vencido, elegir otro
Regla de negocio (409) Explicación de la regla
libro
Reintentar más tarde; el resto sigue
Servicio externo (502/504) Función temporalmente no disponible
funcionando
Defecto (500) Mensaje genérico y código Informar el código; el equipo corrige
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 19

ERRORES EN EL PROCESO Y EN EL CLIENTE
Actividad: auditoría de errores del proyecto
1. Provocar cuatro errores: dato inválido, inexistente, sin
sesión, externo caído DURACIÓN
18 minutos
2. Verificar código, formato y mensaje de cada respuesta
3. Centralizar el manejo en un middleware MODALIDAD
En equipos
4. Agregar identificador de solicitud y registro estructurado
5. Confirmar que en producción no se filtran trazas PRODUCTO
PR con el manejo centralizado de
errores y una tabla de errores en
el README
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 20

ERRORES EN EL PROCESO Y EN EL CLIENTE
Síntesis de la clase
1. Operacionales se manejan; defectos se corrigen
En la práctica de hoy
2. Las rutas lanzan; un middleware responde
• Centralizar el manejo de errores
3. RFC 9457: formato estándar y sin trazas
• Incorporar el registro estructurado
• Revisar los mensajes de error de la interfaz
4. Registro JSON con nivel y requestId
• Preparar la entrega parcial (lunes, semana
5)
5. Nunca registrar datos sensibles
PRÓXIMA CLASE
Clase 16 · Calidad del código:
estándares, análisis estático y
refactorización
Proyecto de Desarrollo de Aplicaciones Web · DCIC · UNS 21
