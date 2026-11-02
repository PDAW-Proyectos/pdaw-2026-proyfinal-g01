# Lista de control para revisar un pull request

Copiar en el comentario de revisión y marcar lo verificado.

## Corrección
- [ ] Cumple los criterios de aceptación del issue vinculado.
- [ ] Contempla casos borde (vacíos, nulos, límites, errores del servicio externo).
- [ ] Probé la rama localmente (`npm ci && npm test`) y la funcionalidad en el navegador.

## Diseño
- [ ] Cada cambio está en la capa correcta (rutas, controladores, servicios, modelos).
- [ ] Los servicios no conocen `req`/`res`; los controladores no tienen reglas de negocio.
- [ ] No hay duplicación evitable ni condicionales por tipo que convenga reemplazar.

## Pruebas
- [ ] Hay pruebas para las reglas nuevas o modificadas.
- [ ] Las pruebas verifican comportamiento, no detalles de implementación.

## Seguridad
- [ ] No hay secretos, claves ni `.env` en el cambio.
- [ ] La identidad del usuario se toma de la sesión, no del cuerpo de la solicitud.
- [ ] Los datos se insertan en el DOM con `textContent`, no con `innerHTML`.

## Legibilidad y documentación
- [ ] Nombres claros; sin números mágicos.
- [ ] El README o la tabla de la API se actualizaron si corresponde.

## Etiquetas para comentarios
`pregunta` · `sugerencia` · `bloqueante` · `elogio` · `detalle`
