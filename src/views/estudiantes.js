import { state } from "../core/state.js";
import { h } from "../core/dom.js";

const ESTADO_BADGES = {
  activo: "bg-green-100 text-green-700",
  egresado: "bg-blue-100 text-blue-700",
  retirado: "bg-gray-200 text-gray-600",
  suspendido: "bg-red-100 text-red-700"
};

function renderRows(items) {
  if (!items.length) {
    return `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No hay estudiantes para mostrar.</td></tr>`;
  }
  return items
    .map(
      (s) => `
      <tr class="border-b border-gray-100 hover:bg-gray-50">
        <td class="px-6 py-3 font-medium text-gray-800">${h(s.codigo)}</td>
        <td class="px-6 py-3">${h(s.nombre)} ${h(s.apellido)}<div class="text-xs text-gray-500">${h(s.email)}</div></td>
        <td class="px-6 py-3 text-sm text-gray-600">${h(s.program?.nombre || "—")}</td>
        <td class="px-6 py-3"><span class="px-2 py-1 rounded-full text-xs font-medium ${ESTADO_BADGES[s.estado] || "bg-gray-100"}">${h(s.estado)}</span></td>
        <td class="px-6 py-3 text-right">
          <button data-edit-student="${s.id}" class="text-blue-600 hover:underline text-sm mr-3">Editar</button>
          <button data-delete-student="${s.id}" class="text-red-600 hover:underline text-sm">Eliminar</button>
        </td>
      </tr>`
    )
    .join("");
}

function renderForm(draft) {
  const d = draft || {};
  const editing = Boolean(d.id);
  return `
    <form id="studentForm" class="card p-6 space-y-3">
      <h3 class="text-lg font-semibold text-gray-800">${editing ? "Editar estudiante" : "Nuevo estudiante"}</h3>
      <input type="hidden" id="studentId" value="${h(d.id || "")}">
      <input id="studentCodigo" placeholder="Codigo / matricula" value="${h(d.codigo || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
      <div class="grid grid-cols-2 gap-3">
        <input id="studentNombre" placeholder="Nombre" value="${h(d.nombre || "")}" class="px-3 py-2 border border-gray-300 rounded-lg" required>
        <input id="studentApellido" placeholder="Apellido" value="${h(d.apellido || "")}" class="px-3 py-2 border border-gray-300 rounded-lg" required>
      </div>
      <input id="studentEmail" type="email" placeholder="Email" value="${h(d.email || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
      <input id="studentProgramId" placeholder="ID de programa (opcional)" value="${h(d.programId || "")}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
      <div class="flex gap-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold">${editing ? "Guardar cambios" : "Crear estudiante"}</button>
        ${editing ? `<button type="button" id="resetStudentForm" class="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>` : ""}
      </div>
    </form>`;
}

function renderImportPanel() {
  const s = state.students;
  const preview = s.importPreview;
  const result = s.importResult;
  return `
    <div class="card p-6 space-y-3">
      <h3 class="text-lg font-semibold text-gray-800">Importacion masiva (Excel)</h3>
      <p class="text-sm text-gray-500">Descarga la plantilla, complétala y súbela. Verás una vista previa antes de confirmar.</p>
      <div class="flex flex-wrap gap-2">
        <button id="downloadTemplateBtn" class="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">⬇ Descargar plantilla</button>
        <input type="file" id="importFile" accept=".xlsx" class="text-sm">
        <button id="previewImportBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Vista previa</button>
      </div>
      ${s.importError ? `<div class="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">${h(s.importError)}</div>` : ""}
      ${
        preview
          ? `<div class="mt-2 border border-gray-200 rounded-lg p-3">
              <div class="flex gap-4 text-sm mb-2">
                <span>Total: <b>${preview.total}</b></span>
                <span class="text-green-700">Válidos: <b>${preview.validos}</b></span>
                <span class="text-orange-600">Inválidos: <b>${preview.invalidos}</b></span>
              </div>
              <div class="max-h-48 overflow-y-auto text-xs space-y-1">
                ${preview.filas
                  .map(
                    (f) =>
                      `<div class="flex gap-2 ${f.valido ? "text-gray-600" : "text-red-600"}"><span class="font-mono">Fila ${f.fila}</span><span>${h(f.codigo)} ${h(f.email)}</span>${f.errores.length ? `<span>— ${h(f.errores.join(", "))}</span>` : "<span>✓</span>"}</div>`
                  )
                  .join("")}
              </div>
              <button id="commitImportBtn" class="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold ${preview.validos === 0 ? "opacity-50 cursor-not-allowed" : ""}" ${preview.validos === 0 ? "disabled" : ""}>Confirmar importación (${preview.validos})</button>
            </div>`
          : ""
      }
      ${
        result
          ? `<div class="p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
              Importación completada: <b>${result.creados}</b> creados, <b>${result.omitidos}</b> omitidos de ${result.totalProcesadas}.
            </div>`
          : ""
      }
    </div>`;
}

export function renderEstudiantes() {
  const s = state.students;
  const total = s.pagination?.total ?? s.items.length;
  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Estudiantes</h2>
          <p class="text-gray-600 mt-2">CRUD de estudiantes e importación masiva por Excel (${total})</p>
        </div>
        <button id="reloadStudents" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${s.loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando estudiantes...</div>' : ""}
      ${s.error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${h(s.error)}</div>` : ""}

      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-4">
          <div class="flex gap-2">
            <input id="studentSearch" placeholder="Buscar por nombre, código o email..." value="${h(s.search)}" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
            <button id="studentSearchBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg">Buscar</button>
          </div>
          <div class="card overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th class="px-6 py-3">Código</th>
                  <th class="px-6 py-3">Estudiante</th>
                  <th class="px-6 py-3">Programa</th>
                  <th class="px-6 py-3">Estado</th>
                  <th class="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>${renderRows(s.items)}</tbody>
            </table>
          </div>
        </div>
        <div class="space-y-6">
          ${renderForm(s.draft)}
          ${renderImportPanel()}
        </div>
      </div>
    </div>
  `;
}
