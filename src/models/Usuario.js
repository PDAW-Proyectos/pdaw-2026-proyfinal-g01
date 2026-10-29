import bcrypt from "bcryptjs"
import { ValidationError, ConflictError, NotFoundError } from "../errors.js"

export class Usuario {
    /** @type {string} */
    #nombre
    /** @type {string} */
    #username
    /** @type {string} */
    #contraseña
    /** @type {Array<number>} */
    #mazos

    constructor({ nombre, username, contraseña, mazos = [] }) {
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            throw new ValidationError('El nombre es obligatorio y debe ser texto.')
        }
        if (typeof username !== 'string' || username.trim() === '') {
            throw new ValidationError('El username es obligatorio.')
        }
        if (typeof contraseña !== 'string' || contraseña.trim() === '') {
            throw new ValidationError('La contraseña es obligatoria.')
        }
        if (!Array.isArray(mazos)) {
            throw new ValidationError('Los mazos deben ser una lista.')
        }

        this.#nombre = nombre.trim()
        this.#username = username.trim()
        this.#contraseña = contraseña
        this.#mazos = [...mazos]
    }

    // Getters
    /** Nombre del usuario. */
    get nombre() {
        return this.#nombre
    }

    /** Username del usuario. */
    get username() {
        return this.#username
    }

    /** Mazos del usuario. */
    get mazos() {
        return [...this.#mazos]
    }

    // Methods
    static fromJSON(data) {
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            throw new ValidationError('fromJSON espera un objeto plano válido.')
        }
        return new Usuario(data)
    }

    /**
     * Serializa la entidad a un objeto plano (incluyendo el hash de la contraseña).
     */
    toJSON() {
        return {
            nombre: this.#nombre,
            username: this.#username,
            contraseña: this.#contraseña,
            mazos: [...this.#mazos]
        }
    }

    /** Obtiene el identificador de un mazo específico.
     * @param {number} idMazo
     * @returns {number | undefined}
     */
    obtenerMazo(idMazo) {
        return this.#mazos.find((id) => id === idMazo)
    }

    /** Agrega el identificador de un Mazo a la lista del usuario.
     * @param {number} idMazo
     */
    agregarMazo(idMazo) {
        if (typeof idMazo !== 'number' || isNaN(idMazo)) {
            throw new ValidationError('El ID del mazo debe ser un número válido.')
        }
        if (this.#mazos.includes(idMazo)) {
            throw new ConflictError(`El usuario ya tiene asignado el mazo con ID ${idMazo}.`)
        }
        this.#mazos.push(idMazo)
    }

    /**
     * Encapsula la comparación de contraseñas dentro de la propia clase.
     * @param {string} contraseñaPlana
     * @returns {Promise<boolean>}
     */
    async verificarContraseña(contraseñaPlana) {
        return await bcrypt.compare(contraseñaPlana, this.#contraseña)
    }

    /** Elimina un mazo de la lista del usuario según su ID.
     * @param {number} idMazo
     */
    eliminarMazo(idMazo) {
        if (!this.#mazos.includes(idMazo)) {
            throw new NotFoundError(`El mazo con ID ${idMazo} no pertenece a este usuario.`)
        }
        this.#mazos = this.#mazos.filter((id) => id !== idMazo)
    }
}