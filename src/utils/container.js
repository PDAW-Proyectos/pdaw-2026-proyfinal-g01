// container.js solo se dedica a tomar las rutas de la base de datos que tenemos y
// pasarselas en las clases logicas que tenemos, ademas las inicia a todas para poder
// usarlas en todo el codigo.

// Las rutas todavia no existen en config pero es donde las deberiamos poner
import { RUTA_USUARIOS, RUTA_MAZOS, RUTA_CARTAS } from "./config.js"
import { RepositorioMazos } from "./repositories/RepositorioMazos.js"
import { RepositorioCartas } from "./repositories/RepositorioCartas.js"
import { RepositorioUsuarios } from "./repositories/RepositorioUsuarios.js"
import { ServicioMazos } from "./services/ServicioMazos.js"
import { ServicioUsuarios } from "./services/ServicioUsuarios.js"
import { ControladorMazos } from "./controllers/ControladorMazos.js"
import { ControladorUsuarios } from "./controllers/ControladorUsuarios.js"

// Aca se inicia la carga de repositorios poner el repositorioUsuarios aca.
// export const repositorioUsuarios = new RepositorioUsuarios(RUTA_USUARIOS)
export const repositorioMazos = new RepositorioMazos(RUTA_MAZOS)
export const repositorioCartas = new RepositorioCartas(RUTA_CARTAS)
export const repositorioUsuarios = new RepositorioUsuarios(RUTA_USUARIOS)

// Despues de iniciarlos se tienen que cargar
// await repositorioUsuarios.cargar()
await repositorioMazos.cargar()
await repositorioCartas.cargar()
await repositorioUsuarios.cargar()

// El servicio se carga usando los repositorios necesarios ej:
// export const ServicioUsuarios = new ServicioUsuarios(repositorioUsuarios, repositorioMazos)
export const servicioMazos = new ServicioMazos(repositorioMazos, repositorioCartas)
export const servicioUsuarios = new ServicioUsuarios(repositorioUsuarios)

// Por ultimo se los conecta a los controladores
// export const controladorUsuarios = new ControladorMazos(servicioUsuarios)
export const controladorMazos = new ControladorMazos(servicioMazos)
export const controladorUsuarios = new ControladorUsuarios(servicioUsuarios)
