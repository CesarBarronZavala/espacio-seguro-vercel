# 🌱 Espacio Seguro — Edición Vercel Serverless

Plataforma comunitaria de concienciación y apoyo frente al acoso con arquitectura **Serverless en Vercel + Base de Datos Supabase (PostgreSQL)**.

---

## 🚀 Despliegue en Vercel en 3 Pasos

### 1. Sube este proyecto a tu GitHub
```bash
cd C:\Users\HP\Desktop\espacio-seguro-vercel
git init
git add .
git commit -m "Initial commit - Espacio Seguro Vercel Edition"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/espacio-seguro-vercel.git
git push -u origin main
```

### 2. Importa el proyecto en Vercel
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu GitHub.
2. Haz clic en **Add New...** → **Project**.
3. Selecciona tu repositorio `espacio-seguro-vercel`.

### 3. Configura las Variables de Entorno en Vercel
En la pantalla de configuración antes de hacer Deploy, despliega la sección **Environment Variables** y añade:

| Variable | Valor |
| :--- | :--- |
| `SUPABASE_URL` | `https://snvnosvrzicppqgncikk.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ADMIN_SECRET_KEY` | `moderador2026` |

Haz clic en **Deploy** y tu sitio estará en vivo con backend Serverless.

---

## 🛠️ Endpoints Serverless en Vercel

* **`GET /api/testimonios`** — Lista testimonios publicados para el feed.
* **`POST /api/testimonios`** — Guarda una nueva historia como pendiente.
* **`PUT /api/testimonios`** — Suma apoyos ("Te escuchamos ❤️").
* **`GET /api/moderacion`** — Consulta historias pendientes/publicadas/rechazadas con clave de moderador.
* **`PUT /api/moderacion`** — Aprueba o rechaza testimonios.
* **`DELETE /api/moderacion`** — Elimina testimonios permanentemente.
