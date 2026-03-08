import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply dark mode from localStorage on initial load (prevent flash)
const settings = localStorage.getItem('nc_settings');
if (settings) {
  try {
    const parsed = JSON.parse(settings);
    if (parsed.darkMode) document.documentElement.classList.add('dark');
  } catch {}
}

createRoot(document.getElementById("root")!).render(<App />);
