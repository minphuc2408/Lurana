import "./shared/config/validation";
import { createRoot } from "react-dom/client";
import App from "@/app/App";
import "./styles/index.css";
import { initializeTheme } from './shared/theme/theme-store';
initializeTheme();
createRoot(document.getElementById("root")!).render(<App />);
