import { state } from "../core/state.js";
import { h } from "../core/dom.js";

function renderCourseRows(items) {
  if (!items.length) {
    return '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No hay cursos registrados.</td></tr>';
  }

  return items
    .map(
      (course) => `
        <tr class="hover:bg-gray-50 ${state.courses.selectedCourseId === course.id ? "bg-blue-50" : ""}">
          <td class="px-6 py-4">
            <p class="font-semibold text-gray-800">${h(course.nombre)}</p>
            <p class="text-sm text-gray-500">${h(course.codigo)}</p>
          </td>
          <td class="px-6 py-4">${h(course.departamento)}</td>
          <td class="px-6 py-4">${course.creditos}</td>
          <td class="px-6 py-4">${course.sesionesPorSemana} x ${course.duracionMinutos} min</td>
          <td class="px-6 py-4">${course.totalSecciones}</td>
          <td class="px-6 py-4">${course.totalInscritos}</td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded" data-select-course="${course.id}">Ver</button>
              <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded" data-edit-course="${course.id}">Editar</button>
              <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded" data-delete-course="${course.id}">Eliminar</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderSectionRows(course) {
  if (!course) {
    return '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Selecciona un curso para gestionar sus secciones.</td></tr>';
  }

  if (!course.sections.length) {
    return '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">Este curso aun no tiene secciones registradas.</td></tr>';
  }

  return course.sections
    .map(
      (section) => `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 font-medium text-gray-800">${h(section.codigoSeccion)}</td>
          <td class="px-6 py-4">${section.teacherNombre || "Sin docente"}</td>
          <td class="px-6 py-4">${section.classroomNombre || "Sin aula"}</td>
          <td class="px-6 py-4">${section.capacidad}</td>
          <td class="px-6 py-4">${section.inscritos}</td>
          <td class="px-6 py-4">${section.horarioResumen || "Sin definir"}</td>
          <td class="px-6 py-4">
            <div class="flex gap-2">
              <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded" data-edit-section="${section.id}">Editar</button>
              <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded" data-delete-section="${section.id}">Eliminar</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderTeacherOptions(course) {
  const selectedId = state.courses.sectionDraft?.teacherId || "";
  const assignableTeachers = state.teachers.items.filter((teacher) =>
    teacher.assignableCourses.some((item) => item.codigoCurso === course?.codigo)
  );

  return [
    '<option value="">Sin asignar</option>',
    ...assignableTeachers.map(
      (teacher) =>
        `<option value="${teacher.id}" ${teacher.id === selectedId ? "selected" : ""}>${h(teacher.nombre)} ${h(teacher.apellido)}</option>`
    )
  ].join("");
}

function renderClassroomOptions() {
  const selectedId = state.courses.sectionDraft?.classroomId || "";

  return [
    '<option value="">Sin asignar</option>',
    ...state.classrooms.items.map(
      (classroom) =>
        `<option value="${classroom.id}" ${classroom.id === selectedId ? "selected" : ""}>${h(classroom.codigo)} - ${h(classroom.edificio)}</option>`
    )
  ].join("");
}

export function renderCursos() {
  const { items, selectedCourseId, loading, error } = state.courses;
  const selectedCourse = items.find((item) => item.id === selectedCourseId) || null;
  const editingSection = state.courses.sectionDraft || null;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Gestion de cursos y secciones</h2>
          <p class="text-gray-600 mt-2">HU-14 y HU-16 conectadas a datos reales y listas para el siguiente sprint</p>
        </div>
        <button id="reloadCourses" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando cursos...</div>' : ""}
      ${error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${error}</div>` : ""}

      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Crear o editar curso</h3>
          <button id="resetCourseForm" class="text-sm text-gray-500">Limpiar</button>
        </div>
        <form id="courseForm" class="grid grid-cols-3 gap-4">
          <input type="hidden" id="courseId">
          <input id="courseCodigo" type="text" placeholder="Codigo del curso" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="courseNombre" type="text" placeholder="Nombre del curso" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="courseDepartamento" type="text" placeholder="Departamento" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="courseCreditos" type="number" min="1" max="12" placeholder="Creditos" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="courseSesiones" type="number" min="1" max="7" placeholder="Sesiones por semana" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <input id="courseDuracion" type="number" min="30" max="360" step="30" placeholder="Duracion por sesion" class="px-4 py-3 border border-gray-300 rounded-lg" required>
          <label class="flex items-center gap-2 text-sm text-gray-700 col-span-3">
            <input id="courseActivo" type="checkbox" checked>
            Curso activo
          </label>
          <button type="submit" class="col-span-3 btn-primary">Guardar curso</button>
        </form>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Curso</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Departamento</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Creditos</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Carga semanal</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Secciones</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Inscritos</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${renderCourseRows(items)}
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-5 gap-6">
        <div class="card p-6 col-span-2">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Secciones del curso</h3>
              <p class="text-sm text-gray-500">${selectedCourse ? `${selectedCourse.codigo} - ${selectedCourse.nombre}` : "Sin curso seleccionado"}</p>
            </div>
            <button id="resetSectionForm" class="text-sm text-gray-500" ${selectedCourse ? "" : "disabled"}>Nueva seccion</button>
          </div>

          <form id="sectionForm" class="space-y-4">
            <input type="hidden" id="sectionId" value="${editingSection?.id || ""}">
            <div class="grid grid-cols-2 gap-3">
              <input id="sectionCodigo" type="text" placeholder="Seccion" class="px-4 py-3 border border-gray-300 rounded-lg" value="${editingSection?.codigoSeccion || ""}" ${selectedCourse ? "" : "disabled"} required>
              <input id="sectionCapacidad" type="number" min="1" max="300" placeholder="Capacidad" class="px-4 py-3 border border-gray-300 rounded-lg" value="${editingSection?.capacidad || ""}" ${selectedCourse ? "" : "disabled"} required>
              <input id="sectionInscritos" type="number" min="0" max="300" placeholder="Inscritos" class="px-4 py-3 border border-gray-300 rounded-lg" value="${editingSection?.inscritos || 0}" ${selectedCourse ? "" : "disabled"} required>
              <input id="sectionHorario" type="text" placeholder="Horario resumen" class="px-4 py-3 border border-gray-300 rounded-lg" value="${editingSection?.horarioResumen || ""}" ${selectedCourse ? "" : "disabled"}>
            </div>

            <select id="sectionTeacher" class="w-full px-4 py-3 border border-gray-300 rounded-lg" ${selectedCourse ? "" : "disabled"}>
              ${renderTeacherOptions(selectedCourse)}
            </select>

            <select id="sectionClassroom" class="w-full px-4 py-3 border border-gray-300 rounded-lg" ${selectedCourse ? "" : "disabled"}>
              ${renderClassroomOptions()}
            </select>

            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input id="sectionActivo" type="checkbox" ${editingSection?.activo === false ? "" : "checked"} ${selectedCourse ? "" : "disabled"}>
              Seccion activa
            </label>

            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold" ${selectedCourse ? "" : "disabled"}>Guardar seccion</button>
          </form>
        </div>

        <div class="card overflow-hidden col-span-3">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Seccion</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Docente</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aula</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Capacidad</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Inscritos</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Horario</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${renderSectionRows(selectedCourse)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
