import { state } from "../core/state.js";

function renderMeetings(meetings) {
  if (!meetings?.length) return "Sin horario";
  return meetings.map((item) => `${item.diaSemana.slice(0, 3)} ${item.horaInicio}-${item.horaFin}`).join(" | ");
}

function renderEnrolled() {
  if (!state.enrollment.enrolled.length) {
    return '<p class="text-sm text-gray-500">Aun no tienes grupos inscritos.</p>';
  }

  return state.enrollment.enrolled
    .map(
      (item) => `
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex justify-between gap-4">
            <div>
              <p class="font-semibold text-gray-900">${item.courseCodigo}/${item.codigoSeccion}</p>
              <p class="text-sm text-gray-600">${item.courseNombre}</p>
              <p class="text-xs text-gray-500 mt-1">${renderMeetings(item.meetings)}</p>
            </div>
            <button class="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded" data-withdraw="${item.id}">Retirar</button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderSectionCards() {
  if (!state.enrollment.availableSections.length) {
    return '<div class="card p-6 text-sm text-gray-500">No hay grupos disponibles.</div>';
  }

  return state.enrollment.availableSections
    .map(
      (item) => `
        <div class="card p-5">
          <div class="flex justify-between gap-4">
            <div>
              <p class="font-semibold text-gray-900">${item.courseCodigo}/${item.codigoSeccion}</p>
              <p class="text-sm text-gray-600">${item.courseNombre}</p>
              <p class="text-xs text-gray-500 mt-2">${item.teacherNombre}</p>
              <p class="text-xs text-gray-500">${renderMeetings(item.meetings)}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-800">${item.cuposDisponibles}/${item.capacidad}</p>
              <p class="text-xs text-gray-500">cupos</p>
            </div>
          </div>
          ${item.disabledReason ? `<p class="text-sm text-amber-700 mt-4">${item.disabledReason}</p>` : ""}
          <button class="w-full mt-4 py-2 rounded-lg ${item.canEnroll ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}" data-enroll="${item.id}" ${item.canEnroll ? "" : "disabled"}>
            ${item.isEnrolled ? "Inscrito" : "Inscribirme"}
          </button>
        </div>
      `
    )
    .join("");
}

export function renderInscripcion() {
  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Inscripcion de grupos</h2>
          <p class="text-gray-600 mt-2">HU-22: inscribirse a grupos para definir horario</p>
        </div>
        <button id="reloadEnrollment" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${state.enrollment.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando inscripciones...</div>' : ""}
      ${state.enrollment.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.enrollment.error}</div>` : ""}

      <div class="grid grid-cols-3 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Mi horario inscrito</h3>
          <div class="space-y-3">${renderEnrolled()}</div>
        </div>
        <div class="col-span-2 grid grid-cols-2 gap-4">
          ${renderSectionCards()}
        </div>
      </div>
    </div>
  `;
}
