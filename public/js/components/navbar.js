import { authService } from '../services/authService.js'
import { inicializarBusquedaDialogo } from '../modules/busquedaCartas.js'

const navAuthContainer = document.getElementById('nav-auth')

function obtenerPaginaActual() {
  const ruta = window.location.pathname.split(/[?#]/)[0]
  const archivo = ruta.split('/').pop()
  return archivo || 'index.html'
}

function obtenerPaginaEnlace(enlace) {
  const href = enlace.getAttribute('href')?.trim()
  if (!href || href.startsWith('#')) return null
  const rutaLimpia = href.split(/[?#]/)[0]
  const archivo = rutaLimpia.split('/').pop()
  return archivo || 'index.html'
}

/**
 * Sincroniza el estado activo del selector de páginas de la navbar/drawer
 * con la ruta actual y abre el acordeón padre si corresponde.
 */
export function actualizarSelectorPagina() {
  const paginaActual = obtenerPaginaActual()
  const enlaces = document.querySelectorAll('.navbar-nav .nav-link[href]')

  for (const enlace of enlaces) {
    const paginaEnlace = obtenerPaginaEnlace(enlace)
    const esActual = paginaEnlace !== null && paginaEnlace === paginaActual

    enlace.classList.toggle('active', esActual)
    if (esActual) {
      enlace.setAttribute('aria-current', 'page')
      const acordeon = enlace.closest('details.nav-mazos-accordion')
      if (acordeon) {
        acordeon.open = true
      }
    } else {
      enlace.removeAttribute('aria-current')
    }
  }
}

async function cerrarSesion() {
  await authService.logout()
  window.location.assign('login.html')
}

function renderNavbarAdmin(usuario) {
  const spanAdmin = document.getElementById('admin-username')
  const btnLogout = document.getElementById('btn-logout-admin')

  if (spanAdmin) {
    spanAdmin.textContent = `Admin: ${usuario.username}`
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', cerrarSesion)
  }
}

function renderUsuarioLogueadoDrawer(usuario) {
  navAuthContainer.replaceChildren()

  const inicial = usuario.username ? usuario.username.charAt(0).toUpperCase() : 'U'

  const contenedor = document.createElement('div')
  contenedor.className = 'd-flex flex-column gap-3 w-100'

  const infoUsuario = document.createElement('div')
  infoUsuario.className = 'd-flex align-items-center justify-content-center gap-2 min-w-0'

  const avatar = document.createElement('span')
  avatar.className = 'd-inline-flex align-items-center justify-content-center bg-primary fg-white fw-bold rounded-circle flex-shrink-0'
  avatar.style.width = '36px'
  avatar.style.height = '36px'
  avatar.setAttribute('aria-hidden', 'true')
  avatar.textContent = inicial

  const saludo = document.createElement('span')
  saludo.className = 'fw-semibold text-truncate'
  saludo.textContent = `Hola, ${usuario.username}`

  infoUsuario.append(avatar, saludo)

  const btnLogout = document.createElement('button')
  btnLogout.type = 'button'
  btnLogout.className = 'btn-outline theme-danger w-100'
  btnLogout.textContent = 'Cerrar sesión'
  btnLogout.addEventListener('click', cerrarSesion)

  contenedor.append(infoUsuario, btnLogout)
  navAuthContainer.append(contenedor)
}

function renderUsuarioInvitadoDrawer() {
  navAuthContainer.replaceChildren()

  const grupoBotones = document.createElement('div')
  grupoBotones.className = 'd-flex gap-2 w-100'

  const linkLogin = document.createElement('a')
  linkLogin.href = 'login.html'
  linkLogin.className = 'btn-outline theme-primary flex-fill text-center'
  linkLogin.textContent = 'Iniciar sesión'

  const linkRegistro = document.createElement('a')
  linkRegistro.href = 'registro.html'
  linkRegistro.className = 'btn-solid theme-primary flex-fill text-center'
  linkRegistro.textContent = 'Regístrate'

  grupoBotones.append(linkLogin, linkRegistro)
  navAuthContainer.append(grupoBotones)
}

function renderUsuarioLogueado(usuario) {
  if (navAuthContainer.closest('.drawer')) {
    renderUsuarioLogueadoDrawer(usuario)
    return
  }

  navAuthContainer.replaceChildren()

  const inicial = usuario.username ? usuario.username.charAt(0).toUpperCase() : 'U'

  // --- VISTA MOBILE (< xl) ---
  const btnLogoutMobile = document.createElement('button')
  btnLogoutMobile.type = 'button'
  btnLogoutMobile.className = 'btn btn-main btn-main-outline d-xl-none w-100'
  btnLogoutMobile.textContent = 'Cerrar sesión'
  btnLogoutMobile.addEventListener('click', cerrarSesion)

  // --- VISTA ESCRITORIO (>= xl) ---
  const dropdownDiv = document.createElement('div')
  dropdownDiv.className = 'dropdown d-none d-xl-block'

  const btnAvatar = document.createElement('button')
  btnAvatar.type = 'button'
  btnAvatar.className = 'btn btn-main rounded-circle d-flex align-items-center justify-content-center p-0 fs-5 fw-bold border border-3'
  btnAvatar.style.width = '42px'
  btnAvatar.style.height = '42px'
  btnAvatar.setAttribute('data-bs-toggle', 'dropdown')
  btnAvatar.setAttribute('aria-expanded', 'false')
  btnAvatar.textContent = inicial

  const ulMenu = document.createElement('ul')
  ulMenu.className = 'dropdown-menu dropdown-menu-end shadow-sm'

  const liUser = document.createElement('li')
  const spanUser = document.createElement('span')
  spanUser.className = 'dropdown-item-text fw-bold text-dark'
  spanUser.textContent = `Hola, ${usuario.username}`
  liUser.appendChild(spanUser)

  const liDivider = document.createElement('li')
  const hr = document.createElement('hr')
  hr.className = 'dropdown-divider'
  liDivider.appendChild(hr)

  const liLogout = document.createElement('li')
  const btnLogoutDesktop = document.createElement('button')
  btnLogoutDesktop.type = 'button'
  btnLogoutDesktop.className = 'dropdown-item text-danger fw-semibold'
  btnLogoutDesktop.textContent = 'Cerrar sesión'
  btnLogoutDesktop.addEventListener('click', cerrarSesion)
  liLogout.appendChild(btnLogoutDesktop)

  ulMenu.append(liUser, liDivider, liLogout)
  dropdownDiv.append(btnAvatar, ulMenu)

  navAuthContainer.append(btnLogoutMobile, dropdownDiv)
}

function renderUsuarioInvitado() {
  if (navAuthContainer.closest('.drawer')) {
    renderUsuarioInvitadoDrawer()
    return
  }

  navAuthContainer.replaceChildren()

  // Botones directos para MOBILE (< xl) y ESCRITORIO grande (>= xxl)
  const directButtonsGroup = document.createElement('div')
  directButtonsGroup.className = 'd-flex d-xl-none d-xxl-flex gap-2 text-nowrap'

  const linkLogin = document.createElement('a')
  linkLogin.href = 'login.html'
  linkLogin.className = 'btn btn-main btn-main-outline'
  linkLogin.textContent = 'Iniciar sesión'

  const linkRegistro = document.createElement('a')
  linkRegistro.href = 'registro.html'
  linkRegistro.className = 'btn btn-main btn-main-primary'
  linkRegistro.textContent = 'Regístrate'

  directButtonsGroup.append(linkLogin, linkRegistro)

  // Dropdown "Acceder" SOLO para pantallas intermedias (entre xl y xxl)
  const dropdownDiv = document.createElement('div')
  dropdownDiv.className = 'dropdown d-none d-xl-block d-xxl-none'

  const btnDropdown = document.createElement('button')
  btnDropdown.type = 'button'
  btnDropdown.className = 'btn btn-main btn-main-primary dropdown-toggle text-nowrap'
  btnDropdown.setAttribute('data-bs-toggle', 'dropdown')
  btnDropdown.setAttribute('aria-expanded', 'false')
  btnDropdown.textContent = 'Acceder'

  const ulMenu = document.createElement('ul')
  ulMenu.className = 'dropdown-menu dropdown-menu-end shadow-sm'

  const liLogin = document.createElement('li')
  const itemLogin = document.createElement('a')
  itemLogin.className = 'dropdown-item'
  itemLogin.href = 'login.html'
  itemLogin.textContent = 'Iniciar sesión'
  liLogin.appendChild(itemLogin)

  const liRegistro = document.createElement('li')
  const itemRegistro = document.createElement('a')
  itemRegistro.className = 'dropdown-item text-primary fw-bold'
  itemRegistro.href = 'registro.html'
  itemRegistro.textContent = 'Regístrate'
  liRegistro.appendChild(itemRegistro)

  ulMenu.append(liLogin, liRegistro)
  dropdownDiv.append(btnDropdown, ulMenu)

  navAuthContainer.append(directButtonsGroup, dropdownDiv)
}

async function verificarSesion() {
  const usuario = await authService.obtenerUsuarioActual()
  const enPanelAdmin = window.location.pathname.endsWith('admin.html')

  if (usuario?.rol === 'admin') {
    if (!enPanelAdmin) {
      window.location.replace('admin.html')
      return
    }
    renderNavbarAdmin(usuario)
    return
  }

  if (!navAuthContainer) return

  if (usuario) {
    renderUsuarioLogueado(usuario)
  } else {
    renderUsuarioInvitado()
  }
}

export function inicializarNavbar() {
  actualizarSelectorPagina()
  inicializarBusquedaDialogo()
  void verificarSesion()
}

inicializarNavbar()
