import { getDashboardSummary } from "../api/dashboardApi.js";
import { resetDashboardLoaded, setDashboardError, setDashboardLoading, setDashboardSummary, state } from "../core/state.js";

async function loadDashboard(renderApp) {
  setDashboardLoading(true);
  setDashboardError(null);
  renderApp();

  try {
    const data = await getDashboardSummary();
    setDashboardSummary(data);
  } catch (error) {
    setDashboardError(error.message || "No se pudo cargar el dashboard");
  } finally {
    setDashboardLoading(false);
    renderApp();
  }
}

export function setupDashboardScreen(renderApp) {
  if (!state.dashboard.loaded && !state.dashboard.loading) {
    loadDashboard(renderApp);
  }

  document.getElementById("reloadDashboard")?.addEventListener("click", async () => {
    resetDashboardLoaded();
    await loadDashboard(renderApp);
  });
}
