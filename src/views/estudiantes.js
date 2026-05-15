import { state } from "../core/state.js";

function renderStudentRows() {
  if (!state.students.items.length) {
    return '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No hay estudiantes registrados.</td></tr>';
  }

  return state.students.items
    .map(
      (student) => `
        <tr class="hover:bg-gray-50 ${student.activo ? "" : "bg-gray-50 text-gray-500"}">
          <td class="px-6 py-4">
            <p class="font-semibold text-gray-800">${student.nombre} ${student.apellido}</p>
            <p class="text-sm text-gray-500">${student.email}</p>
          </td>
          <td class="px-6 py-4">${student.activo ? "Activo" : "Inactivo"}</td>
          <td class="px-6 py-4">${student.verificado ? "Verificado" : "Pendiente"}</td>
          <td class="px-6 py-4">${student.totalInscripciones || 0}</td>
          <td class="px-6 py-4">${new Date(student.createdAt).toLocaleDateString("es-CO")}</td>
        </tr>
      `
    )
    .join("");
}

export function renderEstudiantes() {
  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Gestion de estudiantes</h2>
          <p class="text-gray-600 mt-2">HU-30 y HU-31: registrar y consultar estudiantes</p>
        </div>
        <button id="reloadStudents" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${state.students.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando estudiantes...</div>' : ""}
      ${state.students.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.students.error}</div>` : ""}

      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Registrar estudiante</h3>
        <form id="studentForm" class="grid grid-cols-3 gap-4">
          <input id="studentNombre" placeholder="Nombre" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="studentApellido" placeholder="Apellido" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="studentEmail" type="email" placeholder="Email" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="studentPassword" type="password" placeholder="Contrasena inicial" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <label class="flex items-center gap-2 text-sm text-gray-700"><input id="studentActivo" type="checkbox" checked> Activo</label>
          <label class="flex items-center gap-2 text-sm text-gray-700"><input id="studentVerificado" type="checkbox"> Verificado</label>
          <button class="col-span-3 btn-primary">Crear estudiante</button>
        </form>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estudiante</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Verificacion</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Inscripciones</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Registro</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">${renderStudentRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}
