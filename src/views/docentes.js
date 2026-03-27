import { state } from "../core/state.js";

const WEEK_DAYS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miercoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sabado" }
];

function initialsForTeacher(teacher) {
  return `${teacher.nombre?.[0] || ""}${teacher.apellido?.[0] || ""}`.toUpperCase();
}

function renderTeacherRows(teachers) {
  if (!teachers.length) {
    return '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No hay docentes registrados.</td></tr>';
  }

  return teachers
    .map(
      (teacher) => `
        <tr class="hover:bg-gray-50 ${state.teachers.selectedTeacherId === teacher.id ? "bg-blue-50" : ""}">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                ${initialsForTeacher(teacher)}
              </div>
              <div>
                <p class="font-medium text-gray-800">${teacher.titulo ? `${teacher.titulo} ` : ""}${teacher.nombre} ${teacher.apellido}</p>
                <p class="text-sm text-gray-500">${teacher.email}</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">${teacher.departamento}</span>
          </td>
          <td class="px-6 py-4">
            <p class="text-sm text-gray-800">${teacher.totalCursosAsignables} curso(s)</p>
            <p class="text-xs text-gray-500">${teacher.assignableCourses.map((course) => course.nombreCurso).slice(0, 2).join(", ") || "Sin cursos"}</p>
          </td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 ${teacher.disponibilidadConfigurada ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"} rounded-full text-sm">
              ${teacher.disponibilidadConfigurada ? "Configurada" : "Pendiente"}
            </span>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-gray-800">${teacher.maxHorasSemana} hrs</p>
          </td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded" data-select-teacher="${teacher.id}">Ver</button>
              <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded" data-edit-teacher="${teacher.id}">Editar</button>
              <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded" data-delete-teacher="${teacher.id}">Eliminar</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderAvailabilityRows(teacher) {
  if (!teacher) {
    return '<div class="text-sm text-gray-500">Selecciona un docente para editar su disponibilidad.</div>';
  }

  const rows = teacher.availabilities.length
    ? teacher.availabilities
    : [{ diaSemana: "lunes", horaInicio: "07:00", horaFin: "09:00", activo: true }];

  return rows
    .map(
      (item) => `
        <div class="availability-row grid grid-cols-4 gap-3">
          <select class="availability-day px-3 py-2 border border-gray-300 rounded-lg">
            ${WEEK_DAYS.map((day) => `<option value="${day.value}" ${day.value === item.diaSemana ? "selected" : ""}>${day.label}</option>`).join("")}
          </select>
          <input type="time" class="availability-start px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaInicio}">
          <input type="time" class="availability-end px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaFin}">
          <button type="button" class="remove-availability px-3 py-2 bg-red-50 text-red-700 rounded-lg">Quitar</button>
        </div>
      `
    )
    .join("");
}

function renderCourseRows(teacher) {
  if (!teacher) {
    return '<div class="text-sm text-gray-500">Selecciona un docente para editar los cursos que puede dictar.</div>';
  }

  const rows = teacher.assignableCourses.length
    ? teacher.assignableCourses
    : [{ codigoCurso: "", nombreCurso: "", activo: true }];

  return rows
    .map(
      (course) => `
        <div class="course-row grid grid-cols-3 gap-3">
          <input type="text" class="course-code px-3 py-2 border border-gray-300 rounded-lg" placeholder="Codigo" value="${course.codigoCurso || ""}">
          <input type="text" class="course-name px-3 py-2 border border-gray-300 rounded-lg" placeholder="Nombre del curso" value="${course.nombreCurso || ""}">
          <button type="button" class="remove-course px-3 py-2 bg-red-50 text-red-700 rounded-lg">Quitar</button>
        </div>
      `
    )
    .join("");
}

export function renderDocentes() {
  const { items, selectedTeacherId, loading, error } = state.teachers;
  const selectedTeacher = items.find((item) => item.id === selectedTeacherId) || null;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Gestion de docentes</h2>
          <p class="text-gray-600 mt-2">HU-11, HU-12 y HU-13 conectadas a datos reales</p>
        </div>
        <button id="reloadTeachers" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando docentes...</div>' : ""}
      ${error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${error}</div>` : ""}

      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Crear o editar docente</h3>
          <button id="resetTeacherForm" class="text-sm text-gray-500">Limpiar</button>
        </div>
        <form id="teacherForm" class="grid grid-cols-3 gap-4">
          <input type="hidden" id="teacherId">
          <input id="teacherNombre" type="text" placeholder="Nombre" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="teacherApellido" type="text" placeholder="Apellido" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="teacherEmail" type="email" placeholder="Email" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="teacherDepartamento" type="text" placeholder="Departamento" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="teacherTitulo" type="text" placeholder="Titulo (Dr., Dra., Mg.)" class="px-4 py-3 border border-gray-300 rounded-lg">
          <input id="teacherMaxHoras" type="number" min="1" max="60" placeholder="Horas maximas por semana" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <label class="flex items-center gap-2 text-sm text-gray-700 col-span-3">
            <input id="teacherActivo" type="checkbox" checked>
            Docente activo
          </label>
          <button type="submit" class="col-span-3 btn-primary">Guardar docente</button>
        </form>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Docente</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Departamento</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cursos asignables</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Disponibilidad</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Horas/Semana</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${renderTeacherRows(items)}
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Disponibilidad semanal</h3>
              <p class="text-sm text-gray-500">${selectedTeacher ? `${selectedTeacher.nombre} ${selectedTeacher.apellido}` : "Sin docente seleccionado"}</p>
            </div>
            <button type="button" id="addAvailabilityRow" class="text-sm text-blue-600">Agregar fila</button>
          </div>
          <form id="availabilityForm" class="space-y-3">
            <div id="availabilityRows" class="space-y-3">
              ${renderAvailabilityRows(selectedTeacher)}
            </div>
            <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold" ${selectedTeacher ? "" : "disabled"}>Guardar disponibilidad</button>
          </form>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Cursos que puede dictar</h3>
              <p class="text-sm text-gray-500">${selectedTeacher ? `${selectedTeacher.nombre} ${selectedTeacher.apellido}` : "Sin docente seleccionado"}</p>
            </div>
            <button type="button" id="addCourseRow" class="text-sm text-blue-600">Agregar fila</button>
          </div>
          <form id="assignableCoursesForm" class="space-y-3">
            <div id="courseRows" class="space-y-3">
              ${renderCourseRows(selectedTeacher)}
            </div>
            <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold" ${selectedTeacher ? "" : "disabled"}>Guardar cursos asignables</button>
          </form>
        </div>
      </div>
    </div>
  `;
}
