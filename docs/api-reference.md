# Referencia de API - Papeleria POS

## Base URL

```
http://localhost:3001/api
```

## Autenticación

Todos los endpoints requieren autenticación excepto `/auth/login`.

### Headers

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Obtener Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "name": "Administrador",
    "username": "admin",
    "role": { "id": "def456", "name": "ADMIN" }
  }
}
```

### Verificar Sesión

```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

## Usuarios

### Listar Usuarios

```http
GET /api/users
Authorization: Bearer <token>
```

**Query Params:**
- `page` - Página (default: 1)
- `limit` - Limite de resultados (default: 20)
- `roleId` - Filtrar por rol
- `status` - Filtrar por estado

**Respuesta:**
```json
{
  "users": [...],
  "total": 2,
  "page": 1,
  "limit": 20
}
```

### Crear Usuario

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Juan Pérez",
  "username": "juanperez",
  "email": "juan@papeleria.com",
  "password": "secure123",
  "roleId": "abc123"
}
```

### Actualizar Usuario

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Juan Pérez Actualizado",
  "email": "juan_new@papeleria.com"
}
```

### Eliminar Usuario

```http
DELETE /api/users/:id
Authorization: Bearer <token>
```

---

## Productos

### Listar Productos

```http
GET /api/products
Authorization: Bearer <token>
```

**Query Params:**
- `categoryId` - Filtrar por categoría
- `brandId` - Filtrar por marca
- `search` - Buscar por nombre
- `active` - Filtrar por estado (true/false)
- `page`, `limit`

**Respuesta:**
```json
{
  "products": [...],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

### Crear Producto

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "NUE-001",
  "name": "Nuevo Producto",
  "categoryId": "cat123",
  "brandId": "brand456",
  "purchasePrice": 10.00,
  "salePrice": 15.00,
  "wholesalePrice": 12.00,
  "stock": 100,
  "stockMin": 10
}
```

### Actualizar Stock

```http
PATCH /api/products/:id/stock
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 50,
  "type": "ENTRADA",
  "notes": "Reabastecimiento"
}
```

### Eliminar Producto

```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

---

## Categorías

### Listar

```http
GET /api/categories
Authorization: Bearer <token>
```

### Crear

```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nueva Categoria",
  "description": "Descripción"
}
```

### Actualizar

```http
PUT /api/categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Categoria Actualizada",
  "description": "Nueva descripción"
}
```

### Eliminar

```http
DELETE /api/categories/:id
Authorization: Bearer <token>
```

---

## Marcas

### Listar

```http
GET /api/brands
Authorization: Bearer <token>
```

### Crear

```http
POST /api/brands
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nueva Marca",
  "description": "Descripción"
}
```

### Actualizar

```http
PUT /api/brands/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Marca Actualizada"
}
```

### Eliminar

```http
DELETE /api/brands/:id
Authorization: Bearer <token>
```

---

## Inventario

### Movimientos de Inventario

```http
GET /api/inventory/moves
Authorization: Bearer <token>
```

**Query Params:**
- `productId` - Filtrar por producto
- `type` - Tipo de movimiento
- `dateFrom`, `dateTo` - Rango de fechas

### Crear Movimiento

```http
POST /api/inventory/moves
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod123",
  "type": "ENTRADA",
  "quantity": 100,
  "reference": "PO-001",
  "notes": "Compra a proveedor"
}
```

### Ajuste de Stock

```http
POST /api/inventory/adjust
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "prod123",
  "newStock": 85,
  "reason": "Inventario físico"
}
```

### Reporte de Stock Bajo

```http
GET /api/inventory/low-stock
Authorization: Bearer <token>
```

---

## Ventas

### Crear Venta

```http
POST /api/sales
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "prod123",
      "quantity": 5,
      "unitPrice": 12.00,
      "discount": 0
    }
  ],
  "discount": 0,
  "amountPaid": 100.00,
  "paymentMethod": "EFECTIVO"
}
```

**Respuesta:**
```json
{
  "sale": {
    "id": "sale123",
    "folio": "V-00001",
    "subtotal": 60.00,
    "total": 60.00,
    "amountPaid": 100.00,
    "change": 40.00,
    "status": "COMPLETED"
  },
  "items": [...]
}
```

### Listar Ventas

```http
GET /api/sales
Authorization: Bearer <token>
```

**Query Params:**
- `dateFrom`, `dateTo` - Rango de fechas
- `status` - COMPLETED, CANCELLED
- `userId` - Filtrar por vendedor
- `page`, `limit`

### Obtener Venta

```http
GET /api/sales/:id
Authorization: Bearer <token>
```

### Cancelar Venta

```http
PATCH /api/sales/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Error en la transacción"
}
```

### Resumen de Ventas

```http
GET /api/sales/summary
Authorization: Bearer <token>

