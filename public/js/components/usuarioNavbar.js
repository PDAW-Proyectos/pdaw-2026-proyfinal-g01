/** Renderiza en el contenedor `#nav-auth` del drawer la información del usuario logueado
 * y su botón para cerrar sesión.
 */
export function renderUsuarioLogueadoDrawer(
  usuario,
  onLogout,
  contenedor = document.getElementById("nav-auth")
) {
  if (!contenedor) return
  contenedor.replaceChildren()

  const inicial = usuario?.username ? usuario.username.charAt(0).toUpperCase() : "U"

  const wrapper = document.createElement("div")
  wrapper.className = "d-flex flex-column gap-3 w-100"

  const infoUsuario = document.createElement("div")
  infoUsuario.className = "d-flex align-items-center justify-content-center gap-2 min-w-0"

  const avatar = document.createElement("span")
  avatar.className =
    "d-inline-flex align-items-center justify-content-center bg-primary fg-white fw-bold rounded-circle flex-shrink-0"
  avatar.style.width = "36px"
  avatar.style.height = "36px"
  avatar.setAttribute("aria-hidden", "true")
  avatar.textContent = inicial

  const saludo = document.createElement("span")
  saludo.className = "fw-semibold text-truncate"
  saludo.textContent = `Hola, ${usuario?.username ?? "Usuario"}`

  infoUsuario.append(avatar, saludo)

  const btnLogout = document.createElement("button")
  btnLogout.type = "button"
  btnLogout.className = "btn-outline theme-danger w-100"
  btnLogout.textContent = "Cerrar sesión"
  if (onLogout) {
    btnLogout.addEventListener("click", onLogout)
  }

  wrapper.append(infoUsuario, btnLogout)
  contenedor.append(wrapper)
}

/** Renderiza en el contenedor `#nav-auth` del drawer los botones de acceso para usuarios invitados. */
export function renderUsuarioInvitadoDrawer(
  contenedor = document.getElementById("nav-auth")
) {
  if (!contenedor) return
  contenedor.replaceChildren()

  const grupoBotones = document.createElement("div")
  grupoBotones.className = "d-flex gap-2 w-100"

  const linkLogin = document.createElement("a")
  linkLogin.href = "login.html"
  linkLogin.className = "btn-outline theme-primary flex-fill text-center"
  linkLogin.textContent = "Iniciar sesión"

  const linkRegistro = document.createElement("a")
  linkRegistro.href = "registro.html"
  linkRegistro.className = "btn-solid theme-primary flex-fill text-center"
  linkRegistro.textContent = "Regístrate"

  grupoBotones.append(linkLogin, linkRegistro)
  contenedor.append(grupoBotones)
}
