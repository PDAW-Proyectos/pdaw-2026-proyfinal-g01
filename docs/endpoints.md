# Endpoints de la API

## Resumen de Endpoints

| Operación | Método | Endpoint | Entrada | Éxito | Tipo de Respuesta | Errores | Requisitos / Notas |
| --------- | :----: | -------- | ------- | :---: | :---------------: | :-----: | ------------------ |
| **Registrar usuario** | POST | `/api/usuarios/registro` | Body JSON: `nombre`, `username`, `contraseña` (mín. 6 caracteres) | 201 | `application/json` | 400, 409 | Contraseña encriptada con `bcrypt`. Asigna rol `"usuario"` por defecto |
| **Iniciar sesión** | POST | `/api/usuarios/login` | Body JSON: `username`, `contraseña` | 200 | `application/json` + Cookie `wiki.sid` | 400, 401 | Regenera la sesión y establece la cookie `httpOnly` `wiki.sid` |
| **Cerrar sesión** | POST | `/api/usuarios/logout` | Ninguna (Cookie `wiki.sid`) | 200 | Sin cuerpo | 401 | Requiere autenticación (`requiereAutenticacion`). Destruye la sesión y limpia la cookie |
| **Eliminar usuario (Admin)** | DELETE | `/api/usuarios/:username` | `params`: `username` | 200 | `application/json` | 400, 401, 403, 404, 409 | Requiere rol admin (`requiereRol("admin")`). Elimina al usuario y sus mazos (no permite autoeliminarse) |
| **Listar / Filtrar cartas** | GET | `/api/cartas` | `query` (opcionales): `name`, `frameType`, `race`, `attribute`, `atk`, `def`, `level`, `scale`, `linkval`, `page` | 200 | `application/json` | 400, 404 | Filtra en la base local de cartas y pagina de a 20 resultados |
| **Obtener carta por ID** | GET | `/api/cartas/:id` | `params`: `id` (entero positivo) | 200 | `application/json` | 400, 404 | Devuelve el DTO de la carta con los atributos según su tipo (`Carta`, `CartaMonstruo`, `CartaPendulo`, `CartaLink`) |
| **Obtener imagen de carta** | GET | `/api/imagenes/:id` | `params`: `id` (entero positivo)<br>`query` (opcional): `tipo` (`"full"` \| `"small"`) | 200 | `image/jpeg` (Archivo binario) | 400, 404, 502 | Sirve la imagen desde disco o la descarga de la API externa con control de rate-limit |
| **Listar mazos** | GET | `/api/mazos` | `query` (opcionales): `all` (`"true"` \| `"false"`), `page` (entero positivo) | 200 | `application/json` | 400, 404 | Si hay sesión activa y `all` ≠ `"true"`, lista los mazos del usuario; si no, lista todos (10 por página) |
| **Obtener mazo por ID** | GET | `/api/mazos/:id` | `params`: `id` (entero positivo) | 200 | `application/json` | 400, 404 | Retorna el mazo con sus cartas completas (DTO), validez (`mainDeck >= 40`) y `precioTotal` |
| **Crear mazo** | POST | `/api/mazos` | Body JSON: `nombre`, `mainDeck` (opcional, máx. 60 IDs), `extraDeck` (opcional, máx. 15 IDs) | 201 | `application/json` | 400, 401 | Requiere autenticación (`requiereAutenticacion`). Máximo 10 mazos por usuario |
| **Modificar mazo** | PATCH | `/api/mazos/:id` | `params`: `id`<br>Body JSON (mín. 1 campo): `nombre`, `mainDeck`, `extraDeck` | 200 | `application/json` | 400, 401, 403, 404 | Requiere autenticación (`requiereAutenticacion`) y ser el propietario del mazo |
| **Eliminar mazo** | DELETE | `/api/mazos/:id` | `params`: `id` | 204 | Sin cuerpo | 400, 401, 403, 404 | Requiere autenticación (`requiereAutenticacion`) y ser el propietario del mazo |
| **Agregar carta a un mazo** | POST | `/api/mazos/:id/cartas` | `params`: `id`<br>Body JSON: `idCarta` (entero positivo) | 200 | `application/json` | 400, 401, 403, 404 | Requiere autenticación (`requiereAutenticacion`) y ser dueño. Valida límites del mazo y banlist TCG |
| **Eliminar carta de un mazo** | DELETE | `/api/mazos/:id/cartas/:idCarta` | `params`: `id`, `idCarta` (enteros positivos) | 200 | `application/json` | 400, 401, 403, 404 | Requiere autenticación (`requiereAutenticacion`) y ser dueño. Quita una copia de `mainDeck` o `extraDeck` |

