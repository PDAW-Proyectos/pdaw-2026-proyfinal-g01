import {
  crearCartaBusquedaRapida,
  renderizarErrorBusquedaRapida,
  renderizarMensajeBusquedaRapida
} from "../components/carta/cartaBusquedaRapida.js"
import { mostrarSkeletons } from "../components/carta/skeletonCarta.js"
import { renderizarListaTabla } from "../components/listaTabla.js"
import {
  renderUsuarioInvitadoDrawer,
  renderUsuarioLogueadoDrawer
} from "../components/usuarioNavbar.js"
import { inicializarBusquedaRapidaDialogo } from "../modules/busquedaRapida.js"
import { inicializarNavbarPrincipal } from "../modules/navbarPrincipal.js"

export function inicializarNavbar() {
  inicializarBusquedaRapidaDialogo({
    alLimpiar: (resultados) => renderizarMensajeBusquedaRapida(resultados),
    alIniciarCarga: (resultados) =>
      mostrarSkeletons(resultados, 3, { tamano: "list" }),
    alRecibirResultados: (cartas, resultados) =>
      renderizarListaTabla(resultados, cartas, {
        crearFila: (carta) => crearCartaBusquedaRapida(carta),
        mensajeVacio: "No se encontraron cartas.",
        claseCelda: "p-0 border-0"
      }),
    alOcurrirError: (resultados) => renderizarErrorBusquedaRapida(resultados)
  })

  void inicializarNavbarPrincipal({
    alMostrarUsuarioLogueado: renderUsuarioLogueadoDrawer,
    alMostrarUsuarioInvitado: renderUsuarioInvitadoDrawer
  })
}

inicializarNavbar()
