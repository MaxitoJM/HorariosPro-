import { state } from '../core/state.js';
import { renderDashboard } from './dashboard.js';
import { renderDocentes } from './docentes.js';
import { renderCursos } from './cursos.js';
import { renderAulas } from './aulas.js';
import { renderFranjas } from './franjas.js';
import { renderAsignacion } from './asignacion.js';
import { renderHorarios } from './horarios.js';
import { renderConflictos } from './conflictos.js';
import { renderReportes } from './reportes.js';
import { renderUsuarios } from './usuarios.js';
import { renderEstudiantes } from './estudiantes.js';
import { renderPeriodos } from './periodos.js';
import { renderProgramas } from './programas.js';
import { renderInscripciones } from './inscripciones.js';

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
    case 'reportes':
      return renderReportes();
    case 'usuarios':
      return renderUsuarios();
    case 'estudiantes':
      return renderEstudiantes();
    case 'periodos':
      return renderPeriodos();
    case 'programas':
      return renderProgramas();
    case 'inscripciones':
      return renderInscripciones();
    default:
      return renderDashboard();
  }
}