---

## Formato de las Respuestas (Cómo llega el JSON al cliente)

Todas las respuestas incluyen la cabecera `X-Request-Id` con el identificador único de la solicitud.

### 1. Usuarios (`/api/usuarios`)

#### `POST /api/usuarios/registro` (201) y `POST /api/usuarios/login` (200)
- **Content-Type:** `application/json`
- **Cuerpo (DTO de Usuario, sin contraseña):**
```json
{
  "nombre": "Yugi Muto",
  "username": "yugi",
  "rol": "usuario"
}
```

#### `POST /api/usuarios/logout` (200)
- **Cuerpo:** Vacío (limpia la cookie `wiki.sid`).

#### `DELETE /api/usuarios/:username` (200)
- **Content-Type:** `application/json`
- **Cuerpo:**
```json
{
  "mensaje": "Usuario eliminado con éxito"
}
```

---

### 2. Cartas (`/api/cartas`)

#### `GET /api/cartas/:id` (200)
- **Content-Type:** `application/json`
- **Cuerpo (DTO de Carta):** El objeto varía según la subclase de carta (`Carta`, `CartaMonstruo`, `CartaPendulo`, `CartaLink`). El método `toDTO()` expone `card_price` con el mayor precio numérico entre `ebay_price` y `amazon_price`, `misc_info` como un objeto con `{ viewsweek, tcg_date, ocg_date, konami_id, md_rarity }`, y omite `frameType`, `card_prices` y `card_images` (las imágenes se consultan mediante `/api/imagenes/:id`).

**Ejemplo de Carta Magia/Trampa (`Carta`):**
```json
{
  "id": 5318639,
  "name": "Mystical Space Typhoon",
  "type": "Spell Card",
  "race": "Quick-Play",
  "desc": "Target 1 Spell/Trap on the field; destroy that target.",
  "card_price": 1.2,
  "misc_info": {
    "viewsweek": 8450,
    "tcg_date": "2002-09-01",
    "ocg_date": "2000-09-28",
    "konami_id": 4909,
    "md_rarity": "R"
  },
  "banlist_info": {
    "ban_tcg": "Limited"
  }
}
```
*(Nota: `banlist_info` solo se incluye si la carta posee restricciones en la banlist).*

**Campos adicionales según el tipo de monstruo:**
- **`CartaMonstruo`**: agrega `"atk"` (`number | null`), `"def"` (`number | null`), `"level"` (`number | null`), `"attribute"` (`string | null`).
- **`CartaPendulo`**: incluye los campos de `CartaMonstruo` y agrega `"scale"` (`number`).
- **`CartaLink`**: incluye los campos de `CartaMonstruo` (con `def` y `level` en `null`) y agrega `"linkval"` (`number`) y `"linkmarkers"` (`Array<string>`).

