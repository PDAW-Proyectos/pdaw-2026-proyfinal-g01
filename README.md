# YuGiKi!

> Los jugadores de Yu-Gi-Oh! quieren explorar el catálogo completo de cartas y armar sus mazos; nosotros resolvemos ese problema en una plataforma web rápida y accesible.

Proyecto del equipo **Grupo-01** para *7513 · Proyecto de Desarrollo de Aplicaciones Web*  
(Tecnicatura Universitaria en Programación Web y Móvil — DCIC — UNS).

## URL de la aplicación

- **Entorno de producción:** `url de render` 
- **Entorno local:** `http://localhost:3000`
- **Verificación de estado (Chequeo de salud):** `http://localhost:3000/api/salud`

## Ficha del proyecto

| Aspecto | Descripción |
| :--- | :--- |
| **Propósito / Problema** | Facilitar la búsqueda, filtrado y visualización detallada de cartas de Yu-Gi-Oh!, junto con la creación y consulta de mazos personalizados y de la comunidad. |
| **Usuarios** | Visitantes/jugadores del TCG de Yu-Gi-Oh! (consulta libre de cartas y mazos populares), usuarios registrados (gestión de mazos propios) y administradores (administracion de cuentas). |
| **Funcionalidades núcleo** | Catálogo y búsqueda de cartas por nombre/tipo, ranking de cartas y mazos populares, armado automático de Main/Extra Deck, autenticación por sesiones, panel de administración paginado y Sincronización y caché local de cartas e imágenes desde YGOPRODeck. |
| **Reglas de negocio** | Acceso público de lectura sin registro; validación de esquemas en cada petición; separación automática entre Main Deck y Extra Deck; límite de copias y tamaño de mazo; expiración de sesión tras 60 minutos. |
| **API externa** | [YGOPRODeck API](https://ygoprodeck.com/api-guide/), utilizada para sincronizar la información e imágenes de las cartas. |

## Variables de entorno

El archivo `.env` utiliza las siguientes variables de configuración (en `production`, `SESSION_SECRET` es obligatoria y el servidor falla al iniciar si falta):

| Variable | Descripción | Valor por defecto (`development`) |
| :--- | :--- | :--- |
| `PORT` | Puerto HTTP en el que escucha el servidor Express (`1` a `65535`). | `3000` |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`). En producción activa cookies seguras (`secure: true`) y deshabilita `/test`. | `development` |
| `SESSION_SECRET` | Clave secreta para firmar la cookie de sesión `wiki.sid`. Obligatoria en producción. | `solo-para-desarrollo` |
| `LOG_LEVEL` | Nivel de detalle de los registros estructurados (`debug`, `info`, `warn`, `error`). | `debug` (`info` en producción) |

## Equipo y roles

| Integrante | Usuario de GitHub | Rol |
| :--- | :--- | :--- |
| Franco | [@fran7k](https://github.com/fran7k) | Referente de producto |
| Joaquín | [@joacopompi](https://github.com/joacopompi) | Facilitación |
| Facundo | [@FacundoVarela-N](https://github.com/FacundoVarela-N) | Repositorio y Calidad |

## Ejecución local

1. Clonar el repositorio e instalar dependencias:
   ```bash
   git clone <url-del-repositorio>
   cd <carpeta-del-proyecto>
   npm install

## Cómo ejecutar el proyecto

```bash
cp .env.example .env
npm run dev
```

## Cómo ejecutar las pruebas

```bash
npm test
```

## Documentación
- Guía de uso (usuarios finales): [`docs/guia-de-usuario.md`](docs/guia-de-usuario.md)
- Endpoints de la API: [`docs/endpoints.md`](docs/endpoints.md)
- Diagramas y Arquitectura: [`docs/diagramas.md`](docs/diagramas.md)
- Decisiones de arquitectura (ADR):[`docs/adr.md`](docs/adr.md)
- Lecciones aprendidas: [`docs/lecciones-aprendidas.md`](docs/lecciones-aprendidas.md)
- Wireframes: [`docs/wireframes.pdf`](docs/wireframes.pdf)
- Acuerdos de trabajo y convenciones: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Riesgos: [`docs/riesgos.md`](docs/riesgos.md)
- Documentacion de la API (ygoprodeck.com): [`docs/YGOPRODeckAPIGuide.pdf`](docs/YGOPRODeckAPIGuide.pdf)


## Uso de herramientas de IA

Registrar aquí qué herramientas se usaron, para qué tareas y qué se adoptó de sus propuestas.

| Fecha | Herramienta | Tarea | Qué se adoptó y por qué |
| ----- | ----------- | ----- | ----------------------- |
| Semana1 | Antigravity | Creación de historias de usuario extras | Las ultimas 2 historias de usuarios son creadas por la ia,tenes mas pero no sabemos si las vamos a implementar |
| Semana2 | Figma IA | Crear los wireFrame | Se maqueto los wire me registro, login y vista admin, para acelerar el maquetado |
| semana3 | Antigravity | Creación de los test unitarios de las clases RepositorioMazo y Mazo | Se pidió a la ia que cree los test para probar la lógica de las clases teniendo encuenta la implementación actual y la documentación |
| semana5 | Antigravity | Expandir la documentacion de los endpoints de la API | Se pidió a la ia que usuando nuestra implementacion de los endpoints cree la documentacion de la API |

