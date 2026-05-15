import { refreshToken } from "./authApi.js";
import { config } from "./config.js";
import { logoutUser, state } from "../core/state.js";

function extractValidationMessage(payload) {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  if (!fieldErrors) return null;
  const messages = Object.values(fieldErrors).flat().filter(Boolean);
  return messages.length > 0 ? messages[0] : null;
}

async function rawRequest(path, options = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${state.accessToken}`,
      ...(options.headers || {})
    },
    ...options
  });

  if (options.expectText) {
    return { response, payload: await response.text() };
  }

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
    if (options.expectText) {
      throw new Error(result.payload || "Error inesperado");
    }

    const message = extractValidationMessage(result.payload) || result.payload?.error?.message || "Error inesperado";
    throw new Error(message);
  }

  return options.expectText ? result.payload : result.payload.data;
}

function buildScheduleQuery(filters = {}) {
  const query = new URLSearchParams({
    view: filters.view || "all",
    includeUnscheduled: filters.includeUnscheduled === false ? "false" : "true"
  });

  if (filters.entityId) query.set("entityId", filters.entityId);
  if (filters.department) query.set("department", filters.department);
  return query.toString();
}

export function getScheduleReport(filters) {
  return request(`/reports/schedule?${buildScheduleQuery(filters)}`);
}

export function exportScheduleCsv(filters) {
  return request(`/reports/schedule/export?${buildScheduleQuery(filters)}&format=csv`, {
    expectText: true
  });
}
