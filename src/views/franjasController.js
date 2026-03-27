import {
  createTimeBlock,
  createTimeSlotGroup,
  deleteTimeBlock,
  deleteTimeSlotGroup,
  fetchScheduleConfigBundle,
  updateAcademicConfig,
  updateRules,
  updateTimeBlock,
  updateTimeSlotGroup
} from "../api/scheduleConfigApi.js";
import {
  resetScheduleConfigLoaded,
  setScheduleConfigData,
  setScheduleConfigError,
  setScheduleConfigLoading,
  state
} from "../core/state.js";

function groupPayloadFromForm() {
  return {
    nombre: document.getElementById("groupNombre").value.trim(),
    horaInicio: document.getElementById("groupHoraInicio").value,
    horaFin: document.getElementById("groupHoraFin").value,
    activo: document.getElementById("groupActivo").checked
  };
}

function blockPayloadFromForm() {
  return {
    grupoId: document.getElementById("blockGroupId").value,
    nombre: document.getElementById("blockNombre").value.trim(),
    horaInicio: document.getElementById("blockHoraInicio").value,
    horaFin: document.getElementById("blockHoraFin").value,
    orden: Number(document.getElementById("blockOrden").value),
    activo: document.getElementById("blockActivo").checked
  };
}

function resetGroupForm() {
  document.getElementById("groupId").value = "";
  document.getElementById("timeSlotGroupForm").reset();
  document.getElementById("groupActivo").checked = true;
}

function resetBlockForm() {
  document.getElementById("blockId").value = "";
  document.getElementById("timeBlockForm").reset();
  document.getElementById("blockActivo").checked = true;
}

function fillGroupForm(groupId) {
  const group = state.scheduleConfig.groups.find((item) => item.id === groupId);
  if (!group) return;

  document.getElementById("groupId").value = group.id;
  document.getElementById("groupNombre").value = group.nombre;
  document.getElementById("groupHoraInicio").value = group.horaInicio;
  document.getElementById("groupHoraFin").value = group.horaFin;
  document.getElementById("groupActivo").checked = Boolean(group.activo);
}

function fillBlockForm(blockId) {
  const block = state.scheduleConfig.groups.flatMap((group) => group.timeBlocks).find((item) => item.id === blockId);
  if (!block) return;

  document.getElementById("blockId").value = block.id;
  document.getElementById("blockGroupId").value = block.grupoId;
  document.getElementById("blockNombre").value = block.nombre;
  document.getElementById("blockHoraInicio").value = block.horaInicio;
  document.getElementById("blockHoraFin").value = block.horaFin;
  document.getElementById("blockOrden").value = block.orden;
  document.getElementById("blockActivo").checked = Boolean(block.activo);
}

async function loadScheduleConfig(renderApp) {
  setScheduleConfigLoading(true);
  setScheduleConfigError(null);
  renderApp();

  try {
    const data = await fetchScheduleConfigBundle();
    setScheduleConfigData(data);
  } catch (error) {
    setScheduleConfigError(error.message || "No se pudo cargar la configuracion");
  } finally {
    setScheduleConfigLoading(false);
    renderApp();
  }
}

async function reloadScheduleConfig(renderApp) {
  resetScheduleConfigLoaded();
  await loadScheduleConfig(renderApp);
}

export function setupFranjasScreen(renderApp) {
  if (!state.scheduleConfig.loaded && !state.scheduleConfig.loading) {
    loadScheduleConfig(renderApp);
  }

  document.getElementById("reloadScheduleConfig")?.addEventListener("click", async () => {
    await reloadScheduleConfig(renderApp);
  });

  document.getElementById("resetGroupForm")?.addEventListener("click", resetGroupForm);
  document.getElementById("resetBlockForm")?.addEventListener("click", resetBlockForm);

  document.getElementById("timeSlotGroupForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = document.getElementById("groupId").value;
      const payload = groupPayloadFromForm();
      if (id) {
        await updateTimeSlotGroup(id, payload);
      } else {
        await createTimeSlotGroup(payload);
      }
      resetGroupForm();
      await reloadScheduleConfig(renderApp);
    } catch (error) {
      setScheduleConfigError(error.message || "No se pudo guardar la franja");
      renderApp();
    }
  });

  document.getElementById("timeBlockForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = document.getElementById("blockId").value;
      const payload = blockPayloadFromForm();
      if (id) {
        await updateTimeBlock(id, payload);
      } else {
        await createTimeBlock(payload);
      }
      resetBlockForm();
      await reloadScheduleConfig(renderApp);
    } catch (error) {
      setScheduleConfigError(error.message || "No se pudo guardar el bloque");
      renderApp();
    }
  });

  document.querySelectorAll("[data-edit-group]").forEach((button) => {
    button.addEventListener("click", () => fillGroupForm(button.dataset.editGroup));
  });

  document.querySelectorAll("[data-delete-group]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteTimeSlotGroup(button.dataset.deleteGroup);
        await reloadScheduleConfig(renderApp);
      } catch (error) {
        setScheduleConfigError(error.message || "No se pudo eliminar la franja");
        renderApp();
      }
    });
  });

  document.querySelectorAll("[data-edit-block]").forEach((button) => {
    button.addEventListener("click", () => fillBlockForm(button.dataset.editBlock));
  });

  document.querySelectorAll("[data-delete-block]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteTimeBlock(button.dataset.deleteBlock);
        await reloadScheduleConfig(renderApp);
      } catch (error) {
        setScheduleConfigError(error.message || "No se pudo eliminar el bloque");
        renderApp();
      }
    });
  });

  document.getElementById("rulesForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const rules = state.scheduleConfig.rules.map((rule) => {
        const input = document.querySelector(`[data-rule-key="${rule.clave}"]`);
        const value = rule.tipo === "boolean" ? input.checked : Number(input.value);
        return {
          clave: rule.clave,
          tipo: rule.tipo,
          descripcion: rule.descripcion,
          activo: rule.activo,
          valor: value
        };
      });

      await updateRules(rules);
      await reloadScheduleConfig(renderApp);
    } catch (error) {
      setScheduleConfigError(error.message || "No se pudieron guardar las reglas");
      renderApp();
    }
  });

  document.getElementById("academicConfigForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const diasHabiles = Array.from(document.querySelectorAll(".config-day:checked")).map((input) => input.value);
      await updateAcademicConfig({
        nombre: document.getElementById("configNombre").value.trim(),
        sesionesPorSemanaDefault: Number(document.getElementById("configSesiones").value),
        duracionSesionDefault: Number(document.getElementById("configDuracion").value),
        diasHabiles,
        activo: document.getElementById("configActivo").checked
      });
      await reloadScheduleConfig(renderApp);
    } catch (error) {
      setScheduleConfigError(error.message || "No se pudo guardar la configuracion academica");
      renderApp();
    }
  });
}
