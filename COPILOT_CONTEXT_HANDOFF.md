# Contexto de transferencia — Poesía y Ficción

Documento de traspaso para continuar el trabajo en una nueva ventana de VS Code,
después de migrar el repositorio de OneDrive a `C:\dev\PROYECTOS IA`.

No implementar nada solo por leer este documento: usarlo como contexto antes de
retomar la Fase 2.

## 1. Ubicación y estado de Git

- Ruta actual del repositorio: `C:\dev\PROYECTOS IA`.
- Ruta anterior (OneDrive, ya no es el workspace de trabajo):
  `C:\Users\samue\OneDrive - Universidad de San Buenaventura - Bogota\Desktop\PROYECTOS IA`.
- Rama activa: `main`.
- Rama de respaldo: `backup-fase-1` (apunta al mismo commit que `main`).
- Remoto: `origin` → `https://github.com/Samuel-AI-Electronic-Engineer/-AI-agent-RAG-for-business.git`.
- Último commit confirmado en ambas rutas: `b93c0db "commit"` (`HEAD -> main, origin/main, origin/HEAD, backup-fase-1`).
- Estado verificado: `working tree clean`, `up to date with 'origin/main'`.
- Motivo de la migración: la carpeta original vivía dentro de OneDrive y sufrió una
  reversión silenciosa del árbol de trabajo (ver sección 5) atribuida a sincronización
  de archivos. Se migró a `C:\dev\PROYECTOS IA` para separar sincronización de nube
  de control de versiones.

## 2. Arquitectura del producto

**Poesía y Ficción**: plataforma de literatura con evolución hacia comercio
electrónico de libros.

```text
Usuario
  → React 19 + Vite (SPA)
  → HTTP/JSON (Axios + JWT + cookie HttpOnly de refresh)
  → FastAPI (routers → schemas → models)
  → SQLAlchemy 2.0
  → PostgreSQL (gestionado con Alembic)
```

### Frontend — `poesia-ficcion-react/`

- React 19, Vite 8, React Router 7, Zustand 5, TanStack Query 5, Axios 1.16,
  Framer Motion (declarado, uso mínimo).
- Estado de autenticación en Zustand (`src/store/authStore.js`).
- Server state con TanStack Query.
- Cliente HTTP centralizado en `src/config/api.js` con interceptor de
  renovación automática de sesión.
- Contexto de tienda (`src/context/StoreContext.jsx`, `useStore.js`,
  `StoreContextDef.js`) para catálogo, carrito y pedidos.
- Rutas relevantes: `/`, `/login`, `/register`, `/poema/:id`, `/libreria`,
  `/libreria/edit/` (solo admin), `/dashboard` y subrutas
  (`/publicaciones`, `/pedidos`, `/recomendados`, `/configuracion`),
  `/admin/*` (solo admin), `/publicar`.

### Backend — `poetry-fiction-backend/poetry-fiction-backend/`

- FastAPI 0.115, Pydantic 2.9, SQLAlchemy 2.0, PostgreSQL, JWT (`python-jose`),
  hashing con `passlib` (`pbkdf2_sha256`, no Bcrypt pese a lo que dice cierta
  documentación antigua).
- Estructura: `app/routers` → `app/schemas` → `app/models` → `app/database.py`.
- Routers activos: `auth`, `users`, `posts`, `admin`, `store` (productos),
  `orders` (pedidos).
- Modelos: `User`, `Post`, `Product`, `Order`/`OrderItem`, `RefreshToken`.
- Migraciones con Alembic en `alembic/` (ver sección 4).
- Tests en `tests/` (`conftest.py`, `test_auth.py`) con SQLite en memoria.

### Frontend legado

- `poetry-fiction-frontend/` es un frontend estático anterior, ignorado por
  `.gitignore`. **No es el frontend oficial.** El oficial es
  `poesia-ficcion-react/`.

## 3. Estado de fases

### FASE 0 — Auditoría (completada, solo lectura)

Hallazgos principales (ver resumen entregado en su momento):

