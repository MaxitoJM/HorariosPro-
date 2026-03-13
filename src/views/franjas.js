export function renderFranjas() {
            return `
                <div class="p-8">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800">Configuración de Franjas Horarias</h2>
                            <p class="text-gray-600 mt-2">HU-9, HU-10: Definir franjas y reglas generales del horario</p>
                        </div>
                        <button class="btn-primary">+ Nueva Franja</button>
                    </div>
                    
                    <!-- Time Slots Configuration -->
                    <div class="grid grid-cols-2 gap-6 mb-6">
                        <div class="card p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Franjas Definidas</h3>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl">🌅</span>
                                        <div>
                                            <p class="font-medium text-gray-800">Franja Mañana</p>
                                            <p class="text-sm text-gray-500">7:00 - 12:00</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded">Editar</button>
                                        <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Eliminar</button>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl">☀️</span>
                                        <div>
                                            <p class="font-medium text-gray-800">Franja Tarde</p>
                                            <p class="text-sm text-gray-500">14:00 - 18:00</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded">Editar</button>
                                        <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Eliminar</button>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl">🌙</span>
                                        <div>
                                            <p class="font-medium text-gray-800">Franja Noche</p>
                                            <p class="text-sm text-gray-500">18:00 - 22:00</p>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 rounded">Editar</button>
                                        <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Eliminar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Reglas Generales del Horario (HU-10)</h3>
                            <div class="space-y-4">
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" checked class="w-5 h-5 text-blue-600">
                                        <div>
                                            <p class="font-medium text-gray-800 text-sm">Evitar días consecutivos</p>
                                            <p class="text-xs text-gray-500">No asignar el mismo curso en días seguidos</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" checked class="w-5 h-5 text-blue-600">
                                        <div>
                                            <p class="font-medium text-gray-800 text-sm">Máximo 20 horas por docente</p>
                                            <p class="text-xs text-gray-500">Límite de carga académica semanal</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" checked class="w-5 h-5 text-blue-600">
                                        <div>
                                            <p class="font-medium text-gray-800 text-sm">Descanso mínimo entre clases</p>
                                            <p class="text-xs text-gray-500">15 minutos entre sesiones</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" class="w-5 h-5 text-blue-600">
                                        <div>
                                            <p class="font-medium text-gray-800 text-sm">Permitir grupos bajo cupo</p>
                                            <p class="text-xs text-gray-500">Mínimo 10 estudiantes por grupo</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" checked class="w-5 h-5 text-blue-600">
                                        <div>
                                            <p class="font-medium text-gray-800 text-sm">Validar conflictos automáticamente</p>
                                            <p class="text-xs text-gray-500">Detectar solapamientos y avisar</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Time Blocks Detail -->
                    <div class="card p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Bloques Horarios Detallados</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Bloque</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hora Inicio</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hora Fin</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duración</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Franja</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Bloque 1</td>
                                        <td class="px-4 py-3">7:00</td>
                                        <td class="px-4 py-3">8:30</td>
                                        <td class="px-4 py-3">90 min</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Mañana</span></td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Activo</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Bloque 2</td>
                                        <td class="px-4 py-3">8:45</td>
                                        <td class="px-4 py-3">10:15</td>
                                        <td class="px-4 py-3">90 min</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Mañana</span></td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Activo</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Bloque 3</td>
                                        <td class="px-4 py-3">10:30</td>
                                        <td class="px-4 py-3">12:00</td>
                                        <td class="px-4 py-3">90 min</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Mañana</span></td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Activo</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Bloque 4</td>
                                        <td class="px-4 py-3">14:00</td>
                                        <td class="px-4 py-3">15:30</td>
                                        <td class="px-4 py-3">90 min</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Tarde</span></td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Activo</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Bloque 5</td>
                                        <td class="px-4 py-3">15:45</td>
                                        <td class="px-4 py-3">17:15</td>
                                        <td class="px-4 py-3">90 min</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">Tarde</span></td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Activo</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Bloque 6</td>
                                        <td class="px-4 py-3">18:00</td>
                                        <td class="px-4 py-3">19:30</td>
                                        <td class="px-4 py-3">90 min</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">Noche</span></td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Activo</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        

