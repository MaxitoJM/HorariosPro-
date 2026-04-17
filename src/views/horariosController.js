import { listCourses } from "../api/coursesApi.js";
import { listTeachers } from "../api/teachersApi.js";
import { listClassrooms } from "../api/classroomsApi.js";
import { getSchedulingOverview } from "../api/schedulingApi.js";
import {
  setClassroomsData,
  setCoursesData,
  setSchedulingError,
  setSchedulingLoading,
  setSchedulingOverview,
  setTeachersData,
  state
} from "../core/state.js";

async function loadOverview(renderApp, view = "all", entityId = "") {
  setSchedulingLoading(true);
  setSchedulingError(null);
  renderApp();

  try {
    const [overviewData, coursesData, teachersData, classroomsData] = await Promise.all([
      getSchedulingOverview(view, entityId),
      listCourses(),
      listTeachers(),
      listClassrooms()
    ]);
    setSchedulingOverview(overviewData);
    setCoursesData(coursesData.items);
    setTeachersData(teachersData.items);
    setClassroomsData(classroomsData.items);
  } catch (error) {
    setSchedulingError(error.message || "No se pudo cargar la visualizacion de horarios");
  } finally {
    setSchedulingLoading(false);
    renderApp();
  }
}

export function setupHorariosScreen(renderApp) {
  if (!state.scheduling.overview && !state.scheduling.loading) {
    loadOverview(renderApp);
  }

  document.getElementById("scheduleViewFilter")?.addEventListener("change", async () => {
    const view = document.getElementById("scheduleViewFilter").value;
    await loadOverview(renderApp, view, "");
  });

  document.getElementById("scheduleEntityFilter")?.addEventListener("change", async () => {
    const entityId = document.getElementById("scheduleEntityFilter").value;
    const view = document.getElementById("scheduleViewFilter").value;
    await loadOverview(renderApp, view, entityId);
  });
}
