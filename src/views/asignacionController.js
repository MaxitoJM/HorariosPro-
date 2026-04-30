import { listCourses } from "../api/coursesApi.js";
import { listTeachers } from "../api/teachersApi.js";
import { listClassrooms } from "../api/classroomsApi.js";
import {
  autoGenerate,
  getManualSchedulingContext,
  getSchedulingOverview,
  reassignSection,
  saveManualAssignment
} from "../api/schedulingApi.js";
import {
  resetSchedulingLoaded,
  setClassroomsData,
  setCoursesData,
  setManualContext,
  setSchedulingError,
  setSchedulingLoading,
  setSchedulingOverview,
  setSelectedSchedulingSectionId,
  setTeachersData,
  state
} from "../core/state.js";

async function loadSchedulingBase(renderApp) {
  setSchedulingLoading(true);
  setSchedulingError(null);
  renderApp();

  try {
    const [coursesData, teachersData, classroomsData, overviewData] = await Promise.all([
      listCourses(),
      listTeachers(),
      listClassrooms(),
      getSchedulingOverview("all")
    ]);
    setCoursesData(coursesData.items);
    setTeachersData(teachersData.items);
    setClassroomsData(classroomsData.items);
    setSchedulingOverview(overviewData);
  } catch (error) {
    setSchedulingError(error.message || "No se pudo cargar la vista de asignacion");
  } finally {
    setSchedulingLoading(false);
    renderApp();
  }
}

async function loadManualContext(sectionId, renderApp) {
  if (!sectionId) {
    setManualContext(null);
    renderApp();
    return;
  }

  try {
    setSchedulingLoading(true);
    renderApp();
    const data = await getManualSchedulingContext(sectionId);
    setManualContext(data);
  } catch (error) {
    setSchedulingError(error.message || "No se pudo cargar el contexto de la seccion");
  } finally {
    setSchedulingLoading(false);
    renderApp();
  }
}

function collectSelectedMeetings() {
  return Array.from(document.querySelectorAll(".manual-slot:checked")).map((input) => {
    const [diaSemana, timeBlockId] = input.value.split("::");
    return { diaSemana, timeBlockId };
  });
}

async function handleAutoGenerate(renderApp) {
  state.scheduling.autoGenerating = true;
  state.scheduling.autoGenerateResult = null;
  state.scheduling.autoGenerateError = null;
  renderApp();

  try {
    const data = await autoGenerate();
    state.scheduling.autoGenerateResult = data;
    if (data.assigned.length > 0) {
      // Reload overview after successful generation
      const overview = await getSchedulingOverview("all");
      setSchedulingOverview(overview);
      resetSchedulingLoaded();
      await loadSchedulingBase(renderApp);
      return;
    }
  } catch (error) {
    state.scheduling.autoGenerateError = error.message || "No se pudo ejecutar la generacion automatica";
  } finally {
    state.scheduling.autoGenerating = false;
    renderApp();
  }
}

async function handleReassign(renderApp) {
  const sectionId = state.scheduling.selectedSectionId;
  if (!sectionId) return;

  const msgEl = document.getElementById("reassignMsg");
  if (msgEl) {
    msgEl.textContent = "Buscando reasignacion...";
    msgEl.className = "mb-2 p-3 rounded-lg text-xs font-medium bg-blue-50 text-blue-800";
    msgEl.classList.remove("hidden");
  }

  try {
    const data = await reassignSection(sectionId);
    setManualContext(data);
    const overview = await getSchedulingOverview("all");
    setSchedulingOverview(overview);
    renderApp();

    const updated = document.getElementById("reassignMsg");
    if (updated) {
      updated.textContent = "Reasignacion exitosa.";
      updated.className = "mb-2 p-3 rounded-lg text-xs font-medium bg-green-50 text-green-700";
    }
  } catch (error) {
    const updated = document.getElementById("reassignMsg");
    if (updated) {
      updated.textContent = error.message || "No se encontro reasignacion valida.";
      updated.className = "mb-2 p-3 rounded-lg text-xs font-medium bg-red-50 text-red-700";
    }
  }
}

export function setupAsignacionScreen(renderApp) {
  if (!state.scheduling.loaded && !state.scheduling.loading) {
    loadSchedulingBase(renderApp);
  }

  document.getElementById("reloadScheduling")?.addEventListener("click", async () => {
    resetSchedulingLoaded();
    await loadSchedulingBase(renderApp);
  });

  document.getElementById("autoGenerateBtn")?.addEventListener("click", () => {
    if (!state.scheduling.autoGenerating) handleAutoGenerate(renderApp);
  });

  document.getElementById("manualSectionSelector")?.addEventListener("change", async (event) => {
    const sectionId = event.target.value;
    setSelectedSchedulingSectionId(sectionId || null);
    await loadManualContext(sectionId, renderApp);
  });

  document.getElementById("reassignSectionBtn")?.addEventListener("click", () => handleReassign(renderApp));

  document.getElementById("manualAssignmentForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const sectionId = state.scheduling.selectedSectionId;
      if (!sectionId) return;
      const classroomId = document.getElementById("manualClassroomSelector").value;
      const meetings = collectSelectedMeetings();
      const data = await saveManualAssignment(sectionId, { classroomId, meetings });
      setManualContext(data);
      const overview = await getSchedulingOverview("all");
      setSchedulingOverview(overview);
      renderApp();
    } catch (error) {
      setSchedulingError(error.message || "No se pudo guardar la asignacion manual");
      renderApp();
    }
  });
}
