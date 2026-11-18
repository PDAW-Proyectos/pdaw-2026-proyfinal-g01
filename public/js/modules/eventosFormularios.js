/**
 * Conecta el botón para mostrar/ocultar una contraseña cambiando el tipo del input y el ícono.
 * @param {string} buttonId
 * @param {string} inputId
 */
export function inicializarTogglePassword(buttonId, inputId) {
  const showPasswordButton = document.getElementById(buttonId)
  const password = document.getElementById(inputId)

  showPasswordButton?.addEventListener("click", () => {
    const esOculta = password.type === "password"
    password.type = esOculta ? "text" : "password"

    const icono = showPasswordButton.querySelector("i")
    icono?.classList.toggle("bi-eye", !esOculta)
    icono?.classList.toggle("bi-eye-slash", esOculta)
  })
}
