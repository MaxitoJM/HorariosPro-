import { listTeachers } from "../api/teachersApi.js";
import { listClassrooms } from "../api/classroomsApi.js";
import {
  createCourse,
  createCourseSection,
  deleteCourse,
  deleteCourseSection,
  listCourses,
  updateCourse,
  updateCourseSection
} from "../api/coursesApi.js";
import {
  resetCoursesLoaded,
  setClassroomsData,
  setCoursesData,
  setCoursesError,
  setCoursesLoading,
  setSelectedCourseId,
  setTeachersData,
  state
} from "../core/state.js";

function coursePayloadFromForm() {
  return {
    codigo: document.getElementById("courseCodigo").value.trim().toUpperCase(),
    nombre: document.getElementById("courseNombre").value.trim(),
    departamento: document.getElementById("courseDepartamento").value.trim(),
    creditos: Number(document.getElementById("courseCreditos").value),
    sesionesPorSemana: Number(document.getElementById("courseSesiones").value),
    duracionMinutos: Number(document.getElementById("courseDuracion").value),
    activo: document.getElementById("courseActivo").checked
  };
}

function sectionPayloadFromForm() {
  return {
    codigoSeccion: document.getElementById("sectionCodigo").value.trim().toUpperCase(),
    teacherId: document.getElementById("sectionTeacher").value,
    classroomId: document.getElementById("sectionClassroom").value,
    capacidad: Number(document.getElementById("sectionCapacidad").value),
    inscritos: Number(document.getElementById("sectionInscritos").value),
    horarioResumen: document.getElementById("sectionHorario").value.trim(),
    activo: document.getElementById("sectionActivo").checked
  };
}

function resetCourseForm() {
  document.getElementById("courseId").value = "";
  document.getElementById("courseForm").reset();
  document.getElementById("courseActivo").checked = true;
}

function resetSectionDraft() {
  state.courses.sectionDraft = null;
}

function fillCourseForm(courseId) {
  const course = state.courses.items.find((item) => item.id === courseId);
  if (!course) return;

  document.getElementById("courseId").value = course.id;
  document.getElementById("courseCodigo").value = course.codigo;
  document.getElementById("courseNombre").value = course.nombre;
  document.getElementById("courseDepartamento").value = course.departamento;
  document.getElementById("courseCreditos").value = course.creditos;
  document.getElementById("courseSesiones").value = course.sesionesPorSemana;
  document.getElementById("courseDuracion").value = course.duracionMinutos;
  document.getElementById("courseActivo").checked = Boolean(course.activo);
}

async function loadCourses(renderApp) {
  setCoursesLoading(true);
  setCoursesError(null);
  renderApp();

  try {
    const [coursesData, teachersData, classroomsData] = await Promise.all([
      listCourses(),
      listTeachers(),
      listClassrooms()
    ]);
    setCoursesData(coursesData.items);
    setTeachersData(teachersData.items);
    setClassroomsData(classroomsData.items);
  } catch (error) {
    setCoursesError(error.message || "No se pudieron cargar los cursos");
  } finally {
    setCoursesLoading(false);
    renderApp();
  }
}

async function reloadCourses(renderApp) {
  resetCoursesLoaded();
  resetSectionDraft();
  await loadCourses(renderApp);
}

export function setupCursosScreen(renderApp) {
  if (!state.courses.loaded && !state.courses.loading) {
    loadCourses(renderApp);
  }

  document.getElementById("reloadCourses")?.addEventListener("click", async () => {
    await reloadCourses(renderApp);
  });

  document.getElementById("resetCourseForm")?.addEventListener("click", resetCourseForm);

  document.getElementById("resetSectionForm")?.addEventListener("click", () => {
    resetSectionDraft();
    renderApp();
  });

  document.getElementById("courseForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = document.getElementById("courseId").value;
      const payload = coursePayloadFromForm();
      if (id) {
        await updateCourse(id, payload);
      } else {
        await createCourse(payload);
      }
      resetCourseForm();
      await reloadCourses(renderApp);
    } catch (error) {
      setCoursesError(error.message || "No se pudo guardar el curso");
      renderApp();
    }
  });

  document.querySelectorAll("[data-select-course]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedCourseId(button.dataset.selectCourse);
      resetSectionDraft();
      renderApp();
    });
  });

  document.querySelectorAll("[data-edit-course]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedCourseId(button.dataset.editCourse);
      resetSectionDraft();
      renderApp();
      fillCourseForm(button.dataset.editCourse);
    });
  });

  document.querySelectorAll("[data-delete-course]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteCourse(button.dataset.deleteCourse);
        await reloadCourses(renderApp);
      } catch (error) {
        setCoursesError(error.message || "No se pudo eliminar el curso");
        renderApp();
      }
    });
  });

  document.querySelectorAll("[data-edit-section]").forEach((button) => {
    button.addEventListener("click", () => {
      const course = state.courses.items.find((item) => item.id === state.courses.selectedCourseId);
      const section = course?.sections.find((item) => item.id === button.dataset.editSection);
      if (!section) return;
      state.courses.sectionDraft = { ...section };
      renderApp();
    });
  });

  document.querySelectorAll("[data-delete-section]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const courseId = state.courses.selectedCourseId;
        if (!courseId) return;
        await deleteCourseSection(courseId, button.dataset.deleteSection);
        await reloadCourses(renderApp);
      } catch (error) {
        setCoursesError(error.message || "No se pudo eliminar la seccion");
        renderApp();
      }
    });
  });

  document.getElementById("sectionForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const courseId = state.courses.selectedCourseId;
      if (!courseId) return;
      const sectionId = document.getElementById("sectionId").value;
      const payload = sectionPayloadFromForm();
      if (sectionId) {
        await updateCourseSection(courseId, sectionId, payload);
      } else {
        await createCourseSection(courseId, payload);
      }
      resetSectionDraft();
      await reloadCourses(renderApp);
    } catch (error) {
      setCoursesError(error.message || "No se pudo guardar la seccion");
      renderApp();
    }
  });
}
