import { state } from "../core/state.js";

function renderSectionOptions() {
  const sections = state.courses.items.flatMap((course) =>
    course.sections.map((section) => ({
      id: section.id,
      label: `${course.codigo} - ${course.nombre} / Seccion ${section.codigoSeccion}`,
      hasTeacher: Boolean(section.teacherId)
    }))
  );

  return [
    '<option value="">Selecciona una seccion...</option>',
    ...sections.map(
      (section) =>
        `<option value="${section.id}" ${state.scheduling.selectedSectionId === section.id ? "selected" : ""}>${section.label}${section.hasTeacher ? "" : " (sin docente)"}</option>`
    )
  ].join("");
}

function renderSlotOptions() {
  const context = state.scheduling.manualContext;
  if (!context) {
    return '<div class="text-sm text-gray-500">Selecciona una seccion para consultar sus bloques disponibles.</div>';
  }

  return context.slotOptions
    .map(
      (slot) => `
        <label class="flex items-center gap-3 p-3 border ${slot.disabled ? "border-red-200 bg-red-50 opacity-70" : "border-gray-200 hover:border-blue-400"} rounded-lg cursor-pointer">
          <input type="checkbox" class="manual-slot" value="${slot.diaSemana}::${slot.timeBlockId}" ${slot.disabled ? "disabled" : ""}>
          <div>
            <p class="font-medium text-sm text-gray-800">${slot.label}</p>
            <p class="text-xs ${slot.disabled ? "text-red-600" : "text-gray-500"}">${slot.reason || slot.grupo}</p>
          </div>
        </label>
      `
    )
    .join("");
}

function renderClassroomOptions() {
  const context = state.scheduling.manualContext;
  if (!context) {
    return '<option value="">Selecciona una seccion primero</option>';
  }

  return [
    '<option value="">Selecciona un aula...</option>',
    ...context.classroomOptions.map(
      (classroom) =>
        `<option value="${classroom.id}" ${context.section.assignedClassroomId === classroom.id ? "selected" : ""}>${classroom.codigo} - ${classroom.edificio} (cap. ${classroom.capacidad})</option>`
    )
  ].join("");
}

function renderAssignedMeetings() {
  const items = state.scheduling.manualContext?.section.assignedMeetings || [];
  if (!items.length) {
    return '<p class="text-sm text-gray-500">Esta seccion aun no tiene reuniones programadas.</p>';
  }

  return items
    .map((item) => `<div class="px-3 py-2 rounded-lg bg-blue-50 text-blue-800 text-sm">${item.label}</div>`)
    .join("");
}

export function renderAsignacion() {
  const context = state.scheduling.manualContext;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Asignacion de Horarios</h2>
          <p class="text-gray-600 mt-2">HU-18: Asignacion manual de horarios por seccion</p>
        </div>
        <button id="reloadScheduling" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${state.scheduling.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando contexto de asignacion...</div>' : ""}
      ${state.scheduling.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.scheduling.error}</div>` : ""}

      <div class="grid grid-cols-3 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">1. Seleccionar seccion</h3>
          <select id="manualSectionSelector" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
            ${renderSectionOptions()}
          </select>
          ${
            context
              ? `<div class="mt-4 p-4 rounded-xl bg-blue-50">
                  <p class="font-semibold text-gray-900">${context.section.course.codigo} - ${context.section.course.nombre}</p>
                  <p class="text-sm text-gray-600 mt-1">Seccion ${context.section.codigoSeccion} / ${context.section.teacher.nombre} ${context.section.teacher.apellido}</p>
                  <p class="text-sm text-gray-600">Sesiones requeridas: ${context.requiredSessions}</p>
                </div>`
              : ""
          }
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">2. Seleccionar bloques</h3>
          <div id="manualSlotOptions" class="space-y-2 max-h-[420px] overflow-y-auto">
            ${renderSlotOptions()}
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">3. Seleccionar aula y guardar</h3>
          <form id="manualAssignmentForm" class="space-y-4">
            <select id="manualClassroomSelector" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
              ${renderClassroomOptions()}
            </select>
            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold" ${context ? "" : "disabled"}>Guardar asignacion manual</button>
          </form>

          <div class="mt-6">
            <h4 class="font-semibold text-gray-800 mb-3">Programacion actual</h4>
            <div class="space-y-2">
              ${renderAssignedMeetings()}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
