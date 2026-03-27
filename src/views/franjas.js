import { state } from "../core/state.js";

function renderRuleInput(rule) {
  if (rule.tipo === "boolean") {
    return `
      <label class="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
        <div>
          <p class="font-medium text-gray-800 text-sm">${rule.clave}</p>
          <p class="text-xs text-gray-500">${rule.descripcion || ""}</p>
        </div>
        <input
          type="checkbox"
          data-rule-key="${rule.clave}"
          data-rule-type="${rule.tipo}"
          class="w-5 h-5"
          ${rule.valor ? "checked" : ""}
        >
      </label>
    `;
  }

  return `
    <label class="block p-3 bg-gray-50 rounded-lg">
      <p class="font-medium text-gray-800 text-sm">${rule.clave}</p>
      <p class="text-xs text-gray-500 mb-2">${rule.descripcion || ""}</p>
      <input
        type="number"
        min="1"
        data-rule-key="${rule.clave}"
        data-rule-type="${rule.tipo}"
        value="${rule.valor}"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg"
      >
    </label>
  `;
}

function renderGroupCards(groups) {
  if (!groups.length) {
    return '<p class="text-sm text-gray-500">No hay franjas registradas todavia.</p>';
  }

  return groups
    .map(
      (group) => `
        <div class="border border-gray-200 rounded-xl p-4 bg-white">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div>
              <h4 class="text-lg font-semibold text-gray-800">${group.nombre}</h4>
              <p class="text-sm text-gray-500">${group.horaInicio} - ${group.horaFin}</p>
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg" data-edit-group="${group.id}">Editar</button>
              <button class="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg" data-delete-group="${group.id}">Eliminar</button>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs mb-3">
            <span class="px-2 py-1 rounded-full ${group.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}">
              ${group.activo ? "Activa" : "Inactiva"}
            </span>
            <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              ${group.timeBlocks.length} bloque(s)
            </span>
          </div>
          <div class="space-y-2">
            ${
              group.timeBlocks.length
                ? group.timeBlocks
                    .map(
                      (block) => `
                        <div class="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p class="font-medium text-gray-800 text-sm">${block.nombre}</p>
                            <p class="text-xs text-gray-500">${block.horaInicio} - ${block.horaFin} · ${block.duracionMinutos} min · Orden ${block.orden}</p>
                          </div>
                          <div class="flex gap-2">
                            <button class="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded" data-edit-block="${block.id}">Editar</button>
                            <button class="px-2 py-1 text-xs bg-red-50 text-red-700 rounded" data-delete-block="${block.id}">Eliminar</button>
                          </div>
                        </div>
                      `
                    )
                    .join("")
                : '<p class="text-xs text-gray-500">Sin bloques horarios configurados.</p>'
            }
          </div>
        </div>
      `
    )
    .join("");
}

export function renderFranjas() {
  const { groups, rules, academicConfig, loading, error } = state.scheduleConfig;

  return `
    <div class="p-8 space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Configuracion de horarios</h2>
          <p class="text-gray-600 mt-2">HU-9, HU-10 y HU-15 conectadas a datos reales</p>
        </div>
        <button id="reloadScheduleConfig" class="px-4 py-3 bg-gray-900 text-white rounded-lg">Recargar</button>
      </div>

      ${loading ? '<div class="card p-4 text-sm text-blue-700 bg-blue-50 border border-blue-200">Cargando configuracion...</div>' : ""}
      ${error ? `<div class="card p-4 text-sm text-red-700 bg-red-50 border border-red-200">${error}</div>` : ""}

      <div class="grid grid-cols-2 gap-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Franjas horarias</h3>
            <button id="resetGroupForm" class="text-sm text-gray-500">Limpiar</button>
          </div>
          <form id="timeSlotGroupForm" class="space-y-3">
            <input type="hidden" id="groupId">
            <input id="groupNombre" type="text" placeholder="Nombre de franja" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            <div class="grid grid-cols-2 gap-3">
              <input id="groupHoraInicio" type="time" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
              <input id="groupHoraFin" type="time" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input id="groupActivo" type="checkbox" checked>
              Franja activa
            </label>
            <button type="submit" class="w-full btn-primary">Guardar franja</button>
          </form>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Bloques horarios</h3>
            <button id="resetBlockForm" class="text-sm text-gray-500">Limpiar</button>
          </div>
          <form id="timeBlockForm" class="space-y-3">
            <input type="hidden" id="blockId">
            <select id="blockGroupId" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
              <option value="">Seleccione una franja</option>
              ${groups
                .map((group) => `<option value="${group.id}">${group.nombre} (${group.horaInicio}-${group.horaFin})</option>`)
                .join("")}
            </select>
            <input id="blockNombre" type="text" placeholder="Nombre del bloque" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            <div class="grid grid-cols-3 gap-3">
              <input id="blockHoraInicio" type="time" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
              <input id="blockHoraFin" type="time" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
              <input id="blockOrden" type="number" min="1" placeholder="Orden" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input id="blockActivo" type="checkbox" checked>
              Bloque activo
            </label>
            <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold">Guardar bloque</button>
          </form>
        </div>
      </div>

      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Franjas y bloques configurados</h3>
        <div class="grid grid-cols-2 gap-4">
          ${renderGroupCards(groups)}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Reglas generales</h3>
          <form id="rulesForm" class="space-y-3">
            ${rules.map(renderRuleInput).join("")}
            <button type="submit" class="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold">Guardar reglas</button>
          </form>
        </div>

        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Configuracion academica</h3>
          <form id="academicConfigForm" class="space-y-3">
            <input id="configNombre" type="text" value="${academicConfig?.nombre || ""}" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            <div class="grid grid-cols-2 gap-3">
              <input id="configSesiones" type="number" min="1" value="${academicConfig?.sesionesPorSemanaDefault || 3}" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
              <input id="configDuracion" type="number" min="1" value="${academicConfig?.duracionSesionDefault || 90}" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Dias habiles</p>
              <div class="grid grid-cols-2 gap-2 text-sm">
                ${["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"].map((day) => `
                  <label class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <input type="checkbox" class="config-day" value="${day}" ${(academicConfig?.diasHabiles || []).includes(day) ? "checked" : ""}>
                    ${day}
                  </label>
                `).join("")}
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input id="configActivo" type="checkbox" ${academicConfig?.activo === false ? "" : "checked"}>
              Configuracion activa
            </label>
            <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">Guardar configuracion</button>
          </form>
        </div>
      </div>
    </div>
  `;
}
