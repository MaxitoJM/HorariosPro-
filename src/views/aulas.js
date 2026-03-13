export function renderAulas() {
            return `
                <div class="p-8">
                    <div class="flex justify-between items-center mb-8">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800">Gestión de Aulas</h2>
                            <p class="text-gray-600 mt-2">HU-17: Crear y administrar espacios físicos</p>
                        </div>
                        <button class="btn-primary">+ Nueva Aula</button>
                    </div>
                    
                    <!-- Filters -->
                    <div class="card p-4 mb-6">
                        <div class="flex gap-4">
                            <select class="px-4 py-2 border border-gray-300 rounded-lg">
                                <option>Todos los edificios</option>
                                <option>Edificio A</option>
                                <option>Edificio B</option>
                                <option>Edificio C</option>
                            </select>
                            <select class="px-4 py-2 border border-gray-300 rounded-lg">
                                <option>Todos los tipos</option>
                                <option>Aula estándar</option>
                                <option>Laboratorio</option>
                                <option>Auditorio</option>
                            </select>
                            <select class="px-4 py-2 border border-gray-300 rounded-lg">
                                <option>Todas las capacidades</option>
                                <option>1-20 personas</option>
                                <option>21-40 personas</option>
                                <option>41+ personas</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Classrooms Grid -->
                    <div class="grid grid-cols-4 gap-6">
                        <div class="card p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800">301</h3>
                                    <p class="text-sm text-gray-500">Edificio A - Piso 3</p>
                                </div>
                                <span class="text-2xl">🏛️</span>
                            </div>
                            
                            <div class="space-y-2 text-sm mb-4">
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Capacidad:</span>
                                    <span class="font-medium">30 personas</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Tipo:</span>
                                    <span class="font-medium">Aula estándar</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Ocupación:</span>
                                    <span class="font-medium text-green-600">85%</span>
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-xs text-gray-500 mb-2">Equipamiento:</p>
                                <div class="flex flex-wrap gap-1">
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Proyector</span>
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Pizarra</span>
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">AC</span>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Ver horario</button>
                                <button class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">✏️</button>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800">302</h3>
                                    <p class="text-sm text-gray-500">Edificio A - Piso 3</p>
                                </div>
                                <span class="text-2xl">🏛️</span>
                            </div>
                            
                            <div class="space-y-2 text-sm mb-4">
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Capacidad:</span>
                                    <span class="font-medium">25 personas</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Tipo:</span>
                                    <span class="font-medium">Aula estándar</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Ocupación:</span>
                                    <span class="font-medium text-yellow-600">65%</span>
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-xs text-gray-500 mb-2">Equipamiento:</p>
                                <div class="flex flex-wrap gap-1">
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Proyector</span>
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Pizarra</span>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Ver horario</button>
                                <button class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">✏️</button>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800">Lab-01</h3>
                                    <p class="text-sm text-gray-500">Edificio B - Piso 1</p>
                                </div>
                                <span class="text-2xl">🔬</span>
                            </div>
                            
                            <div class="space-y-2 text-sm mb-4">
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Capacidad:</span>
                                    <span class="font-medium">20 personas</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Tipo:</span>
                                    <span class="font-medium">Laboratorio</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Ocupación:</span>
                                    <span class="font-medium text-red-600">95%</span>
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-xs text-gray-500 mb-2">Equipamiento:</p>
                                <div class="flex flex-wrap gap-1">
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Microscopios</span>
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Equipos</span>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Ver horario</button>
                                <button class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">✏️</button>
                            </div>
                        </div>
                        
                        <div class="card p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800">Aud-01</h3>
                                    <p class="text-sm text-gray-500">Edificio C - Piso 1</p>
                                </div>
                                <span class="text-2xl">🎭</span>
                            </div>
                            
                            <div class="space-y-2 text-sm mb-4">
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Capacidad:</span>
                                    <span class="font-medium">100 personas</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Tipo:</span>
                                    <span class="font-medium">Auditorio</span>
                                </p>
                                <p class="flex justify-between">
                                    <span class="text-gray-500">Ocupación:</span>
                                    <span class="font-medium text-green-600">45%</span>
                                </p>
                            </div>
                            
                            <div class="mb-4">
                                <p class="text-xs text-gray-500 mb-2">Equipamiento:</p>
                                <div class="flex flex-wrap gap-1">
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Proyector HD</span>
                                    <span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Sonido</span>
                                </div>
                            </div>
                            
                            <div class="flex gap-2">
                                <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Ver horario</button>
                                <button class="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">✏️</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        

