import { enroll, listEnrollments, withdrawEnrollment } from "../api/enrollmentsApi.js";
import { listStudents } from "../api/studentsApi.js";
import { listCourses } from "../api/coursesApi.js";
import {
  resetEnrollmentsLoaded,
  setCoursesData,
  setEnrollmentsData,
  setEnrollmentsError,
  setEnrollmentsFilters,
  setEnrollmentsLoading,
  setStudentsData,
  state
} from "../core/state.js";

// Asegura que estudiantes y cursos (con secciones) esten cargados para los selectores.
async function ensureRefData() {
  const tasks = [];
  if (!state.students.loaded) tasks.push(listStudents({ pageSize: 200 }).then((d) => setStudentsData(d)));
  if (!state.courses.loaded) tasks.push(listCourses().then((d) => setCoursesData(d.items ?? d)));
  if (tasks.length) await Promise.all(tasks);
}

async function load(renderApp) {
  setEnrollmentsLoading(true);
  setEnrollmentsError(null);
  renderApp();
  try {
    await ensureRefData();
    const data = await listEnrollments({ sectionId: state.enrollments.filters.sectionId });
    setEnrollmentsData(data.items ?? data);
  } catch (error) {
    setEnrollmentsError(error.message || "No se pudieron cargar las inscripciones");
  } finally {
    setEnrollmentsLoading(false);
    renderApp();
  }
}

async function reload(renderApp) {
  resetEnrollmentsLoaded();
  await load(renderApp);
}

export function setupInscripcionesScreen(renderApp) {
  if (!state.enrollments.loaded && !state.enrollments.loading) load(renderApp);

  document.getElementById("reloadEnrollments")?.addEventListener("click", () => reload(renderApp));

  document.getElementById("enrollFilterBtn")?.addEventListener("click", () => {
    setEnrollmentsFilters({ sectionId: document.getElementById("enrollFilterSection").value });
    reload(renderApp);
  });

  document.querySelectorAll("[data-withdraw-enrollment]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await withdrawEnrollment(btn.dataset.withdrawEnrollment);
        await reload(renderApp);
      } catch (error) {
        setEnrollmentsError(error.message);
        renderApp();
      }
    })
  );

  document.getElementById("enrollForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const studentId = document.getElementById("enrollStudent").value;
    const sectionId = document.getElementById("enrollSection").value;
    if (!studentId || !sectionId) {
      setEnrollmentsError("Selecciona estudiante y sección");
      renderApp();
      return;
    }
    try {
      await enroll({ studentId, sectionId });
      await reload(renderApp);
    } catch (error) {
      setEnrollmentsError(error.message || "No se pudo inscribir");
      renderApp();
    }
  });
}
