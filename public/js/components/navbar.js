import { authService } from '../services/authService.js'

const navAuthContainer = document.getElementById('nav-auth')

async function cerrarSesion() {
  await authService.logout()
  window.location.assign('login.html')
}

function renderUsuarioLogueado(usuario) {
  navAuthContainer.replaceChildren()

  const inicial = usuario.username ? usuario.username.charAt(0).toUpperCase() : 'U'
  const esAdmin = usuario.rol === 'admin'

  // --- VISTA MOBILE (< xl) ---
  const mobileGroup = document.createElement('div')
  mobileGroup.className = 'd-flex flex-column gap-2 d-xl-none w-100'

  if (esAdmin) {
    const linkAdminMobile = document.createElement('a')
    linkAdminMobile.href = 'admin.html'
    linkAdminMobile.className = 'btn btn-main btn-main-primary w-100'
    linkAdminMobile.textContent = 'Panel Admin'
    mobileGroup.appendChild(linkAdminMobile)
  }

  const btnLogoutMobile = document.createElement('button')
  btnLogoutMobile.type = 'button'
  btnLogoutMobile.className = 'btn btn-main btn-main-outline w-100'
  btnLogoutMobile.textContent = 'Cerrar sesión'
  btnLogoutMobile.addEventListener('click', cerrarSesion)
  mobileGroup.appendChild(btnLogoutMobile)

  // --- VISTA ESCRITORIO (>= xl) ---
  const dropdownDiv = document.createElement('div')
  dropdownDiv.className = 'dropdown d-none d-xl-block'

  const btnAvatar = document.createElement('button')
  btnAvatar.type = 'button'
  btnAvatar.className = 'btn btn-main rounded-circle d-flex align-items-center justify-content-center p-0 fs-5 fw-bold'
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
  ulMenu.appendChild(liUser)

  if (esAdmin) {
    const liAdmin = document.createElement('li')
    const linkAdminDesktop = document.createElement('a')
    linkAdminDesktop.className = 'dropdown-item fw-semibold text-primary'
    linkAdminDesktop.href = 'admin.html'
    linkAdminDesktop.textContent = 'Panel Admin'
    liAdmin.appendChild(linkAdminDesktop)
    ulMenu.appendChild(liAdmin)
  }

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

  ulMenu.appendChild(liDivider)
  ulMenu.appendChild(liLogout)

  dropdownDiv.appendChild(btnAvatar)
  dropdownDiv.appendChild(ulMenu)

  navAuthContainer.appendChild(mobileGroup)
  navAuthContainer.appendChild(dropdownDiv)
}

function renderUsuarioInvitado() {
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

  directButtonsGroup.appendChild(linkLogin)
  directButtonsGroup.appendChild(linkRegistro)

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

  ulMenu.appendChild(liLogin)
  ulMenu.appendChild(liRegistro)

  dropdownDiv.appendChild(btnDropdown)
  dropdownDiv.appendChild(ulMenu)

  navAuthContainer.appendChild(directButtonsGroup)
  navAuthContainer.appendChild(dropdownDiv)
}

async function verificarSesion() {
  if (!navAuthContainer) return

  const usuario = await authService.obtenerUsuarioActual()
  if (usuario) {
    renderUsuarioLogueado(usuario)
  } else {
    renderUsuarioInvitado()
  }
}

verificarSesion()