// Resolución de la URL del API en runtime, sin bundler.
//
// Orden de precedencia:
//   1) window.__API_BASE_URL__   → seteable en index.html (o por Vercel inyectando
//                                  un script previo a main.js). Útil para producción
//                                  sin reconstruir nada.
//   2) Heurística por hostname    → si la app corre en localhost/127.0.0.1 asume
//                                  que el backend está en http://localhost:4000.
//   3) Fallback                   → mismo origen + /api/v1 (cubre el caso de un
//                                  reverse-proxy o backend bajo el mismo dominio).
//
// En producción (Vercel): define window.__API_BASE_URL__ con la URL HTTPS
// pública del backend (ej. https://horarios-pro-api.onrender.com/api/v1).

const LOCAL_API_URL = "http://localhost:4000/api/v1";

function resolveApiBaseUrl() {
  if (typeof window === "undefined") {
    return LOCAL_API_URL;
  }

  const override = window.__API_BASE_URL__;
  if (typeof override === "string" && override.length > 0) {
    return override.replace(/\/$/, "");
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return LOCAL_API_URL;
  }

  // Último recurso: mismo origen. Si el backend no está expuesto aquí
  // las llamadas fallarán con un error de red claro y predecible.
  console.warn(
    "[config] window.__API_BASE_URL__ no está definido. " +
      "Usando el origen actual como fallback. " +
      "Define window.__API_BASE_URL__ en index.html para apuntar al backend público."
  );
  return `${window.location.origin}/api/v1`;
}

export const config = {
  apiBaseUrl: resolveApiBaseUrl()
};
