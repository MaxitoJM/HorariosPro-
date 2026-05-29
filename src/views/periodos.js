import { state } from "../core/state.js";
import { h } from "../core/dom.js";

function fmt(d) {
  return d ? String(d).slice(0, 10) : "";
}

function renderRows(items) {
  if (!items.length) {
    return `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No hay periodos registrados.</td></tr>`;
  }
  return items
    .map(
      (p) => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-6 py-3 font-medium text-gray-800">${h(p.codigo)}${p.esActual ? ' <span class="ml-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">actual</span>' : ""}</td>
        <td class="px-6 py-3">${h(p.nombre)}</td>
        <td class="px-6 py-3 text-sm text-gray-600">${fmt(p.fechaInicio)} → ${fmt(p.fechaFin)}</td>
        <td class="px-6 py-3 text-sm">${p.activo ? "Activo" : "Inactivo"}</td>
        <td class="px-6 py-3 text-right whitespace-nowrap">
          ${!p.esActual ? `<button data-current-period="${p.id}" class="text-green-600 hover:underline text-sm mr-3">Marcar actual</button>` : ""}
          <button data-edit-period="${p.id}" class="text-blue-600 hover:underline text-sm mr-3">Editar</button>
          <button data-delete-period="${p.id}" class="text-red-600 hover:underline text-sm">Eliminar</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderForm(draft) {
  const d = draft || {};
  const editing = Boolean(d.id);
  return `
    <form id="periodForm" class="card p-6 space-y-3">
      <h3 class="text-lg font-semibold text-gray-800">${editing ? "Editar periodo" : "Nuevo periodo"}</h3>
      <input type="hidden" id="periodId" value="${h(d.id || "")}">
      <input id="periodCodigo" placeholder="Código (ej. 2026-2)" value="${h(d.codigo || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
      <input id="periodNombre" placeholder="Nombre" value="${h(d.nombre || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
      <div class="grid grid-cols-2 gap-3">
        <label class="text-xs text-gray-500">Inicio<input id="periodInicio" type="date" value="${fmt(d.fechaInicio)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required></label>
        <label class="text-xs text-gray-500">Fin<input id="periodFin" type="date" value="${fmt(d.fechaFin)}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required></label>
      </div>
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" id="periodActual" ${d.esActual ? "checked" : ""}> Marcar como periodo actual</label>
      <div class="flex gap-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold">${editing ? "Guardar" : "Crear"}</button>
        ${editing ? `<button type="button" id="resetPeriodForm" class="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>` : ""}
      </div>
    </form>`;
}

export function renderPeriodos() {
  const s = state.periods;
  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Periodos Académicos</h2>
          <p class="text-gray-600 mt-2">Gestión de semestres / periodos (${s.items.length})</p>
        </div>
        <button id="reloadPeriods" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>
      ${s.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando...</div>' : ""}
      ${s.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${h(s.error)}</div>` : ""}
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 card overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr><th class="px-6 py-3">Código</th><th class="px-6 py-3">Nombre</th><th class="px-6 py-3">Vigencia</th><th class="px-6 py-3">Estado</th><th class="px-6 py-3"></th></tr>
            </thead>
            <tbody>${renderRows(s.items)}</tbody>
          </table>
        </div>
        <div>${renderForm(s.draft)}</div>
      </div>
    </div>`;
}
