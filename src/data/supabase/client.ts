// PrintFlow AI — cliente de Supabase (solo modo VITE_DATA_SOURCE=supabase).
// Se crea en diferido: en modo mock nunca se instancia ni exige variables.
// Solo la clave pública "anon": la seguridad la ponen RLS y las RPC (ARQ-02).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export class ConfigError extends Error {
  constructor() {
    super("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
    this.name = "ConfigError";
  }
}

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ConfigError();
  client = createClient(url, key, {
    // La sesión persiste: recargar la app no cierra el turno (APP-D-09).
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
