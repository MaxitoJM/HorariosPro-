import { state } from '../core/state.js';

export function renderSidebarItem(id, icon, label) {
  const isActive = state.currentScreen === id;
  return `
    <div id="nav-${id}" class="sidebar-item ${isActive ? 'active' : ''}">
      <span class="text-xl">${icon}</span>
      <span>${label}</span>
    </div>
  `;
}

export function renderLayout(screenHtml) {
  return `
    <div class="flex h-screen bg-gray-50">
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div class="p-6 border-b border-gray-200">
          <h1 class="text-2xl font-bold text-gray-800">📊 HorariosPro</h1>
          <p class="text-sm text-gray-500 mt-1">Universidad El Bosque</p>
        </div>

        <nav class="flex-1 p-4 space-y-2">
          ${renderSidebarItem('dashboard', '🏠', 'Dashboard')}
          ${renderSidebarItem('docentes', '👨‍🏫', 'Docentes')}
          ${renderSidebarItem('cursos', '📚', 'Cursos')}
          ${renderSidebarItem('aulas', '🏛️', 'Aulas')}
          ${renderSidebarItem('franjas', '⏰', 'Franjas Horarias')}
          ${renderSidebarItem('asignacion', '📋', 'Asignación')}
          ${renderSidebarItem('horarios', '📊', 'Horarios')}
          ${renderSidebarItem('conflictos', '⚠️', 'Conflictos')}
        </nav>

        <div class="p-4 border-t border-gray-200">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                ${state.currentUser?.initials || 'AD'}
              </div>
              <div>
                <p class="font-medium text-sm">${state.currentUser?.name || 'Admin'}</p>
                <p class="text-xs text-gray-500">${state.currentUser?.role || 'Administrador'}</p>
              </div>
            </div>
            <button id="logoutBtn" class="text-gray-400 hover:text-red-600 transition" title="Cerrar sesión">🚪</button>
          </div>
        </div>
      </aside>

      <main class="flex-1 overflow-auto">${screenHtml}</main>
    </div>
  `;
}
