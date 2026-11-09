const PATRON_ENTERO_POSITIVO = "^[1-9]\\d*$"

export const esquemasImagenes = {
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

  queryTipo: {
    type: "object",
    additionalProperties: false,
    properties: {
      tipo: {
        type: "string",
        enum: ["full", "small"]
      }
    }
  }
}
