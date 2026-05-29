# Despliegue a producción — HorariosPro

Stack de producción: **Vercel** (frontend estático) + **Render** (backend Node/Express) + **Neon** (Postgres serverless).

> El repositorio incluye `render.yaml` (Render Blueprint) para que el backend se provisione automáticamente. Solo necesitas pegar dos valores en el dashboard tras conectar el repo.

---

## 1. Base de datos en Neon (gratis)

1. Crear cuenta en [neon.tech](https://neon.tech) y un proyecto.
2. En el dashboard del proyecto copiar el **connection string** con `?sslmode=require` (formato: `postgresql://user:pass@host/db?sslmode=require`).
3. Guardarlo: se usa como `DATABASE_URL` en Render.

> Las migraciones se aplican solas en cada deploy (`prisma migrate deploy` en el `startCommand`). No es necesario ejecutarlas manualmente.

---

## 2. Backend en Render

1. Ir a [render.com](https://render.com) → **New** → **Blueprint**.
2. Conectar el repositorio `MaxitoJM/HorariosPro-`.
3. Render detecta `render.yaml` y propone crear el servicio `horariospro-backend`. Confirmar.
4. En el dashboard del servicio, sección **Environment**, completar las dos variables marcadas `sync: false`:
   - `DATABASE_URL` → la connection string de Neon (paso 1.2).
   - `CORS_ORIGIN` → la URL de la app en Vercel (paso 3), p.ej. `https://horariospro.vercel.app`.
5. Render dispara el primer deploy: `npm install && prisma generate && tsc → prisma migrate deploy && node dist/server.js`.
6. Verificar health check: `https://<tu-servicio>.onrender.com/api/v1/health/public` debe devolver `200`.
7. Copiar la URL pública: se usa en el frontend (paso 3.3).

### Variables que Render gestiona automáticamente
| Variable | Origen |
|---|---|
| `NODE_ENV=production` | render.yaml |
| `JWT_ACCESS_SECRET` | `generateValue: true` — Render crea uno aleatorio |
| `JWT_ACCESS_EXPIRES_IN=15m`, `REFRESH_TOKEN_EXPIRES_DAYS=7`, `BCRYPT_ROUNDS=12` | render.yaml |
| `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` | render.yaml (necesario para cross-domain Vercel↔Render) |

---

## 3. Frontend en Vercel

1. En [vercel.com](https://vercel.com) → **New Project** → importar el repo.
2. **Root directory**: dejar en blanco (raíz del repo).
3. **Antes del deploy**, editar `index.html` y descomentar/ajustar la línea:
   ```html
   <script>
     window.__API_BASE_URL__ = "https://<tu-servicio>.onrender.com/api/v1";
   </script>
   ```
   Reemplazar con la URL del paso 2.7.
4. Commit + push → Vercel redeploya solo.
5. Verificar: abrir la URL de Vercel, debe mostrar el login. Al iniciar sesión, las peticiones van al backend de Render.

---

## 4. Crear el admin en la base de datos de producción

Como el seed se ejecuta solo en desarrollo, hay dos opciones:

**Opción A (rápida):** correr el seed contra Neon desde tu máquina **una vez**:
```bash
cd backend
DATABASE_URL="<URL de Neon>" npm run prisma:seed
```

**Opción B:** crear el admin con un INSERT manual en Neon (SQL editor del dashboard), generando el hash de bcrypt con `node -e "console.log(require('bcryptjs').hashSync('TuPassword123*', 12))"`.

---

## 5. Verificaciones post-deploy

| Check | Cómo |
|---|---|
| Health backend | `curl https://<servicio>.onrender.com/api/v1/health/public` → `200` |
| Login desde Vercel | Abrir frontend, iniciar sesión con admin |
| CORS correcto | Probar que la consola del navegador no muestre errores CORS |
| Cookies cross-domain | Confirmar que el `/auth/refresh` funciona (cookie `nucleo_rt` se envía) |
| Migraciones aplicadas | Render logs deben mostrar `Database schema is up to date!` |

---

## 6. Mantenimiento

- **Nuevas migraciones**: se generan con `npx prisma migrate dev --name <nombre>` en desarrollo, se commitean en `prisma/migrations/`. El próximo deploy las aplica automáticamente.
- **Variables sensibles**: nunca commitearlas. Usar el dashboard de Render.
- **Logs**: Render dashboard → tab Logs. Para Neon: dashboard del proyecto.

---

## Resumen de URLs y secrets

| Servicio | Donde | Notas |
|---|---|---|
| Neon | Externo | DATABASE_URL con `?sslmode=require` |
| Render backend | Auto vía `render.yaml` | URL pública `https://*.onrender.com` |
| Vercel frontend | Auto desde repo | `window.__API_BASE_URL__` en `index.html` |
