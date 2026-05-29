import { createProgram, deleteProgram, listPrograms, updateProgram } from "../api/programsApi.js";
import {
  resetProgramsLoaded,
  setProgramDraft,
  setProgramsData,
  setProgramsError,
  setProgramsLoading,
  setProgramsSearch,
  state
} from "../core/state.js";

async function load(renderApp) {
  setProgramsLoading(true);
  setProgramsError(null);
  renderApp();
  try {
    setProgramsData(await listPrograms({ search: state.programs.search }));
  } catch (error) {
    setProgramsError(error.message || "No se pudieron cargar los programas");
  } finally {
    setProgramsLoading(false);
    renderApp();
  }
}

async function reload(renderApp) {
  resetProgramsLoaded();
  setProgramDraft(null);
  await load(renderApp);
}

function payload() {
  return {
    codigo: document.getElementById("programCodigo").value.trim(),
    nombre: document.getElementById("programNombre").value.trim(),
    departamento: document.getElementById("programDepartamento").value.trim()
  };
}

export function setupProgramasScreen(renderApp) {
  if (!state.programs.loaded && !state.programs.loading) load(renderApp);

  document.getElementById("reloadPrograms")?.addEventListener("click", () => reload(renderApp));
  document.getElementById("resetProgramForm")?.addEventListener("click", () => {
    setProgramDraft(null);
    renderApp();
  });
  document.getElementById("programSearchBtn")?.addEventListener("click", () => {
    setProgramsSearch(document.getElementById("programSearch").value.trim());
    reload(renderApp);
  });
  document.getElementById("programSearch")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      setProgramsSearch(e.target.value.trim());
      reload(renderApp);
    }
  });

  document.querySelectorAll("[data-edit-program]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const p = state.programs.items.find((i) => i.id === btn.dataset.editProgram);
      if (p) {
        setProgramDraft({ ...p });
        renderApp();
      }
    })
  );

  document.querySelectorAll("[data-delete-program]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      try {
        await deleteProgram(btn.dataset.deleteProgram);
        await reload(renderApp);
      } catch (error) {
        setProgramsError(error.message);
        renderApp();
      }
    })
  );

  document.getElementById("programForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const id = document.getElementById("programId").value;
      if (id) await updateProgram(id, payload());
      else await createProgram(payload());
      await reload(renderApp);
    } catch (error) {
      setProgramsError(error.message || "No se pudo guardar el programa");
      renderApp();
    }
  });
}
