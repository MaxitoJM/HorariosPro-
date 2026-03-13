export function renderCursos() {
            return `
                <div class="p-8">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800">Gestión de Cursos</h2>
                            <p class="text-gray-600 mt-2">HU-14, HU-15, HU-16: Crear cursos, definir sesiones y grupos</p>
                        </div>
                        <button class="btn-primary">+ Nuevo Curso</button>
                    </div>
                    
                    <!-- Course Cards -->
                    <div class="grid grid-cols-3 gap-6 mb-6">
                        <div class="card p-6 border-l-4 border-blue-500">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="font-semibold text-gray-800 text-lg">Cálculo I</h3>
                                    <p class="text-sm text-gray-500">MAT-101</p>
                                </div>
                                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activo</span>
                            </div>
                            
                            <div class="space-y-2 text-sm mb-4">
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Créditos:</span>
                                    <span class="font-medium">4</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Sesiones/semana:</span>
                                    <span class="font-medium">3</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Duración sesión:</span>
                                    <span class="font-medium">90 min</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Grupos:</span>
                                    <span class="font-medium">4 grupos</span>
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-xs text-gray-500 mb-2">Docentes asignados:</p>
                                <div class="flex gap-2">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">JP</div>
                                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">MG</div>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Ver detalles</button>
                                <button class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">✏️</button>
                            </div>
                        </div>
                        
                        <div class="card p-6 border-l-4 border-purple-500">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="font-semibold text-gray-800 text-lg">Física I</h3>
                                    <p class="text-sm text-gray-500">FIS-101</p>
                                </div>
                                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">Activo</span>
                            </div>
                            
                            <div class="space-y-2 text-sm mb-4">
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Créditos:</span>
                                    <span class="font-medium">4</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Sesiones/semana:</span>
                                    <span class="font-medium">2</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Duración sesión:</span>
                                    <span class="font-medium">120 min</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Grupos:</span>
                                    <span class="font-medium">3 grupos</span>
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-xs text-gray-500 mb-2">Docentes asignados:</p>
                                <div class="flex gap-2">
                                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">MG</div>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Ver detalles</button>
                                <button class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">✏️</button>
                            </div>
                        </div>
                        
                        <div class="card p-6 border-l-4 border-green-500">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="font-semibold text-gray-800 text-lg">Química General</h3>
                                    <p class="text-sm text-gray-500">QUI-101</p>
                                </div>
                                <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendiente</span>
                            </div>
                            
                            <div class="space-y-2 text-sm mb-4">
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Créditos:</span>
                                    <span class="font-medium">3</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Sesiones/semana:</span>
                                    <span class="font-medium">2</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Duración sesión:</span>
                                    <span class="font-medium">90 min</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Grupos:</span>
                                    <span class="font-medium">2 grupos</span>
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-xs text-gray-500 mb-2">Docentes asignados:</p>
                                <div class="flex gap-2">
                                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">CR</div>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Ver detalles</button>
                                <button class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">✏️</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Grupos Section -->
                    <div class="card p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Grupos - Cálculo I (HU-16)</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grupo</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Docente</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Capacidad</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Inscritos</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Horario</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aula</th>
                                        <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200">
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Grupo A</td>
                                        <td class="px-4 py-3">Dr. Juan Pérez</td>
                                        <td class="px-4 py-3">30</td>
                                        <td class="px-4 py-3">28</td>
                                        <td class="px-4 py-3 text-sm">L-Mi-V 8:00-9:30</td>
                                        <td class="px-4 py-3">Aula 301</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completo</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Grupo B</td>
                                        <td class="px-4 py-3">Dr. Juan Pérez</td>
                                        <td class="px-4 py-3">30</td>
                                        <td class="px-4 py-3">25</td>
                                        <td class="px-4 py-3 text-sm">L-Mi-V 10:00-11:30</td>
                                        <td class="px-4 py-3">Aula 302</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Disponible</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Grupo C</td>
                                        <td class="px-4 py-3">Dra. María González</td>
                                        <td class="px-4 py-3">30</td>
                                        <td class="px-4 py-3">22</td>
                                        <td class="px-4 py-3 text-sm">Ma-J 14:00-15:30</td>
                                        <td class="px-4 py-3">Aula 303</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Disponible</span></td>
                                    </tr>
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-3 font-medium">Grupo D</td>
                                        <td class="px-4 py-3">-</td>
                                        <td class="px-4 py-3">15</td>
                                        <td class="px-4 py-3">0</td>
                                        <td class="px-4 py-3 text-sm text-gray-400">Sin asignar</td>
                                        <td class="px-4 py-3 text-gray-400">-</td>
                                        <td class="px-4 py-3"><span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pendiente</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        }
        

