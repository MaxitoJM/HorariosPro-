import { config } from "./config.js";
import { refreshToken } from "./authApi.js";
import { logoutUser, state } from "../core/state.js";

function extractValidationMessage(payload) {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  if (!fieldErrors) return null;
  const messages = Object.values(fieldErrors).flat().filter(Boolean);
  return messages.length > 0 ? messages[0] : null;
}

async function rawRequest(path, options = {}) {
  // Si el body es FormData, NO fijar Content-Type (el navegador pone el boundary).
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${state.accessToken}`,
      ...(options.headers || {})
    },
    ...options
  });
  return response;
}

async function request(path, options = {}) {
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

export function listStudents({ search = "", programId = "", estado = "", page = 1, pageSize = 50 } = {}) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) query.set("search", search);
  if (programId) query.set("programId", programId);
  if (estado) query.set("estado", estado);
  return request(`/students?${query.toString()}`);
}

export function createStudent(data) {
  return request("/students", { method: "POST", body: JSON.stringify(data) });
}

export function updateStudent(id, data) {
  return request(`/students/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteStudent(id) {
  return request(`/students/${id}`, { method: "DELETE", body: JSON.stringify({}) });
}

export function previewStudentImport(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/students/import/preview", { method: "POST", body: form });
}

export function commitStudentImport(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/students/import/commit", { method: "POST", body: form });
}

// Descarga la plantilla .xlsx (blob) respetando el token de sesion.
export async function downloadStudentTemplate() {
  const response = await rawRequest("/students/import/template", { method: "GET" });
  if (!response.ok) throw new Error("No se pudo descargar la plantilla");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla-estudiantes.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
