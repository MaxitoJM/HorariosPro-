import { enrollSection, getEnrollmentContext, withdrawEnrollment } from "../api/enrollmentsApi.js";
import {
  resetEnrollmentLoaded,
  setEnrollmentData,
  setEnrollmentError,
  setEnrollmentLoading,
  state
} from "../core/state.js";

async function loadEnrollment(renderApp) {
  setEnrollmentLoading(true);
  setEnrollmentError(null);
  renderApp();

  try {
    const data = await getEnrollmentContext();
    setEnrollmentData(data);
  } catch (error) {
    setEnrollmentError(error.message || "No se pudieron cargar las inscripciones");
  } finally {
    setEnrollmentLoading(false);
    renderApp();
  }
}

async function reloadEnrollment(renderApp) {
  resetEnrollmentLoaded();
  await loadEnrollment(renderApp);
}

export function setupInscripcionScreen(renderApp) {
  if (!state.enrollment.loaded && !state.enrollment.loading) {
    loadEnrollment(renderApp);
  }

  document.getElementById("reloadEnrollment")?.addEventListener("click", async () => {
    await reloadEnrollment(renderApp);
  });

  document.querySelectorAll("[data-enroll]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const data = await enrollSection(button.dataset.enroll);
        setEnrollmentData(data);
        renderApp();
      } catch (error) {
        setEnrollmentError(error.message || "No se pudo completar la inscripcion");
        renderApp();
      }
    });
  });

  document.querySelectorAll("[data-withdraw]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const data = await withdrawEnrollment(button.dataset.withdraw);
        setEnrollmentData(data);
        renderApp();
      } catch (error) {
        setEnrollmentError(error.message || "No se pudo retirar la inscripcion");
        renderApp();
      }
    });
  });
}
