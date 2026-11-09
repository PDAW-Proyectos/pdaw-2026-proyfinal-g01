const PATRON_NO_VACIO = "\\S"
const PATRON_ENTERO_POSITIVO = "^[1-9]\\d*$"

function esquemaListaIdsCartas(maxCartas) {
  return {
    type: "array",
    maxItems: maxCartas,
    items: {
      type: "integer",
      minimum: 1
    }
  }
}

export const esquemasMazos = {
  queryListar: {
    type: "object",
    additionalProperties: false,
    properties: {
      all: {
        type: "string",
        enum: ["true", "false"]
      },
      page: {
        type: "string",
        pattern: PATRON_ENTERO_POSITIVO
      }
    }
  },

  parametroId: {
    type: "object",
    required: ["id"],
    additionalProperties: false,
    properties: {
      id: {
        type: "string",
        pattern: PATRON_ENTERO_POSITIVO
      }
    }
  },

  parametrosMazoYCarta: {
    type: "object",
    required: ["id", "idCarta"],
    additionalProperties: false,
    properties: {
      id: {
        type: "string",
        pattern: PATRON_ENTERO_POSITIVO
      },
      idCarta: {
        type: "string",
        pattern: PATRON_ENTERO_POSITIVO
      }
    }
  },

  crear: {
    type: "object",
    required: ["nombre"],
    additionalProperties: false,
    properties: {
      nombre: {
        type: "string",
        pattern: PATRON_NO_VACIO
      },
      mainDeck: esquemaListaIdsCartas(60),
      extraDeck: esquemaListaIdsCartas(15)
    }
  },

  actualizar: {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      nombre: {
        type: "string",
        pattern: PATRON_NO_VACIO
      },
      mainDeck: esquemaListaIdsCartas(60),
      extraDeck: esquemaListaIdsCartas(15)
    }
  },

  agregarCarta: {
    type: "object",
    required: ["idCarta"],
    additionalProperties: false,
    properties: {
      idCarta: {
        type: "integer",
        minimum: 1
      }
    }
  }
}
