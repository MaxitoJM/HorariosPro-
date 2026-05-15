import { state } from "../core/state.js";

const ROLE_LABELS = {
  admin: "Administrador",
  profesor: "Profesor",
  estudiante: "Estudiante"
};

function renderUserRows() {
  if (!state.users.items.length) {
    return '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No hay usuarios registrados.</td></tr>';
  }

  return state.users.items
    .map(
      (user) => `
        <tr class="hover:bg-gray-50 ${user.activo ? "" : "bg-gray-50 text-gray-500"}">
          <td class="px-6 py-4">
            <p class="font-semibold text-gray-800">${user.nombre} ${user.apellido}</p>
            <p class="text-sm text-gray-500">${user.email}</p>
          </td>
          <td class="px-6 py-4">${ROLE_LABELS[user.rol] || user.rol}</td>
          <td class="px-6 py-4">${user.activo ? "Activo" : "Inactivo"}</td>
          <td class="px-6 py-4">${user.verificado ? "Verificado" : "Pendiente"}</td>
          <td class="px-6 py-4">${new Date(user.updatedAt || user.createdAt).toLocaleDateString("es-CO")}</td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded" data-edit-user="${user.id}">Editar</button>
              <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded" data-delete-user="${user.id}" ${user.id === state.currentUser?.id ? "disabled" : ""}>Eliminar</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

export function renderUsuarios() {
  const draft = state.users.draft;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Gestion de usuarios</h2>
          <p class="text-gray-600 mt-2">HU-38, HU-39 y HU-40: editar, eliminar y listar usuarios</p>
        </div>
        <button id="reloadUsers" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${state.users.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando usuarios...</div>' : ""}
      ${state.users.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.users.error}</div>` : ""}

      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">${draft ? "Editar usuario" : "Selecciona un usuario"}</h3>
          <button id="resetUserForm" class="text-sm text-gray-500">Limpiar</button>
        </div>
        <form id="userForm" class="grid grid-cols-3 gap-4">
          <input type="hidden" id="userId" value="${draft?.id || ""}">
          <input id="userNombre" value="${draft?.nombre || ""}" placeholder="Nombre" class="px-4 py-3 border border-gray-300 rounded-lg" required ${draft ? "" : "disabled"}>
          <input id="userApellido" value="${draft?.apellido || ""}" placeholder="Apellido" class="px-4 py-3 border border-gray-300 rounded-lg" required ${draft ? "" : "disabled"}>
          <input id="userEmail" value="${draft?.email || ""}" type="email" placeholder="Email" class="px-4 py-3 border border-gray-300 rounded-lg" required ${draft ? "" : "disabled"}>
          <select id="userRol" class="px-4 py-3 border border-gray-300 rounded-lg" ${draft ? "" : "disabled"}>
            ${Object.entries(ROLE_LABELS).map(([value, label]) => `<option value="${value}" ${draft?.rol === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
          <input id="userPassword" type="password" placeholder="Nueva contrasena opcional" class="px-4 py-3 border border-gray-300 rounded-lg" ${draft ? "" : "disabled"}>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700"><input id="userActivo" type="checkbox" ${draft?.activo === false ? "" : "checked"} ${draft ? "" : "disabled"}> Activo</label>
            <label class="flex items-center gap-2 text-sm text-gray-700"><input id="userVerificado" type="checkbox" ${draft?.verificado ? "checked" : ""} ${draft ? "" : "disabled"}> Verificado</label>
          </div>
          <button class="col-span-3 btn-primary" ${draft ? "" : "disabled"}>Guardar cambios</button>
        </form>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Usuario</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rol</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Verificacion</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actualizado</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">${renderUserRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}
