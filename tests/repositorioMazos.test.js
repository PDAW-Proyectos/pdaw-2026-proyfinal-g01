import { readFile, writeFile, rm, mkdir, access } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { RepositorioMazos } from "../src/repositories/RepositorioMazos.js"
import { Mazo } from "../src/models/Mazo.js"
import { NotFoundError } from "../src/errors.js"

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
const crearDatosMazo = (id, username = "ana", extras = {}) => ({
  id,
  username,
  nombre: `Mazo ${id}`,
  mainDeck: [100, 101],
  extraDeck: [200],
  ...extras,
})

/** Crea un objeto plano con los datos de entrada para agregar() (sin id). */
const crearInputMazo = (username = "ana", nombre = "Mazo Nuevo", extras = {}) => ({
  username,
  nombre,
  mainDeck: [100, 101],
  extraDeck: [200],
  ...extras,
})

/** Genera una lista de datos de mazos consecutivos para un usuario: ids [1, 2, ..., cantidad]. */
const generarDatosMazos = (cantidad, username = "ana") =>
  Array.from({ length: cantidad }, (_, i) => crearDatosMazo(i + 1, username))

/**
 * Convierte una lista de instancias de Mazo (u objetos planos) a su representación JSON,
 * verificando además que sean instancias de Mazo.
 */
