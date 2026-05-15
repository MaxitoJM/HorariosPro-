export const screens = [
  'dashboard',
  'docentes',
  'cursos',
  'aulas',
  'franjas',
  'asignacion',
  'horarios',
  'conflictos',
  'estudiantes',
  'inscripcion'
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
  },
  courses: {
    items: [],
    selectedCourseId: null,
    loading: false,
    loaded: false,
    error: null
  },
  classrooms: {
    items: [],
    selectedClassroomId: null,
    loading: false,
    loaded: false,
    error: null
  },
  scheduling: {
    overview: null,
    manualContext: null,
    selectedSectionId: null,
    loading: false,
    loaded: false,
    error: null,
    autoGenerating: false,
    autoGenerateResult: null,
    autoGenerateError: null
  },
  dashboard: {
    summary: null,
    loading: false,
    loaded: false,
    error: null
  },
  conflicts: {
    result: null,
    loading: false,
    loaded: false,
    error: null
  },
  students: {
    items: [],
    draft: null,
    loading: false,
    loaded: false,
    error: null
  },
  enrollment: {
    enrolled: [],
    availableSections: [],
    loading: false,
    loaded: false,
    error: null
  }
};

function getInitialScreenByRole(role) {
  if (role === 'admin') return 'dashboard';
  if (role === 'profesor') return 'horarios';
  return 'inscripcion';
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
  state.courses = {
    items: [],
    selectedCourseId: null,
    loading: false,
    loaded: false,
    error: null
  };
  state.classrooms = {
    items: [],
    selectedClassroomId: null,
    loading: false,
    loaded: false,
    error: null
  };
  state.scheduling = {
    overview: null,
    manualContext: null,
    selectedSectionId: null,
    loading: false,
    loaded: false,
    error: null,
    autoGenerating: false,
    autoGenerateResult: null,
    autoGenerateError: null
  };
  state.dashboard = {
    summary: null,
    loading: false,
    loaded: false,
    error: null
  };
  state.conflicts = {
    result: null,
    loading: false,
    loaded: false,
    error: null
  };
  state.students = {
    items: [],
    draft: null,
    loading: false,
    loaded: false,
    error: null
  };
  state.enrollment = {
    enrolled: [],
    availableSections: [],
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

export function setCoursesLoading(loading) {
  state.courses.loading = loading;
}

export function setCoursesError(error) {
  state.courses.error = error;
}

export function setCoursesData(items) {
  state.courses.items = items;
  state.courses.loaded = true;
  state.courses.error = null;

  if (!state.courses.selectedCourseId && items.length > 0) {
    state.courses.selectedCourseId = items[0].id;
  }

  if (state.courses.selectedCourseId && !items.some((item) => item.id === state.courses.selectedCourseId)) {
    state.courses.selectedCourseId = items[0]?.id ?? null;
  }
}

export function setSelectedCourseId(id) {
  state.courses.selectedCourseId = id;
}

export function resetCoursesLoaded() {
  state.courses.loaded = false;
}

export function setClassroomsLoading(loading) {
  state.classrooms.loading = loading;
}

export function setClassroomsError(error) {
  state.classrooms.error = error;
}

export function setClassroomsData(items) {
  state.classrooms.items = items;
  state.classrooms.loaded = true;
  state.classrooms.error = null;

  if (!state.classrooms.selectedClassroomId && items.length > 0) {
    state.classrooms.selectedClassroomId = items[0].id;
  }

  if (
    state.classrooms.selectedClassroomId &&
    !items.some((item) => item.id === state.classrooms.selectedClassroomId)
  ) {
    state.classrooms.selectedClassroomId = items[0]?.id ?? null;
  }
}

export function setSelectedClassroomId(id) {
  state.classrooms.selectedClassroomId = id;
}

export function resetClassroomsLoaded() {
  state.classrooms.loaded = false;
}

export function setSchedulingLoading(loading) {
  state.scheduling.loading = loading;
}

export function setSchedulingError(error) {
  state.scheduling.error = error;
}

export function setSchedulingOverview(data) {
  state.scheduling.overview = data;
  state.scheduling.loaded = true;
  state.scheduling.error = null;
}

export function setManualContext(data) {
  state.scheduling.manualContext = data;
  state.scheduling.error = null;
}

export function setSelectedSchedulingSectionId(id) {
  state.scheduling.selectedSectionId = id;
}

export function resetSchedulingLoaded() {
  state.scheduling.loaded = false;
}

export function setDashboardLoading(loading) {
  state.dashboard.loading = loading;
}

export function setDashboardError(error) {
  state.dashboard.error = error;
}

export function setDashboardSummary(summary) {
  state.dashboard.summary = summary;
  state.dashboard.loaded = true;
  state.dashboard.error = null;
}

export function resetDashboardLoaded() {
  state.dashboard.loaded = false;
}

export function setConflictsLoading(loading) {
  state.conflicts.loading = loading;
}

export function setConflictsError(error) {
  state.conflicts.error = error;
}

export function setConflictsResult(result) {
  state.conflicts.result = result;
  state.conflicts.loaded = true;
  state.conflicts.error = null;
}

export function resetConflictsLoaded() {
  state.conflicts.loaded = false;
}

export function setStudentsLoading(loading) {
  state.students.loading = loading;
}

export function setStudentsError(error) {
  state.students.error = error;
}

export function setStudentsData(items) {
  state.students.items = items;
  state.students.loaded = true;
  state.students.error = null;
}

export function setStudentDraft(draft) {
  state.students.draft = draft;
}

export function resetStudentsLoaded() {
  state.students.loaded = false;
}

export function setEnrollmentLoading(loading) {
  state.enrollment.loading = loading;
}

export function setEnrollmentError(error) {
  state.enrollment.error = error;
}

export function setEnrollmentData(data) {
  state.enrollment.enrolled = data.enrolled || [];
  state.enrollment.availableSections = data.availableSections || [];
  state.enrollment.loaded = true;
  state.enrollment.error = null;
}

export function resetEnrollmentLoaded() {
  state.enrollment.loaded = false;
}