Query Params:
  dateFrom: 2024-01-01
  dateTo: 2024-01-31
```

---

## Devoluciones

### Crear Devolución

```http
POST /api/returns
Authorization: Bearer <token>
Content-Type: application/json

{
  "saleId": "sale123",
  "items": [
    {
      "productId": "prod123",
      "quantity": 2,
      "reason": "Producto defectuoso"
    }
  ],
  "reason": "Defecto de fábrica"
}
```

### Listar Devoluciones

```http
GET /api/returns
Authorization: Bearer <token>
```

### Actualizar Estado

```http
PATCH /api/returns/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED"
}
```

---

## Caja

### Abrir Caja

```http
POST /api/cash-register/open
Authorization: Bearer <token>
Content-Type: application/json

{
  "initialFund": 500.00
}
```

### Cerrar Caja

```http
POST /api/cash-register/close
Authorization: Bearer <token>
Content-Type: application/json

{
  "countedCash": 1250.00
}
```

### Movimientos de Caja

```http
POST /api/cash-register/movements
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "INGRESO",
  "amount": 100.00,
  "reference": "VENTA-001",
  "notes": "Venta de producto"
}
```

### Estado de Caja Abierta

```http
GET /api/cash-register/open
Authorization: Bearer <token>
```

---

## Reportes

### Ventas por Fecha

```http
GET /api/reports/sales-by-date
Authorization: Bearer <token>
Query Params:
  dateFrom: 2024-01-01
  dateTo: 2024-01-31
```

### Ventas por Producto

```http
GET /api/reports/sales-by-product
Authorization: Bearer <token>
Query Params:
  dateFrom: 2024-01-01
  dateTo: 2024-01-31
  limit: 20
```

### Ventas por Categoría

```http
GET /api/reports/sales-by-category
Authorization: Bearer <token>
Query Params:
  dateFrom: 2024-01-01
  dateTo: 2024-01-31
```

### Inventario General

```http
GET /api/reports/inventory
Authorization: Bearer <token>
```

### Ganancias por Periodo

```http
GET /api/reports/profitability
Authorization: Bearer <token>
Query Params:
  dateFrom: 2024-01-01
  dateTo: 2024-01-31
```

---

## Configuración

### Obtener Configuración

```http
GET /api/settings
Authorization: Bearer <token>
```

### Actualizar Configuración

```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "businessName": "Nuevo Nombre",
  "taxRate": 18,
  "currency": "PEN",
  "allowNegativeStock": false
}
```

---

## Backups

### Crear Backup

```http
POST /api/backups
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Backup completado",
  "path": "/backups/backup-2024-01-15.sql"
}
```

### Listar Backups

```http
GET /api/backups
Authorization: Bearer <token>
```

### Restaurar Backup

```http
POST /api/backups/restore
Authorization: Bearer <token>
Content-Type: application/json

{
  "filePath": "/backups/backup-2024-01-15.sql"
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Datos inválidos |
| 401 | Token requerido o inválido |
| 403 | Sin permisos |
| 404 | Recurso no encontrado |
| 409 | Registro duplicado |
| 500 | Error interno del servidor |

## Límites de Rate

- 100 peticiones por 15 minutos por IP
- 5 peticiones por segundo para `/auth/login`
- Sin límite para `/health`
