# YuGiKi!

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

- Endpoints de la API: [`docs/endpoints.md`](docs/endpoints.md)
- Diagramas: [`docs/diagramas.md`](docs/diagramas.md)
- Wireframes: [`docs/wireframes.pdf`](docs/wireframes.pdf)
- Acuerdos de trabajo y convenciones: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Riesgos: [`docs/riesgos.md`](docs/riesgos.md)
- Documentacion de la API (ygoprodeck.com): [`docs/YGOPRODeckAPIGuide.pdf`](docs/YGOPRODeckAPIGuide.pdf)

## Uso de herramientas de IA

Registrar aquí qué herramientas se usaron, para qué tareas y qué se adoptó de sus propuestas.

| Fecha | Herramienta | Tarea | Qué se adoptó y por qué |
| ----- | ----------- | ----- | ----------------------- |
| Semana1 | Antigravity | Creación de historias de usuario extras | Las ultimas 2 historias de usuarios son creadas por la ia,tenes mas pero no sabemos si las vamos a implementar |
| 19/10/26 | Figma IA | Crear los wireFrame | Se maqueto los wire me registro, login y vista admin, para acelerar el maquetado |
| semana3 | Antigravity | Creación de los test unitarios de las clases RepositorioMazo y Mazo | Se pidió a la ia que cree los test para probar la lógica de las clases teniendo encuenta la implementación actual y la documentación |
| semana5 | Antigravity | Expandir la documentacion de los endpoints de la API | Se pidió a la ia que usuando nuestra implementacion de los endpoints cree la documentacion de la API |
