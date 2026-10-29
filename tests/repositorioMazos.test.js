import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioMazos } from "../src/repositories/RepositorioMazos.js"
import { Mazo } from "../src/models/Mazo.js"
import { NotFoundError, ValidationError } from "../src/errors.js"

// ---------------------------------------------------------------------------
// Configuración de la base de datos provisoria
// ---------------------------------------------------------------------------

// Carpeta dataTest ubicada en la raíz del proyecto
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const carpetaDataTest = path.resolve(__dirname, "..", "dataTest")

// Archivo .json que actúa como base de datos solo durante la prueba
const rutaDb = path.join(carpetaDataTest, "mazosTest.json")

// Cantidad de mazos usada en los tests que necesitan varios mazos
const cantidadMazos = 10

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Escribe directamente en el .json de prueba para preparar el estado inicial. */
const sembrarDb = (datos) => writeFile(rutaDb, JSON.stringify(datos), "utf8")

/** Lee y parsea el contenido actual del .json de prueba. */
const leerDb = async () => JSON.parse(await readFile(rutaDb, "utf8"))

/** Indica si un archivo existe en el disco. */
const existe = async (ruta) => {
  try {
    await access(ruta)
    return true
  } catch {
    return false
  }
}

/** Crea un objeto plano con los datos de un mazo para pruebas (incluyendo id, para sembrarDb o comparar). */
const crearDatosMazo = (id, extras = {}) => ({
  id,
  nombre: `Mazo ${id}`,
  mainDeck: [100, 101],
  extraDeck: [200],
  ...extras,
})

/** Crea un objeto plano con los datos de entrada para agregar() (sin id). */
const crearInputMazo = (nombre = "Mazo Nuevo", extras = {}) => ({
  nombre,
  mainDeck: [100, 101],
  extraDeck: [200],
  ...extras,
})

/**
 * Genera un objeto { [id]: datosMazo } con mazos consecutivos: ids [1, 2, ..., cantidad].
 * Representa el formato en que RepositorioMazos guarda el archivo .json.
 */
const generarMapaDatosMazos = (cantidad) =>
  Object.fromEntries(
    Array.from({ length: cantidad }, (_, i) => {
      const id = i + 1
      return [id, crearDatosMazo(id)]
    })
  )

// ---------------------------------------------------------------------------
// Ciclo de vida de los tests
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Se asegura de que la carpeta dataTest exista
  await mkdir(carpetaDataTest, { recursive: true })
})

beforeEach(async () => {
  // Cada test arranca sin archivo para que no dependa de los anteriores
  await rm(rutaDb, { force: true })
})