#### `GET /api/cartas` (200)
- **Content-Type:** `application/json`
- **Cuerpo (Resultados paginados con DTO de Carta):**
```json
{
  "datos": [
    {
      "id": 46986414,
      "name": "Dark Magician",
      "type": "Normal Monster",
      "race": "Spellcaster",
      "desc": "The ultimate wizard in terms of attack and defense.",
      "card_price": 8.48,
      "misc_info": {
        "viewsweek": 12500,
        "tcg_date": "2002-03-08",
        "ocg_date": "1999-02-04",
        "konami_id": 4007,
        "md_rarity": "UR"
      },
      "atk": 2500,
      "def": 2100,
      "level": 7,
      "attribute": "DARK"
    }
  ],
  "paginacion": {
    "paginaActual": 1,
    "totalPaginas": 5,
    "totalCartas": 92,
    "tieneAnterior": false,
    "tieneSiguiente": true
  }
}
```

---

### 3. Imágenes (`/api/imagenes`)

#### `GET /api/imagenes/:id` (200)
- **Content-Type:** `image/jpeg`
- **Cuerpo:** Archivo binario de la imagen de la carta (enviado mediante `res.sendFile`).

---

### 4. Mazos (`/api/mazos`)

#### `GET /api/mazos/:id` (200)
- **Content-Type:** `application/json`
- **Cuerpo (Mazo con cartas expandidas mediante `toDTO()`, validación y precio total):**
```json
{
  "id": 1,
  "username": "yugi",
  "nombre": "Mazo Mago Oscuro",
  "mainDeck": [
    {
      "id": 46986414,
      "name": "Dark Magician",
      "type": "Normal Monster",
      "race": "Spellcaster",
      "desc": "The ultimate wizard in terms of attack and defense.",
      "card_price": 8.48,
      "misc_info": {
        "viewsweek": 12500,
        "tcg_date": "2002-03-08",
        "ocg_date": "1999-02-04",
        "konami_id": 4007,
        "md_rarity": "UR"
      },
      "atk": 2500,
      "def": 2100,
      "level": 7,
      "attribute": "DARK"
    }
  ],
  "extraDeck": [],
  "valido": false,
  "precioTotal": 8.48
}
```

#### `GET /api/mazos` (200)
- **Content-Type:** `application/json`
- **Cuerpo (Lista paginada de mazos detallados):**
```json
{
  "datos": [
    {
      "id": 1,
      "username": "yugi",
      "nombre": "Mazo Mago Oscuro",
      "mainDeck": [],
      "extraDeck": [],
      "valido": false,
      "precioTotal": 0
    }
  ],
  "paginacion": {
    "paginaActual": 1,
    "totalPaginas": 1,
    "totalMazos": 1,
    "tieneAnterior": false,
    "tieneSiguiente": false
  }
}
```

#### `POST /api/mazos` (201), `PATCH /api/mazos/:id` (200), `POST /api/mazos/:id/cartas` (200) y `DELETE /api/mazos/:id/cartas/:idCarta` (200)
- **Content-Type:** `application/json`
- **Cuerpo (Entidad `Mazo` con arreglos de IDs numéricos de cartas):**
```json
{
  "id": 1,
  "username": "yugi",
  "nombre": "Mazo Mago Oscuro",
  "mainDeck": [46986414],
  "extraDeck": []
}
```

#### `DELETE /api/mazos/:id` (204)
- **Cuerpo:** Vacío (`204 No Content`).

---

### 5. Formato Estándar de Errores (400, 401, 403, 404, 409, 500, 502)

Cualquier error operacional o inesperado es procesado por `errorHandler` y devuelto siguiendo el estándar **Problem Details (RFC 9457)**:

- **Content-Type:** `application/problem+json`
- **Cuerpo:**
```json
{
  "type": "about:blank",
  "title": "Datos invalidos",
  "status": 400,
  "detail": "Falta el parametro obligatorio \"nombre\".",
  "instance": "/api/mazos",
  "requestId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "errores": [
    {
      "campo": "nombre",
      "mensaje": "Falta el parametro obligatorio \"nombre\"."
    }
  ],
  "error": "ValidationError",
  "mensaje": "Falta el parametro obligatorio \"nombre\"."
}
```
*(Nota: El arreglo `"errores"` se incluye únicamente cuando el fallo proviene de errores de validación de esquema en `ValidationError`).*
