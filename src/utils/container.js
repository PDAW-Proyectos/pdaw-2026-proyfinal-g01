// container.js solo se dedica a tomar las rutas de la base de datos que tenemos y
// pasarselas en las clases logicas que tenemos, ademas las inicia a todas para poder
// usarlas en todo el codigo.

import { mkdir } from "node:fs/promises"
import { RUTA_USUARIOS, RUTA_MAZOS, RUTA_CARTAS, RUTA_IMAGENES } from "./config.js"
import { RepositorioMazos } from "../repositories/RepositorioMazos.js"
import { RepositorioCartas } from "../repositories/RepositorioCartas.js"
import { RepositorioImagenes } from "../repositories/RepositorioImagenes.js"
import { RepositorioUsuarios } from "../repositories/RepositorioUsuarios.js"
import { ServicioMazos } from "../services/ServicioMazos.js"
import { ServicioCartas } from "../services/ServicioCartas.js"
import { ServicioImagenes } from "../services/ServicioImagenes.js"
import { ServicioUsuarios } from "../services/ServicioUsuarios.js"
import { ControladorMazos } from "../controllers/ControladorMazos.js"
import { ControladorCartas } from "../controllers/ControladorCartas.js"
import { ControladorImagenes } from "../controllers/ControladorImagenes.js"
import { ControladorUsuarios } from "../controllers/ControladorUsuarios.js"

// Aca se inicia la carga de repositorios poner el repositorioUsuarios aca.
export const repositorioMazos = new RepositorioMazos(RUTA_MAZOS)
export const repositorioCartas = new RepositorioCartas(RUTA_CARTAS)
export const repositorioImagenes = new RepositorioImagenes(RUTA_IMAGENES)
export const repositorioUsuarios = new RepositorioUsuarios(RUTA_USUARIOS)

// El servicio se carga usando los repositorios necesarios ej:
export const servicioMazos = new ServicioMazos(repositorioMazos, repositorioCartas)
export const servicioCartas = new ServicioCartas(repositorioCartas)
export const servicioImagenes = new ServicioImagenes(repositorioImagenes, repositorioCartas)
export const servicioUsuarios = new ServicioUsuarios(repositorioUsuarios, repositorioMazos)

// Por ultimo se los conecta a los controladores
export const controladorMazos = new ControladorMazos(servicioMazos)
export const controladorCartas = new ControladorCartas(servicioCartas)
export const controladorImagenes = new ControladorImagenes(servicioImagenes)
export const controladorUsuarios = new ControladorUsuarios(servicioUsuarios)

export async function inicializarContenedor() {
  // Inicio la carpeta para la base de datos si no existe
  await mkdir("data", { recursive: true })

  // Carga de la base de datos desde archivos
  await repositorioMazos.cargar()
  await repositorioCartas.cargar()
  await repositorioImagenes.cargar()
  await repositorioUsuarios.cargar()

  // Cargamos/descargamos las cartas a la base de datos, si no estan
  await servicioCartas.cargarCartas()
}
