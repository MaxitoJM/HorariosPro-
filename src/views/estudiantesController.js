import {
  commitStudentImport,
  createStudent,
  deleteStudent,
  downloadStudentTemplate,
  listStudents,
  previewStudentImport,
  updateStudent
} from "../api/studentsApi.js";
import {
  clearStudentImport,
  resetStudentsLoaded,
  setStudentDraft,
  setStudentImportError,
  setStudentImportPreview,
  setStudentImportResult,
  setStudentsData,
  setStudentsError,
  setStudentsLoading,
  setStudentsSearch,
  state
} from "../core/state.js";

async function loadStudents(renderApp) {
  setStudentsLoading(true);
  setStudentsError(null);
  renderApp();
  try {
    const data = await listStudents({ search: state.students.search });
    setStudentsData(data);
  } catch (error) {
    setStudentsError(error.message || "No se pudieron cargar los estudiantes");
  } finally {
    setStudentsLoading(false);
    renderApp();
  }
}

async function reloadStudents(renderApp) {
  resetStudentsLoaded();
  setStudentDraft(null);
  await loadStudents(renderApp);
}

function payloadFromForm() {
  const programId = document.getElementById("studentProgramId").value.trim();
  return {
    codigo: document.getElementById("studentCodigo").value.trim(),
    nombre: document.getElementById("studentNombre").value.trim(),
    apellido: document.getElementById("studentApellido").value.trim(),
    email: document.getElementById("studentEmail").value.trim().toLowerCase(),
    ...(programId ? { programId } : {})
  };
}

export function setupEstudiantesScreen(renderApp) {
  if (!state.students.loaded && !state.students.loading) {
    loadStudents(renderApp);
  }

  document.getElementById("reloadStudents")?.addEventListener("click", () => reloadStudents(renderApp));

  document.getElementById("studentSearchBtn")?.addEventListener("click", () => {
    setStudentsSearch(document.getElementById("studentSearch").value.trim());
    reloadStudents(renderApp);
  });

  document.getElementById("studentSearch")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      setStudentsSearch(e.target.value.trim());
      reloadStudents(renderApp);
    }
  });

  document.getElementById("resetStudentForm")?.addEventListener("click", () => {
    setStudentDraft(null);
    renderApp();
  });

  document.querySelectorAll("[data-edit-student]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = state.students.items.find((item) => item.id === btn.dataset.editStudent);
      if (!s) return;
      setStudentDraft({ ...s });
      renderApp();
    });
  });

  document.querySelectorAll("[data-delete-student]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await deleteStudent(btn.dataset.deleteStudent);
        await reloadStudents(renderApp);
      } catch (error) {
        setStudentsError(error.message || "No se pudo eliminar el estudiante");
        renderApp();
      }
    });
  });

  document.getElementById("studentForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = document.getElementById("studentId").value;
      if (id) {
        await updateStudent(id, payloadFromForm());
      } else {
        await createStudent(payloadFromForm());
      }
      await reloadStudents(renderApp);
    } catch (error) {
      setStudentsError(error.message || "No se pudo guardar el estudiante");
      renderApp();
    }
  });

  // ── Importacion Excel ──
  document.getElementById("downloadTemplateBtn")?.addEventListener("click", async () => {
    try {
      await downloadStudentTemplate();
    } catch (error) {
      setStudentImportError(error.message || "No se pudo descargar la plantilla");
      renderApp();
    }
  });

  document.getElementById("previewImportBtn")?.addEventListener("click", async () => {
    const file = document.getElementById("importFile")?.files?.[0];
    if (!file) {
      setStudentImportError("Selecciona un archivo .xlsx primero");
      renderApp();
      return;
    }
    try {
      const preview = await previewStudentImport(file);
      setStudentImportPreview(preview);
    } catch (error) {
      setStudentImportError(error.message || "No se pudo procesar el archivo");
    } finally {
      renderApp();
    }
  });

  document.getElementById("commitImportBtn")?.addEventListener("click", async () => {
    const file = document.getElementById("importFile")?.files?.[0];
    if (!file) {
      setStudentImportError("El archivo ya no está disponible. Selecciónalo de nuevo.");
      renderApp();
      return;
    }
    try {
      const result = await commitStudentImport(file);
      setStudentImportResult(result);
      resetStudentsLoaded();
      await loadStudents(renderApp);
    } catch (error) {
      setStudentImportError(error.message || "No se pudo importar");
      renderApp();
    }
  });
}
