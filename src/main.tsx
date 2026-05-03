import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Reset iOS viewport zoom when input loses focus (fixes zoom-in not reverting on tap elsewhere)
document.addEventListener('focusout', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
    const vp = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!vp) return;
    vp.content = 'width=device-width, initial-scale=1, maximum-scale=1';
    requestAnimationFrame(() => {
      vp.content = 'width=device-width, initial-scale=1.0';
    });
  }
});

createRoot(document.getElementById("root")!).render(<App />);
