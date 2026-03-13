import { screens, setCurrentScreen, state, restoreSession, logoutUser, loginUser } from './state.js';
import { renderLayout } from '../layout/shell.js';
import { renderScreen } from '../views/index.js';
import { renderLogin } from '../auth/loginView.js';
import { logout, setupLoginListeners } from '../auth/session.js';
import { me, refreshToken } from '../api/authApi.js';

const ROLE_ALLOWED_SCREENS = {
  admin: screens,
  profesor: ['horarios', 'dashboard'],
  estudiante: ['horarios']
};

function canAccessScreen(role, screen) {
  const allowed = ROLE_ALLOWED_SCREENS[role] || [];
  return allowed.includes(screen);
}

async function validateSession() {
  if (!restoreSession()) {
    return false;
  }

  try {
    const profile = await me(state.accessToken);
    state.currentUser = profile.user;
    return true;
  } catch {
    try {
      const refreshed = await refreshToken();
      loginUser({ user: refreshed.user, accessToken: refreshed.accessToken });
      return true;
    } catch {
      logoutUser();
      return false;
    }
  }
}

export async function renderApp() {
  const app = document.getElementById('app');

  if (!state.isLoggedIn) {
    const restored = await validateSession();
    if (!restored) {
      app.innerHTML = renderLogin();
      setTimeout(() => setupLoginListeners(renderApp), 0);
      return;
    }
  }

  if (!canAccessScreen(state.currentUser?.rol, state.currentScreen)) {
    const fallback = ROLE_ALLOWED_SCREENS[state.currentUser?.rol]?.[0] || 'horarios';
    setCurrentScreen(fallback);
  }

  app.innerHTML = renderLayout(renderScreen());

  screens.forEach((screen) => {
    const element = document.getElementById(`nav-${screen}`);
    if (!element) return;

    if (!canAccessScreen(state.currentUser?.rol, screen)) {
      element.classList.add('hidden');
      return;
    }

    element.onclick = () => {
      setCurrentScreen(screen);
      renderApp();
    };
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => logout(renderApp);
  }
}
