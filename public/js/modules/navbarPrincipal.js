import { authService } from "../services/servicioAutentificacion.js"

function obtenerPaginaActual() {
  const ruta = window.location.pathname.split(/[?#]/)[0]
  const archivo = ruta.split("/").pop()
  return archivo || "index.html"
}

function obtenerPaginaEnlace(enlace) {
  const href = enlace.getAttribute("href")?.trim()
  if (!href || href.startsWith("#")) return null
  const rutaLimpia = href.split(/[?#]/)[0]
  const archivo = rutaLimpia.split("/").pop()
  return archivo || "index.html"
}

/**
 * Sincroniza el estado activo del selector de páginas de la navbar/drawer
 * con la ruta actual y abre el acordeón padre si corresponde.
 */
export function actualizarSelectorPagina() {
  const paginaActual = obtenerPaginaActual()
  const enlaces = document.querySelectorAll(".navbar-nav .nav-link[href]")

  for (const enlace of enlaces) {
    const paginaEnlace = obtenerPaginaEnlace(enlace)
    const esActual = paginaEnlace !== null && paginaEnlace === paginaActual

    enlace.classList.toggle("active", esActual)
    if (esActual) {
      enlace.setAttribute("aria-current", "page")
      const acordeon = enlace.closest("details.nav-mazos-accordion")
      if (acordeon) {
        acordeon.open = true
      }
    } else {
      enlace.removeAttribute("aria-current")
    }
  }
}

/**
 * Cierra la sesión actual en el backend y redirige al login.
 */
export async function cerrarSesion() {
  await authService.logout()
  window.location.assign("login.html")
}

/**
 * Inicializa el comportamiento de la navbar ya renderizada en el HTML:
 * marca el enlace activo, verifica la sesión del usuario, redirige al panel si es admin
 * (o conecta su botón de logout), y ejecuta los callbacks correspondientes para `#nav-auth`.
 *
 * @param {Object} [callbacks]
 * @param {(usuario: Object, onLogout: () => Promise<void>, contenedor: HTMLElement) => void} [callbacks.alMostrarUsuarioLogueado]
 * @param {(contenedor: HTMLElement) => void} [callbacks.alMostrarUsuarioInvitado]
 */
export async function inicializarNavbarPrincipal({
  alMostrarUsuarioLogueado,
  alMostrarUsuarioInvitado
} = {}) {
  actualizarSelectorPagina()

  const usuario = await authService.obtenerUsuarioActual()
  const enPanelAdmin = window.location.pathname.endsWith("admin.html")

  if (usuario?.rol === "admin") {
    if (!enPanelAdmin) {
      window.location.replace("admin.html")
      return
    }
    document.getElementById("btn-logout-admin")?.addEventListener("click", cerrarSesion)
    return
  }

  const navAuthContainer = document.getElementById("nav-auth")
  if (!navAuthContainer) return

  if (usuario) {
    alMostrarUsuarioLogueado?.(usuario, cerrarSesion, navAuthContainer)
  } else {
    alMostrarUsuarioInvitado?.(navAuthContainer)
  }
}
