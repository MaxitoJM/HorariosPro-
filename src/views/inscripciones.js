import { state } from "../core/state.js";
import { h } from "../core/dom.js";

const ESTADO_BADGES = {
  inscrito: "bg-green-100 text-green-700",
  retirado: "bg-gray-200 text-gray-600",
  aprobado: "bg-blue-100 text-blue-700",
  reprobado: "bg-red-100 text-red-700"
};

// Aplana las secciones de todos los cursos cargados para el selector.
function sectionOptions(selectedId) {
  const opts = state.courses.items.flatMap((c) =>
    (c.sections || []).map(
      (sec) =>
        `<option value="${sec.id}" ${sec.id === selectedId ? "selected" : ""}>${h(c.codigo)} - ${h(c.nombre)} / Secc ${h(sec.codigoSeccion)} (${sec.inscritos}/${sec.capacidad})</option>`
    )
  );
  return ['<option value="">Selecciona una sección...</option>', ...opts].join("");
}

function studentOptions() {
  const opts = state.students.items.map(
    (s) => `<option value="${s.id}">${h(s.codigo)} - ${h(s.nombre)} ${h(s.apellido)}</option>`
  );
  return ['<option value="">Selecciona un estudiante...</option>', ...opts].join("");
}

function renderRows(items) {
  if (!items.length) {
    return `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No hay inscripciones para el filtro actual.</td></tr>`;
  }
  return items
    .map(
      (e) => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-6 py-3 font-medium text-gray-800">${h(e.student?.codigo || "")}<div class="text-xs text-gray-500">${h(e.student ? `${e.student.nombre} ${e.student.apellido}` : "")}</div></td>
        <td class="px-6 py-3 text-sm">${h(e.section?.course?.codigo || "")} / ${h(e.section?.codigoSeccion || "")}</td>
        <td class="px-6 py-3 text-sm text-gray-600">${h(e.periodo?.codigo || "")}</td>
        <td class="px-6 py-3"><span class="px-2 py-1 rounded-full text-xs font-medium ${ESTADO_BADGES[e.estado] || "bg-gray-100"}">${h(e.estado)}</span></td>
        <td class="px-6 py-3 text-right whitespace-nowrap">
          ${e.estado === "inscrito" ? `<button data-withdraw-enrollment="${e.id}" class="text-red-600 hover:underline text-sm">Retirar</button>` : ""}
        </td>
      </tr>`
    )
    .join("");
}

export function renderInscripciones() {
  const s = state.enrollments;
  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Inscripciones</h2>
          <p class="text-gray-600 mt-2">Inscripción de estudiantes en secciones (${s.items.length})</p>
        </div>
        <button id="reloadEnrollments" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>
      ${s.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando...</div>' : ""}
      ${s.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${h(s.error)}</div>` : ""}
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-4">
          <div class="card p-4 flex items-end gap-3">
            <label class="flex-1 text-xs text-gray-500">Filtrar por sección
              <select id="enrollFilterSection" class="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg">${sectionOptions(s.filters.sectionId)}</select>
            </label>
            <button id="enrollFilterBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Filtrar</button>
          </div>
          <div class="card overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th class="px-6 py-3">Estudiante</th><th class="px-6 py-3">Sección</th><th class="px-6 py-3">Periodo</th><th class="px-6 py-3">Estado</th><th class="px-6 py-3"></th></tr>
              </thead>
              <tbody>${renderRows(s.items)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <form id="enrollForm" class="card p-6 space-y-3">
            <h3 class="text-lg font-semibold text-gray-800">Nueva inscripción</h3>
            <p class="text-xs text-gray-500">Usa el periodo actual automáticamente.</p>
            <select id="enrollStudent" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>${studentOptions()}</select>
            <select id="enrollSection" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>${sectionOptions("")}</select>
            <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">Inscribir</button>
          </form>
        </div>
      </div>
    </div>`;
}
