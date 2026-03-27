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
  accessToken: null,
  scheduleConfig: {
    groups: [],
    rules: [],
    academicConfig: null,
    loading: false,
    loaded: false,
    error: null
  },
  teachers: {
    items: [],
    selectedTeacherId: null,
    loading: false,
    loaded: false,
    error: null
  }
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
  state.scheduleConfig = {
    groups: [],
    rules: [],
    academicConfig: null,
    loading: false,
    loaded: false,
    error: null
  };
  state.teachers = {
    items: [],
    selectedTeacherId: null,
    loading: false,
    loaded: false,
    error: null
  };

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

export function setScheduleConfigLoading(loading) {
  state.scheduleConfig.loading = loading;
}

export function setScheduleConfigError(error) {
  state.scheduleConfig.error = error;
}

export function setScheduleConfigData({ groups, rules, academicConfig }) {
  state.scheduleConfig.groups = groups;
  state.scheduleConfig.rules = rules;
  state.scheduleConfig.academicConfig = academicConfig;
  state.scheduleConfig.loaded = true;
  state.scheduleConfig.error = null;
}

export function resetScheduleConfigLoaded() {
  state.scheduleConfig.loaded = false;
}

export function setTeachersLoading(loading) {
  state.teachers.loading = loading;
}

export function setTeachersError(error) {
  state.teachers.error = error;
}

export function setTeachersData(items) {
  state.teachers.items = items;
  state.teachers.loaded = true;
  state.teachers.error = null;

  if (!state.teachers.selectedTeacherId && items.length > 0) {
    state.teachers.selectedTeacherId = items[0].id;
  }

  if (state.teachers.selectedTeacherId && !items.some((item) => item.id === state.teachers.selectedTeacherId)) {
    state.teachers.selectedTeacherId = items[0]?.id ?? null;
  }
}

export function setSelectedTeacherId(id) {
  state.teachers.selectedTeacherId = id;
}

export function resetTeachersLoaded() {
  state.teachers.loaded = false;
}
