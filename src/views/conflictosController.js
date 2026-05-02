import { getConflicts, reassignSection } from '../api/schedulingApi.js';
import {
  resetConflictsLoaded,
  setConflictsError,
  setConflictsLoading,
  setConflictsResult,
  state
} from '../core/state.js';

async function scanConflicts(renderApp) {
  setConflictsLoading(true);
  setConflictsError(null);
  renderApp();

  try {
    const data = await getConflicts();
    setConflictsResult(data);
  } catch (error) {
    setConflictsError(error.message || 'No se pudo completar el escaneo de conflictos');
  } finally {
    setConflictsLoading(false);
    renderApp();
  }
}

async function handleReassign(sectionId, renderApp) {
  const msgEl = document.getElementById('reassignResultMsg');
  if (msgEl) {
    msgEl.textContent = 'Buscando reasignacion...';
    msgEl.className = 'mb-4 p-4 rounded-lg text-sm font-medium bg-blue-50 text-blue-800 border border-blue-200';
    msgEl.classList.remove('hidden');
  }

  try {
    await reassignSection(sectionId);
    // Re-scan to update conflict list
    const data = await getConflicts();
    setConflictsResult(data);
    renderApp();

    const updatedMsg = document.getElementById('reassignResultMsg');
    if (updatedMsg) {
      updatedMsg.textContent = 'Reasignacion completada exitosamente.';
      updatedMsg.className = 'mb-4 p-4 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200';
    }
  } catch (error) {
    const updatedMsg = document.getElementById('reassignResultMsg');
    if (updatedMsg) {
      updatedMsg.textContent = error.message || 'No se encontro una reasignacion valida para esta seccion.';
      updatedMsg.className = 'mb-4 p-4 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200';
    }
  }
}

export function setupConflictosScreen(renderApp) {
  // Auto-scan on first load
  if (!state.conflicts.loaded && !state.conflicts.loading) {
    scanConflicts(renderApp);
    return;
  }

  document.getElementById('scanConflictsBtn')?.addEventListener('click', () => {
    resetConflictsLoaded();
    scanConflicts(renderApp);
  });

  document.querySelectorAll('.btn-reassign').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sectionId = btn.dataset.sectionId;
      if (!sectionId) return;
      btn.disabled = true;
      btn.textContent = '⏳';
      await handleReassign(sectionId, renderApp);
      // Re-wire buttons after re-render
    });
  });
}
