import { apiRequest } from "./http.js";

export function listPrograms({ search = "", deleted = false } = {}) {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (deleted) query.set("deleted", "true");
  const qs = query.toString();
  return apiRequest(`/programs${qs ? `?${qs}` : ""}`);
}

export function createProgram(data) {
  return apiRequest("/programs", { method: "POST", body: JSON.stringify(data) });
}

export function updateProgram(id, data) {
  return apiRequest(`/programs/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteProgram(id) {
  return apiRequest(`/programs/${id}`, { method: "DELETE", body: JSON.stringify({}) });
}
