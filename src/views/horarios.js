export function renderHorarios() {
            return `
                <div class="p-8">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800">Visualización de Horarios</h2>
                            <p class="text-gray-600 mt-2">HU-19: Vista general y específica de horarios</p>
                        </div>
                        <div class="flex gap-3">
                            <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                                📄 Exportar PDF
                            </button>
                            <select class="px-4 py-2 border border-gray-300 rounded-lg">
                                <option>Vista: Todos</option>
                                <option>Vista: Por Docente</option>
                                <option>Vista: Por Aula</option>
                                <option>Vista: Por Curso</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Schedule Grid -->
                    <div class="card p-6 overflow-x-auto">
                        <div class="schedule-grid">
                            <!-- Header -->
                            <div class="schedule-cell schedule-header"></div>
                            <div class="schedule-cell schedule-header">Lunes</div>
                            <div class="schedule-cell schedule-header">Martes</div>
                            <div class="schedule-cell schedule-header">Miércoles</div>
                            <div class="schedule-cell schedule-header">Jueves</div>
                            <div class="schedule-cell schedule-header">Viernes</div>
                            <div class="schedule-cell schedule-header">Sábado</div>
                            
                            <!-- 7:00 - 8:30 -->
                            <div class="schedule-cell schedule-time">7:00<br>8:30</div>
                            <div class="schedule-cell">
                                <div class="class-block">
                                    <p class="font-semibold">Cálculo I - Grupo A</p>
                                    <p class="text-xs mt-1">Dr. Juan Pérez</p>
                                    <p class="text-xs">Aula 301</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block">
                                    <p class="font-semibold">Cálculo I - Grupo A</p>
                                    <p class="text-xs mt-1">Dr. Juan Pérez</p>
                                    <p class="text-xs">Aula 301</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block">
                                    <p class="font-semibold">Cálculo I - Grupo A</p>
                                    <p class="text-xs mt-1">Dr. Juan Pérez</p>
                                    <p class="text-xs">Aula 301</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            
                            <!-- 8:45 - 10:15 -->
                            <div class="schedule-cell schedule-time">8:45<br>10:15</div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block" style="background: #fef3c7; border-color: #f59e0b;">
                                    <p class="font-semibold">Física I - Grupo A</p>
                                    <p class="text-xs mt-1">Dra. María González</p>
                                    <p class="text-xs">Lab-01</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block" style="background: #fef3c7; border-color: #f59e0b;">
                                    <p class="font-semibold">Física I - Grupo A</p>
                                    <p class="text-xs mt-1">Dra. María González</p>
                                    <p class="text-xs">Lab-01</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell"></div>
                            
                            <!-- 10:30 - 12:00 -->
                            <div class="schedule-cell schedule-time">10:30<br>12:00</div>
                            <div class="schedule-cell">
                                <div class="class-block" style="background: #d1fae5; border-color: #10b981;">
                                    <p class="font-semibold">Química General</p>
                                    <p class="text-xs mt-1">Dr. Carlos Rodríguez</p>
                                    <p class="text-xs">Aula 302</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block" style="background: #d1fae5; border-color: #10b981;">
                                    <p class="font-semibold">Química General</p>
                                    <p class="text-xs mt-1">Dr. Carlos Rodríguez</p>
                                    <p class="text-xs">Aula 302</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell"></div>
                            
                            <!-- 14:00 - 15:30 -->
                            <div class="schedule-cell schedule-time">14:00<br>15:30</div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block">
                                    <p class="font-semibold">Cálculo I - Grupo B</p>
                                    <p class="text-xs mt-1">Dr. Juan Pérez</p>
                                    <p class="text-xs">Aula 303</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block">
                                    <p class="font-semibold">Cálculo I - Grupo B</p>
                                    <p class="text-xs mt-1">Dr. Juan Pérez</p>
                                    <p class="text-xs">Aula 303</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell"></div>
                            
                            <!-- 15:45 - 17:15 -->
                            <div class="schedule-cell schedule-time">15:45<br>17:15</div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell"></div>
                            <div class="schedule-cell">
                                <div class="class-block">
                                    <p class="font-semibold">Cálculo I - Grupo B</p>
                                    <p class="text-xs mt-1">Dr. Juan Pérez</p>
                                    <p class="text-xs">Aula 303</p>
                                </div>
                            </div>
                            <div class="schedule-cell"></div>
                        </div>
                    </div>
                    
                    <!-- Legend -->
                    <div class="card p-6 mt-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Leyenda</h3>
                        <div class="flex flex-wrap gap-4">
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-blue-200 border-l-2 border-blue-500"></div>
                                <span class="text-sm">Cálculo I</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-yellow-200 border-l-2 border-yellow-500"></div>
                                <span class="text-sm">Física I</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-green-200 border-l-2 border-green-500"></div>
                                <span class="text-sm">Química General</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        

