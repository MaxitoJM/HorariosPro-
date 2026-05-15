import { deleteUser, listUsers, updateUser } from "../api/usersApi.js";
import {
  resetUsersLoaded,
  setUserDraft,
  setUsersData,
  setUsersError,
  setUsersLoading,
  state
} from "../core/state.js";

async function loadUsers(renderApp) {
  setUsersLoading(true);
  setUsersError(null);
  renderApp();

  try {
    const data = await listUsers({ includeInactive: true });
    setUsersData(data.items);
  } catch (error) {
    setUsersError(error.message || "No se pudieron cargar los usuarios");
  } finally {
    setUsersLoading(false);
    renderApp();
  }
}

async function reloadUsers(renderApp) {
  resetUsersLoaded();
  setUserDraft(null);
  await loadUsers(renderApp);
}

function payloadFromForm() {
  const password = document.getElementById("userPassword").value;
  return {
    nombre: document.getElementById("userNombre").value.trim(),
    apellido: document.getElementById("userApellido").value.trim(),
    email: document.getElementById("userEmail").value.trim().toLowerCase(),
    rol: document.getElementById("userRol").value,
    activo: document.getElementById("userActivo").checked,
    verificado: document.getElementById("userVerificado").checked,
    ...(password ? { password } : {})
  };
}

export function setupUsuariosScreen(renderApp) {
  if (!state.users.loaded && !state.users.loading) {
    loadUsers(renderApp);
  }

  document.getElementById("reloadUsers")?.addEventListener("click", async () => {
    await reloadUsers(renderApp);
  });

  document.getElementById("resetUserForm")?.addEventListener("click", () => {
    setUserDraft(null);
    renderApp();
  });

  document.querySelectorAll("[data-edit-user]").forEach((button) => {
    button.addEventListener("click", () => {
      const user = state.users.items.find((item) => item.id === button.dataset.editUser);
      if (!user) return;
      setUserDraft({ ...user });
      renderApp();
    });
  });

  document.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await deleteUser(button.dataset.deleteUser);
        await reloadUsers(renderApp);
      } catch (error) {
        setUsersError(error.message || "No se pudo eliminar el usuario");
        renderApp();
      }
    });
  });

  document.getElementById("userForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = document.getElementById("userId").value;
      if (!id) return;
      await updateUser(id, payloadFromForm());
      await reloadUsers(renderApp);
    } catch (error) {
      setUsersError(error.message || "No se pudo actualizar el usuario");
      renderApp();
    }
  });
}
