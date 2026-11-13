// Patron que exige al menos un caracter que no sea espacio en blanco
const PATRON_NO_VACIO = "\\S"

export const esquemasUsuarios = {
  registro: {
    type: "object",
    required: ["nombre", "username", "contraseña"],
    additionalProperties: false,
    properties: {
      nombre: {
        type: "string",
        minLength: 1,
        maxLength: 50,
        pattern: PATRON_NO_VACIO
      },
      username: {
        type: "string",
        minLength: 1,
        maxLength: 30,
        pattern: PATRON_NO_VACIO
      },
      contraseña: {
        type: "string",
        minLength: 6,
        maxLength: 30,
        pattern: PATRON_NO_VACIO
      }
    }
  },

  login: {
    type: "object",
    required: ["username", "contraseña"],
    additionalProperties: false,
    properties: {
      username: {
        type: "string",
        minLength: 1,
        maxLength: 30,
        pattern: PATRON_NO_VACIO
      },
      contraseña: {
        type: "string",
        minLength: 6,
        maxLength: 30,
        pattern: PATRON_NO_VACIO
      }
    }
  },

  parametroUsername: {
    type: "object",
    required: ["username"],
    additionalProperties: false,
    properties: {
      username: {
        type: "string",
        minLength: 1,
        maxLength: 30,
        pattern: PATRON_NO_VACIO
      }
    }
  }
}
