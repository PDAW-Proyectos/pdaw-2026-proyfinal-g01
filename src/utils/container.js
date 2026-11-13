// container.js solo se dedica a tomar las rutas de la base de datos que tenemos y
// pasarselas en las clases logicas que tenemos, ademas las inicia a todas para poder
// usarlas en todo el codigo.

import { mkdir } from "node:fs/promises"
import { RUTA_USUARIOS, RUTA_MAZOS, RUTA_MAZOS_POPULARES, RUTA_CARTAS, RUTA_IMAGENES } from "./config.js"
import { ProgramadorDescargas } from "./ProgramadorDescargas.js"
import { RepositorioMazos } from "../repositories/RepositorioMazos.js"
import { RepositorioMazosPopulares } from "../repositories/RepositorioMazosPopulares.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { RepositorioImagenes } from "../repositories/RepositorioImagenes.js"
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js"
import { ServicioMazos } from "../services/ServicioMazos.js"
import { ServicioMazosPopulares } from "../services/ServicioMazosPopulares.js"
import { ServicioCartas } from "../services/ServicioCartas.js"
import { ServicioImagenes } from "../services/ServicioImagenes.js"
import { ServicioUsuarios } from "../services/ServicioUsuarios.js"
import { ControladorMazos } from "../controllers/ControladorMazos.js"
import { ControladorCartas } from "../controllers/ControladorCartas.js"
import { ControladorImagenes } from "../controllers/ControladorImagenes.js"
import { ControladorUsuarios } from "../controllers/ControladorUsuarios.js"

// Aca se inicia la carga de repositorios poner el repositorioUsuarios aca.
const repositorioMazos = new RepositorioMazos(RUTA_MAZOS)
const repositorioMazosPopulares = new RepositorioMazosPopulares(RUTA_MAZOS_POPULARES)
const repositorioCartas = new RepositorioCartas(RUTA_CARTAS)
const repositorioImagenes = new RepositorioImagenes(RUTA_IMAGENES)
const repositorioUsuarios = new RepositorioUsuarios(RUTA_USUARIOS)

// El servicio se carga usando los repositorios necesarios ej:
const servicioMazos = new ServicioMazos(repositorioMazos, repositorioCartas)
const servicioMazosPopulares = new ServicioMazosPopulares(repositorioMazosPopulares, repositorioCartas)
const servicioCartas = new ServicioCartas(repositorioCartas)
const servicioImagenes = new ServicioImagenes(repositorioImagenes, repositorioCartas)
const servicioUsuarios = new ServicioUsuarios(repositorioUsuarios, repositorioMazos)

// Programador de descargas semanales (recibe todos los servicios que descargan datos)
// Importante: servicioCartas va primero para asegurar que las cartas esten cargadas antes de hidratar los mazos populares
const programadorDescargas = new ProgramadorDescargas([servicioCartas, servicioMazosPopulares])

// Por ultimo se los conecta a los controladores
export const controladorMazos = new ControladorMazos(servicioMazos, servicioMazosPopulares)
export const controladorCartas = new ControladorCartas(servicioCartas)
export const controladorImagenes = new ControladorImagenes(servicioImagenes)
export const controladorUsuarios = new ControladorUsuarios(servicioUsuarios)

export async function inicializarContenedor() {
  // Inicio la carpeta para la base de datos si no existe
  await mkdir("data", { recursive: true })

  // Carga de la base de datos desde archivos
  await repositorioMazos.cargar()
  await repositorioMazosPopulares.cargar()
  await repositorioCartas.cargar()
  await repositorioImagenes.cargar()
  await repositorioUsuarios.cargar()

  // Ejecutamos y programamos las descargas semanales necesarias
  await programadorDescargas.iniciar()
}
