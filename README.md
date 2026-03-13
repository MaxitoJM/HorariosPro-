# Proyecto Núcleo 2

Módulo de autenticación para un sistema académico de gestión de horarios.

## Stack elegido

- Backend: Node.js + TypeScript + Express
- Base de datos: PostgreSQL
- ORM: Prisma
- Auth: JWT access token + refresh token (cookie httpOnly)
- Validación: Zod
- Hash de contraseñas: bcryptjs
- Seguridad: Helmet, CORS controlado, rate limiting, validación y manejo centralizado de errores

## Estructura

```text
.
├─ index.html
├─ src/                       # Frontend mockup + integración auth
│  ├─ api/
│  │  ├─ config.js
│  │  └─ authApi.js
│  ├─ auth/
│  │  ├─ loginView.js
│  │  └─ session.js
│  └─ core/
│     ├─ render.js
│     └─ state.js
└─ backend/
   ├─ prisma/
   │  ├─ schema.prisma
   │  └─ seed.ts
   ├─ src/
   │  ├─ app.ts
   │  ├─ server.ts
   │  ├─ config/env.ts
   │  ├─ constants/roles.ts
   │  ├─ database/prisma.ts
   │  ├─ middlewares/
   │  │  ├─ authenticate.ts
   │  │  ├─ authorize.ts
   │  │  ├─ rate-limit.ts
   │  │  ├─ validate.ts
   │  │  └─ error-handler.ts
   │  ├─ modules/auth/
   │  │  ├─ auth.schema.ts
   │  │  ├─ auth.service.ts
   │  │  └─ auth.routes.ts
   │  ├─ modules/health/health.routes.ts
   │  └─ utils/
   │     ├─ http-error.ts
   │     ├─ jwt.ts
   │     └─ security.ts
   └─ tests/
      ├─ integration/
      │  ├─ auth.routes.test.ts
      │  └─ health.test.ts
      └─ unit/security.test.ts
```

## Modelo de datos (Prisma)

Entidades incluidas:

- `User`: id, nombre, apellido, email único, password_hash, rol, activo, verificado, created_at, updated_at.
- `RefreshToken`: token hash, expiración, revocación, ip, user agent.
- `PasswordResetToken`: token hash, expiración, uso.
- `AuditLog`: auditoría básica de acciones de auth.

Roles soportados:

- `admin`
- `profesor`
- `estudiante`

## Ejecucion desde la raiz

El proyecto ya esta preparado para correr desde la carpeta raiz.

```bash
npm run install:backend
npm run db:setup-postgres
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

URLs:

- Frontend: `http://localhost:5500`
- Backend: `http://localhost:4000/api/v1`
- PostgreSQL: `localhost:5433`

Credenciales iniciales del admin:

- Email: `admin@proyectonucleo.edu`
- Password: `Admin12345*`

## Variables de entorno requeridas

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_DAYS`
- `PASSWORD_RESET_EXPIRES_MINUTES`
- `BCRYPT_ROUNDS`
- `CORS_ORIGIN`
- `COOKIE_SECURE`

La configuracion por defecto de desarrollo ya quedo en [backend/.env](C:/Users/Maxi%20Jaramillo/OneDrive/Documentos/Universidad/Proyecto%20Nucleo%202/backend/.env) apuntando a PostgreSQL local en el puerto `5433`.

## Endpoints de autenticación

### Registro

`POST /api/v1/auth/register`

Request:

```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "email": "ana@universidad.edu",
  "password": "Admin12345*",
  "rol": "estudiante"
}
```

Response 201:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "nombre": "Ana",
      "apellido": "Pérez",
      "email": "ana@universidad.edu",
      "rol": "estudiante",
      "activo": true,
      "verificado": false,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "accessToken": "..."
  }
}
```

### Login

`POST /api/v1/auth/login`

```json
{
  "email": "ana@universidad.edu",
  "password": "Admin12345*"
}
```

Prueba rapida automatizada:

```bash
npm run test:endpoints
```

### Refresh token

`POST /api/v1/auth/refresh`

- Usa cookie `nucleo_rt` httpOnly (o body `refreshToken` para clientes no-browser).

### Logout

`POST /api/v1/auth/logout`

### Logout global

`POST /api/v1/auth/logout-all` (requiere `Authorization: Bearer <accessToken>`)

### Forgot password

`POST /api/v1/auth/forgot-password`

```json
{
  "email": "ana@universidad.edu"
}
```

Siempre devuelve mensaje genérico para no filtrar existencia de usuarios.

### Reset password

`POST /api/v1/auth/reset-password`

```json
{
  "token": "token_recibido",
  "password": "NuevaClave123*"
}
```

### Perfil actual

`GET /api/v1/auth/me`

## Seguridad aplicada

- Contraseñas hasheadas con bcrypt.
- Reglas de contraseña fuerte.
- Access token JWT con expiración.
- Refresh token opaco, almacenado como hash y revocable.
- Invalida sesiones en reset de contraseña.
- Rate limiting global de auth y más estricto en login.
- Validación de entrada con Zod.
- CORS controlado por lista blanca.
- Helmet para headers de seguridad.
- Errores consistentes sin exponer secretos internos.
- Secretos por variables de entorno.

## Frontend integrado

Se actualizó el frontend actual para usar la API real:

- Login
- Registro
- Recuperación de contraseña
- Restablecimiento de contraseña por token
- Persistencia de sesión (access token en `sessionStorage`, usuario en `localStorage`)
- Refresh automático al expirar access token
- Protección de navegación por rol en el menú

## Pruebas

En `backend/tests`:

- Unitarias: seguridad de contraseñas.
- Integración HTTP: registro/login/forgot-password + health.

Ejecución:

```bash
cd backend
npm test
```

## Integración con módulos futuros

- Usa `authenticate` para rutas privadas.
- Usa `authorize("admin" | "profesor" | "estudiante")` para control por rol.
- Para permisos finos, agrega una capa `permissions` sobre `user.rol` y recursos del dominio (horarios, clases, etc).

## Extensiones recomendadas

1. Verificación de email con token de activación.
2. OAuth2/OIDC (Google/Microsoft).
3. Gestión de sesiones por dispositivo con panel de sesiones activas.
4. Auditoría avanzada con trazabilidad por módulo.
