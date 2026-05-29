import { state } from '../core/state.js';
import { h } from '../core/dom.js';

const SEVERITY_CONFIG = {
  critical: { icon: '🔴', label: 'CRITICO',   badgeCss: 'bg-red-100 text-red-800',    rowCss: 'border-l-4 border-red-500' },
  warning:  { icon: '🟠', label: 'ADVERTENCIA', badgeCss: 'bg-orange-100 text-orange-800', rowCss: 'border-l-4 border-orange-400' },
  info:     { icon: '🔵', label: 'INFO',       badgeCss: 'bg-blue-100 text-blue-800',  rowCss: 'border-l-4 border-blue-400' }
};

const TYPE_LABELS = {
  TEACHER_DOUBLE_BOOKING:   'Docente con doble asignacion',
  CLASSROOM_DOUBLE_BOOKING: 'Aula con doble asignacion',
  SECTION_WITHOUT_TEACHER:  'Seccion sin docente',
  SECTION_UNSCHEDULED:      'Seccion sin horario',
  INVALID_SESSION_COUNT:    'Cantidad de sesiones incorrecta',
  TEACHER_UNAVAILABLE:      'Docente fuera de disponibilidad',
  CLASSROOM_UNAVAILABLE:    'Aula fuera de disponibilidad',
  CONSECUTIVE_DAYS:         'Dias consecutivos (recomendacion)'
};

