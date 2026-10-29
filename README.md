# Wiki Yu-gi-oh!

> Los jugadores de yugi quieren conocer sus cartas, nosotros resolvemos ese problema.

Proyecto del equipo **[Grupo-01]** para *7513 · Proyecto de Desarrollo de Aplicaciones Web*
(Tecnicatura Universitaria en Programación Web y Móvil — DCIC — UNS).

## Ficha del proyecto

| Aspecto                     | Descripción                                   |
| --------------------------- | --------------------------------------------- |
| Problema                    | Ver todas las cartas de Yu-gi-oh              |
| Usuarios                    | Juegadores del TCG de Yu-gi-oh                |
| Funcionalidades núcleo      | Buscar cartas, armar mazos y ver precios      |
| Reglas de negocio           | Limite de cartas en el mazo, precios actualizados y facil visualizacion de cartas |
| API externa                 | Yu-Gi-Oh! API, url(https://ygoprodeck.com/api-guide/), la vamos a usar para conseguir la informacion de las cartas|

## Equipo y roles del sprint actual

| Integrante | Usuario de GitHub | Rol en el sprint      |
| ---------- | ----------------- | --------------------- |
| Franco     | fran7k            | Referente de producto |
| Joaquin    | joacopompi        | Facilitación          |
| Facundo    | FacundoVarela-N   | Repositorio           |
| Facundo    | FacundoVarela-N   | Calidad               |

## Endpoints de la API
| Operación | Método | Endpoint | Entrada | Éxito | Errores | Requisitos / Notas |
| --------- | :----: | -------- | ------- | :---: | :-----: | ------------------ |
| **Registrar usuario** | POST | `/api/register` | JSON: username, email, contraseña | 201 | 400 | Contraseña encriptada en el servidor |
| **Iniciar sesión** | POST | `/api/login` | JSON: username/email, contraseña | 200 | 400, 401 | Retorna token de sesión / autenticación |
| **Cerrar sesión** | POST | `/api/logout` | Ninguna | 200 | 401 | Requiere autenticación (`requiereAuth`) |
| **Buscar cartas por nombre** | GET | `/api/cartas/:name` | params: name | 200 | 404 | Consulta filtrada por nombre |
| **Listar/Filtrar cartas** | GET | `/api/cartas` | query: filtros (tipo, atributo, etc.) | 200 | 400 | Busca en nuestra base de cartas |
| **Obtener mazos de un usuario** | GET | `/api/mazos/userId` | params: userId | 200 | 401, 404 | Requiere autenticación (`requiereAuth`) |
| **Crear mazo** | POST | `/api/mazos` | JSON: nombre, cartas (ids y cantidades) | 201 | 400, 401 | Requiere autenticación (`requiereAuth`) |
| **Modificar mazo** | PATCH | `/api/mazos/:id` | params: id<br>JSON: campos a actualizar | 200 | 400, 401, 403, 404 | Requiere autenticación (`requiereAuth`) |
| **Eliminar mazo propio** | DELETE | `/api/mazos/:id` | params: id | 204 sin cuerpo | 401, 404 | Requiere autenticación (`requiereAuth`) |
| **Eliminar usuario (Admin)** | DELETE | `/api/admin/userID` | params: userID | 204 sin cuerpo | 401, 403, 404 | Requiere rol de admin (`requiereRole`) |

## Cómo ejecutar el proyecto

```bash
npm install
cp .env.example .env
npm run dev
```

## Cómo ejecutar las pruebas

```bash
npm test
```

## Documentación

- Diagramas: [`docs/diagramas.md`](docs/diagramas.md)
- Wireframes: [`docs/wireframes.pdf`](docs/wireframes.pdf)
- Acuerdos de trabajo y convenciones: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Riesgos: [`docs/riesgos.md`](docs/riesgos.md)

## Uso de herramientas de IA

Registrar aquí qué herramientas se usaron, para qué tareas y qué se adoptó de sus propuestas.

| Fecha | Herramienta | Tarea | Qué se adoptó y por qué |
| ----- | ----------- | ----- | ----------------------- |
| Semana1 | Antigravity | Creación de historias de usuario extras | Las ultimas 2 historias de usuarios son creadas por la ia,tenes mas pero no sabemos si las vamos a implementar |
| 19/10/26 | Figma IA | Crear los wireFrame | Se maqueto los wire me registro, login y vista admin, para acelerar el maquetado |
| semana3 | Antigravity | Creación de los test unitarios de las clases RepositorioMazo y Mazo | Se pidió a la ia que cree los test para probar la lógica de las clases teniendo encuenta la implementación actual y la documentación |