- MVP avanzado, no listo para producción comercial.
- RF-11 a RF-18 con implementación parcial; RF-19 (pasarela de pago) y
  RF-20 (refresh tokens) no implementados en ese momento.
- Riesgos críticos detectados: configuración insegura por defecto
  (`DEBUG=True`, `SECRET_KEY` hardcodeada, password vacía), sin migraciones
  reales (`Base.metadata.create_all()` en el arranque), sin refresh tokens,
  sin tests, inventario descontado antes de confirmar pago, checkout sin
  pasarela real.

### FASE 1 — Fundación y seguridad (completada, con incidente corregido)

Objetivos cumplidos:

1. **Alembic real**: estructura creada (`alembic.ini`, `alembic/env.py`,
   `alembic/script.py.mako`, migración base
   `alembic/versions/20260922_0001_baseline.py`). La migración base es
   idempotente (`Base.metadata.create_all` dentro de la migración) para no
   destruir la base de datos existente. `alembic current` → `20260922_0001
   (head)`. `alembic check` → sin operaciones pendientes.
2. **Configuración segura** (`app/core/config.py`):
   - `ENVIRONMENT` (`development` | `testing` | `production`).
   - `DEBUG` por defecto `False`.
   - `SECRET_KEY` obligatoria, mínimo 32 caracteres (validador).
   - `DATABASE_URL` o combinación `DB_*` con `DB_PASSWORD` obligatoria.
   - En producción: `DEBUG` debe ser `false`, `DATABASE_URL` obligatoria,
     `COOKIE_SECURE` obligatorio, `COOKIE_SAMESITE=none` requiere
     `COOKIE_SECURE=true`, `ALLOWED_ORIGINS` no puede contener
     `localhost`/`127.0.0.1`.
   - La app falla al iniciar si faltan estas condiciones (`pydantic`
     `model_validator`).
3. **Refresh tokens rotatorios** (`app/models/refresh_token.py`,
   `app/core/security.py`, `app/routers/auth.py`):
   - Tabla `refresh_tokens` (hash SHA-256 del token, `expires_at`,
     `revoked_at`, `replaced_by`).
   - Cookie `HttpOnly`, `Secure` (según entorno), `SameSite` configurable,
     con `path=/api/v1/auth`.
   - `POST /api/v1/auth/register` y `/login` emiten `access_token` (15 min
     por defecto) + cookie de refresh (30 días por defecto).
   - `POST /api/v1/auth/refresh`: valida, revoca el token usado, emite uno
     nuevo (rotación), rechaza reutilización de tokens ya revocados o
     expirados.
   - `POST /api/v1/auth/logout`: revoca el refresh token y limpia la cookie.
   - Access tokens incluyen `typ: "access"` y `jti` único (evita colisiones
     al rotar en el mismo segundo).
4. **Autorización**: sin cambios de fondo, ya dependía de `get_current_user`
   / `get_current_admin` en el backend (nunca del frontend). Se mantiene esa
   garantía.
5. **CORS**: `origins_list` filtra vacíos; validado que producción no
   admita `localhost`.
6. **Manejo global de errores** (`app/main.py`): handlers para
   `RequestValidationError`, `HTTPException`, `SQLAlchemyError` y
   `Exception`, todos devuelven JSON consistente
   (`{"detail": ..., "error": {"code": ..., "message": ...}}`) sin filtrar
   stack traces.
7. **HTTPS**: no se implementaron certificados en FastAPI (se asume reverse
   proxy/plataforma administrada). Las cookies ya soportan `Secure`.
8. **Tests** (`requirements.txt`: `pytest`, `pytest-asyncio`, `httpx`):
   - `tests/conftest.py`: cliente de pruebas con SQLite en memoria
     (`StaticPool`), overrides de `get_db`.
   - `tests/test_auth.py` (5 tests, todos en verde):
     registro/login/`/users/me`/refresh/logout,
     registro inválido y login inválido,
     access token expirado + autorización admin (403 sin rol),
     rechazo de reutilización de refresh token,
     health check.
