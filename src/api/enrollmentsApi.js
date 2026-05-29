import { apiRequest } from "./http.js";

export function listEnrollments({ sectionId = "", studentId = "", periodoId = "", estado = "" } = {}) {
  const query = new URLSearchParams();
  if (sectionId) query.set("sectionId", sectionId);
  if (studentId) query.set("studentId", studentId);
  if (periodoId) query.set("periodoId", periodoId);
  if (estado) query.set("estado", estado);
  const qs = query.toString();
  return apiRequest(`/enrollments${qs ? `?${qs}` : ""}`);
}

export function enroll(data) {
  return apiRequest("/enrollments", { method: "POST", body: JSON.stringify(data) });
}

export function setEnrollmentStatus(id, estado) {
  return apiRequest(`/enrollments/${id}/status`, { method: "PATCH", body: JSON.stringify({ estado }) });
}

export function withdrawEnrollment(id) {
  return apiRequest(`/enrollments/${id}`, { method: "DELETE", body: JSON.stringify({}) });
}
