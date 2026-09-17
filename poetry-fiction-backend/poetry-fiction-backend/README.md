# 🖊️ Poesía y Ficción — Backend API

API REST construida con **FastAPI** y **PostgreSQL** para la plataforma de poesía y ficción.

---

## 🗂️ Estructura del Proyecto

```
poetry-fiction-backend/
├── app/
│   ├── main.py              ← Punto de entrada de la app
│   ├── database.py          ← Conexión y sesión MySQL
│   ├── deps.py              ← Dependencias (auth JWT)
│   ├── core/
│   │   ├── config.py        ← Variables de entorno
│   │   └── security.py      ← Hash de contraseñas + JWT
│   ├── models/
│   │   ├── user.py          ← Tabla users
│   │   └── post.py          ← Tabla posts (poemas/cuentos)
│   ├── schemas/
│   │   ├── user.py          ← Validación de datos usuario
│   │   └── post.py          ← Validación de datos publicación
│   └── routers/
│       ├── auth.py          ← /auth/register, /auth/login
│       ├── users.py         ← /users/me, /users/{username}
│       └── posts.py         ← CRUD de publicaciones
├── requirements.txt
├── .env.example
└── README.md
```

---

## ⚙️ Instalación

### 1. Clonar y entrar al proyecto

```bash
git clone <tu-repo>
cd poetry-fiction-backend
```

### 2. Crear entorno virtual

```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales de PostgreSQL
```

### 5. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE poetry_fiction_db;
```

### 6. Iniciar el servidor

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 📡 Endpoints disponibles

| Método | Ruta | Descripción | Auth |
| -------- | ------ | ------------- | ------ |
| GET | `/` | Estado del servidor | No |
| GET | `/health` | Health check | No |
| POST | `/api/v1/auth/register` | Registrar usuario | No |
| POST | `/api/v1/auth/login` | Iniciar sesión | No |
| GET | `/api/v1/users/me` | Mi perfil | ✅ |
| PUT | `/api/v1/users/me` | Actualizar perfil | ✅ |
| GET | `/api/v1/users/{username}` | Perfil público | No |
| GET | `/api/v1/posts` | Listar publicaciones | No |
| GET | `/api/v1/posts/featured` | Publicaciones destacadas | No |
| GET | `/api/v1/posts/{id}` | Ver publicación | No |
| POST | `/api/v1/posts` | Crear publicación | ✅ |
| PUT | `/api/v1/posts/{id}` | Editar publicación | ✅ |
| DELETE | `/api/v1/posts/{id}` | Eliminar publicación | ✅ |

### Parámetros de listado (`GET /api/v1/posts`)

| Parámetro | Tipo | Descripción |
| ----------- | ------ | ------------- |
| `page` | int | Página (default: 1) |
| `per_page` | int | Resultados por página (default: 12) |
| `content_type` | string | `poema` o `cuento` |
| `tag` | string | Filtrar por etiqueta |
| `search` | string | Buscar en título |

---

## 🔐 Autenticación

La API usa **JWT Bearer tokens**.

1. Regístrate o inicia sesión → recibirás un `access_token`
2. Incluye el token en el header de las peticiones protegidas:

   ```
   Authorization: Bearer <tu_token>
   ```

---

## 📚 Documentación interactiva

Con el servidor corriendo, visita:

- **Swagger UI:** <http://localhost:8000/docs>
- **ReDoc:** <http://localhost:8000/redoc>

---

## 🛠️ Próximos pasos sugeridos

- [ ] Subida de imágenes de portada (Cloudinary / S3)
- [ ] Sistema de comentarios
- [ ] Likes / reacciones
- [ ] Busqueda por autor
- [ ] Migración con Alembic para cambios de esquema
- [ ] Deploy en Railway / Render / VPS
