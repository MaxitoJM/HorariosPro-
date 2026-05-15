import { createStudent, listStudents } from "../api/studentsApi.js";
import {
  resetStudentsLoaded,
  setStudentsData,
  setStudentsError,
  setStudentsLoading,
  state
} from "../core/state.js";

async function loadStudents(renderApp) {
  setStudentsLoading(true);
  setStudentsError(null);
  renderApp();

  try {
    const data = await listStudents({ includeInactive: true });
    setStudentsData(data.items);
  } catch (error) {
    setStudentsError(error.message || "No se pudieron cargar los estudiantes");
  } finally {
    setStudentsLoading(false);
    renderApp();
  }
}

async function reloadStudents(renderApp) {
  resetStudentsLoaded();
  await loadStudents(renderApp);
}

function payloadFromForm() {
  return {
    nombre: document.getElementById("studentNombre").value.trim(),
    apellido: document.getElementById("studentApellido").value.trim(),
    email: document.getElementById("studentEmail").value.trim().toLowerCase(),
    password: document.getElementById("studentPassword").value,
    activo: document.getElementById("studentActivo").checked,
    verificado: document.getElementById("studentVerificado").checked
  };
}

export function setupEstudiantesScreen(renderApp) {
  if (!state.students.loaded && !state.students.loading) {
    loadStudents(renderApp);
  }

  document.getElementById("reloadStudents")?.addEventListener("click", async () => {
    await reloadStudents(renderApp);
  });

  document.getElementById("studentForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await createStudent(payloadFromForm());
      document.getElementById("studentForm").reset();
      document.getElementById("studentActivo").checked = true;
      await reloadStudents(renderApp);
    } catch (error) {
      setStudentsError(error.message || "No se pudo registrar el estudiante");
      renderApp();
    }
  });
}
