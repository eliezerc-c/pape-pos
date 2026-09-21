# Arquitectura del Sistema Papeleria POS

## Visión General

Papeleria POS es un sistema de punto de venta construido como una aplicación de escritorio Electron con backend Express/Prisma y frontend React.

## Componentes Principales

### 1. Backend (Express + Prisma)
- **Runtime**: Node.js con TypeScript (ESM)
- **Framework**: Express 4.x
- **ORM**: Prisma Client con PostgreSQL
- **Autenticación**: JWT + bcrypt
- **Puerto**: 3001

```
┌─────────────────────────────────────────────┐
│              Backend (Express)               │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐  │
│  │ Auth    │  │ Products│  │ Sales       │  │
│  │ Module  │  │ Module  │  │ Module      │  │
│  └────┬────┘  └────┬────┘  └──────┬──────┘  │
│       │            │              │          │
│  ┌────▼────────────▼──────────────▼──────┐  │
│  │         Routes (Router)               │  │
│  └────────────────────┬─────────────────┘  │
│                       │                    │
│  ┌────────────────────▼─────────────────┐  │
│  │    Middleware (Auth, Validation)      │  │
│  └────────────────────┬─────────────────┘  │
│                       │                    │
│  ┌────────────────────▼─────────────────┐  │
│  │    Prisma Client → PostgreSQL        │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 2. Frontend (React + Vite)
- **Framework**: React 18
- **Build**: Vite
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **UI**: TailwindCSS + Lucide Icons
- **Puerto**: 5173

### 3. Electron (Desktop)
- **Main Process**: Electron main.ts
- **Preload Script**: contextBridge para seguridad
- **IPC Communication**: Mensajes seguros entre procesos
- **Features**: Menu system, Tray icon, Backup/Restore

## Patrón de Módulos

Cada módulo del backend sigue esta estructura:

```
src/modules/{module}/
├── routes.ts      # Definición de rutas Express
├── controller.ts  # Lógica de negocio
├── service.ts     # Servicios externos
└── types.ts       # Tipos TypeScript
```

## Flujo de Autenticación

```
1. Usuario envía credenciales (username/password)
2. Backend verifica usuario en BD
3. bcrypt compara password con hash
4. Si válido, genera JWT (24h)
5. Frontend almacena token en memoria
6. Cada petición incluye: Authorization: Bearer <token>
7. Middleware authenticate verifica token
8. requireRole verifica permisos del rol
```

## Flujo de Ventas

```
1. CAJERO inicia sesión
2. Abre registro de caja (CashRegister)
3. Agrega productos al carrito
4. Calcula subtotal, descuento, impuesto
5. Procesa pago (efectivo/transferencia)
6. Genera factura (folio)
7. Actualiza inventario (Stock)
8. Cierra registro de caja
```

## Estructura de Base de Datos

PostgreSQL con Prisma ORM:
- **Tablas de dominio**: users, roles, products, categories, brands
- **Tablas de transacción**: sales, sale_items, payments, returns
- **Tablas de auditoría**: audit_logs, inventory_moves
- **Tablas de configuración**: business_settings, cash_registers

## Comunicación Electron ↔ Backend

```
Electron Main Process
       │
       │ IPC (ipcMain/ipcRenderer)
       │
       ├──→ app:status     → Check backend health
       ├──→ app:backup     → Create database backup
       ├──→ app:restore    → Restore from backup
       ├──→ app:getTheme   → Get system theme
       └──→ app:openFile   → Open file dialog
```

## Seguridad

- **Context Isolation**: contextBridge expone solo API necesaria
- **nodeIntegration**: Deshabilitado en render process
- **Content Security Policy**: Configurado en backend
- **Rate Limiting**: 100 peticiones/15min por IP
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configurado para frontend específico
- **JWT**: Tokens con expiración de 24h
- **bcrypt**: Hash de contraseñas con 12 rondas

## Escalamiento Futuro

- Migración a microservicios por módulo
- WebSocket para notificaciones en tiempo real
- Redis para caching de sesiones
- Docker Compose para despliegue
- API REST pública para integraciones
