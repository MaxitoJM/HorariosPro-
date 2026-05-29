import { apiRequest } from "./http.js";

export function listPeriods({ deleted = false } = {}) {
  const query = new URLSearchParams();
  if (deleted) query.set("deleted", "true");
  const qs = query.toString();
  return apiRequest(`/academic-periods${qs ? `?${qs}` : ""}`);
}

export function createPeriod(data) {
  return apiRequest("/academic-periods", { method: "POST", body: JSON.stringify(data) });
}

export function updatePeriod(id, data) {
  return apiRequest(`/academic-periods/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deletePeriod(id) {
  return apiRequest(`/academic-periods/${id}`, { method: "DELETE", body: JSON.stringify({}) });
}

export function setCurrentPeriod(id) {
  return apiRequest(`/academic-periods/${id}/set-current`, { method: "POST", body: JSON.stringify({}) });
}
