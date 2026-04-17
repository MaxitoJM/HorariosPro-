import { state } from "../core/state.js";

const DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function renderFilters() {
  const teachers = state.teachers.items;
  const classrooms = state.classrooms.items;
  const courses = state.courses.items;

  return `
    <div class="flex gap-3">
      <select id="scheduleViewFilter" class="px-4 py-2 border border-gray-300 rounded-lg">
        <option value="all">Vista general</option>
        <option value="teacher">Por docente</option>
        <option value="classroom">Por aula</option>
        <option value="course">Por curso</option>
      </select>
      <select id="scheduleEntityFilter" class="px-4 py-2 border border-gray-300 rounded-lg">
        <option value="">Todos</option>
        ${teachers.map((item) => `<option value="${item.id}" data-kind="teacher">${item.nombre} ${item.apellido}</option>`).join("")}
        ${classrooms.map((item) => `<option value="${item.id}" data-kind="classroom">${item.codigo} - ${item.edificio}</option>`).join("")}
        ${courses.map((item) => `<option value="${item.id}" data-kind="course">${item.codigo} - ${item.nombre}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderGrid() {
  const meetings = state.scheduling.overview?.meetings || [];
  const timeRows = Array.from(new Set(meetings.map((item) => `${item.horaInicio}-${item.horaFin}`)));

  if (!timeRows.length) {
    return '<div class="text-sm text-gray-500">Todavia no hay reuniones programadas para esta vista.</div>';
  }

  const header = ['<div class="schedule-cell schedule-header"></div>', ...DAYS.map((day) => `<div class="schedule-cell schedule-header capitalize">${day}</div>`)].join("");

  const rows = timeRows
    .map((timeLabel) => {
      const [horaInicio, horaFin] = timeLabel.split("-");
      const cells = DAYS.map((day) => {
        const item = meetings.find((meeting) => meeting.diaSemana === day && `${meeting.horaInicio}-${meeting.horaFin}` === timeLabel);
        if (!item) {
          return '<div class="schedule-cell"></div>';
        }

        return `
          <div class="schedule-cell">
            <div class="class-block">
              <p class="font-semibold">${item.courseCodigo} - ${item.sectionCodigo}</p>
              <p class="text-xs mt-1">${item.teacherNombre}</p>
              <p class="text-xs">${item.classroomNombre}</p>
            </div>
          </div>
        `;
      }).join("");

      return `
        <div class="schedule-cell schedule-time">${horaInicio}<br>${horaFin}</div>
        ${cells}
      `;
    })
    .join("");

  return `<div class="schedule-grid">${header}${rows}</div>`;
}

export function renderHorarios() {
  const counts = state.scheduling.overview?.counts;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Visualizacion de horarios</h2>
          <p class="text-gray-600 mt-2">HU-19 implementada con filtros reales por docente, aula y curso</p>
        </div>
        ${renderFilters()}
      </div>

      ${state.scheduling.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando horario...</div>' : ""}
      ${state.scheduling.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.scheduling.error}</div>` : ""}

      <div class="grid grid-cols-3 gap-4">
        <div class="card p-4"><p class="text-sm text-gray-500">Reuniones</p><p class="text-2xl font-bold text-gray-900">${counts?.totalMeetings ?? 0}</p></div>
        <div class="card p-4"><p class="text-sm text-gray-500">Secciones programadas</p><p class="text-2xl font-bold text-gray-900">${counts?.totalSectionsScheduled ?? 0}</p></div>
        <div class="card p-4"><p class="text-sm text-gray-500">Cursos con horario</p><p class="text-2xl font-bold text-gray-900">${counts?.totalCoursesScheduled ?? 0}</p></div>
      </div>

      <div class="card p-6 overflow-x-auto">
        ${renderGrid()}
      </div>
    </div>
  `;
}
