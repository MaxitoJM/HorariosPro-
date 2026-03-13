import { forgotPassword, login, logout as apiLogout, register, resetPassword } from "../api/authApi.js";
import { loginUser, logoutUser } from "../core/state.js";

function validateRegisterPayload(payload) {
  if (payload.nombre.length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }

  if (payload.apellido.length < 2) {
    return "El apellido debe tener al menos 2 caracteres";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Ingresa un correo electronico valido";
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,64}$/.test(payload.password)) {
    return "La contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y simbolo";
  }

  return null;
}

function showMessage(message, type = "error") {
  const box = document.getElementById("authMessage");
  if (!box) {
    return;
  }

  box.classList.remove(
    "hidden",
    "bg-red-50",
    "border-red-200",
    "text-red-600",
    "bg-green-50",
    "border-green-200",
    "text-green-700",
    "bg-blue-50",
    "border-blue-200",
    "text-blue-700",
    "border"
  );

  if (type === "success") {
    box.classList.add("bg-green-50", "border", "border-green-200", "text-green-700");
  } else if (type === "info") {
    box.classList.add("bg-blue-50", "border", "border-blue-200", "text-blue-700");
  } else {
    box.classList.add("bg-red-50", "border", "border-red-200", "text-red-600");
  }

  box.textContent = message;
}

function switchTab(tab) {
  const tabs = ["login", "register", "forgot"];
  tabs.forEach((name) => {
    const tabEl = document.getElementById(`tab-${name}`);
    const formEl = document.getElementById(`${name}Form`);
    if (tabEl) {
      tabEl.classList.toggle("active", name === tab);
    }
    if (formEl) {
      formEl.classList.toggle("hidden", name !== tab);
    }
  });

  const resetForm = document.getElementById("resetForm");
  if (resetForm) {
    resetForm.classList.toggle("hidden", tab !== "forgot");
  }
}

export function setupLoginListeners(onSuccess) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const forgotForm = document.getElementById("forgotForm");
  const resetForm = document.getElementById("resetForm");

  document.getElementById("tab-login")?.addEventListener("click", () => switchTab("login"));
  document.getElementById("tab-register")?.addEventListener("click", () => switchTab("register"));
  document.getElementById("tab-forgot")?.addEventListener("click", () => switchTab("forgot"));

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const password = document.getElementById("loginPassword").value;
      const session = await login({ email, password });
      loginUser(session);
      onSuccess();
    } catch (error) {
      showMessage(error.message || "No se pudo iniciar sesion", "error");
    }
  });

  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: document.getElementById("registerNombre").value.trim(),
        apellido: document.getElementById("registerApellido").value.trim(),
        email: document.getElementById("registerEmail").value.trim().toLowerCase(),
        password: document.getElementById("registerPassword").value,
        rol: document.getElementById("registerRol").value
      };

      const validationError = validateRegisterPayload(payload);
      if (validationError) {
        showMessage(validationError, "error");
        return;
      }

      const session = await register(payload);
      loginUser(session);
      onSuccess();
    } catch (error) {
      showMessage(error.message || "No se pudo registrar", "error");
    }
  });

  forgotForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById("forgotEmail").value.trim().toLowerCase();
      const result = await forgotPassword(email);
      let message = result.message;
      if (result.debugResetToken) {
        message += ` Token de prueba: ${result.debugResetToken}`;
      }
      showMessage(message, "info");
    } catch (error) {
      showMessage(error.message || "No se pudo procesar la solicitud", "error");
    }
  });

  resetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const token = document.getElementById("resetToken").value.trim();
      const password = document.getElementById("resetPassword").value;
      const result = await resetPassword({ token, password });
      showMessage(result.message, "success");
      switchTab("login");
    } catch (error) {
      showMessage(error.message || "No se pudo restablecer la contrasena", "error");
    }
  });
}

export async function logout(onSuccess) {
  try {
    await apiLogout();
  } catch {
    // no-op
  } finally {
    logoutUser();
    onSuccess();
  }
}
