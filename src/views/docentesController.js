import {
  createTeacher,
  deleteTeacher,
  listTeachers,
  updateTeacher,
  updateTeacherAssignableCourses,
  updateTeacherAvailability
} from "../api/teachersApi.js";
import {
  resetTeachersLoaded,
  setSelectedTeacherId,
  setTeachersData,
  setTeachersError,
  setTeachersLoading,
  state
} from "../core/state.js";

const DAY_OPTIONS = `
  <option value="lunes">Lunes</option>
  <option value="martes">Martes</option>
  <option value="miercoles">Miercoles</option>
  <option value="jueves">Jueves</option>
  <option value="viernes">Viernes</option>
  <option value="sabado">Sabado</option>
`;

function teacherPayloadFromForm() {
  return {
    nombre: document.getElementById("teacherNombre").value.trim(),
    apellido: document.getElementById("teacherApellido").value.trim(),
    email: document.getElementById("teacherEmail").value.trim().toLowerCase(),
    departamento: document.getElementById("teacherDepartamento").value.trim(),
    titulo: document.getElementById("teacherTitulo").value.trim(),
    maxHorasSemana: Number(document.getElementById("teacherMaxHoras").value),
    activo: document.getElementById("teacherActivo").checked
  };
}

function resetTeacherForm() {
  document.getElementById("teacherId").value = "";
  document.getElementById("teacherForm").reset();
  document.getElementById("teacherActivo").checked = true;
}

function fillTeacherForm(teacherId) {
  const teacher = state.teachers.items.find((item) => item.id === teacherId);
  if (!teacher) return;

  document.getElementById("teacherId").value = teacher.id;
  document.getElementById("teacherNombre").value = teacher.nombre;
  document.getElementById("teacherApellido").value = teacher.apellido;
  document.getElementById("teacherEmail").value = teacher.email;
  document.getElementById("teacherDepartamento").value = teacher.departamento;
  document.getElementById("teacherTitulo").value = teacher.titulo || "";
  document.getElementById("teacherMaxHoras").value = teacher.maxHorasSemana;
  document.getElementById("teacherActivo").checked = Boolean(teacher.activo);
}

function buildAvailabilityRow(item = { diaSemana: "lunes", horaInicio: "07:00", horaFin: "09:00" }) {
  return `
    <div class="availability-row grid grid-cols-4 gap-3">
      <select class="availability-day px-3 py-2 border border-gray-300 rounded-lg">
        ${DAY_OPTIONS.replace(`value="${item.diaSemana}"`, `value="${item.diaSemana}" selected`)}
      </select>
      <input type="time" class="availability-start px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaInicio}">
      <input type="time" class="availability-end px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaFin}">
      <button type="button" class="remove-availability px-3 py-2 bg-red-50 text-red-700 rounded-lg">Quitar</button>
    </div>
  `;
}

function buildCourseRow(item = { codigoCurso: "", nombreCurso: "" }) {
  return `
    <div class="course-row grid grid-cols-3 gap-3">
      <input type="text" class="course-code px-3 py-2 border border-gray-300 rounded-lg" placeholder="Codigo" value="${item.codigoCurso || ""}">
      <input type="text" class="course-name px-3 py-2 border border-gray-300 rounded-lg" placeholder="Nombre del curso" value="${item.nombreCurso || ""}">
      <button type="button" class="remove-course px-3 py-2 bg-red-50 text-red-700 rounded-lg">Quitar</button>
    </div>
  `;
}

function collectAvailabilityRows() {
  return Array.from(document.querySelectorAll(".availability-row")).map((row) => ({
    diaSemana: row.querySelector(".availability-day").value,
    horaInicio: row.querySelector(".availability-start").value,
    horaFin: row.querySelector(".availability-end").value,
    activo: true
  }));
}

function collectCourseRows() {
  return Array.from(document.querySelectorAll(".course-row"))
    .map((row) => ({
      codigoCurso: row.querySelector(".course-code").value.trim(),
      nombreCurso: row.querySelector(".course-name").value.trim(),
      activo: true
    }))
    .filter((course) => course.nombreCurso);
}

async function loadTeachers(renderApp) {
  setTeachersLoading(true);
  setTeachersError(null);
  renderApp();

  try {
    const data = await listTeachers();
    setTeachersData(data.items);
  } catch (error) {
    setTeachersError(error.message || "No se pudieron cargar los docentes");
  } finally {
    setTeachersLoading(false);
    renderApp();
  }
}

async function reloadTeachers(renderApp) {
  resetTeachersLoaded();
  await loadTeachers(renderApp);
}

function bindDynamicRowButtons() {
  document.querySelectorAll(".remove-availability").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".availability-row")?.remove();
    });
  });

  document.querySelectorAll(".remove-course").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".course-row")?.remove();
    });
  });
}

export function setupDocentesScreen(renderApp) {
  if (!state.teachers.loaded && !state.teachers.loading) {
    loadTeachers(renderApp);
  }

  document.getElementById("reloadTeachers")?.addEventListener("click", async () => {
    await reloadTeachers(renderApp);
  });

  document.getElementById("resetTeacherForm")?.addEventListener("click", resetTeacherForm);

  document.getElementById("teacherForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = document.getElementById("teacherId").value;
      const payload = teacherPayloadFromForm();
      if (id) {
        await updateTeacher(id, payload);
      } else {
        await createTeacher(payload);
      }
      resetTeacherForm();
      await reloadTeachers(renderApp);
    } catch (error) {
      setTeachersError(error.message || "No se pudo guardar el docente");
      renderApp();
    }
  });

  document.querySelectorAll("[data-select-teacher]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedTeacherId(button.dataset.selectTeacher);
      renderApp();
    });
  });

  document.querySelectorAll("[data-edit-teacher]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedTeacherId(button.dataset.editTeacher);
      renderApp();
      fillTeacherForm(button.dataset.editTeacher);
    });
  });

  document.querySelectorAll("[data-delete-teacher]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteTeacher(button.dataset.deleteTeacher);
        await reloadTeachers(renderApp);
      } catch (error) {
        setTeachersError(error.message || "No se pudo eliminar el docente");
        renderApp();
      }
    });
  });

  document.getElementById("addAvailabilityRow")?.addEventListener("click", () => {
    document.getElementById("availabilityRows")?.insertAdjacentHTML("beforeend", buildAvailabilityRow());
    bindDynamicRowButtons();
  });

  document.getElementById("addCourseRow")?.addEventListener("click", () => {
    document.getElementById("courseRows")?.insertAdjacentHTML("beforeend", buildCourseRow());
    bindDynamicRowButtons();
  });

  document.getElementById("availabilityForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const teacherId = state.teachers.selectedTeacherId;
      if (!teacherId) return;
      await updateTeacherAvailability(teacherId, collectAvailabilityRows());
      await reloadTeachers(renderApp);
    } catch (error) {
      setTeachersError(error.message || "No se pudo guardar la disponibilidad");
      renderApp();
    }
  });

  document.getElementById("assignableCoursesForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const teacherId = state.teachers.selectedTeacherId;
      if (!teacherId) return;
      await updateTeacherAssignableCourses(teacherId, collectCourseRows());
      await reloadTeachers(renderApp);
    } catch (error) {
      setTeachersError(error.message || "No se pudieron guardar los cursos del docente");
      renderApp();
    }
  });

  bindDynamicRowButtons();
}
