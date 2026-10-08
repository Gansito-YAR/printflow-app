// PrintFlow AI — arranque de la sesión (APP-03).
//   mock:     no hay nada que rehidratar.
//   supabase: recupera la sesión guardada por Supabase (recargar no cierra el
//             turno), valida perfil y turno, y escucha los cierres de sesión.

import { dataSource, supabaseGateway } from "./index";
import { getSupabase } from "./supabase/client";
import { setSignOutHook, useSessionStore } from "../store/session";

let started = false;

export async function initSession(): Promise<void> {
  if (started) return;
  started = true;
  const store = useSessionStore.getState();
  if (dataSource !== "supabase" || !supabaseGateway) {
    store.setStatus("ready");
    return;
  }

  const gw = supabaseGateway;
  setSignOutHook(() => gw.signOut());
  store.setStatus("checking");

  try {
    const auth = getSupabase().auth;

    // Cierres de sesión hechos por Supabase (token inválido, otra pestaña): limpiar local.
    auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") useSessionStore.getState().clearLocal();
    });

    const { data } = await auth.getSession();
    const saved = data.session;
    if (saved) {
      const session = await gw.sessionFromToken(saved.access_token, saved.user.id).catch(() => null);
      if (session && Date.now() < Date.parse(session.absoluteDeadline)) {
        useSessionStore.getState().login(session);
      } else {
        // Perfil ya no válido, sin marca de login o turno vencido.
        await gw.signOut();
        useSessionStore.getState().clearLocal();
      }
    }
  } catch {
    // Sin configuración o sin red al abrir: queda en el login.
    useSessionStore.getState().clearLocal();
  } finally {
    useSessionStore.getState().setStatus("ready");
  }
}