9. **Frontend** (`src/config/api.js`, `src/store/authStore.js`,
   `src/services/authService.js`, `src/pages/Dashboard.jsx`):
   - Axios con `withCredentials: true`.
   - Interceptor de respuesta: ante `401` (que no sea endpoint de auth),
     intenta `POST /auth/refresh` una sola vez (`_retry`), reintenta la
     petición original; si falla, limpia sesión y dispara
     `pf-auth-expired`.
   - `authStore.setToken` para actualizar solo el access token tras un
     refresh.
   - `authService.logout()` llama al backend antes de limpiar el estado
     local; `Dashboard.jsx` usa esto en el botón de cerrar sesión.
10. **Compatibilidad verificada**: registro, login, logout, `/users/me`,
    publicaciones, rutas protegidas, administración, productos, pedidos y
    health check siguen funcionando (ver sección 6).

Correcciones adicionales dentro de la Fase 1:

- `app/routers/posts.py`: renombrado `sql_func` → `func` (diagnóstico
  estático falso positivo resuelto).
- `app/database.py`: `except Exception` → `except SQLAlchemyError` en
  `check_db_connection`.
- `app/main.py`: eliminado `Base.metadata.create_all()` del ciclo de vida
  (`lifespan`); ahora el esquema se gestiona exclusivamente vía Alembic.
  Se conserva `create_dev_seed_data()` solo si `DEBUG=True`.
- `pytest.ini` con `asyncio_default_fixture_loop_scope = function` para
  evitar el warning de `pytest-asyncio`.

## 4. Base de datos

- Motor: PostgreSQL local (`poetry_fiction_db`).
- Gestión de esquema: Alembic, revisión única `20260922_0001` (baseline
  idempotente, no destructiva).
- Tablas confirmadas en producción local: `users`, `posts`, `products`,
  `orders`, `order_items`, `refresh_tokens`.
- Antes de crear nuevas migraciones: revisar modelos actuales en
  `app/models/` y usar `alembic revision --autogenerate` solo después de
  confirmar que el entorno apunta a la base correcta.
- Regla: nunca ejecutar migraciones destructivas automáticamente ni borrar
  datos existentes sin aprobación explícita.

## 5. Incidente detectado y resuelto durante la Fase 1

**Síntoma**: después de implementar toda la Fase 1, `git status` mostraba
archivos nuevos como eliminados (`D`) y archivos modificados con contenido
revertido a la versión insegura original (antes de Fase 1), a pesar de que
los tests habían pasado minutos antes.

**Causa raíz identificada**: el árbol de trabajo (mientras el proyecto vivía
dentro de OneDrive) se revirtió silenciosamente a un estado anterior,
probablemente por sincronización de archivos de OneDrive, después de que dos
commits externos al agente (`a7e2fd6 "Commit Everythings"` y
`b93c0db "commit"`) ya habían capturado correctamente toda la Fase 1 en
`HEAD`.

**Diagnóstico**: se comparó el contenido de `HEAD` (vía `git show HEAD:<ruta>`)
contra el disco, confirmando que `HEAD` tenía la versión completa y correcta;
solo el árbol de trabajo estaba desactualizado.

**Corrección aplicada**: `git restore --source=HEAD --worktree -- <rutas>`
sobre los 21 archivos afectados (frontend y backend). No se reimplementó
nada desde cero.

**Validación posterior**: `compileall`, `pytest` (5/5), `alembic
current`/`check`, `npm run lint`, `npm run build`, y un smoke test real
contra PostgreSQL (no solo SQLite de pruebas):
`register → 201`, `/users/me → 200`, `refresh → 200` (token rotado),
`logout → 204`, `refresh tras logout → 401`, `/health → healthy`,
`/posts → total 5`, `/products → 3`.

**Lección operativa**: evitar mantener el workspace activo de Copilot dentro
de una carpeta sincronizada por OneDrive mientras se editan archivos de
forma intensiva. Esta es la razón directa de la migración a `C:\dev\PROYECTOS IA`.

