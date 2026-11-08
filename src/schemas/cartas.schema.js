const PATRON_ENTERO_POSITIVO = "^[1-9]\\d*$"
// Permite cadena vacia (ignorada por filtroCartas) o un numero valido en el query string
const PATRON_NUMERO_FILTRO = "^(-?\\d+(\\.\\d+)?)?$"

export const esquemasCartas = {
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

  queryFiltrar: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string" },
      frameType: { type: "string" },
      race: { type: "string" },
      attribute: { type: "string" },
      atk: { type: "string", pattern: PATRON_NUMERO_FILTRO },
      def: { type: "string", pattern: PATRON_NUMERO_FILTRO },
      level: { type: "string", pattern: PATRON_NUMERO_FILTRO },
      scale: { type: "string", pattern: PATRON_NUMERO_FILTRO },
      linkval: { type: "string", pattern: PATRON_NUMERO_FILTRO }
    }
  }
}
