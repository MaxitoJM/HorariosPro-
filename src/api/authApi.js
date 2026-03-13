import { config } from "./config.js";

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

async function request(path, options = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      extractValidationMessage(payload) ||
      payload?.error?.message ||
      "Error inesperado";
    throw new Error(message);
  }

  return payload.data;
}

export function register(data) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function login(data) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export function refreshToken() {
  return request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function me(accessToken) {
  return request("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function logout() {
  return request("/auth/logout", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export function forgotPassword(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export function resetPassword(data) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