**Consecuencia sobre este documento**: siempre que se reabra el proyecto en
una nueva ventana, verificar primero `git status`, `git log --oneline -5` y
que el contenido en disco de archivos clave (`app/core/config.py`,
`app/routers/auth.py`, `app/main.py`) coincida con `HEAD` antes de asumir que
el entorno está íntegro.

## 6. Validaciones ejecutadas (última vez, resultado)

| Validación | Resultado |
| --- | --- |
| Backend `compileall` (`app`, `scripts`) | ✅ sin errores |
| `pytest` (`tests/test_auth.py`, 5 tests) | ✅ 5 passed |
| `alembic current` | ✅ `20260922_0001 (head)` |
| `alembic check` | ✅ sin operaciones pendientes |
| Frontend `npm run lint` | ✅ sin errores |
| Frontend `npm run build` | ✅ 158 módulos, sin errores |
| Smoke test real contra PostgreSQL | ✅ ver sección 5 |
| `git status` en `C:\dev\PROYECTOS IA` | ✅ `working tree clean`, `up to date with origin/main` |

Diagnósticos estáticos que aparecieron como falsos positivos/caché durante
la sesión (confirmados sin problema real leyendo el archivo y con
`compileall` limpio): referencias antiguas a `sql_func.count` y
`except Exception` en `posts.py`/`database.py`. Ya corregidos en código;
si el editor los sigue marcando, es caché del analizador, no un error
vigente.

## 7. Archivos clave por si se necesita releer contexto

Backend:

- `poetry-fiction-backend/poetry-fiction-backend/app/core/config.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/core/security.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/routers/auth.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/main.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/database.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/models/refresh_token.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/models/user.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/routers/posts.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/routers/store.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/routers/orders.py`
- `poetry-fiction-backend/poetry-fiction-backend/app/routers/admin.py`
- `poetry-fiction-backend/poetry-fiction-backend/alembic/` (env.py,
  script.py.mako, versions/20260922_0001_baseline.py)
- `poetry-fiction-backend/poetry-fiction-backend/tests/conftest.py`
- `poetry-fiction-backend/poetry-fiction-backend/tests/test_auth.py`
- `poetry-fiction-backend/poetry-fiction-backend/.env.example`
- `poetry-fiction-backend/poetry-fiction-backend/requirements.txt`
- `poetry-fiction-backend/poetry-fiction-backend/scripts/promote_admin.py`
  (promueve una cuenta existente a `is_admin=true` por correo)

Frontend:

- `poesia-ficcion-react/src/config/api.js`
- `poesia-ficcion-react/src/store/authStore.js`
- `poesia-ficcion-react/src/services/authService.js`
- `poesia-ficcion-react/src/context/StoreContext.jsx` /
  `StoreContextDef.js` / `useStore.js`
- `poesia-ficcion-react/src/pages/Dashboard.jsx`
- `poesia-ficcion-react/src/pages/Store.jsx` / `AdminStore.jsx`
- `poesia-ficcion-react/src/pages/AdminPanel.jsx`
- `poesia-ficcion-react/src/pages/CreatePost.jsx` /
  `ProfilePublications.jsx` / `ProfileOrders.jsx` /
  `ProfileRecommendations.jsx` / `ProfileSettings.jsx`
- `poesia-ficcion-react/src/App.jsx` (rutas y `AdminRoute`/`ProtectedRoute`)
- `poesia-ficcion-react/src/styles/global.css` (identidad visual espacial)

Documentación y reglas del proyecto:

- `.github/copilot-instructions.md` (reglas del producto, ver sección 9)
- `produccion_requerimientos_poesia_ficcion.html` (documento de
  requerimientos de producción, referencia de RF-11 a RF-20)

## 8. Pendiente inmediato (no iniciar sin autorización explícita)

**FASE 2 no ha comenzado.** Antes de tocar código en la nueva ventana:

1. Confirmar explícitamente con el usuario la ruta raíz del workspace
   (`C:\dev\PROYECTOS IA`) y que Copilot detecta el repositorio Git correcto,
   rama `main`, último commit `b93c0db` (o el que exista al reabrir).
