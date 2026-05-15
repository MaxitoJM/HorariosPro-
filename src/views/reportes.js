import { state } from "../core/state.js";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-CO");
}

function renderEntityOptions() {
  const { view, entityId } = state.reports.filters;
  const collections = {
    teacher: state.teachers.items.map((item) => ({ id: item.id, label: `${item.nombre} ${item.apellido}` })),
    classroom: state.classrooms.items.map((item) => ({ id: item.id, label: `${item.codigo} - ${item.edificio}` })),
    course: state.courses.items.map((item) => ({ id: item.id, label: `${item.codigo} - ${item.nombre}` }))
  };

  const options = collections[view] || [];
  if (!options.length) {
    return '<option value="">Todos</option>';
  }

  return [
    '<option value="">Todos</option>',
    ...options.map((item) => `<option value="${item.id}" ${entityId === item.id ? "selected" : ""}>${item.label}</option>`)
  ].join("");
}

function renderFilters() {
  const filters = state.reports.filters;

  return `
    <div class="card p-4 report-controls">
      <div class="grid grid-cols-5 gap-3">
        <label class="text-sm text-gray-600">
          <span class="block mb-1">Vista</span>
          <select id="reportsViewFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="all" ${filters.view === "all" ? "selected" : ""}>General</option>
            <option value="teacher" ${filters.view === "teacher" ? "selected" : ""}>Docente</option>
            <option value="classroom" ${filters.view === "classroom" ? "selected" : ""}>Aula</option>
            <option value="course" ${filters.view === "course" ? "selected" : ""}>Curso</option>
          </select>
        </label>
        <label class="text-sm text-gray-600">
          <span class="block mb-1">Entidad</span>
          <select id="reportsEntityFilter" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            ${renderEntityOptions()}
          </select>
        </label>
        <label class="text-sm text-gray-600">
          <span class="block mb-1">Departamento</span>
          <input id="reportsDepartmentFilter" value="${filters.department || ""}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Todos">
        </label>
        <label class="text-sm text-gray-600 flex items-end gap-2 pb-2">
          <input id="reportsIncludePending" type="checkbox" ${filters.includeUnscheduled ? "checked" : ""}>
          <span>Incluir pendientes</span>
        </label>
        <div class="flex items-end gap-2">
          <button id="reloadReports" class="px-4 py-2 bg-gray-900 text-white rounded-lg">Recargar</button>
          <button id="exportReportsCsv" class="px-4 py-2 bg-blue-600 text-white rounded-lg">${state.reports.exporting ? "Exportando..." : "CSV"}</button>
          <button id="printReports" class="px-4 py-2 border border-gray-300 rounded-lg">Imprimir</button>
        </div>
      </div>
      ${state.reports.exportError ? `<p class="text-sm text-red-700 mt-3">${state.reports.exportError}</p>` : ""}
    </div>
  `;
}

function renderSummary() {
  const summary = state.reports.schedule?.summary;
  const items = [
    ["Secciones", summary?.totalSections ?? 0],
    ["Programadas", summary?.scheduledSections ?? 0],
    ["Pendientes", summary?.pendingSections ?? 0],
    ["Cumplimiento", `${summary?.completionPercentage ?? 0}%`],
    ["Reuniones", summary?.scheduledMeetings ?? 0],
    ["Horas", summary?.scheduledHours ?? 0]
  ];

  return `
    <div class="grid grid-cols-6 gap-4">
      ${items
        .map(
          ([label, value]) => `
            <div class="card p-4">
              <p class="text-sm text-gray-500">${label}</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">${value}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderDayBreakdown() {
  const days = state.reports.schedule?.byDay || [];
  const max = Math.max(...days.map((item) => item.totalMeetings), 1);

  return `
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Distribucion por dia</h3>
      <div class="space-y-3">
        ${days
          .map(
            (item) => `
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="capitalize text-gray-600">${item.diaSemana}</span>
                  <span class="font-medium">${item.totalMeetings}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" style="width:${Math.round((item.totalMeetings / max) * 100)}%"></div>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderDepartmentBreakdown() {
  const items = state.reports.schedule?.byDepartment || [];
  if (!items.length) {
    return '<div class="card p-6 text-sm text-gray-500">No hay datos por departamento.</div>';
  }

  return `
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Avance por departamento</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="py-2">Departamento</th>
              <th class="py-2">Secciones</th>
              <th class="py-2">Programadas</th>
              <th class="py-2">Pendientes</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
                  <tr class="border-b last:border-b-0">
                    <td class="py-2 font-medium text-gray-800">${item.departamento}</td>
                    <td class="py-2">${item.totalSections}</td>
                    <td class="py-2">${item.scheduledSections}</td>
                    <td class="py-2">${item.pendingSections}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMeetingsTable() {
  const meetings = state.reports.schedule?.meetings || [];
  if (!meetings.length) {
    return '<div class="card p-6 text-sm text-gray-500">No hay reuniones programadas para los filtros seleccionados.</div>';
  }

  return `
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Horario consolidado</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b">
              <th class="py-2">Dia</th>
              <th class="py-2">Hora</th>
              <th class="py-2">Curso</th>
              <th class="py-2">Seccion</th>
              <th class="py-2">Docente</th>
              <th class="py-2">Aula</th>
              <th class="py-2">Inscritos</th>
            </tr>
          </thead>
          <tbody>
            ${meetings
              .map(
                (item) => `
                  <tr class="border-b last:border-b-0">
                    <td class="py-2 capitalize">${item.diaSemana}</td>
                    <td class="py-2">${item.horaInicio}-${item.horaFin}</td>
                    <td class="py-2 font-medium text-gray-800">${item.courseCodigo}</td>
                    <td class="py-2">${item.sectionCodigo}</td>
                    <td class="py-2">${item.teacherNombre}</td>
                    <td class="py-2">${item.classroomNombre}</td>
                    <td class="py-2">${item.inscritos}/${item.capacidad}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPendingSections() {
  const items = state.reports.schedule?.unscheduledSections || [];
  if (!items.length) {
    return '<div class="card p-6 text-sm text-gray-500">No hay secciones pendientes para los filtros seleccionados.</div>';
  }

  return `
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Secciones pendientes</h3>
      <div class="grid grid-cols-2 gap-3">
        ${items
          .map(
            (item) => `
              <div class="border border-amber-200 bg-amber-50 rounded-lg p-3">
                <p class="font-semibold text-gray-900">${item.courseCodigo}/${item.sectionCodigo}</p>
                <p class="text-sm text-gray-600">${item.courseNombre}</p>
                <p class="text-xs text-gray-500 mt-1">${item.teacherNombre} - ${item.sesionesRequeridas} sesiones</p>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

export function renderReportes() {
  return `
    <div class="p-8 space-y-6 report-print-area">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Reportes operativos</h2>
          <p class="text-gray-600 mt-2">HU-32: reportes de horarios para analizar la planificacion academica</p>
        </div>
        <p class="text-sm text-gray-500">Actualizado: ${formatDate(state.reports.schedule?.generatedAt)}</p>
      </div>

      ${renderFilters()}
      ${state.reports.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando reportes...</div>' : ""}
      ${state.reports.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.reports.error}</div>` : ""}

      ${renderSummary()}
      <div class="grid grid-cols-2 gap-6">
        ${renderDayBreakdown()}
        ${renderDepartmentBreakdown()}
      </div>
      ${renderMeetingsTable()}
      ${renderPendingSections()}
    </div>
  `;
}
