export function renderDashboard() {
            return `
                <div class="p-8">
                    <div class="mb-8">
                        <h2 class="text-3xl font-bold text-gray-800">Dashboard</h2>
                        <p class="text-gray-600 mt-2">Vista general del sistema de horarios académicos</p>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-4 gap-6 mb-8">
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Docentes</p>
                                    <p class="text-3xl font-bold text-gray-800 mt-2">45</p>
                                    <p class="text-green-600 text-sm mt-2">↑ 5 nuevos</p>
                                </div>
                                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">👨‍🏫</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Cursos</p>
                                    <p class="text-3xl font-bold text-gray-800 mt-2">28</p>
                                    <p class="text-blue-600 text-sm mt-2">12 activos</p>
                                </div>
                                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">📚</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Aulas</p>
                                    <p class="text-3xl font-bold text-gray-800 mt-2">18</p>
                                    <p class="text-gray-600 text-sm mt-2">85% ocupación</p>
                                </div>
                                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">🏛️</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Conflictos</p>
                                    <p class="text-3xl font-bold text-gray-800 mt-2">3</p>
                                    <p class="text-red-600 text-sm mt-2">⚠️ Requieren atención</p>
                                </div>
                                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">⚠️</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="grid grid-cols-2 gap-6 mb-8">
                        <div class="card p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
                            <div class="space-y-3">
                                <button class="w-full btn-primary text-left">+ Crear Nuevo Docente</button>
                                <button class="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition">+ Crear Nuevo Curso</button>
                                <button class="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition">🤖 Generar Horarios Automático</button>
                                <button class="w-full bg-orange-500 text-white px-4 py-3 rounded-lg hover:bg-orange-600 transition">📄 Exportar PDF</button>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h3>
                            <div class="space-y-4">
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span class="text-sm">👨‍🏫</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-800">Docente creado</p>
                                        <p class="text-xs text-gray-500">Dr. Juan Pérez - hace 2 horas</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span class="text-sm">📚</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-800">Curso actualizado</p>
                                        <p class="text-xs text-gray-500">Cálculo II - hace 5 horas</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span class="text-sm">✓</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-800">Horario asignado</p>
                                        <p class="text-xs text-gray-500">Grupo A - Matemáticas - hace 1 día</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-start gap-3">
                                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span class="text-sm">⚠️</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-800">Conflicto detectado</p>
                                        <p class="text-xs text-gray-500">Aula 301 - Lunes 10:00 - hace 1 día</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Progress -->
                    <div class="card p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Progreso del Semestre</h3>
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="text-gray-600">Docentes configurados</span>
                                    <span class="font-medium">45/50 (90%)</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-500 h-2 rounded-full" style="width: 90%"></div>
                                </div>
                            </div>
                            
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="text-gray-600">Cursos con horario</span>
                                    <span class="font-medium">24/28 (86%)</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-purple-500 h-2 rounded-full" style="width: 86%"></div>
                                </div>
                            </div>
                            
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span class="text-gray-600">Aulas asignadas</span>
                                    <span class="font-medium">18/18 (100%)</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-green-500 h-2 rounded-full" style="width: 100%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        

