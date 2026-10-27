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
        //se tendria que hacer una consulta a la base de datos y con eso inicializar mainDeck y extraDeck
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
            mainDeck: [...this.#mainDeck],
            extraDeck: [...this.#extraDeck],
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
     * Agrega una carta al mazo correspondiente.
     * @param {number} idCarta 
     * @param {('main'|'extra')} [destino='main'] - Mazo de destino (es main por defecto)
     * @returns {boolean}
     */
    agregarCarta(idCarta, destino = 'main') {
        if (destino === 'extra') {
            this.#extraDeck.push(idCarta);
            return true;
        }

        if (destino === 'main') {
            this.#mainDeck.push(idCarta);
            return true;
        }

        return false;
    }

    /**
     * Elimina una carta del mazo ya sea mainDeck o extraDeck.
     * @param {number} idCarta 
     * @param {('main'|'extra')} [destino='main']
     * @returns {boolean}
     */
    eliminarCarta(idCarta, destino = 'main') {
        const deck = destino === 'extra' ? this.#extraDeck : this.#mainDeck;
        const indice = deck.indexOf(idCarta);
        
        if (indice !== -1) {
            deck.splice(indice, 1);
            return true;
        }
        return false;
    }
    
}
