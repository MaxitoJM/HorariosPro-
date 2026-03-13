import { state } from '../core/state.js';
import { renderDashboard } from './dashboard.js';
import { renderDocentes } from './docentes.js';
import { renderCursos } from './cursos.js';
import { renderAulas } from './aulas.js';
import { renderFranjas } from './franjas.js';
import { renderAsignacion } from './asignacion.js';
import { renderHorarios } from './horarios.js';
import { renderConflictos } from './conflictos.js';

export function renderScreen() {
  switch (state.currentScreen) {
    case 'dashboard':
      return renderDashboard();
    case 'docentes':
      return renderDocentes();
    case 'cursos':
      return renderCursos();
    case 'aulas':
      return renderAulas();
    case 'franjas':
      return renderFranjas();
    case 'asignacion':
      return renderAsignacion();
    case 'horarios':
      return renderHorarios();
    case 'conflictos':
      return renderConflictos();
    default:
      return renderDashboard();
  }
}
