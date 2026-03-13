export function renderLogin() {
  return `
    <div class="flex h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <div class="m-auto w-full max-w-md p-8">
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-4xl">📅</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-800">Proyecto Núcleo</h1>
            <p class="text-gray-600 mt-2">Universidad El Bosque</p>
            <p class="text-sm text-gray-500 mt-1">Sistema de Gestión de Horarios Académicos</p>
          </div>

          <div class="flex gap-2 mb-6">
            <button type="button" id="tab-login" class="tab active flex-1 text-center">Login</button>
            <button type="button" id="tab-register" class="tab flex-1 text-center">Registro</button>
            <button type="button" id="tab-forgot" class="tab flex-1 text-center">Recuperar</button>
          </div>

          <form id="loginForm" class="space-y-4">
            <input id="loginEmail" type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Email" required>
            <input id="loginPassword" type="password" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Contraseña" required>
            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Iniciar sesión</button>
          </form>

          <form id="registerForm" class="space-y-4 hidden">
            <input id="registerNombre" type="text" minlength="2" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nombre" required>
            <input id="registerApellido" type="text" minlength="2" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Apellido" required>
            <input id="registerEmail" type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Email" required>
            <select id="registerRol" class="w-full px-4 py-3 border border-gray-300 rounded-lg" required>
              <option value="estudiante">Estudiante</option>
              <option value="profesor">Profesor</option>
              <option value="admin">Administrador</option>
            </select>
            <input id="registerPassword" type="password" minlength="8" pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,64}$" title="Debe incluir mayuscula, minuscula, numero y simbolo" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Contraseña segura" required>
            <p class="text-xs text-gray-500">Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.</p>
            <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition">Crear cuenta</button>
          </form>

          <form id="forgotForm" class="space-y-4 hidden">
            <input id="forgotEmail" type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Email" required>
            <button type="submit" class="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition">Enviar recuperación</button>
          </form>

          <form id="resetForm" class="space-y-4 mt-6 hidden">
            <input id="resetToken" type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Token de recuperación" required>
            <input id="resetPassword" type="password" minlength="8" pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^\\w\\s]).{8,64}$" title="Debe incluir mayuscula, minuscula, numero y simbolo" class="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nueva contraseña" required>
            <button type="submit" class="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">Establecer nueva contraseña</button>
          </form>

          <div id="authMessage" class="hidden mt-4 p-3 rounded-lg text-sm"></div>
        </div>
      </div>
    </div>
  `;
}
