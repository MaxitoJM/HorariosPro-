import { listCourses } from "../api/coursesApi.js";
import { listTeachers } from "../api/teachersApi.js";
import { listClassrooms } from "../api/classroomsApi.js";
import {
  getManualSchedulingContext,
  getSchedulingOverview,
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

export function setupAsignacionScreen(renderApp) {
  if (!state.scheduling.loaded && !state.scheduling.loading) {
    loadSchedulingBase(renderApp);
  }

  document.getElementById("reloadScheduling")?.addEventListener("click", async () => {
    resetSchedulingLoaded();
    await loadSchedulingBase(renderApp);
  });

  document.getElementById("manualSectionSelector")?.addEventListener("change", async (event) => {
    const sectionId = event.target.value;
    setSelectedSchedulingSectionId(sectionId || null);
    await loadManualContext(sectionId, renderApp);
  });

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
