// main.tsx — entry point

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Tipografía de la marca (Barlow), servida con la app: funciona sin red.
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-700.css";
import "@fontsource/barlow/latin-800.css";
import "./styles/global.css";
import { initSession } from "./data/session";
import { initInstallPrompt } from "./store/install";
import { initPwa } from "./pwa";

initInstallPrompt();
initPwa();

// APP-03b: recupera la sesión guardada (modo supabase) antes de decidir la ruta.
void initSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
