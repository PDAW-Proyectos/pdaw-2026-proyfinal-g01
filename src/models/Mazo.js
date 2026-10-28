/**
 * Representa la entidad Mazo
 */
export class Mazo {
    /** @type {number|string} */
    #id;
    #username;
    #nombre;
    #mainDeck;
    #extraDeck;

    /**
     * @param {Object} datos //es el objeto que se recibe para crear el mazo
     * @param {number|string} datos.id
     * @param {string|number} datos.username
     * @param {string} datos.nombre
     * @param {Array<number>} [datos.mainDeck=[]]
     * @param {Array<number>} [datos.extraDeck=[]]
     */
    constructor({ id, username, nombre, mainDeck = [], extraDeck = [] }) {
        this.#id = id;
        this.#username = username;
        this.#nombre = nombre;
        this.#mainDeck = [...mainDeck];
        this.#extraDeck = [...extraDeck];
    }

    /**
     * @returns {number|string}
     */
    get id() { return this.#id; }

    /**
     * @returns {string|number}
     */
    get username() { return this.#username; }

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
     * Serializa el objeto Mazo a un objeto JSON.
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.#id,
            username: this.#username,
            nombre: this.#nombre,
            mainDeck: [...this.#mainDeck],
            extraDeck: [...this.#extraDeck]
        };
    }

    /**
     * Crea una instancia de Mazo a partir de un objeto deserializado.
     * @param {Object} data
     * @returns {Mazo}
     */
    static fromJSON(data) {
        return new Mazo({
            id: data.id,
            username: data.username,
            nombre: data.nombre,
            mainDeck: data.mainDeck,
            extraDeck: data.extraDeck
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