2. No ejecutar `git init`, `git clone`, `git reset --hard`, `git clean -fd`
   ni `git push --force`.
3. No borrar la copia antigua en OneDrive todavía (decisión del usuario).
4. Solo después de esa confirmación, retomar el plan de Fase 2 con el
   alcance que el usuario autorice explícitamente.

## 9. Reglas de trabajo que se deben mantener

De `.github/copilot-instructions.md` y de esta conversación:

- No cambiar tecnologías (React/Vite, FastAPI, PostgreSQL) sin justificar.
- No introducir dependencias innecesarias.
- No duplicar lógica; reutilizar componentes y servicios existentes.
- Mantener separación: Router → Schema → Service/lógica → Model → Database.
- El frontend nunca debe acceder directamente a PostgreSQL.
- Autorización siempre verificada en backend; nunca confiar en
  `localStorage`, Zustand o roles enviados por el cliente.
- Zustand solo para estado global necesario (auth); TanStack Query para
  server state; Axios para HTTP. No duplicar server state en Zustand.
- No marcar una funcionalidad como terminada solo porque el código fue
  escrito: debe estar implementada, integrada, validada y probada
  (lint, build, compileall, pytest, revisión de consola/backend).
- Antes de modificar el modelo de datos: analizar relaciones existentes,
  identificar impacto, proponer cambios, implementar migración segura
  (Alembic, nunca destructiva sin aprobación).
- No implementar pagos reales (Wompi/PayU) sin antes tener bien diseñado:
  modelo de productos, órdenes, items, estados de pago, seguridad,
  webhooks, idempotencia y manejo de errores.
- No avanzar de fase automáticamente: cada fase requiere presentar
  diagnóstico/cambios y esperar autorización antes de continuar.
- Cuando se reporte una regresión o inconsistencia, detenerse y diagnosticar
  la causa raíz antes de reimplementar o sobrescribir código (ver sección 5
  como precedente exacto).

## 10. Deuda técnica conocida (pendiente para fases futuras)

- Refresh tokens revocados/reemplazados no se purgan (falta job de limpieza).
- Sin rate limiting en login/registro/creación de contenido (previsto para
  una fase de seguridad avanzada).
- Advertencias de deprecación: `pydantic` `Field(example=...)` y
  `jose` `datetime.utcnow()`. No afectan funcionalidad todavía.
- Sin protección CSRF explícita adicional para el flujo de cookie de
  refresh (mitigado parcialmente por `SameSite=lax`).
- README del backend desactualizado respecto a endpoints nuevos
  (`/auth/refresh`, `/auth/logout`, productos, pedidos, administración).
- Sin tests para `products`, `orders` ni `admin` todavía.
- RF-16 (subida real de imágenes de portada) sigue sin implementar
  (`cover_image_url` es solo texto).
- RF-19 (pasarela de pago real Wompi/PayU) sigue sin implementar; el
  checkout actual crea el pedido pero no procesa pago.
- Inventario (`Product.stock`) se descuenta al crear el pedido, no al
  confirmar el pago; pendiente de rediseño cuando se aborde Fase de pagos.
- Frontend todavía combina catálogo/carrito con `localStorage` como
  respaldo además de las llamadas reales a `/products` y `/orders`; revisar
  si conviene eliminar el fallback local una vez el backend sea la única
  fuente de verdad.

## 11. Cómo verificar que el contexto en la nueva ventana es correcto

Al abrir `C:\dev\PROYECTOS IA` en la nueva ventana, antes de pedir cualquier
tarea a Copilot, ejecutar y confirmar:

```powershell
git status
git branch
git remote -v
git log --oneline --decorate -5
Test-Path ".git"
git fetch origin
git status
```

Se espera:

- `Test-Path ".git"` → `True`.
- Ramas: `* main` y `backup-fase-1`.
- Commit visible: `b93c0db (HEAD -> main, origin/main, origin/HEAD) commit`
  (o uno más reciente si hubo commits posteriores).
- `Your branch is up to date with 'origin/main'.`

Si algo no coincide, detenerse y no continuar con Fase 2 hasta resolverlo.
