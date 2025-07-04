import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/lib/i18n"; // Import i18n configuration

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
