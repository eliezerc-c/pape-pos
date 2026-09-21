# Instalación de Papeleria POS

## Requisitos Previos

- **Node.js**: v18+ o v20+
- **PostgreSQL**: 14+ o 15+
- **Git**: Para clonar el repositorio
- **Windows**: 10/11 (para build de .exe)
- **npm**: v9+

## Paso 1: Clonar el Repositorio

```bash
git clone <repo-url>
cd papeleria-pos
```

## Paso 2: Configurar PostgreSQL

### Instalar PostgreSQL (si no lo tienes)

1. Descarga desde [postgresql.org](https://www.postgresql.org/download/windows/)
2. Instala con la contraseña que desees
3. Agrega PostgreSQL al PATH del sistema

### Crear la Base de Datos

```bash
# Opción A: Usando psql
psql -U postgres -c "CREATE DATABASE pape_pos;"

# Opción B: Usando el setup automático
call setup.bat
```

## Paso 3: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cd papeleria-pos
copy .env.example .env
```

Edita `.env`:

```env
DATABASE_URL=postgresql://postgres:admin01@localhost:5432/pape_pos
PORT=3001
JWT_SECRET=tu_secret_seguro_cambiar_2024
STORAGE_PATH=./storage/products
BACKUP_PATH=./database/backups
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Nota**: La contraseña `admin01` es la configuración por defecto. Cámbiala según tu instalación de PostgreSQL.

## Paso 4: Instalar Dependencias

### Método A: Setup Automático

```bash
call setup.bat
```

Esto ejecutará:
1. Crear base de datos
2. Instalar dependencias del backend
3. Ejecutar migraciones
4. Ejecutar seed
5. Instalar dependencias del frontend
6. Crear archivo .env

### Método B: Instalación Manual

```bash
# Backend
cd backend
call npm install

# Migraciones
npx prisma migrate dev --name init

# Seed
npx prisma db seed

# Frontend
cd ..\frontend
call npm install
```

## Paso 5: Ejecutar el Sistema

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Deberías ver:
```
[DB] Conectado a PostgreSQL
[SERVER] Papeleria POS corriendo en puerto 3001
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Deberías ver:
```
  Local:   http://localhost:5173/
```

### Terminal 3 - Electron (Opcional)

```bash
cd electron
npm start
```

## Paso 6: Verificar Instalación

Abre `http://localhost:5173` en tu navegador.

Accede con las credenciales del seed:
- **ADMIN**: `admin` / `admin123`
- **CAJERO**: `cajero` / `cajero123`

## Generar .exe (Windows)

### Requisitos Adicionales

```bash
# Instalar electron-builder globalmente
npm install -g electron-builder
```

### Opción A: Usando build-exe.bat

```bash
call build-exe.bat
```

### Opción B: Manual

```bash
# Construir backend
cd backend
npm run build

# Construir frontend
cd ../frontend
npm run build

# Construir electron
cd ..
npx electron-builder --win --dir
```

El .exe se generará en `dist\`.

## Estructura de Archivos

```
papeleria-pos/
├── backend/                 # Backend Express + Prisma
│   ├── src/                # Código fuente
│   ├── prisma/             # Esquema y migraciones
│   ├── tests/              # Tests
│   ├── package.json        # Dependencias del backend
│   └── tsconfig.json       # Configuración TypeScript
├── frontend/               # Frontend React + Vite
│   ├── src/                # Código fuente
│   ├── package.json        # Dependencias del frontend
│   └── tsconfig.json       # Configuración TypeScript
├── electron/               # Capa Electron
│   ├── main.ts            # Proceso principal
│   ├── preload.ts         # Script de pre-carga
│   ├── package.json       # Dependencias de Electron
│   └── electron-builder.json # Configuración de build
├── scripts/               # Scripts de Windows
│   ├── backup.bat
│   ├── restore.bat
│   ├── migrate.bat
│   └── seed.bat
├── docs/                  # Documentación
├── database/              # Base de datos y backups
├── storage/               # Archivos de productos
├── setup.bat              # Setup automatizado
├── build-exe.bat          # Build de .exe
├── .env.example           # Variables de entorno de ejemplo
└── .gitignore             # Archivos ignorados por Git
```

## Solución de Problemas

### Error: "psql no encontrado"
Agrega PostgreSQL al PATH del sistema:
- Variables de entorno → PATH → Agregar `C:\Program Files\PostgreSQL\15\bin`

### Error: "Connection refused" al backend
Verifica que PostgreSQL esté corriendo:
```bash
psql -U postgres -c "SELECT 1;"
```

### Error: "Database 'pape_pos' does not exist"
```bash
psql -U postgres -c "CREATE DATABASE pape_pos;"
```

### Error: Migraciones fallan
```bash
cd backend
npx prisma migrate reset --force
npx prisma migrate dev --name init
npx prisma db seed
```

### Error: Puerto 3001 ocupado
Cambia el puerto en `.env`:
```env
PORT=3002
```

### Error: CORS al acceder desde frontend
Verifica `FRONTEND_URL` en `.env` coincide con la URL del frontend.

## Comandos Úteis

```bash
# Reiniciar backend
cd backend && npm run dev

# Reiniciar frontend
cd frontend && npm run dev

# Ejecutar tests
cd backend && npm test

# Crear backup
call scripts\backup.bat

# Restaurar backup
call scripts\restore.bat

# Ejecutar migraciones
call scripts\migrate.bat

# Ejecutar seed
call scripts\seed.bat

# Ver logs del backend
cd backend && npm run dev
```

## Variables de Entorno Disponibles

| Variable | Default | Descripción |
|----------|---------|-------------|
| DATABASE_URL | - | URL de conexión PostgreSQL |
| PORT | 3001 | Puerto del backend |
| JWT_SECRET | dev-secret-change-me | Secreto para JWT |
| STORAGE_PATH | ./storage/products | Ruta de almacenamiento |
| BACKUP_PATH | ./database/backups | Ruta de backups |
| FRONTEND_URL | http://localhost:5173 | URL del frontend |
| NODE_ENV | development | Entorno |
