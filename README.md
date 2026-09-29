# Finance App - Personal Expenses Tracker

Una aplicación web progresiva (PWA) de nivel empresarial diseñada para el control de gastos personales con un enfoque Mobile-First y capacidades Offline-First.

## Arquitectura del Proyecto

El sistema está dividido en tres capas principales:

1. **Frontend (Cliente):** React 18, Vite, TypeScript y Tailwind CSS v4. Incluye PWA (Service Workers, IndexedDB) y diseño Glassmorphism.
2. **Backend (API REST):** Node.js, Express.js y TypeScript. Protegido con JWT en cookies HttpOnly y Cloudflare Turnstile contra ataques automatizados.
3. **Base de Datos:** PostgreSQL. Estructura relacional con seguridad basada en roles (RBAC) e IDOR protection a nivel de controlador.

---

## 🛠️ Requisitos Previos

- **Node.js** v18 o superior (Se recomienda Node 24)
- **Docker Desktop** (Asegúrate de tener VT-x/Hyper-V habilitado en tu BIOS/Windows)
- **Git**

---

## 🚀 Despliegue Local (Paso a Paso)

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/davidvato/finance_app.git
cd finance_app

# Instalar dependencias del Backend
cd backend
npm install

# Instalar dependencias del Frontend
cd ../frontend
npm install
```

### 2. Configurar Variables de Entorno

**En el Backend (`backend/.env`):**
```env
PORT=5000
DATABASE_URL=postgresql://finance_user:finance_password@localhost:5432/finance_db
JWT_SECRET=super-secret-jwt-key-replace-in-production
TURNSTILE_SECRET=1x0000000000000000000000000000000AA
NODE_ENV=development
```

**En el Frontend (`frontend/.env`):**
```env
VITE_TURNSTILE_SITEKEY=1x00000000000000000000AA
```
*(Nota: Las claves `1x00...AA` son de prueba oficiales de Cloudflare y siempre pasarán en localhost).*

### 3. Levantar la Base de Datos

En la carpeta raíz del proyecto (`finance_app`), ejecuta:
```bash
docker compose up -d
```
Esto descargará e iniciará un contenedor de PostgreSQL en el puerto 5432.

### 4. Ejecutar Migraciones y Crear el Admin (Seeding)

Debes crear la estructura de las tablas y el primer usuario (Admin). Abre tu terminal PowerShell o CMD:

**A. Crear el Esquema (Tablas):**
```powershell
cmd /c "docker exec -i finance_app_db psql -U finance_user -d finance_db < backend\db\migrations\001_initial_schema.sql"
```

**B. Generar Usuario Admin:**
```powershell
cd backend
cmd /c "npx tsx db/seed.ts"
```
*(Creará el usuario `admin` con contraseña `qwerty`).*

### 5. Iniciar los Servidores de Desarrollo

Abre dos terminales diferentes:

**Terminal 1 (Backend):**
```powershell
cd backend
cmd /c "npm run dev"
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
cmd /c "npm run dev"
```

Ve a `http://localhost:5173` en tu navegador. Al ingresar por primera vez con `admin` / `qwerty`, el sistema te forzará a cambiar la contraseña por una segura (12 caracteres, mayúsculas, símbolos).

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con una robusta suite de pruebas de integración para verificar RBAC, IDOR y Cloudflare Turnstile.

```bash
cd backend
npm test
```
*Asegúrate de que la base de datos de Docker esté corriendo antes de ejecutar las pruebas.*

---

## 📦 Construcción para Producción

Para desplegar la aplicación en servicios como Vercel (Frontend) y Render/Railway (Backend):

### Backend
```bash
cd backend
npm run build
# El código compilado estará en la carpeta dist/
# Iniciar en producción:
node dist/server.js
```

### Frontend
```bash
cd frontend
npm run build
# El bundle final optimizado estará en la carpeta dist/
```

### Notas sobre Producción:
- Recuerda cambiar los `JWT_SECRET` y los secretos de Turnstile por claves reales.
- El atributo `Secure` de las cookies se activa automáticamente si `NODE_ENV=production`.
- Para Vercel, asegúrate de configurar el "Root Directory" a `frontend` y añadir la variable de entorno `VITE_API_URL` si tu backend no está en el mismo dominio.
