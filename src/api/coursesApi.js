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

export function listCourses() {
  return request("/courses");
}

export function createCourse(data) {
  return request("/courses", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateCourse(id, data) {
  return request(`/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteCourse(id) {
  return request(`/courses/${id}`, {
    method: "DELETE",
    body: JSON.stringify({})
  });
}

export function createCourseSection(courseId, data) {
  return request(`/courses/${courseId}/sections`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateCourseSection(courseId, sectionId, data) {
  return request(`/courses/${courseId}/sections/${sectionId}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteCourseSection(courseId, sectionId) {
  return request(`/courses/${courseId}/sections/${sectionId}`, {
    method: "DELETE",
    body: JSON.stringify({})
  });
}
