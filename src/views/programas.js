import { state } from "../core/state.js";
import { h } from "../core/dom.js";

function renderRows(items) {
  if (!items.length) {
    return `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">No hay programas registrados.</td></tr>`;
  }
  return items
    .map(
      (p) => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-6 py-3 font-medium text-gray-800">${h(p.codigo)}</td>
        <td class="px-6 py-3">${h(p.nombre)}</td>
        <td class="px-6 py-3 text-sm text-gray-600">${h(p.departamento)}</td>
        <td class="px-6 py-3 text-right whitespace-nowrap">
          <button data-edit-program="${p.id}" class="text-blue-600 hover:underline text-sm mr-3">Editar</button>
          <button data-delete-program="${p.id}" class="text-red-600 hover:underline text-sm">Eliminar</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderForm(draft) {
  const d = draft || {};
  const editing = Boolean(d.id);
  return `
    <form id="programForm" class="card p-6 space-y-3">
      <h3 class="text-lg font-semibold text-gray-800">${editing ? "Editar programa" : "Nuevo programa"}</h3>
      <input type="hidden" id="programId" value="${h(d.id || "")}">
      <input id="programCodigo" placeholder="Código (ej. ING-SIS)" value="${h(d.codigo || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
      <input id="programNombre" placeholder="Nombre" value="${h(d.nombre || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
      <input id="programDepartamento" placeholder="Departamento" value="${h(d.departamento || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
      <div class="flex gap-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold">${editing ? "Guardar" : "Crear"}</button>
        ${editing ? `<button type="button" id="resetProgramForm" class="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>` : ""}
      </div>
    </form>`;
}

export function renderProgramas() {
  const s = state.programs;
  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Programas</h2>
          <p class="text-gray-600 mt-2">Programas / carreras académicas (${s.items.length})</p>
        </div>
        <button id="reloadPrograms" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>
      ${s.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando...</div>' : ""}
      ${s.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${h(s.error)}</div>` : ""}
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-4">
          <div class="flex gap-2">
            <input id="programSearch" placeholder="Buscar..." value="${h(s.search)}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
            <button id="programSearchBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Buscar</button>
          </div>
          <div class="card overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th class="px-6 py-3">Código</th><th class="px-6 py-3">Nombre</th><th class="px-6 py-3">Departamento</th><th class="px-6 py-3"></th></tr>
              </thead>
              <tbody>${renderRows(s.items)}</tbody>
            </table>
          </div>
        </div>
        <div>${renderForm(s.draft)}</div>
      </div>
    </div>`;
}
