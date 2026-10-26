/**
 * Representa la entidad Mazo
 */
export class Mazo {
    /** @type {number|string} */
    #id;
    #userId;
    #nombre;
    #mainDeck;
    #extraDeck;
    #precioTotal;

    /**
     * @param {Object} datos //es el objeto que se recibe para crear el mazo
     * @param {number|string} datos.id
     * @param {string|number} datos.userId
     * @param {string} datos.nombre
     */
    constructor({ id, userId, nombre }) {
        this.#id = id;
        this.#userId = userId;
        this.#nombre = nombre;
        this.#mainDeck = [];
        this.#extraDeck = [];
        this.#precioTotal = 0;
    }

    /**
     * @returns {number|string}
     */
    get id() { return this.#id; }

    /**
     * @returns {string|number}
     */
    get userId() { return this.#userId; }

    /**
     * @returns {string}
     */
    get nombre() { return this.#nombre; }

    /**
     * @returns {Array<number>}
     */
    get mainDeck() { return this.#mainDeck; }

    /**
     * @returns {Array<number>}
     */
    get extraDeck() { return this.#extraDeck; }

    /**
     * @returns {number}
     */
    get precioTotal() { return this.#precioTotal; }

    /**
     * Serializa el objeto Mazo a un objeto JSON.
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.#id,
            userId: this.#userId,
            nombre: this.#nombre,
            mainDeck: this.#mainDeck,
            extraDeck: this.#extraDeck,
            precioTotal: this.#precioTotal
        };
    }

    /**
     * Crea una instancia de Mazo a partir de un string JSON.
     * @param {Object} data
     * @returns {Mazo}
     */
    static fromJSON(data) { 
        const nuevoMazo = new Mazo({
            id: data.id,
            userId: data.userId,
            nombre: data.nombre
        });
        nuevoMazo.#mainDeck = data.mainDeck || [];
        nuevoMazo.#extraDeck = data.extraDeck || [];
        nuevoMazo.#precioTotal = data.precioTotal || 0;

        return nuevoMazo;
    }

    /**
     * Agrega el ID de una carta al mazo.
     * @param {number} idCarta
     * @returns {boolean}
     */
    agregarCarta(idCarta) {
        this.#mainDeck.push(idCarta);
        return true;
    }

    /**
     * Elimina una copia del ID de la carta especificada.
     * @param {number} idCarta
     * @returns {boolean}
     */
    eliminarCarta(idCarta) {
        const indice = this.#mainDeck.indexOf(idCarta);
        if (indice !== -1) {
            this.#mainDeck.splice(indice, 1);
            return true;
        }
        return false;
    }
    
}
