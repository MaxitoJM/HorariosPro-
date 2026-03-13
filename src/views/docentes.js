export function renderDocentes() {
            return `
                <div class="p-8">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800">Gestión de Docentes</h2>
                            <p class="text-gray-600 mt-2">HU-11, HU-12, HU-13: Crear, configurar disponibilidad y asignar cursos</p>
                        </div>
                        <button class="btn-primary">+ Nuevo Docente</button>
                    </div>
                    
                    <!-- Filters -->
                    <div class="card p-4 mb-6">
                        <div class="flex gap-4">
                            <input type="text" placeholder="Buscar docente..." class="flex-1 px-4 py-2 border border-gray-300 rounded-lg">
                            <select class="px-4 py-2 border border-gray-300 rounded-lg">
                                <option>Todos los departamentos</option>
                                <option>Matemáticas</option>
                                <option>Física</option>
                                <option>Química</option>
                            </select>
                            <select class="px-4 py-2 border border-gray-300 rounded-lg">
                                <option>Todos los estados</option>
                                <option>Activo</option>
                                <option>Inactivo</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Teachers Table -->
                    <div class="card overflow-hidden">
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Docente</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Departamento</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cursos Asignados</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Disponibilidad</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Horas/Semana</th>
                                    <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                JP
                                            </div>
                                            <div>
                                                <p class="font-medium text-gray-800">Dr. Juan Pérez</p>
                                                <p class="text-sm text-gray-500">juan.perez@unbosque.edu.co</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Matemáticas</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="text-sm text-gray-800">3 cursos</p>
                                        <p class="text-xs text-gray-500">Cálculo I, II, III</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✓ Configurada</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="font-medium text-gray-800">18 hrs</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex gap-2">
                                            <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">Ver</button>
                                            <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">Editar</button>
                                            <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                MG
                                            </div>
                                            <div>
                                                <p class="font-medium text-gray-800">Dra. María González</p>
                                                <p class="text-sm text-gray-500">maria.gonzalez@unbosque.edu.co</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Física</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="text-sm text-gray-800">2 cursos</p>
                                        <p class="text-xs text-gray-500">Física I, II</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">⚠️ Pendiente</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="font-medium text-gray-800">12 hrs</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex gap-2">
                                            <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">Ver</button>
                                            <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">Editar</button>
                                            <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                CR
                                            </div>
                                            <div>
                                                <p class="font-medium text-gray-800">Dr. Carlos Rodríguez</p>
                                                <p class="text-sm text-gray-500">carlos.rodriguez@unbosque.edu.co</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Química</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="text-sm text-gray-800">4 cursos</p>
                                        <p class="text-xs text-gray-500">Química General, Orgánica...</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✓ Configurada</span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="font-medium text-gray-800">24 hrs</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex gap-2">
                                            <button class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">Ver</button>
                                            <button class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded">Editar</button>
                                            <button class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Modal Preview -->
                    <div class="card p-6 mt-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Vista Detalle - Disponibilidad Docente (HU-12)</h3>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <h4 class="font-medium text-gray-700 mb-3">Información Básica</h4>
                                <div class="space-y-2 text-sm">
                                    <p><span class="text-gray-500">Nombre:</span> Dr. Juan Pérez</p>
                                    <p><span class="text-gray-500">Email:</span> juan.perez@unbosque.edu.co</p>
                                    <p><span class="text-gray-500">Departamento:</span> Matemáticas</p>
                                    <p><span class="text-gray-500">Carga máxima:</span> 20 horas/semana</p>
                                </div>
                            </div>
                            
                            <div>
                                <h4 class="font-medium text-gray-700 mb-3">Disponibilidad Horaria</h4>
                                <div class="grid grid-cols-3 gap-2 text-xs">
                                    <div class="p-2 bg-green-100 text-green-800 rounded text-center">L: 7-18h</div>
                                    <div class="p-2 bg-green-100 text-green-800 rounded text-center">M: 7-18h</div>
                                    <div class="p-2 bg-green-100 text-green-800 rounded text-center">Mi: 7-18h</div>
                                    <div class="p-2 bg-green-100 text-green-800 rounded text-center">J: 7-14h</div>
                                    <div class="p-2 bg-red-100 text-red-800 rounded text-center">V: No disponible</div>
                                    <div class="p-2 bg-gray-100 text-gray-800 rounded text-center">S: No aplica</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        

