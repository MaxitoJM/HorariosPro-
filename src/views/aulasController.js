import {
  createClassroom,
  deleteClassroom,
  listClassrooms,
  updateClassroom,
  updateClassroomAvailability
} from "../api/classroomsApi.js";
import {
  resetClassroomsLoaded,
  setClassroomsData,
  setClassroomsError,
  setClassroomsLoading,
  setSelectedClassroomId,
  state
} from "../core/state.js";

const DEFAULT_AVAILABILITY = { diaSemana: "lunes", horaInicio: "07:00", horaFin: "18:00", activo: true };

function classroomPayloadFromForm() {
  return {
    codigo: document.getElementById("classroomCodigo").value.trim().toUpperCase(),
    edificio: document.getElementById("classroomEdificio").value.trim(),
    piso: document.getElementById("classroomPiso").value.trim(),
    tipo: document.getElementById("classroomTipo").value,
    capacidad: Number(document.getElementById("classroomCapacidad").value),
    equipamiento: document
      .getElementById("classroomEquipamiento")
      .value.split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    activo: document.getElementById("classroomActivo").checked
  };
}

function resetClassroomForm() {
  document.getElementById("classroomId").value = "";
  document.getElementById("classroomForm").reset();
  document.getElementById("classroomTipo").value = "aula";
  document.getElementById("classroomActivo").checked = true;
}

function fillClassroomForm(classroomId) {
  const classroom = state.classrooms.items.find((item) => item.id === classroomId);
  if (!classroom) return;

  document.getElementById("classroomId").value = classroom.id;
  document.getElementById("classroomCodigo").value = classroom.codigo;
  document.getElementById("classroomEdificio").value = classroom.edificio;
  document.getElementById("classroomPiso").value = classroom.piso || "";
  document.getElementById("classroomTipo").value = classroom.tipo;
  document.getElementById("classroomCapacidad").value = classroom.capacidad;
  document.getElementById("classroomEquipamiento").value = classroom.equipamiento.join(", ");
  document.getElementById("classroomActivo").checked = Boolean(classroom.activo);
}

function buildAvailabilityRow(item = DEFAULT_AVAILABILITY) {
  return `
    <div class="classroom-availability-row grid grid-cols-4 gap-3">
      <select class="classroom-availability-day px-3 py-2 border border-gray-300 rounded-lg">
        <option value="lunes" ${item.diaSemana === "lunes" ? "selected" : ""}>Lunes</option>
        <option value="martes" ${item.diaSemana === "martes" ? "selected" : ""}>Martes</option>
        <option value="miercoles" ${item.diaSemana === "miercoles" ? "selected" : ""}>Miercoles</option>
        <option value="jueves" ${item.diaSemana === "jueves" ? "selected" : ""}>Jueves</option>
        <option value="viernes" ${item.diaSemana === "viernes" ? "selected" : ""}>Viernes</option>
        <option value="sabado" ${item.diaSemana === "sabado" ? "selected" : ""}>Sabado</option>
      </select>
      <input type="time" class="classroom-availability-start px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaInicio}">
      <input type="time" class="classroom-availability-end px-3 py-2 border border-gray-300 rounded-lg" value="${item.horaFin}">
      <button type="button" class="remove-classroom-availability px-3 py-2 bg-red-50 text-red-700 rounded-lg">Quitar</button>
    </div>
  `;
}

function bindAvailabilityButtons() {
  document.querySelectorAll(".remove-classroom-availability").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".classroom-availability-row")?.remove();
    });
  });
}

function collectAvailabilityRows() {
  return Array.from(document.querySelectorAll(".classroom-availability-row")).map((row) => ({
    diaSemana: row.querySelector(".classroom-availability-day").value,
    horaInicio: row.querySelector(".classroom-availability-start").value,
    horaFin: row.querySelector(".classroom-availability-end").value,
    activo: true
  }));
}

async function loadClassrooms(renderApp) {
  setClassroomsLoading(true);
  setClassroomsError(null);
  renderApp();

  try {
    const data = await listClassrooms();
    setClassroomsData(data.items);
  } catch (error) {
    setClassroomsError(error.message || "No se pudieron cargar las aulas");
  } finally {
    setClassroomsLoading(false);
    renderApp();
  }
}

async function reloadClassrooms(renderApp) {
  resetClassroomsLoaded();
  await loadClassrooms(renderApp);
}

export function setupAulasScreen(renderApp) {
  if (!state.classrooms.loaded && !state.classrooms.loading) {
    loadClassrooms(renderApp);
  }

  document.getElementById("reloadClassrooms")?.addEventListener("click", async () => {
    await reloadClassrooms(renderApp);
  });

  document.getElementById("resetClassroomForm")?.addEventListener("click", resetClassroomForm);

  document.getElementById("classroomForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = document.getElementById("classroomId").value;
      const payload = classroomPayloadFromForm();
      if (id) {
        await updateClassroom(id, payload);
      } else {
        await createClassroom(payload);
      }
      resetClassroomForm();
      await reloadClassrooms(renderApp);
    } catch (error) {
      setClassroomsError(error.message || "No se pudo guardar el aula");
      renderApp();
    }
  });

  document.querySelectorAll("[data-select-classroom]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedClassroomId(button.dataset.selectClassroom);
      renderApp();
    });
  });

  document.querySelectorAll("[data-edit-classroom]").forEach((button) => {
    button.addEventListener("click", () => {
      setSelectedClassroomId(button.dataset.editClassroom);
      renderApp();
      fillClassroomForm(button.dataset.editClassroom);
    });
  });

  document.querySelectorAll("[data-delete-classroom]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteClassroom(button.dataset.deleteClassroom);
        await reloadClassrooms(renderApp);
      } catch (error) {
        setClassroomsError(error.message || "No se pudo eliminar el aula");
        renderApp();
      }
    });
  });

  document.getElementById("addClassroomAvailabilityRow")?.addEventListener("click", () => {
    document.getElementById("classroomAvailabilityRows")?.insertAdjacentHTML("beforeend", buildAvailabilityRow());
    bindAvailabilityButtons();
  });

  document.getElementById("classroomAvailabilityForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const classroomId = state.classrooms.selectedClassroomId;
      if (!classroomId) return;
      await updateClassroomAvailability(classroomId, collectAvailabilityRows());
      await reloadClassrooms(renderApp);
    } catch (error) {
      setClassroomsError(error.message || "No se pudo guardar la disponibilidad del aula");
      renderApp();
    }
  });

  bindAvailabilityButtons();
}
