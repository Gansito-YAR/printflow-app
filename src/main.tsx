// main.tsx — entry point

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { initSession } from "./data/session";

// APP-03b: recupera la sesión guardada (modo supabase) antes de decidir la ruta.
void initSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
