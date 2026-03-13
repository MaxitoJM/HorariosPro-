export const screens = [
  'dashboard',
  'docentes',
  'cursos',
  'aulas',
  'franjas',
  'asignacion',
  'horarios',
  'conflictos'
];

export const state = {
  currentScreen: 'dashboard',
  isLoggedIn: false,
  currentUser: null,
  accessToken: null
};

function getInitialScreenByRole(role) {
  if (role === 'admin') return 'dashboard';
  if (role === 'profesor') return 'horarios';
  return 'horarios';
}

export function setCurrentScreen(screen) {
  state.currentScreen = screen;
}

export function loginUser(session) {
  state.isLoggedIn = true;
  state.currentUser = session.user;
  state.accessToken = session.accessToken;
  state.currentScreen = getInitialScreenByRole(session.user.rol);

  sessionStorage.setItem('nucleo_access_token', session.accessToken);
  localStorage.setItem('nucleo_user', JSON.stringify(session.user));
}

export function logoutUser() {
  state.isLoggedIn = false;
  state.currentUser = null;
  state.accessToken = null;
  state.currentScreen = 'dashboard';

  sessionStorage.removeItem('nucleo_access_token');
  localStorage.removeItem('nucleo_user');
}

export function restoreSession() {
  const accessToken = sessionStorage.getItem('nucleo_access_token');
  const userRaw = localStorage.getItem('nucleo_user');

  if (!accessToken || !userRaw) {
    return false;
  }

  try {
    state.isLoggedIn = true;
    state.currentUser = JSON.parse(userRaw);
    state.accessToken = accessToken;
    state.currentScreen = getInitialScreenByRole(state.currentUser.rol);
    return true;
  } catch {
    logoutUser();
    return false;
  }
}
