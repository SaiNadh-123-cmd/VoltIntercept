import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { MissionProvider } from "./context/MissionContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MissionProvider>
      <App />
    </MissionProvider>
  </StrictMode>,
);
