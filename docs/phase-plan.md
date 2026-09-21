# Plan de Fases - Papeleria POS

## Visión General

Desarrollo incremental del sistema POS en 6 fases, cada una con entregables y criterios de aceptación definidos.

---

## Fase 1: Fundamentos y Autenticación (Semanas 1-2)

### Objetivos
- Configurar la base de datos completa con Prisma
- Implementar autenticación JWT + bcrypt
- Crear esquema de roles y permisos

### Entregables
- [ ] Esquema Prisma actualizado y migraciones ejecutadas
- [ ] Seed con usuarios ADMIN y CAJERO
- [ ] Endpoint de login funcional
- [ ] Middleware de autenticación y autorización
- [ ] Estructura base del proyecto organizada

### Tareas
1. Definir modelos en `prisma/schema.prisma` (Role, User con permisos)
2. Crear migración inicial con `npx prisma migrate dev --name init`
3. Implementar `auth/routes.ts` con login, logout, sesion
4. Configurar `hashSync` con bcrypt en servicio de auth
5. Crear script de seed con usuarios administradores
6. Implementar `requireRole` middleware
7. Tests de autenticación (login exitoso/fallido, expiración token)

### Criterios de Aceptación
- ✅ ADMIN puede acceder a todos los endpoints
- ✅ CAJERO solo puede acceder a módulos de venta
- ✅ Login con credenciales incorrectas retorna 401
- ✅ Token JWT expira después de 24h
- ✅ Todos los endpoints protegidos requieren Bearer token

### Datos de Prueba
```
ADMIN: admin / admin123
CAJERO: cajero / cajero123
```

---

## Fase 2: Gestión de Productos y Catálogo (Semanas 3-4)

### Objetivos
- CRUD completo de productos, categorías y marcas
- Gestión de inventario básico
- Imágenes de productos

### Entregables
- [ ] CRUD de categorías con validación
- [ ] CRUD de marcas
- [ ] CRUD de productos con precios multi-nivel
- [ ] Sistema de imágenes de productos
- [ ] Movimientos de inventario (entrada/salida/ajuste)
- [ ] Búsqueda y filtros de productos
- [ ] Reportes de stock bajo

### Tareas
1. Crear `categories/routes.ts`, `brands/routes.ts`, `products/routes.ts`
2. Implementar validación con Zod para cada entidad
3. Crear `inventory/routes.ts` con movimiento de stock
4. Implementar `storage.ts` para gestión de imágenes
5. Crear índice de búsqueda por nombre/sku/barcode
6. Implementar endpoint de stock bajo
7. Tests de productos (crear, actualizar, eliminar, listar)
8. Tests de inventario (movimiento, ajuste)

### Criterios de Aceptación
- ✅ Se pueden crear 10+ productos con categorías y marcas
- ✅ El stock se actualiza correctamente al crear movimientos
- ✅ La búsqueda funciona por nombre, sku y barcode
- ✅ Los productos con stock bajo son visibles en reportes
- ✅ Los movimientos de inventario son trazables

---

## Fase 3: Sistema de Ventas (Semanas 5-6)

### Objetivos
- Flujo de venta completo (carrito → pago → ticket)
- Gestión de cajas (apertura/cierre)
- Generación de folios

### Entregables
- [ ] Creación de ventas con múltiples items
- [ ] Cálculo automático de subtotal, descuento, total, cambio
- [ ] Sistema de folios automáticos
- [ ] Gestión de cajas (abrir, cerrar, movimientos)
- [ ] Cancelación de ventas
- [ ] Generación de tickets/facturas

### Tareas
1. Crear `sales/routes.ts` con lógica de venta completa
2. Implementar generación de folios (`V-00001`, `V-00002`...)
3. Crear `payments/routes.ts` para procesar pagos
4. Implementar `cash-register/routes.ts` para caja
5. Crear lógica de cálculo: subtotal, descuento, impuesto, cambio
6. Implementar cancelación de ventas
7. Generar ticket PDF con jspdf
8. Tests de ventas (crear, cancelar, calcular cambio)
9. Tests de caja (abrir, cerrar, movimientos)

### Criterios de Aceptación
- ✅ Una venta puede tener múltiples items
- ✅ El cambio se calcula correctamente
- ✅ Los folios son únicos y secuenciales
- ✅ La caja se puede abrir y cerrar correctamente
- ✅ Las ventas canceladas se registran con motivo
- ✅ El ticket PDF se genera correctamente

---

## Fase 4: Devoluciones y Reportes (Semanas 7-8)

### Objetivos
- Proceso de devoluciones completo
- Reportes de ventas e inventario
- Dashboard de métricas

### Entregables
- [ ] Sistema de devoluciones (crear, aprobar, rechazar)
- [ ] Reporte de ventas por fecha, producto, categoría
- [ ] Reporte de ganancias
- [ ] Inventario general
- [ ] Dashboard con métricas clave
- [ ] Exportación a Excel/PDF

