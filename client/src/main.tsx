import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/lib/i18n"; // Import i18n configuration

// CRITICAL: Import Port Guardian to ensure app is ALWAYS on correct port
import "@/lib/port-guardian";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