const serializarMazos = (mazos) => {
  expect(Array.isArray(mazos)).toBe(true)
  mazos.forEach((mazo) => expect(mazo).toBeInstanceOf(Mazo))
  return mazos.map((mazo) => mazo.toJSON())
}

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
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      await sembrarDb({ ana: [mazo1, mazo2] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const copia = repo.mazos
      copia.get("ana")[0].agregarCarta(999, "main")
      copia.get("ana").push(new Mazo(crearDatosMazo(99, "ana")))
      copia.set("beto", [new Mazo(crearDatosMazo(5, "beto"))])

      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([mazo1, mazo2])
      expect(repo.cantidadTotal()).toBe(2)
    })
  })

  describe("guardar", () => {
    test("escribe en el .json el contenido del repositorio", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      await sembrarDb({ ana: [mazo1, mazo2] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await rm(rutaDb) // se borra para comprobar que guardar() lo vuelve a crear
      await repo.guardar()

      expect(await leerDb()).toEqual({ ana: [mazo1, mazo2] })
    })
  })

  describe("cargar", () => {
    test("carga los mazos desde un .json existente", async () => {
      const mazosAna = [
        crearDatosMazo(1, "ana"),
        crearDatosMazo(2, "ana"),
        crearDatosMazo(3, "ana"),
      ]
      const mazosBeto = [crearDatosMazo(4, "beto")]
      await sembrarDb({ ana: mazosAna, beto: mazosBeto })
      const repo = new RepositorioMazos(rutaDb)

      await repo.cargar()

      expect(repo.cantidadTotal()).toBe(4)
      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual(mazosAna)
      expect(serializarMazos(repo.buscarMazos("beto"))).toEqual(mazosBeto)
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

    test("devuelve la cantidad total de mazos de todos los usuarios", async () => {
      await sembrarDb({
        ana: [crearDatosMazo(1, "ana"), crearDatosMazo(2, "ana"), crearDatosMazo(3, "ana")],
        beto: [crearDatosMazo(4, "beto")],
        carla: [],
      })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      // 3 + 1 + 0 mazos (no la cantidad de usuarios, que sería 3)
      expect(repo.cantidadTotal()).toBe(4)
    })

    test("aumenta en uno cada vez que se agrega un mazo", async () => {
      await sembrarDb({ ana: [crearDatosMazo(1, "ana")] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await repo.agregar(crearInputMazo("ana", "Mazo 2")) // usuario existente
      expect(repo.cantidadTotal()).toBe(2)

      await repo.agregar(crearInputMazo("beto", "Mazo 3")) // usuario nuevo
      expect(repo.cantidadTotal()).toBe(3)
    })

    test("disminuye en uno cada vez que se elimina un mazo", async () => {
      await sembrarDb({
        ana: [crearDatosMazo(1, "ana"), crearDatosMazo(2, "ana")],
        beto: [crearDatosMazo(3, "beto")],
      })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await repo.eliminar({ username: "ana", id: 1 })

      expect(repo.cantidadTotal()).toBe(2)
    })

    test("no cambia si eliminar falla", async () => {
      await sembrarDb({ ana: [crearDatosMazo(1, "ana"), crearDatosMazo(2, "ana")] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar({ username: "ana", id: 99 })).rejects.toThrow(NotFoundError)

      expect(repo.cantidadTotal()).toBe(2)
    })
  })

  describe("buscar", () => {
    test("devuelve el mazo correspondiente al id buscado sin importar el usuario", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      const mazo3 = crearDatosMazo(3, "beto")
      await sembrarDb({ ana: [mazo1, mazo2], beto: [mazo3] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const encontrado = repo.buscar(3)

      expect(encontrado).toBeInstanceOf(Mazo)
      expect(encontrado.toJSON()).toEqual(mazo3)
    })

    test("devuelve null si no existe ningún mazo con ese id", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      await sembrarDb({ ana: [mazo1] })
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
      const mazo1 = crearDatosMazo(1, "ana")
      await sembrarDb({ ana: [mazo1] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const copia = repo.buscar(1)
      copia.agregarCarta(999, "main")

      expect(repo.buscar(1).toJSON()).toEqual(mazo1)
    })
  })

  describe("buscarMazos", () => {
    test("devuelve los mazos del usuario", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      await sembrarDb({ ana: [mazo1, mazo2] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([mazo1, mazo2])
    })

    test("devuelve null si el usuario no existe", async () => {
      await sembrarDb({ ana: [crearDatosMazo(1, "ana"), crearDatosMazo(2, "ana")] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      expect(repo.buscarMazos("inexistente")).toBeNull()
    })

    test("devuelve una copia profunda: modificar el arreglo o sus mazos no altera el repositorio", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      await sembrarDb({ ana: [mazo1, mazo2] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const copia = repo.buscarMazos("ana")
      copia[0].agregarCarta(999, "main")
      copia.push(new Mazo(crearDatosMazo(99, "ana")))

      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([mazo1, mazo2])
    })
  })

  describe("agregar", () => {
    test("asigna id 1 al primer mazo cuando el repositorio está vacío", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar() // crea el .json vacío

      const input = crearInputMazo("ana", "Mazo 1")
      const esperado = { ...input, id: 1 }

      const resultado = await repo.agregar(input)

      expect(resultado).toBeInstanceOf(Mazo)
      expect(resultado.toJSON()).toEqual(esperado)
      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([esperado])
      expect(await leerDb()).toEqual({ ana: [esperado] })
    })

    test("asigna como id el máximo id existente + 1 tras cargar y lo persiste", async () => {
      const datosMazo1 = crearDatosMazo(1, "ana")
      await sembrarDb({ ana: [datosMazo1] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const inputMazo2 = crearInputMazo("ana", "Mazo 2")
      const esperadoMazo2 = { ...inputMazo2, id: 2 }

      const resultado = await repo.agregar(inputMazo2)

      expect(resultado).toBeInstanceOf(Mazo)
      expect(resultado.toJSON()).toEqual(esperadoMazo2)
      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([datosMazo1, esperadoMazo2])
      expect(await leerDb()).toEqual({ ana: [datosMazo1, esperadoMazo2] })
    })

    test("calcula el próximo id a partir del mayor id entre todos los usuarios", async () => {
      const datosAna = crearDatosMazo(2, "ana")
      const datosBeto = crearDatosMazo(7, "beto")
      await sembrarDb({ ana: [datosAna], beto: [datosBeto] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const inputCarla = crearInputMazo("carla", "Mazo 8")
      const esperadoCarla = { ...inputCarla, id: 8 }

      const resultado = await repo.agregar(inputCarla)

      expect(resultado).toBeInstanceOf(Mazo)
      expect(resultado.toJSON()).toEqual(esperadoCarla)
      expect(repo.cantidadTotal()).toBe(3)
      expect(serializarMazos(repo.buscarMazos("carla"))).toEqual([esperadoCarla])
      expect(await leerDb()).toEqual({
        ana: [datosAna],
        beto: [datosBeto],
        carla: [esperadoCarla],
      })
    })

    test("ignora o sobrescribe cualquier id que venga en el objeto de entrada", async () => {
      const datosAna = crearDatosMazo(1, "ana")
      await sembrarDb({ ana: [datosAna] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const resultado = await repo.agregar(crearDatosMazo(999, "ana", { nombre: "Mazo 2" }))
      const esperado = crearDatosMazo(2, "ana", { nombre: "Mazo 2" })

      expect(resultado.toJSON()).toEqual(esperado)
      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([datosAna, esperado])
    })

    test("un usuario creado por agregar acumula varios mazos con ids autoincrementales", async () => {
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()
      const listaEsperada = generarDatosMazos(cantidadMazos, "ana")

      for (let i = 1; i <= cantidadMazos; i++) {
        await repo.agregar(crearInputMazo("ana", `Mazo ${i}`))
      }

      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual(listaEsperada)
      expect((await leerDb()).ana).toEqual(listaEsperada)
    })

    test("no limita la cantidad de mazos (esa regla es responsabilidad del servicio)", async () => {
      const listaInicial = generarDatosMazos(cantidadMazos, "ana")
      await sembrarDb({ ana: listaInicial })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const inputExtra = crearInputMazo("ana", `Mazo ${cantidadMazos + 1}`)
      const esperadoExtra = { ...inputExtra, id: cantidadMazos + 1 }
      await repo.agregar(inputExtra)

      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([...listaInicial, esperadoExtra])
    })

    test("no afecta a los mazos de otros usuarios", async () => {
      const datosBeto = crearDatosMazo(7, "beto")
      await sembrarDb({
        ana: [crearDatosMazo(1, "ana")],
        beto: [datosBeto],
      })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await repo.agregar(crearInputMazo("ana", "Mazo Nuevo"))

      expect(serializarMazos(repo.buscarMazos("beto"))).toEqual([datosBeto])
    })
  })

  describe("eliminar", () => {
    test("elimina el mazo del usuario, lo persiste y devuelve true", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      const mazo3 = crearDatosMazo(3, "ana")
      await sembrarDb({ ana: [mazo1, mazo2, mazo3] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const resultado = await repo.eliminar({ username: "ana", id: 2 })

      expect(resultado).toBe(true)
      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([mazo1, mazo3])
      expect(await leerDb()).toEqual({ ana: [mazo1, mazo3] })
    })

    test("permite eliminar un mazo cuyo id es 0", async () => {
      const mazo0 = crearDatosMazo(0, "ana")
      const mazo1 = crearDatosMazo(1, "ana")
      await sembrarDb({ ana: [mazo0, mazo1] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      const resultado = await repo.eliminar({ username: "ana", id: 0 })

      expect(resultado).toBe(true)
      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([mazo1])
      expect(await leerDb()).toEqual({ ana: [mazo1] })
    })

    test("lanza NotFoundError si el mazo no pertenece al usuario", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      await sembrarDb({ ana: [mazo1, mazo2] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar({ username: "ana", id: 99 })).rejects.toThrow(NotFoundError)
      expect(serializarMazos(repo.buscarMazos("ana"))).toEqual([mazo1, mazo2])
    })

    test("lanza NotFoundError si el usuario no existe y no modifica el archivo", async () => {
      const mazo1 = crearDatosMazo(1, "ana")
      const mazo2 = crearDatosMazo(2, "ana")
      await sembrarDb({ ana: [mazo1, mazo2] })
      const repo = new RepositorioMazos(rutaDb)
      await repo.cargar()

      await expect(repo.eliminar({ username: "inexistente", id: 1 })).rejects.toThrow(NotFoundError)

      expect(repo.cantidadTotal()).toBe(2)
      expect(await leerDb()).toEqual({ ana: [mazo1, mazo2] })
    })
  })
})
