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
     * @param {Array<number>} [datos.mainDeck=[]] 
     * @param {Array<number>} [datos.extraDeck=[]] 
     * @param {number} [datos.precioTotal=0]
     */
    constructor({ id, userId, nombre, mainDeck = [], extraDeck = [], precioTotal = 0 }) {
        this.#id = id;
        this.#userId = userId;
        this.#nombre = nombre;
        this.#mainDeck = [...mainDeck];
        this.#extraDeck = [...extraDeck];
        this.#precioTotal = precioTotal;
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
    get mainDeck() { return [...this.#mainDeck] }

    /**
     * @returns {Array<number>}
     */
    get extraDeck() { return [...this.#extraDeck] }

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
     * Crea una instancia de Mazo a partir de un objeto deserializado.
     * @param {Object} data
     * @returns {Mazo}
     */
<<<<<<< HEAD
    static fromJSON(data) {
        const nuevoMazo = new Mazo({
=======
    static fromJSON(data) { 
        return new Mazo({
>>>>>>> c93d48c32c97c41c8f47627cc273a8d7a7cf7b06
            id: data.id,
            userId: data.userId,
            nombre: data.nombre,
            mainDeck: data.mainDeck,
            extraDeck: data.extraDeck,
            precioTotal: data.precioTotal
        });
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
     * Elimina una carta del mazo. Busca primero en mainDeck y si no esta, en extraDeck.
     * @param {number} idCarta 
     * @returns {boolean} True si la carta fue encontrada y eliminada, false si no
     */
    eliminarCarta(idCarta) {
        let indice = this.#mainDeck.indexOf(idCarta);
        if (indice !== -1) {
            this.#mainDeck.splice(indice, 1);
            return true;
        }

        indice = this.#extraDeck.indexOf(idCarta);
        if (indice !== -1) {
            this.#extraDeck.splice(indice, 1);
            return true;
        }
        return false;
    }

}
