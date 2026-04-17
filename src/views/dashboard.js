import { state } from "../core/state.js";

function renderActivity(items) {
  if (!items.length) {
    return '<p class="text-sm text-gray-500">Aun no hay actividad registrada.</p>';
  }

  return items
    .map(
      (item) => `
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-semibold">
            ${item.action.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800">${item.action}</p>
            <p class="text-xs text-gray-500">${new Date(item.createdAt).toLocaleString("es-CO")}</p>
          </div>
        </div>
      `
    )
    .join("");
}

export function renderDashboard() {
  const { summary, loading, error } = state.dashboard;
  const stats = summary?.stats;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Dashboard operativo</h2>
          <p class="text-gray-600 mt-2">Estado real de configuracion, asignacion manual y visualizacion de horarios</p>
        </div>
        <button id="reloadDashboard" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando resumen del sistema...</div>' : ""}
      ${error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${error}</div>` : ""}

      <div class="grid grid-cols-4 gap-6">
        <div class="card p-6"><p class="text-sm text-gray-500">Docentes activos</p><p class="text-3xl font-bold text-gray-900 mt-2">${stats?.teachers ?? "-"}</p></div>
        <div class="card p-6"><p class="text-sm text-gray-500">Cursos activos</p><p class="text-3xl font-bold text-gray-900 mt-2">${stats?.courses ?? "-"}</p></div>
        <div class="card p-6"><p class="text-sm text-gray-500">Aulas activas</p><p class="text-3xl font-bold text-gray-900 mt-2">${stats?.classrooms ?? "-"}</p></div>
        <div class="card p-6"><p class="text-sm text-gray-500">Reuniones programadas</p><p class="text-3xl font-bold text-gray-900 mt-2">${stats?.meetings ?? "-"}</p></div>
      </div>

      <div class="grid grid-cols-3 gap-6">
        <div class="card p-6 col-span-2">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Progreso de programacion</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-2">
                <span class="text-gray-600">Secciones con horario</span>
                <span class="font-medium">${stats?.scheduledSections ?? 0} programadas / ${((stats?.scheduledSections ?? 0) + (stats?.pendingSections ?? 0)) || 0} totales</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-blue-600 h-3 rounded-full" style="width:${stats?.schedulingProgress ?? 0}%"></div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="p-4 rounded-xl bg-gray-50">
                <p class="text-sm text-gray-500">Progreso</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">${stats?.schedulingProgress ?? 0}%</p>
              </div>
              <div class="p-4 rounded-xl bg-gray-50">
                <p class="text-sm text-gray-500">Pendientes</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">${stats?.pendingSections ?? 0}</p>
              </div>
              <div class="p-4 rounded-xl bg-gray-50">
                <p class="text-sm text-gray-500">Capacidad total</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">${stats?.totalAssignableCapacity ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Actividad reciente</h3>
          <div class="space-y-4">
            ${renderActivity(summary?.recentActivity || [])}
          </div>
        </div>
      </div>
    </div>
  `;
}
