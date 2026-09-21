# Papelería POS

Sistema POS (Point of Sale) para papelería, desarrollado con Node.js, React y PostgreSQL.

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- [PostgreSQL](https://www.postgresql.org/) v14 o superior
- npm o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/eliezerc-c/pape-pos.git
cd pape-pos
```

### 2. Configurar variables de entorno

```bash
copy .env.example .env
```

Editar el archivo `.env` con tus datos de PostgreSQL:

```
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@localhost:5432/pape_pos
PORT=3001
JWT_SECRET=tu_clave_secreta_segura
STORAGE_PATH=./storage/products
BACKUP_PATH=./database/backups
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
BACKEND_URL=http://localhost:3001
ELECTRON_DEV=true
```

### 3. Instalar dependencias

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 4. Crear la base de datos

```bash
npm run migrate
npm run seed
```

### 5. Ejecutar la aplicación

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Estructura del Proyecto

```
papeleria-pos/
├── backend/          # API REST (Node.js + Express + Prisma)
├── frontend/         # Interfaz web (React + Vite + Tailwind)
├── electron/         # App de escritorio (Electron)
├── scripts/          # Scripts de utilería
└── docs/             # Documentación
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecutar backend y frontend en desarrollo |
| `npm run dev:backend` | Ejecutar solo el backend |
| `npm run dev:frontend` | Ejecutar solo el frontend |
| `npm run build` | Compilar para producción |
| `npm run migrate` | Ejecutar migraciones de BD |
| `npm run migrate:reset` | Resetear base de datos |
| `npm run seed` | Poblar base de datos con datos de prueba |

## Cuentas por Defecto

Tras ejecutar `npm run seed`, puedes iniciar sesión con:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| cajero | cajero123 | Cajero |

## Licencia

Proyecto privado.
