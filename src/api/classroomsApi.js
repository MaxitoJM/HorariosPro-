import { config } from "./config.js";
import { refreshToken } from "./authApi.js";
import { logoutUser, state } from "../core/state.js";

function extractValidationMessage(payload) {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  if (!fieldErrors) return null;

  const messages = Object.values(fieldErrors)
    .flat()
    .filter(Boolean);

  return messages.length > 0 ? messages[0] : null;
}

async function rawRequest(path, options = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.accessToken}`,
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function request(path, options = {}) {
  let result = await rawRequest(path, options);

  if (result.response.status === 401) {
    try {
      const session = await refreshToken();
      state.isLoggedIn = true;
      state.currentUser = session.user;
      state.accessToken = session.accessToken;
      sessionStorage.setItem("nucleo_access_token", session.accessToken);
      localStorage.setItem("nucleo_user", JSON.stringify(session.user));
      result = await rawRequest(path, options);
    } catch {
      logoutUser();
      throw new Error("Tu sesion expiro. Inicia sesion nuevamente.");
    }
  }

  if (!result.response.ok) {
    const message =
      extractValidationMessage(result.payload) ||
      result.payload?.error?.message ||
      "Error inesperado";
    throw new Error(message);
  }

  return result.payload.data;
}

export function listClassrooms() {
  return request("/classrooms");
}

export function createClassroom(data) {
  return request("/classrooms", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateClassroom(id, data) {
  return request(`/classrooms/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteClassroom(id) {
  return request(`/classrooms/${id}`, {
    method: "DELETE",
    body: JSON.stringify({})
  });
}

export function updateClassroomAvailability(id, availability) {
  return request(`/classrooms/${id}/availability`, {
    method: "PUT",
    body: JSON.stringify({ availability })
  });
}
