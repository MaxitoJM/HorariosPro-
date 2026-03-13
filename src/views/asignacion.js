export function renderAsignacion() {
            return `
                <div class="p-8">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800">Asignación de Horarios</h2>
                            <p class="text-gray-600 mt-2">HU-18, HU-21: Asignación manual y generación automática inteligente</p>
                        </div>
                        <div class="flex gap-3">
                            <button class="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium">
                                📋 Asignar Manualmente
                            </button>
                            <button class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition font-medium">
                                🤖 Generar Automático
                            </button>
                        </div>
                    </div>
                    
                    <!-- Manual Assignment Interface -->
                    <div class="grid grid-cols-3 gap-6 mb-6">
                        <div class="card p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">1. Seleccionar Curso</h3>
                            <select class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3">
                                <option>Seleccione un curso...</option>
                                <option>Cálculo I - Grupo A</option>
                                <option>Cálculo I - Grupo B</option>
                                <option>Física I - Grupo A</option>
                                <option>Química General - Grupo A</option>
                            </select>
                            
                            <div class="bg-blue-50 p-4 rounded-lg">
                                <p class="text-sm font-medium text-gray-700 mb-2">Curso seleccionado:</p>
                                <p class="font-semibold text-gray-800">Cálculo I - Grupo A</p>
                                <p class="text-sm text-gray-600 mt-1">Dr. Juan Pérez</p>
                                <p class="text-sm text-gray-600">3 sesiones/semana × 90min</p>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">2. Seleccionar Horario</h3>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                                    <input type="radio" name="slot" class="w-4 h-4">
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Lunes 7:00-8:30</p>
                                        <p class="text-xs text-gray-500">Bloque 1 - Disponible</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                                    <input type="radio" name="slot" class="w-4 h-4">
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Miércoles 7:00-8:30</p>
                                        <p class="text-xs text-gray-500">Bloque 1 - Disponible</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                                    <input type="radio" name="slot" class="w-4 h-4">
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Viernes 7:00-8:30</p>
                                        <p class="text-xs text-gray-500">Bloque 1 - Disponible</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2 p-3 border border-red-200 bg-red-50 rounded-lg opacity-50 cursor-not-allowed">
                                    <input type="radio" name="slot" class="w-4 h-4" disabled>
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Martes 7:00-8:30</p>
                                        <p class="text-xs text-red-600">⚠️ Conflicto - Docente no disponible</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">3. Seleccionar Aula</h3>
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                                    <input type="radio" name="room" class="w-4 h-4">
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Aula 301</p>
                                        <p class="text-xs text-gray-500">Capacidad: 30 - Disponible</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer">
                                    <input type="radio" name="room" class="w-4 h-4">
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Aula 302</p>
                                        <p class="text-xs text-gray-500">Capacidad: 25 - Disponible</p>
                                    </div>
                                </div>
                                
                                <div class="flex items-center gap-2 p-3 border border-red-200 bg-red-50 rounded-lg opacity-50 cursor-not-allowed">
                                    <input type="radio" name="room" class="w-4 h-4" disabled>
                                    <div class="flex-1">
                                        <p class="font-medium text-sm">Aula 303</p>
                                        <p class="text-xs text-red-600">⚠️ Ocupada en este horario</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button class="w-full mt-4 btn-primary">
                                ✓ Asignar Horario
                            </button>
                        </div>
                    </div>
                    
                    <!-- Automatic Generation -->
                    <div class="card p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">🤖 Generación Automática Inteligente (HU-21)</h3>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <p class="text-gray-600 mb-4">El algoritmo inteligente generará automáticamente los horarios considerando:</p>
                                <ul class="space-y-2 text-sm text-gray-700">
                                    <li class="flex items-start gap-2">
                                        <span class="text-green-600 mt-1">✓</span>
                                        <span>Disponibilidad de docentes</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-green-600 mt-1">✓</span>
                                        <span>Capacidad de aulas</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-green-600 mt-1">✓</span>
                                        <span>Evitar días consecutivos</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-green-600 mt-1">✓</span>
                                        <span>Optimización de carga docente</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-green-600 mt-1">✓</span>
                                        <span>Distribución equitativa de horarios</span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <span class="text-green-600 mt-1">✓</span>
                                        <span>Minimización de conflictos</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div>
                                <div class="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                                    <div class="flex items-center gap-3 mb-4">
                                        <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span class="text-2xl">🤖</span>
                                        </div>
                                        <div>
                                            <p class="font-semibold text-gray-800">Motor de IA</p>
                                            <p class="text-sm text-gray-600">Listo para generar</p>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-3 mb-4">
                                        <div class="flex items-center justify-between text-sm">
                                            <span class="text-gray-600">Cursos pendientes:</span>
                                            <span class="font-semibold">8</span>
                                        </div>
                                        <div class="flex items-center justify-between text-sm">
                                            <span class="text-gray-600">Tiempo estimado:</span>
                                            <span class="font-semibold">~30 segundos</span>
                                        </div>
                                    </div>
                                    
                                    <button class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition font-medium">
                                        🚀 Iniciar Generación
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        