afterAll(async () => {
  // Se elimina la base de datos provisoria al terminar todos los tests
  await rm(rutaDb, { force: true })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RepositorioMazos", () => {
  describe("constructor y getters", () => {
    test("arranca sin mazos", () => {
      const repo = new RepositorioMazos(rutaDb)
      expect(repo.mazos).toBeInstanceOf(Map)
      expect(repo.mazos.size).toBe(0)
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("el getter mazos devuelve una copia profunda que no afecta al repositorio", async () => {
      const mazo1 = crearDatosMazo(1)
      const mazo2 = crearDatosMazo(2)
      await sembrarDb({ 1: mazo1, 2: mazo2 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const copia = repo.mazos
      copia.get(1).agregarCarta(999, "none", "main")
      copia.set(99, new Mazo(crearDatosMazo(99)))
      copia.delete(2)

      expect(repo.buscar(1).toJSON()).toEqual(mazo1)
      expect(repo.buscar(2).toJSON()).toEqual(mazo2)
      expect(repo.cantidadTotal()).toBe(2)
    })
  })

  describe("guardar", () => {
    test("escribe en el .json el contenido del repositorio indexado por id", async () => {
      const mazo1 = crearDatosMazo(1)
      const mazo2 = crearDatosMazo(2)
      await sembrarDb({ 1: mazo1, 2: mazo2 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await rm(rutaDb) // se borra para comprobar que guardar() lo vuelve a crear
      await repo.guardar()

      expect(await leerDb()).toEqual({ 1: mazo1, 2: mazo2 })
    })
  })

  describe("cargar", () => {
    test("carga los mazos desde un .json existente", async () => {
      const mazo1 = crearDatosMazo(1)
      const mazo2 = crearDatosMazo(2)
      const mazo3 = crearDatosMazo(3)
      await sembrarDb({ 1: mazo1, 2: mazo2, 3: mazo3 })
      const repo = new RepositorioMazos(rutaDb)

      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(3)
      expect(repo.buscar(1)).toBeInstanceOf(Mazo)
      expect(repo.buscar(1).toJSON()).toEqual(mazo1)
      expect(repo.buscar(2).toJSON()).toEqual(mazo2)
      expect(repo.buscar(3).toJSON()).toEqual(mazo3)
    })

    test("si el archivo no existe lo crea vacío", async () => {
      const repo = new RepositorioMazos(rutaDb)

      await repo.cargar()

      expect(await existe(rutaDb)).toBe(true)
      expect(await leerDb()).toEqual({})
      expect(repo.cantidadTotal()).toBe(0)
    })

    test("si el archivo tiene un JSON inválido propaga el error", async () => {
      await writeFile(rutaDb, "esto no es json", "utf8")
      const repo = new RepositorioMazos(rutaDb)

      await expect(repo.cargar()).rejects.toThrow(SyntaxError)
    })

    test("si ocurre un error distinto de ENOENT lo propaga", async () => {
      // La ruta apunta a una carpeta, por lo que readFile falla con EISDIR
      const repo = new RepositorioMazos(carpetaDataTest)

      await expect(repo.cargar()).rejects.toMatchObject({ code: "EISDIR" })
    })
  })

  describe("cantidadTotal", () => {
    test("devuelve 0 si el repositorio está vacío", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(0)
    })

    test("devuelve la cantidad total de mazos almacenados", async () => {
      await sembrarDb({
        1: crearDatosMazo(1),
        2: crearDatosMazo(2),
        3: crearDatosMazo(3),
        4: crearDatosMazo(4),
      })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(4)
    })

    test("aumenta en uno cada vez que se agrega un mazo", async () => {
      await sembrarDb({ 1: crearDatosMazo(1) })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await repo.agregar(crearInputMazo("Mazo 2"))
      expect(repo.cantidadTotal()).toBe(2)

      await repo.agregar(crearInputMazo("Mazo 3"))
      expect(repo.cantidadTotal()).toBe(3)
    })

    test("disminuye en uno cada vez que se elimina un mazo", async () => {
      await sembrarDb({
        1: crearDatosMazo(1),
        2: crearDatosMazo(2),
        3: crearDatosMazo(3),
      })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await repo.eliminar(1)

      expect(repo.cantidadTotal()).toBe(2)
    })

    test("no cambia si eliminar falla", async () => {
      await sembrarDb({
        1: crearDatosMazo(1),
        2: crearDatosMazo(2),
      })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar(99)).rejects.toThrow(NotFoundError)

      expect(repo.cantidadTotal()).toBe(2)
    })
  })

  describe("buscar", () => {
    test("devuelve el mazo correspondiente al id numérico buscado", async () => {
      const mazo1 = crearDatosMazo(1)
      const mazo2 = crearDatosMazo(2)
      const mazo3 = crearDatosMazo(3)
      await sembrarDb({ 1: mazo1, 2: mazo2, 3: mazo3 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const encontrado = repo.buscar(3)

      expect(encontrado).toBeInstanceOf(Mazo)
      expect(encontrado.toJSON()).toEqual(mazo3)
    })

    test("devuelve null si no existe ningún mazo con ese id", async () => {
      const mazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: mazo1 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.buscar(999)).toBeNull()
    })

    test("devuelve null si el repositorio está vacío", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.buscar(1)).toBeNull()
    })

    test("devuelve una copia profunda: modificar el mazo devuelto no altera el repositorio", async () => {
      const mazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: mazo1 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const copia = repo.buscar(1)
      copia.agregarCarta(999, "none", "main")

      expect(repo.buscar(1).toJSON()).toEqual(mazo1)
    })
  })

  describe("agregar", () => {
    test("asigna id 1 al primer mazo cuando el repositorio está vacío", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar() // crea el .json vacío

      const input = crearInputMazo("Mazo 1")
      const esperado = { ...input, id: 1 }

      const resultado = await repo.agregar(input)

      expect(resultado).toBeInstanceOf(Mazo)
      expect(resultado.toJSON()).toEqual(esperado)
      expect(repo.buscar(1).toJSON()).toEqual(esperado)
      expect(await leerDb()).toEqual({ 1: esperado })
    })

    test("asigna como id el máximo id existente + 1 tras cargar y lo persiste", async () => {
      const datosMazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: datosMazo1 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const inputMazo2 = crearInputMazo("Mazo 2")
      const esperadoMazo2 = { ...inputMazo2, id: 2 }

      const resultado = await repo.agregar(inputMazo2)

      expect(resultado).toBeInstanceOf(Mazo)
      expect(resultado.toJSON()).toEqual(esperadoMazo2)
      expect(repo.buscar(2).toJSON()).toEqual(esperadoMazo2)
      expect(await leerDb()).toEqual({ 1: datosMazo1, 2: esperadoMazo2 })
    })

    test("calcula el próximo id a partir del mayor id existente aunque haya huecos", async () => {
      const datosMazo2 = crearDatosMazo(2)
      const datosMazo7 = crearDatosMazo(7)
      await sembrarDb({ 2: datosMazo2, 7: datosMazo7 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const inputMazo8 = crearInputMazo("Mazo 8")
      const esperadoMazo8 = { ...inputMazo8, id: 8 }

      const resultado = await repo.agregar(inputMazo8)

      expect(resultado).toBeInstanceOf(Mazo)
      expect(resultado.toJSON()).toEqual(esperadoMazo8)
      expect(repo.cantidadTotal()).toBe(3)
      expect(repo.buscar(8).toJSON()).toEqual(esperadoMazo8)
      expect(await leerDb()).toEqual({
        2: datosMazo2,
        7: datosMazo7,
        8: esperadoMazo8,
      })
    })

    test("ignora o sobrescribe cualquier id que venga en el objeto de entrada", async () => {
      const datosMazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: datosMazo1 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const resultado = await repo.agregar(crearDatosMazo(999, { nombre: "Mazo 2" }))
      const esperado = crearDatosMazo(2, { nombre: "Mazo 2" })

      expect(resultado.toJSON()).toEqual(esperado)
      expect(repo.buscar(2).toJSON()).toEqual(esperado)
      expect(repo.buscar(999)).toBeNull()
    })

    test("acumula varios mazos con ids autoincrementales", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()
      const mapaEsperado = generarMapaDatosMazos(cantidadMazos)

      for (let i = 1; i <= cantidadMazos; i++) {
        await repo.agregar(crearInputMazo(`Mazo ${i}`))
      }

      expect(repo.cantidadTotal()).toBe(cantidadMazos)
      expect(await leerDb()).toEqual(mapaEsperado)
    })

    test("no limita la cantidad de mazos (esa regla es responsabilidad de Usuario / Servicio)", async () => {
      const mapaInicial = generarMapaDatosMazos(cantidadMazos)
      await sembrarDb(mapaInicial)
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const inputExtra = crearInputMazo(`Mazo ${cantidadMazos + 1}`)
      const esperadoExtra = { ...inputExtra, id: cantidadMazos + 1 }
      await repo.agregar(inputExtra)

      expect(repo.cantidadTotal()).toBe(cantidadMazos + 1)
      expect(repo.buscar(cantidadMazos + 1).toJSON()).toEqual(esperadoExtra)
    })

    test("no altera los demás mazos existentes al agregar uno nuevo", async () => {
      const datosMazo7 = crearDatosMazo(7)
      await sembrarDb({ 7: datosMazo7 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await repo.agregar(crearInputMazo("Mazo Nuevo"))

      expect(repo.buscar(7).toJSON()).toEqual(datosMazo7)
    })
  })

  describe("actualizar", () => {
    test("actualiza los campos enviados del mazo, los persiste y devuelve el Mazo actualizado", async () => {
      const mazo1 = crearDatosMazo(1)
      const mazo2 = crearDatosMazo(2)
      await sembrarDb({ 1: mazo1, 2: mazo2 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const cambios = {
        id: 1,
        nombre: "Mazo Renombrado",
        mainDeck: [100, 101, 102],
        extraDeck: [200, 201],
      }
      const esperado = { ...mazo1, ...cambios }

      const resultado = await repo.actualizar(cambios)

      expect(resultado).toBeInstanceOf(Mazo)
      expect(resultado.toJSON()).toEqual(esperado)
      expect(repo.buscar(1).toJSON()).toEqual(esperado)
      expect(repo.buscar(2).toJSON()).toEqual(mazo2)
      expect(await leerDb()).toEqual({ 1: esperado, 2: mazo2 })
    })

    test("conserva los campos que no se envían en la actualización", async () => {
      const mazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: mazo1 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const resultado = await repo.actualizar({ id: 1, nombre: "Solo Nombre Nuevo" })
      const esperado = { ...mazo1, nombre: "Solo Nombre Nuevo" }

      expect(resultado.toJSON()).toEqual(esperado)
      expect(repo.buscar(1).toJSON()).toEqual(esperado)
    })

    test("lanza NotFoundError si el mazo a actualizar no existe y no modifica el archivo", async () => {
      const mazo1 = crearDatosMazo(1)
      await sembrarDb({ 1: mazo1 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(
        repo.actualizar({ id: 99, nombre: "Inexistente" })
      ).rejects.toThrow(NotFoundError)

      expect(repo.cantidadTotal()).toBe(1)
      expect(await leerDb()).toEqual({ 1: mazo1 })
    })
  })

  describe("eliminar", () => {
    test("elimina el mazo por su id, lo persiste y devuelve true", async () => {
      const mazo1 = crearDatosMazo(1)
      const mazo2 = crearDatosMazo(2)
      const mazo3 = crearDatosMazo(3)
      await sembrarDb({ 1: mazo1, 2: mazo2, 3: mazo3 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const resultado = await repo.eliminar(2)

      expect(resultado).toBe(true)
      expect(repo.buscar(2)).toBeNull()
      expect(repo.cantidadTotal()).toBe(2)
      expect(await leerDb()).toEqual({ 1: mazo1, 3: mazo3 })
    })

    test("rechaza con ValidationError al cargar un mazo cuyo id es 0 o inválido", async () => {
      const mazo0 = crearDatosMazo(0)
      await sembrarDb({ 0: mazo0 })
      const repo = new RepositorioMazos(rutaDb)

      await expect(repo.cargar()).rejects.toThrow(ValidationError)
    })

    test("lanza NotFoundError si el id no existe y no modifica el archivo", async () => {
      const mazo1 = crearDatosMazo(1)
      const mazo2 = crearDatosMazo(2)
      await sembrarDb({ 1: mazo1, 2: mazo2 })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar(99)).rejects.toThrow(NotFoundError)

      expect(repo.cantidadTotal()).toBe(2)
      expect(await leerDb()).toEqual({ 1: mazo1, 2: mazo2 })
    })
  })
})
