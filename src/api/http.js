import { config } from "./config.js";
import { refreshToken } from "./authApi.js";
import { logoutUser, state } from "../core/state.js";

// Cliente HTTP compartido con refresh automatico de token y manejo de errores.
// Usado por los modulos academicos (periodos, programas, inscripciones).

function extractValidationMessage(payload) {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  if (!fieldErrors) return null;
  const messages = Object.values(fieldErrors).flat().filter(Boolean);
  return messages.length > 0 ? messages[0] : null;
}

async function rawRequest(path, options = {}) {
  const isForm = options.body instanceof FormData;
  return fetch(`${config.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${state.accessToken}`,
      ...(options.headers || {})
    },
    ...options
  });
}

export async function apiRequest(path, options = {}) {
  let response = await rawRequest(path, options);
  if (response.status === 401) {
    try {
      const session = await refreshToken();
      state.isLoggedIn = true;
      state.currentUser = session.user;
      state.accessToken = session.accessToken;
      sessionStorage.setItem("nucleo_access_token", session.accessToken);
      localStorage.setItem("nucleo_user", JSON.stringify(session.user));
      response = await rawRequest(path, options);
    } catch {
      logoutUser();
      throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
    }
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(extractValidationMessage(payload) || payload?.error?.message || "Error inesperado");
  }
  return payload.data;
}

// Descarga un endpoint como archivo (blob) respetando el token de sesion.
export async function apiDownload(path, filename) {
  const response = await rawRequest(path, { method: "GET" });
  if (!response.ok) throw new Error("No se pudo descargar el archivo");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