function renderStats() {
  const result = state.conflicts.result;
  if (!result) {
    return `
      <div class="grid grid-cols-4 gap-6 mb-6">
        ${['Total', 'Criticos', 'Advertencias', 'Info'].map(label => `
          <div class="card p-6">
            <p class="text-gray-500 text-sm font-medium">${label}</p>
            <p class="text-3xl font-bold text-gray-300 mt-2">—</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  const { summary } = result;
  return `
    <div class="grid grid-cols-4 gap-6 mb-6">
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">Total Conflictos</p>
            <p class="text-3xl font-bold ${summary.total > 0 ? 'text-red-600' : 'text-green-600'} mt-2">${summary.total}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">⚠️</span>
          </div>
        </div>
      </div>
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">Criticos</p>
            <p class="text-3xl font-bold text-red-600 mt-2">${summary.critical}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🔴</span>
          </div>
        </div>
      </div>
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">Advertencias</p>
            <p class="text-3xl font-bold text-orange-600 mt-2">${summary.warning}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🟠</span>
          </div>
        </div>
      </div>
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">Informativos</p>
            <p class="text-3xl font-bold text-blue-600 mt-2">${summary.info}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🔵</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderConflictCard(conflict) {
  const cfg = SEVERITY_CONFIG[conflict.severity] ?? SEVERITY_CONFIG.info;
  const typeLabel = TYPE_LABELS[conflict.type] ?? conflict.type;

  const meta = [
    conflict.teacherNombre  && `<p><span class="text-gray-500">Docente:</span> ${h(conflict.teacherNombre)}</p>`,
    conflict.classroomCodigo && `<p><span class="text-gray-500">Aula:</span> ${h(conflict.classroomCodigo)}</p>`,
    conflict.courseCodigo   && `<p><span class="text-gray-500">Curso:</span> ${h(conflict.courseCodigo)} — ${h(conflict.courseNombre ?? '')}</p>`,
    conflict.sectionCodigo  && `<p><span class="text-gray-500">Seccion:</span> ${conflict.sectionCodigo}</p>`,
    conflict.diaSemana      && `<p><span class="text-gray-500">Dia/Bloque:</span> ${conflict.diaSemana} ${conflict.timeBlockLabel ?? ''}</p>`
  ].filter(Boolean).join('');

  const suggestions = conflict.suggestions.length > 0
    ? `<div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
        <p class="text-sm font-medium text-blue-900 mb-2">💡 Sugerencias:</p>
        <ul class="text-sm text-blue-800 space-y-1">
          ${conflict.suggestions.map(s => `<li>• ${h(s)}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const reassignBtn = conflict.sectionId
    ? `<button class="btn-reassign px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm" data-section-id="${conflict.sectionId}">Reasignar</button>`
    : '';

  return `
    <div class="p-6 hover:bg-gray-50 ${cfg.rowCss}">
      <div class="flex items-start justify-between">
        <div class="flex items-start gap-4 flex-1">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
            ${cfg.icon}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h4 class="font-semibold text-gray-800">${typeLabel}</h4>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badgeCss}">${cfg.label}</span>
            </div>
            <p class="text-gray-600 text-sm">${h(conflict.description)}</p>
            ${meta ? `<div class="mt-2 space-y-0.5 text-sm">${meta}</div>` : ''}
            ${suggestions}
          </div>
        </div>
        <div class="ml-4 flex-shrink-0">${reassignBtn}</div>
      </div>
    </div>
  `;
}

function renderConflictList() {
  if (state.conflicts.loading) {
    return '<div class="p-8 text-center text-gray-500">Escaneando conflictos...</div>';
  }

  if (state.conflicts.error) {
    return `<div class="p-6 text-red-600 bg-red-50">${state.conflicts.error}</div>`;
  }

  const result = state.conflicts.result;
  if (!result) {
    return '<div class="p-8 text-center text-gray-400">Presiona "Escanear Conflictos" para analizar los horarios actuales.</div>';
  }

  if (result.conflicts.length === 0) {
    return `
      <div class="p-10 text-center">
        <div class="text-5xl mb-4">✅</div>
        <p class="text-xl font-semibold text-green-700">Sin conflictos detectados</p>
        <p class="text-gray-500 mt-2 text-sm">Escaneado el ${new Date(result.scannedAt).toLocaleString('es-CO')}</p>
      </div>
    `;
  }

  const criticals = result.conflicts.filter(c => c.severity === 'critical');
  const warnings  = result.conflicts.filter(c => c.severity === 'warning');
  const infos     = result.conflicts.filter(c => c.severity === 'info');

  const sections = [
    { label: '🔴 Criticos', list: criticals, headerCss: 'bg-red-50 text-red-800' },
    { label: '🟠 Advertencias', list: warnings, headerCss: 'bg-orange-50 text-orange-800' },
    { label: '🔵 Informativos', list: infos, headerCss: 'bg-blue-50 text-blue-800' }
  ].filter(s => s.list.length > 0);

  return sections.map(({ label, list, headerCss }) => `
    <div class="mb-4">
      <div class="px-6 py-3 ${headerCss} font-semibold text-sm">${label} (${list.length})</div>
      <div class="divide-y divide-gray-200">${list.map(renderConflictCard).join('')}</div>
    </div>
  `).join('');
}

export function renderConflictos() {
  const scannedAt = state.conflicts.result?.scannedAt
    ? `Ultimo escaneo: ${new Date(state.conflicts.result.scannedAt).toLocaleString('es-CO')}`
    : '';

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Gestion de Conflictos</h2>
          <p class="text-gray-500 text-sm mt-1">${scannedAt || 'HU-20/HU-30: Deteccion y notificacion de conflictos en horarios'}</p>
        </div>
        <div class="flex gap-3">
          <button id="scanConflictsBtn" class="btn-primary flex items-center gap-2">
            ${state.conflicts.loading ? '⏳ Escaneando...' : '🔍 Escanear Conflictos'}
          </button>
        </div>
      </div>

      ${state.conflicts.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${state.conflicts.error}</div>` : ''}

      ${renderStats()}

      <div id="conflictsResultPanel">
        ${state.conflicts.result
          ? `
            <div id="reassignResultMsg" class="hidden mb-4 p-4 rounded-lg text-sm font-medium"></div>
            <div class="card overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 class="font-semibold text-gray-800">Resultado del escaneo</h3>
                <span class="text-xs text-gray-500">${state.conflicts.result.conflicts.length} conflicto(s) encontrado(s)</span>
              </div>
              <div id="conflictsList">
                ${renderConflictList()}
              </div>
            </div>
          `
          : `
            <div class="card p-12 text-center">
              <div class="text-6xl mb-4">🔍</div>
              <p class="text-lg font-medium text-gray-700">Listo para escanear</p>
              <p class="text-gray-500 text-sm mt-2">Haz clic en "Escanear Conflictos" para detectar problemas en los horarios actuales.</p>
            </div>
          `
        }
      </div>
    </div>
  `;
}
