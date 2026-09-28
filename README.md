# Finance App (PWA Offline-First)

Aplicación web responsiva (Mobile-First) para el control de gastos personales mensuales.

## Características Principales

*   **Offline-First:** Permite registrar transacciones sin conexión mediante IndexedDB y se sincroniza en segundo plano al recuperar la conexión.
*   **PWA:** Instalable en dispositivos móviles con interfaz ergonómica.
*   **Seguridad:** Autenticación con JWT (Cookies HttpOnly), contraseñas hasheadas con Argon2id, limitación de tasa y Cloudflare Turnstile.
*   **RBAC & Anti-IDOR:** Controles estrictos de acceso para el rol `ADMIN` (gestión de usuarios) y aislamiento total de datos entre usuarios `USER`.

## Requisitos Previos

*   Node.js (v18+)
*   Docker y Docker Compose (para PostgreSQL)
*   Una cuenta de Cloudflare para las claves de Turnstile.

## Configuración y Despliegue Local

1.  **Clonar el repositorio y preparar variables de entorno:**
    Copia el archivo `.env.example` a `.env` en las carpetas `backend` y ajusta las variables necesarias:
    *   `DATABASE_URL=postgresql://finance_user:finance_password@localhost:5432/finance_db`
    *   `JWT_SECRET=tu_secreto_seguro`
    *   `TURNSTILE_SECRET=tu_secreto_turnstile`

    En `frontend/.env`:
    *   `VITE_TURNSTILE_SITEKEY=tu_sitekey_turnstile`

2.  **Levantar la base de datos PostgreSQL:**
    ```bash
    docker compose up -d
    ```

3.  **Ejecutar Migraciones y Seeding:**
    Desde la carpeta `backend`:
    ```bash
    # Ejecuta el schema SQL en PostgreSQL
    docker exec -i finance_app_db psql -U finance_user -d finance_db < db/migrations/001_initial_schema.sql
    
    # Crea el usuario admin (admin / qwerty)
    npm run ts-node db/seed.ts
    ```

4.  **Iniciar el Backend:**
    ```bash
    cd backend
    npm install
    npm run dev
    ```

5.  **Iniciar el Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Acceso al Sistema

Abre tu navegador en `http://localhost:5173`.
*   **Usuario Admin Inicial:** `admin`
*   **Contraseña:** `qwerty` (El sistema forzará el cambio inmediato tras el primer inicio de sesión).
