# Esquema de Base de Datos - Papeleria POS

## Resumen

Base de datos PostgreSQL con 17 tablas y 12 enumeraciones gestionadas por Prisma ORM.

## Modelos Principales

### Role
Tabla de roles con permisos granulares.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| name | String @unique | Nombre del rol (ADMIN, CAJERO) |
| description | String? | Descripción del rol |
| permissions | Json | Permisos del rol |
| createdAt | DateTime @default(now()) | Fecha de creación |
| updatedAt | DateTime @updatedAt | Fecha de actualización |

### User
Usuarios del sistema con autenticación por rol.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| name | String | Nombre completo |
| username | String @unique | Nombre de usuario |
| email | String? @unique | Correo electrónico |
| passwordHash | String | Hash bcrypt de la contraseña |
| roleId | String | Relación con Role |
| status | UserStatus | ACTIVE, INACTIVE, SUSPENDED |
| lastLogin | DateTime? | Último inicio de sesión |

### Category
Categorías de productos (11 categorías en seed).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| name | String @unique | Nombre de la categoría |
| description | String? | Descripción |
| status | Boolean @default(true) | Activa o inactiva |

### Brand
Marcas de productos (8 marcas en seed).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| name | String @unique | Nombre de la marca |
| description | String? | Descripción |
| status | Boolean @default(true) | Activa o inactiva |

### Product
Productos del inventario con precios multi-nivel.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| sku | String @unique | SKU del producto |
| barcode | String? @unique | Código de barras |
| name | String | Nombre del producto |
| description | String? | Descripción |
| categoryId | String | Relación con Category |
| brandId | String? | Relación con Brand |
| unit | String @default("UNI") | Unidad de medida |
| purchasePrice | Decimal(10,2) | Precio de compra |
| salePrice | Decimal(10,2) | Precio de venta |
| wholesalePrice | Decimal?(10,2) | Precio mayorista |
| stock | Int @default(0) | Stock actual |
| stockMin | Int @default(1) | Stock mínimo |
| stockMax | Int? | Stock máximo |
| location | String? | Ubicación en almacén |
| active | Boolean @default(true) | Producto activo |

### Sale
Ventas realizadas por usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| folio | String @unique | Número de folio |
| date | DateTime @default(now()) | Fecha de venta |
| userId | String | Vendedor |
| subtotal | Decimal(10,2) | Subtotal |
| discount | Decimal(10,2) @default(0) | Descuento |
| total | Decimal(10,2) | Total |
| amountPaid | Decimal(10,2) | Monto pagado |
| change | Decimal(10,2) | Cambio |
| paymentMethod | String @default("EFECTIVO") | Método de pago |
| status | SaleStatus | COMPLETED, CANCELLED |
| cashRegisterId | String? | Relación con caja |

### SaleItem
Items individuales de cada venta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| saleId | String | Relación con Sale |
| productId | String | Producto vendido |
| quantity | Int | Cantidad |
| unitPrice | Decimal(10,2) | Precio unitario |
| discount | Decimal(10,2) @default(0) | Descuento |
| subtotal | Decimal(10,2) | Subtotal del item |

### InventoryMove
Movimientos de inventario para trazabilidad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| productId | String | Producto afectado |
| type | MoveType | Tipo de movimiento |
| quantity | Int | Cantidad |
| stockBefore | Int | Stock antes del movimiento |
| stockAfter | Int | Stock después del movimiento |
| userId | String | Usuario que realizó el movimiento |
| reference | String? | Referencia externa |

### CashRegister
Registro de apertura/cierre de caja.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| userId | String | Usuario que abrió la caja |
| openDate | DateTime @default(now()) | Fecha de apertura |
| closeDate | DateTime? | Fecha de cierre |
| initialFund | Decimal(10,2) | Fondo inicial |
| expectedCash | Decimal(10,2) | Efectivo esperado |
| countedCash | Decimal? | Efectivo contado |
| difference | Decimal? | Diferencia |
| status | CashRegisterStatus | OPEN, CLOSED |
| salesCount | Int @default(0) | Número de ventas |

### Return
Devoluciones de productos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| saleId | String | Venta original |
| userId | String | Usuario que procesó la devolución |
| reason | String | Motivo |
| total | Decimal(10,2) | Monto total de devolución |
| status | ReturnStatus | PENDING, APPROVED, REJECTED |

### Payment
Pagos asociados a ventas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| saleId | String @unique | Relación con Sale |
| amount | Decimal(10,2) | Monto del pago |
| method | String @default("EFECTIVO") | Método de pago |
| change | Decimal(10,2) | Cambio |

### BusinessSettings
Configuración del negocio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| businessName | String @default("Papeleria") | Nombre del negocio |
| address | String? | Dirección |
| phone | String? | Teléfono |
| currency | String @default("PEN") | Moneda |
| taxRate | Decimal(5,2) @default(18) | Tasa de impuesto |
| folioPrefix | String @default("V") | Prefijo de folio |
| defaultStockMin | Int @default(1) | Stock mínimo por defecto |
| allowNegativeStock | Boolean @default(false) | Permitir stock negativo |

### AuditLog
Log de auditoría para trazabilidad completa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String @id @default(cuid()) | Identificador único |
| userId | String? | Usuario responsable |
| action | String | Acción realizada |
| entity | String? | Entidad afectada |
| entityId | String? | ID de la entidad |
| ip | String? | Dirección IP |
| details | Json? | Detalles adicionales |

## Enumeraciones

```
UserStatus:    ACTIVE, INACTIVE, SUSPENDED
MoveType:      ENTRADA, SALIDA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO,
               VENTA, MERMA, DAÑADO, DEVOLUCION_COMPRA, INVENTARIO_INICIAL, OTRO
SaleStatus:    COMPLETED, CANCELLED
CashRegisterStatus: OPEN, CLOSED
ReturnStatus:  PENDING, APPROVED, REJECTED
```

## Relaciones Clave

```
User → Role (ManyToOne)
User → Sale (OneToMany)
User → InventoryMove (OneToMany)
Product → Category (ManyToOne)
Product → Brand (ManyToOne)
Sale → SaleItem (OneToMany)
Sale → Payment (OneToOne)
Sale → Return (OneToMany)
InventoryMove → Product (ManyToOne)
InventoryMove → User (ManyToOne)
CashRegister → User (ManyToOne)
Return → Sale (ManyToOne)
Return → User (ManyToOne)
Return → ReturnItem (OneToMany)
```

## Índices

- `products`: name, sku, barcode, categoryId
- `sales`: date, userId, status, folio
- `inventory_moves`: productId, userId, type, createdAt
- `audit_logs`: userId, action, createdAt
- `returns`: saleId, userId
- `cash_register_movements`: cashRegisterId, userId
