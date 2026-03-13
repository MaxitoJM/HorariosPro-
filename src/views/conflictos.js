export function renderConflictos() {
            return `
                <div class="p-8">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800">Gestión de Conflictos</h2>
                            <p class="text-gray-600 mt-2">HU-20: Validar y resolver conflictos en horarios</p>
                        </div>
                        <button class="btn-primary">🔍 Escanear Conflictos</button>
                    </div>
                    
                    <!-- Stats -->
                    <div class="grid grid-cols-4 gap-6 mb-6">
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Total Conflictos</p>
                                    <p class="text-3xl font-bold text-red-600 mt-2">3</p>
                                </div>
                                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">⚠️</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Resueltos Hoy</p>
                                    <p class="text-3xl font-bold text-green-600 mt-2">5</p>
                                </div>
                                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">✓</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Críticos</p>
                                    <p class="text-3xl font-bold text-orange-600 mt-2">1</p>
                                </div>
                                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">🔥</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-500 text-sm font-medium">Preventivos</p>
                                    <p class="text-3xl font-bold text-blue-600 mt-2">2</p>
                                </div>
                                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span class="text-2xl">ℹ️</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Conflicts List -->
                    <div class="card overflow-hidden">
                        <div class="p-6 border-b border-gray-200 bg-red-50">
                            <h3 class="text-lg font-semibold text-gray-800">⚠️ Conflictos Activos</h3>
                        </div>
                        
                        <div class="divide-y divide-gray-200">
                            <!-- Conflict 1 -->
                            <div class="p-6 hover:bg-gray-50">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex items-start gap-4">
                                        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span class="text-xl">🔴</span>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-3 mb-2">
                                                <h4 class="font-semibold text-gray-800 text-lg">Conflicto de Aula</h4>
                                                <span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">CRÍTICO</span>
                                            </div>
                                            <p class="text-gray-600">Dos cursos asignados al mismo aula en el mismo horario</p>
                                            <div class="mt-3 space-y-1 text-sm">
                                                <p><span class="text-gray-500">Horario:</span> Lunes 7:00-8:30</p>
                                                <p><span class="text-gray-500">Aula:</span> 301</p>
                                                <p><span class="text-gray-500">Cursos:</span> Cálculo I - Grupo A y Física I - Grupo B</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                                            Resolver
                                        </button>
                                        <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                                            Ignorar
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p class="text-sm font-medium text-blue-900 mb-2">💡 Sugerencias de resolución:</p>
                                    <ul class="text-sm text-blue-800 space-y-1">
                                        <li>• Reasignar Física I - Grupo B al Aula 302 (disponible)</li>
                                        <li>• Cambiar horario de Física I - Grupo B a Martes 7:00-8:30</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <!-- Conflict 2 -->
                            <div class="p-6 hover:bg-gray-50">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex items-start gap-4">
                                        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span class="text-xl">🟠</span>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-3 mb-2">
                                                <h4 class="font-semibold text-gray-800 text-lg">Disponibilidad Docente</h4>
                                                <span class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">ADVERTENCIA</span>
                                            </div>
                                            <p class="text-gray-600">Docente asignado fuera de su horario de disponibilidad</p>
                                            <div class="mt-3 space-y-1 text-sm">
                                                <p><span class="text-gray-500">Docente:</span> Dra. María González</p>
                                                <p><span class="text-gray-500">Horario asignado:</span> Viernes 14:00-15:30</p>
                                                <p><span class="text-gray-500">Disponibilidad:</span> L-J 7:00-18:00 (Viernes no disponible)</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                                            Resolver
                                        </button>
                                        <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                                            Ignorar
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p class="text-sm font-medium text-blue-900 mb-2">💡 Sugerencias de resolución:</p>
                                    <ul class="text-sm text-blue-800 space-y-1">
                                        <li>• Mover a Jueves 14:00-15:30 (docente disponible)</li>
                                        <li>• Asignar otro docente disponible los viernes</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <!-- Conflict 3 -->
                            <div class="p-6 hover:bg-gray-50">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex items-start gap-4">
                                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span class="text-xl">🔵</span>
                                        </div>
                                        <div>
                                            <div class="flex items-center gap-3 mb-2">
                                                <h4 class="font-semibold text-gray-800 text-lg">Días Consecutivos</h4>
                                                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">INFO</span>
                                            </div>
                                            <p class="text-gray-600">Curso programado en días consecutivos (recomendación no cumplida)</p>
                                            <div class="mt-3 space-y-1 text-sm">
                                                <p><span class="text-gray-500">Curso:</span> Química General - Grupo A</p>
                                                <p><span class="text-gray-500">Horarios:</span> Lunes y Martes 10:30-12:00</p>
                                                <p><span class="text-gray-500">Recomendación:</span> Evitar días consecutivos</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
                                            Resolver
                                        </button>
                                        <button class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">
                                            Ignorar
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p class="text-sm font-medium text-blue-900 mb-2">💡 Sugerencias de resolución:</p>
                                    <ul class="text-sm text-blue-800 space-y-1">
                                        <li>• Cambiar Martes por Miércoles (L-Mi-V patrón)</li>
                                        <li>• Cambiar a patrón Ma-J</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Resolution History -->
                    <div class="card p-6 mt-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Historial de Resoluciones</h3>
                        <div class="space-y-3">
                            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                <span class="text-green-600">✓</span>
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-800">Conflicto de docente resuelto</p>
                                    <p class="text-xs text-gray-500">Dr. Pérez - Reasignado a Aula 304 - hace 2 horas</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                <span class="text-green-600">✓</span>
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-800">Capacidad de aula ajustada</p>
                                    <p class="text-xs text-gray-500">Aula 302 - Grupo reducido a 25 estudiantes - hace 5 horas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        

