// PrintFlow AI — punto único de acceso a datos (APP-01, APP-D-01).
//   VITE_DATA_SOURCE=mock     → MockGateway (por defecto; habilita /demo)
//   VITE_DATA_SOURCE=supabase → SupabaseGateway (base real)
// Las pantallas importan `gateway` desde aquí, nunca desde mocks/ ni supabase/.

import type { PrintflowGateway } from "./gateway";
import { gateway as mockGateway } from "./mocks/mockGateway";
import { SupabaseGateway } from "./supabase/supabaseGateway";

export type DataSource = "mock" | "supabase";

export const dataSource: DataSource = import.meta.env.VITE_DATA_SOURCE === "supabase" ? "supabase" : "mock";

export const isMock = dataSource === "mock";

export const supabaseGateway: SupabaseGateway | null = dataSource === "supabase" ? new SupabaseGateway() : null;

export const gateway: PrintflowGateway = supabaseGateway ?? mockGateway;
