import { listClassrooms } from "../api/classroomsApi.js";
import { listCourses } from "../api/coursesApi.js";
import { exportScheduleCsv, getScheduleReport } from "../api/reportsApi.js";
import { listTeachers } from "../api/teachersApi.js";
import {
  resetReportsLoaded,
  setClassroomsData,
  setCoursesData,
  setReportsData,
  setReportsError,
  setReportsExportError,
  setReportsExporting,
  setReportsFilters,
  setReportsLoading,
  setTeachersData,
  state
} from "../core/state.js";

async function loadReports(renderApp) {
  setReportsLoading(true);
  setReportsError(null);
  renderApp();

  try {
    const [schedule, teachersData, coursesData, classroomsData] = await Promise.all([
      getScheduleReport(state.reports.filters),
      listTeachers(),
      listCourses(),
      listClassrooms()
    ]);

    setReportsData({ schedule });
    setTeachersData(teachersData.items);
    setCoursesData(coursesData.items);
    setClassroomsData(classroomsData.items);
  } catch (error) {
    setReportsError(error.message || "No se pudieron cargar los reportes");
  } finally {
    setReportsLoading(false);
    renderApp();
  }
}

function downloadCsv(content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `horarios-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function handleExport(renderApp) {
  setReportsExporting(true);
  setReportsExportError(null);
  renderApp();

  try {
    const content = await exportScheduleCsv(state.reports.filters);
    downloadCsv(content);
  } catch (error) {
    setReportsExportError(error.message || "No se pudo exportar el reporte");
  } finally {
    setReportsExporting(false);
    renderApp();
  }
}

function readFiltersFromDom() {
  return {
    view: document.getElementById("reportsViewFilter")?.value || "all",
    entityId: document.getElementById("reportsEntityFilter")?.value || "",
    department: document.getElementById("reportsDepartmentFilter")?.value?.trim() || "",
    includeUnscheduled: Boolean(document.getElementById("reportsIncludePending")?.checked)
  };
}

export function setupReportesScreen(renderApp) {
  if (!state.reports.loaded && !state.reports.loading) {
    loadReports(renderApp);
  }

  document.getElementById("reloadReports")?.addEventListener("click", async () => {
    setReportsFilters(readFiltersFromDom());
    resetReportsLoaded();
    await loadReports(renderApp);
  });

  document.getElementById("reportsViewFilter")?.addEventListener("change", async () => {
    const view = document.getElementById("reportsViewFilter").value;
    setReportsFilters({ view, entityId: "" });
    resetReportsLoaded();
    await loadReports(renderApp);
  });

  document.getElementById("reportsEntityFilter")?.addEventListener("change", async () => {
    setReportsFilters(readFiltersFromDom());
    resetReportsLoaded();
    await loadReports(renderApp);
  });

  document.getElementById("reportsIncludePending")?.addEventListener("change", async () => {
    setReportsFilters(readFiltersFromDom());
    resetReportsLoaded();
    await loadReports(renderApp);
  });

  document.getElementById("reportsDepartmentFilter")?.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    setReportsFilters(readFiltersFromDom());
    resetReportsLoaded();
    await loadReports(renderApp);
  });

  document.getElementById("exportReportsCsv")?.addEventListener("click", async () => {
    setReportsFilters(readFiltersFromDom());
    await handleExport(renderApp);
  });

  document.getElementById("printReports")?.addEventListener("click", () => {
    window.print();
  });
}
