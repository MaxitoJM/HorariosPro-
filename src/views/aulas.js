import { state } from "../core/state.js";

const WEEK_DAYS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miercoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sabado" }
];

function renderClassroomRows(items) {
  if (!items.length) {
    return '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No hay aulas registradas.</td></tr>';
  }

  return items
    .map(
      (classroom) => `
        <tr class="hover:bg-gray-50 ${state.classrooms.selectedClassroomId === classroom.id ? "bg-blue-50" : ""}">
          <td class="px-6 py-4">
            <p class="font-semibold text-gray-800">${classroom.codigo}</p>
            <p class="text-sm text-gray-500">${classroom.edificio}${classroom.piso ? ` - Piso ${classroom.piso}` : ""}</p>
          </td>
          <td class="px-6 py-4 capitalize">${classroom.tipo.replace("_", " ")}</td>
          <td class="px-6 py-4">${classroom.capacidad}</td>
          <td class="px-6 py-4">${classroom.totalSeccionesAsignadas}</td>
          <td class="px-6 py-4">${classroom.equipamiento.join(", ") || "Sin equipamiento"}</td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 ${classroom.disponibilidadConfigurada ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} rounded-full text-sm">
              ${classroom.disponibilidadConfigurada ? "Configurada" : "Pendiente"}
            </span>
          </td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded" data-select-classroom="${classroom.id}">Ver</button>
              <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded" data-edit-classroom="${classroom.id}">Editar</button>
              <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded" data-delete-classroom="${classroom.id}">Eliminar</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderAvailabilityRows(classroom) {
  if (!classroom) {
    return '<div class="text-sm text-gray-500">Selecciona un aula para editar su disponibilidad operativa.</div>';
  }

  const rows = classroom.availabilities.length
    ? classroom.availabilities
    : [{ diaSemana: "lunes", horaInicio: "07:00", horaFin: "18:00", activo: true }];

  return rows
    .map(
      (item) => `
        <div class="classroom-availability-row grid grid-cols-4 gap-3">
          <select class="classroom-availability-day px-3 py-2 border border-gray-300 rounded-lg">
            ${WEEK_DAYS.map((day) => `<option value="${day.value}" ${day.value === item.diaSemana ? "selected" : ""}>${day.label}</option>`).join("")}
          </select>
          <input type="time" class="classroom-availability-start px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaInicio}">
          <input type="time" class="classroom-availability-end px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaFin}">
          <button type="button" class="remove-classroom-availability px-3 py-2 bg-red-50 text-red-700 rounded-lg">Quitar</button>
        </div>
      `
    )
    .join("");
}

export function renderAulas() {
  const { items, selectedClassroomId, loading, error } = state.classrooms;
  const selectedClassroom = items.find((item) => item.id === selectedClassroomId) || null;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Gestion de aulas</h2>
          <p class="text-gray-600 mt-2">HU-17 conectada a datos reales y preparada para la asignacion de horarios</p>
        </div>
        <button id="reloadClassrooms" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando aulas...</div>' : ""}
      ${error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${error}</div>` : ""}

      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Crear o editar aula</h3>
          <button id="resetClassroomForm" class="text-sm text-gray-500">Limpiar</button>
        </div>
        <form id="classroomForm" class="grid grid-cols-3 gap-4">
          <input type="hidden" id="classroomId">
          <input id="classroomCodigo" type="text" placeholder="Codigo" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="classroomEdificio" type="text" placeholder="Edificio" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="classroomPiso" type="text" placeholder="Piso" class="px-4 py-3 border border-gray-300 rounded-lg">
          <select id="classroomTipo" class="px-4 py-3 border border-gray-300 rounded-lg" required>
            <option value="aula">Aula</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="auditorio">Auditorio</option>
            <option value="sala_computo">Sala de computo</option>
            <option value="otro">Otro</option>
          </select>
          <input id="classroomCapacidad" type="number" min="1" max="500" placeholder="Capacidad" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="classroomEquipamiento" type="text" placeholder="Equipamiento separado por comas" class="px-4 py-3 border border-gray-300 rounded-lg">
          <label class="flex items-center gap-2 text-sm text-gray-700 col-span-3">
            <input id="classroomActivo" type="checkbox" checked>
            Aula activa
          </label>
          <button type="submit" class="col-span-3 btn-primary">Guardar aula</button>
        </form>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aula</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Capacidad</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Secciones</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Equipamiento</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Disponibilidad</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${renderClassroomRows(items)}
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Disponibilidad del aula</h3>
              <p class="text-sm text-gray-500">${selectedClassroom ? `${selectedClassroom.codigo} - ${selectedClassroom.edificio}` : "Sin aula seleccionada"}</p>
            </div>
            <button type="button" id="addClassroomAvailabilityRow" class="text-sm text-blue-600">Agregar fila</button>
          </div>

          <form id="classroomAvailabilityForm" class="space-y-3">
            <div id="classroomAvailabilityRows" class="space-y-3">
              ${renderAvailabilityRows(selectedClassroom)}
            </div>
            <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold" ${selectedClassroom ? "" : "disabled"}>Guardar disponibilidad</button>
          </form>
        </div>

        <div class="card p-6 space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">Resumen operativo</h3>
            <p class="text-sm text-gray-500">${selectedClassroom ? "Vista rapida para coordinacion" : "Selecciona un aula"}</p>
          </div>

          ${
            selectedClassroom
              ? `
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 rounded-xl bg-gray-50">
                    <p class="text-sm text-gray-500">Codigo</p>
                    <p class="text-lg font-semibold text-gray-900">${selectedClassroom.codigo}</p>
                  </div>
                  <div class="p-4 rounded-xl bg-gray-50">
                    <p class="text-sm text-gray-500">Tipo</p>
                    <p class="text-lg font-semibold text-gray-900 capitalize">${selectedClassroom.tipo.replace("_", " ")}</p>
                  </div>
                  <div class="p-4 rounded-xl bg-gray-50">
                    <p class="text-sm text-gray-500">Capacidad</p>
                    <p class="text-lg font-semibold text-gray-900">${selectedClassroom.capacidad}</p>
                  </div>
                  <div class="p-4 rounded-xl bg-gray-50">
                    <p class="text-sm text-gray-500">Secciones asignadas</p>
                    <p class="text-lg font-semibold text-gray-900">${selectedClassroom.totalSeccionesAsignadas}</p>
                  </div>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-2">Equipamiento</p>
                  <div class="flex flex-wrap gap-2">
                    ${selectedClassroom.equipamiento.map((item) => `<span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">${item}</span>`).join("") || '<span class="text-sm text-gray-500">Sin equipamiento registrado</span>'}
                  </div>
                </div>
              `
              : '<div class="text-sm text-gray-500">Selecciona un aula para ver su resumen.</div>'
          }
        </div>
      </div>
    </div>
  `;
}