### Tareas
1. Crear `returns/routes.ts` con estados PENDING/APPROVED/REJECTED
2. Implementar `reports/routes.ts` con diferentes reportes
3. Crear endpoints de exportación Excel (xlsx)
4. Implementar dashboard con métricas:
   - Ventas del día/semana/mes
   - Productos más vendidos
   - Ingresos totales
   - Productos con stock bajo
5. Crear frontend para dashboard
6. Tests de devoluciones
7. Tests de reportes

### Criterios de Aceptación
- ✅ Se pueden crear devoluciones sobre ventas existentes
- ✅ Los reportes muestran datos correctos
- ✅ La exportación a Excel genera archivos válidos
- ✅ El dashboard muestra todas las métricas
- ✅ Los productos más vendidos se ordenan correctamente

---

## Fase 5: Electron y Escritorio (Semanas 9-10)

### Objetivos
- Empaquetar la aplicación como escritorio Electron
- Funcionalidades de escritorio (tray icon, backup/restore)
- Integración de backend con frontend

### Entregables
- [ ] Electron main.ts con BrowserWindow y menú
- [ ] Preload con contextBridge seguro
- [ ] Sistema de backup/restore integrado
- [ ] Tray icon con acceso rápido
- [ ] Menú de aplicación completo
- [ ] Build de .exe para Windows
- [ ] Configuración de electron-builder

### Tareas
1. Crear `electron/main.ts` con toda la funcionalidad
2. Crear `electron/preload.ts` con APIs expuestas
3. Implementar handlers IPC para backup/restore
4. Crear menú de aplicación (Archivo, Ver, Help)
5. Implementar tray icon
6. Configurar `electron-builder.json` para .exe
7. Crear `scripts/backup.bat`, `restore.bat`
8. Probar build con `electron-builder --win --dir`
9. Tests de integración Electron

### Criterios de Aceptación
- ✅ La aplicación inicia como escritorio
- ✅ El backend está embebido en la app
- ✅ Se puede crear backup desde la interfaz
- ✅ Se puede restaurar backup desde la interfaz
- ✅ El tray icon funciona correctamente
- ✅ El .exe se genera sin errores
- ✅ El menú de aplicación es funcional

---

## Fase 6: Producción y Optimización (Semanas 11-12)

### Objetivos
- Optimización de rendimiento
- Seguridad avanzada
- Documentación completa
- Despliegue y monitoreo

### Entregables
- [ ] Optimización de queries Prisma
- [ ] Seguridad reforzada (CSP, headers, rate limits)
- [ ] Logging completo
- [ ] Documentación actualizada
- [ ] Tests de integración completos
- [ ] Script de deploy
- [ ] Configuración de monitoreo

### Tareas
1. Optimizar queries con índices y eager loading
2. Reforzar seguridad (helmet, cors, rate limiting)
3. Implementar logging estructurado
4. Completar documentación de API
5. Crear script de deploy automatizado
6. Configurar monitoreo de errores
7. Optimizar bundle del frontend
8. Finalizar documentación de instalación
9. Revisión de código y fixes
10. Pruebas de carga y estrés

### Criterios de Aceptación
- ✅ Tiempo de respuesta < 200ms para endpoints principales
- ✅ Todos los endpoints tienen rate limiting activo
- ✅ La documentación está completa y actualizada
- ✅ Los tests cubren > 80% del código
- ✅ El .exe funciona en máquinas sin Node.js
- ✅ El backup/restore funciona en producción
- ✅ No hay vulnerabilidades de seguridad conocidas

---

## Cronograma Resumido

| Semana | Fase | Estado |
|--------|------|--------|
| 1-2 | Autenticación y Roles | ✅ Completada |
| 3-4 | Productos y Catálogo | ✅ Completada |
| 5-6 | Sistema de Ventas | ✅ Completada |
| 7-8 | Devoluciones y Reportes | ✅ Completada |
| 9-10 | Electron y Escritorio | 🔧 En Proceso |
| 11-12 | Producción y Optimización | 📋 Pendiente |

---

## Dependencias entre Fases

```
Fase 1 → Fase 2 (Productos necesitan autenticación)
Fase 2 → Fase 3 (Ventas necesitan productos)
Fase 3 → Fase 4 (Devoluciones necesitan ventas)
Fase 4 → Fase 5 (Electron necesita toda la API)
Fase 5 → Fase 6 (Producción necesita Electron completo)
```

---

## Recursos Necesarios

- **Desarrollador**: 1 persona, tiempo completo
- **Base de datos**: PostgreSQL 14+ en servidor o local
- **Herramientas**: VS Code, Git, PostgreSQL
- **Testing**: Jest, Supertest, Vitest, Playwright (opcional)
- **Build**: Node.js 18+, electron-builder
- **Despliegue**: Servidor VPS o máquina local

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Problemas con Prisma | Media | Alto | Documentación oficial, tests de migración |
| Errores de build .exe | Bajo | Alto | Probar en VM limpia, mantener backups |
| Incompatibilidad PostgreSQL | Baja | Medio | Usar versión 14+ explícitamente |
| CORS/Frontend bloqueos | Media | Alto | Configurar FRONTEND_URL correctamente |
| Problemas de memoria | Media | Medio | Monitorear, optimizar queries |
