import { createPeriod, deletePeriod, listPeriods, setCurrentPeriod, updatePeriod } from "../api/periodsApi.js";
import {
  resetPeriodsLoaded,
  setPeriodDraft,
  setPeriodsData,
  setPeriodsError,
  setPeriodsLoading,
  state
} from "../core/state.js";

async function load(renderApp) {
  setPeriodsLoading(true);
  setPeriodsError(null);
  renderApp();
  try {
    const data = await listPeriods();
    setPeriodsData(data.items ?? data);
  } catch (error) {
    setPeriodsError(error.message || "No se pudieron cargar los periodos");
  } finally {
    setPeriodsLoading(false);
    renderApp();
  }
}

async function reload(renderApp) {
  resetPeriodsLoaded();
  setPeriodDraft(null);
  await load(renderApp);
}

function toIso(dateStr) {
  return dateStr ? new Date(`${dateStr}T00:00:00.000Z`).toISOString() : "";
}

function payload() {
  return {
    codigo: document.getElementById("periodCodigo").value.trim(),
    nombre: document.getElementById("periodNombre").value.trim(),
    fechaInicio: toIso(document.getElementById("periodInicio").value),
    fechaFin: toIso(document.getElementById("periodFin").value),
    esActual: document.getElementById("periodActual").checked
  };
}

export function setupPeriodosScreen(renderApp) {
  if (!state.periods.loaded && !state.periods.loading) load(renderApp);

  document.getElementById("reloadPeriods")?.addEventListener("click", () => reload(renderApp));
  document.getElementById("resetPeriodForm")?.addEventListener("click", () => {
    setPeriodDraft(null);
    renderApp();
  });

  document.querySelectorAll("[data-edit-period]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const p = state.periods.items.find((i) => i.id === btn.dataset.editPeriod);
      if (p) {
        setPeriodDraft({ ...p });
        renderApp();
      }
    })
  );

  document.querySelectorAll("[data-current-period]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await setCurrentPeriod(btn.dataset.currentPeriod);
        await reload(renderApp);
      } catch (error) {
        setPeriodsError(error.message);
        renderApp();
      }
    })
  );

  document.querySelectorAll("[data-delete-period]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await deletePeriod(btn.dataset.deletePeriod);
        await reload(renderApp);
      } catch (error) {
        setPeriodsError(error.message);
        renderApp();
      }
    })
  );

  document.getElementById("periodForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const id = document.getElementById("periodId").value;
      if (id) await updatePeriod(id, payload());
      else await createPeriod(payload());
      await reload(renderApp);
    } catch (error) {
      setPeriodsError(error.message || "No se pudo guardar el periodo");
      renderApp();
    }
  });
}
