import { config } from "./config.js";
import { refreshToken } from "./authApi.js";
import { logoutUser, state } from "../core/state.js";

function extractValidationMessage(payload) {
  const fieldErrors = payload?.error?.details?.fieldErrors;
  if (!fieldErrors) {
    return null;
  }

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

export async function fetchScheduleConfigBundle() {
  const [groupsResponse, rulesResponse, configResponse] = await Promise.all([
    request("/schedule-config/time-slot-groups"),
    request("/schedule-config/rules"),
    request("/schedule-config/academic-config")
  ]);

  return {
    groups: groupsResponse.items,
    rules: rulesResponse.items,
    academicConfig: configResponse.item
  };
}

export function createTimeSlotGroup(data) {
  return request("/schedule-config/time-slot-groups", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateTimeSlotGroup(id, data) {
  return request(`/schedule-config/time-slot-groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteTimeSlotGroup(id) {
  return request(`/schedule-config/time-slot-groups/${id}`, {
    method: "DELETE",
    body: JSON.stringify({})
  });
}

export function createTimeBlock(data) {
  return request("/schedule-config/time-blocks", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function updateTimeBlock(id, data) {
  return request(`/schedule-config/time-blocks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export function deleteTimeBlock(id) {
  return request(`/schedule-config/time-blocks/${id}`, {
    method: "DELETE",
    body: JSON.stringify({})
  });
}

export function updateRules(rules) {
  return request("/schedule-config/rules", {
    method: "PUT",
    body: JSON.stringify({ rules })
  });
}

export function updateAcademicConfig(data) {
  return request("/schedule-config/academic-config", {
    method: "PUT",
    body: JSON.stringify(data)
  });
}
