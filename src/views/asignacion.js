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

function renderAutoGeneratePanel() {
  const s = state.scheduling;
  const autoResult = s.autoGenerateResult;

  return `
    <div class="card p-6">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">Generacion Automatica (HU-21)</h3>
          <p class="text-sm text-gray-500 mt-1">Asigna horarios a todas las secciones sin programar que tienen docente asignado.</p>
        </div>
        <button id="autoGenerateBtn" class="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm ${s.autoGenerating ? 'opacity-60 cursor-not-allowed' : ''}">
          ${s.autoGenerating ? '⏳ Generando...' : '⚡ Generar Automaticamente'}
        </button>
      </div>

      ${s.autoGenerateError ? `<div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">${s.autoGenerateError}</div>` : ''}

      ${autoResult ? `
        <div class="mt-4 space-y-3">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-2xl font-bold text-gray-700">${autoResult.total}</p>
              <p class="text-xs text-gray-500 mt-1">Secciones procesadas</p>
            </div>
            <div class="p-3 bg-green-50 rounded-lg">
              <p class="text-2xl font-bold text-green-600">${autoResult.assigned.length}</p>
              <p class="text-xs text-gray-500 mt-1">Asignadas exitosamente</p>
            </div>
            <div class="p-3 bg-orange-50 rounded-lg">
              <p class="text-2xl font-bold text-orange-600">${autoResult.skipped.length}</p>
              <p class="text-xs text-gray-500 mt-1">No pudieron asignarse</p>
            </div>
          </div>

          ${autoResult.assigned.length > 0 ? `
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">✅ Asignadas:</p>
              <div class="space-y-1 max-h-40 overflow-y-auto">
                ${autoResult.assigned.map(a => `
                  <div class="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                    <span class="font-medium text-green-800">${a.sectionLabel}</span>
                    <span class="text-gray-500">→</span>
                    <span class="text-gray-700">${a.classroomCodigo}</span>
                    <span class="text-gray-400 text-xs">${a.meetingLabels.join(' | ')}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${autoResult.skipped.length > 0 ? `
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">⚠️ No asignadas:</p>
              <div class="space-y-1 max-h-32 overflow-y-auto">
                ${autoResult.skipped.map(s => `
                  <div class="text-sm p-2 bg-orange-50 rounded">
                    <span class="font-medium text-orange-800">${s.sectionLabel}:</span>
                    <span class="text-gray-600 ml-1">${s.reason}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderAsignacion() {
  const context = state.scheduling.manualContext;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Asignacion de Horarios</h2>
          <p class="text-gray-600 mt-2">HU-18/HU-21/HU-23: Asignacion manual, generacion automatica y reasignacion</p>
        </div>
        <button id="reloadScheduling" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${state.scheduling.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando contexto de asignacion...</div>' : ""}
      ${state.scheduling.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.scheduling.error}</div>` : ""}

      ${renderAutoGeneratePanel()}

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
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-gray-800">Programacion actual</h4>
              ${context && context.section.assignedMeetings.length > 0
                ? `<button id="reassignSectionBtn" class="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition">↺ Reasignar</button>`
                : ''}
            </div>
            <div id="reassignMsg" class="hidden mb-2 p-3 rounded-lg text-xs font-medium"></div>
            <div class="space-y-2">
              ${renderAssignedMeetings()}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
