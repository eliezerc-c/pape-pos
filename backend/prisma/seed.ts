import { PrismaClient } from '@prisma/client';
import { hashSync } from '../src/shared/services/auth.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  console.log('[SEED] Conectado a la base de datos');

  const roles = [
    {
      name: 'ADMIN',
      description: 'Administrador del sistema con acceso completo',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        categories: ['create', 'read', 'update', 'delete'],
        brands: ['create', 'read', 'update', 'delete'],
        inventory: ['create', 'read', 'update', 'delete'],
        sales: ['create', 'read', 'update', 'delete'],
        returns: ['create', 'read', 'update', 'delete'],
        cashRegister: ['create', 'read', 'update', 'delete'],
        reports: ['read'],
        settings: ['create', 'read', 'update', 'delete'],
        backups: ['create', 'read', 'delete'],
        auth: ['login'],
      },
    },
    {
      name: 'CAJERO',
      description: 'Cajero con acceso a ventas y devoluciones',
      permissions: {
        users: [],
        products: ['read'],
        categories: ['read'],
        brands: ['read'],
        inventory: ['read'],
        sales: ['create', 'read'],
        returns: ['create', 'read'],
        cashRegister: ['create', 'read', 'update'],
        reports: [],
        settings: [],
        backups: [],
        auth: ['login'],
      },
    },
  ];

  for (const role of roles) {
    const existing = await prisma.role.findUnique({ where: { name: role.name } });
    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`[SEED] Rol creado: ${role.name}`);
    } else {
      await prisma.role.update({ where: { name: role.name }, data: role });
      console.log(`[SEED] Rol actualizado: ${role.name}`);
    }
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const cajeroRole = await prisma.role.findUnique({ where: { name: 'CAJERO' } });

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { name: 'Administrador', email: 'admin@papeleria.com', passwordHash: hashSync('admin123'), roleId: adminRole!.id, status: 'ACTIVE' },
    create: { name: 'Administrador', username: 'admin', email: 'admin@papeleria.com', passwordHash: hashSync('admin123'), roleId: adminRole!.id, status: 'ACTIVE' },
  });
  console.log(`[SEED] Usuario ADMIN creado: admin / admin123`);

  const cajeroUser = await prisma.user.upsert({
    where: { username: 'cajero' },
    update: { name: 'Cajero', email: 'cajero@papeleria.com', passwordHash: hashSync('cajero123'), roleId: cajeroRole!.id, status: 'ACTIVE' },
    create: { name: 'Cajero', username: 'cajero', email: 'cajero@papeleria.com', passwordHash: hashSync('cajero123'), roleId: cajeroRole!.id, status: 'ACTIVE' },
  });
  console.log(`[SEED] Usuario CAJERO creado: cajero / cajero123`);

  const categories = [
    { name: 'Cuadernos', description: 'Cuadernos de diferentes tamaños y rayas' },
    { name: 'Lapices', description: 'Lapices de grafito de varias durezas' },
    { name: 'Plumas', description: 'Plumas esfericas, filamentosas y de tinta' },
    { name: 'Marcadores', description: 'Marcadores de colores y para pizarra' },
    { name: 'Papeleria Escolar', description: 'Materiales de papeleria escolar variados' },
    { name: 'Organizadores', description: 'Carpetas, separadores y organizadores' },
    { name: 'Artesania', description: 'Materiales para manualidades y arte' },
    { name: 'Calculadoras', description: 'Calculadoras cientificas y basicas' },
    { name: 'Mochilas', description: 'Mochilas y bolsos escolares' },
    { name: 'Borradores', description: 'Borradores de lapiz y goma' },
    { name: 'Pegamento', description: 'Pegamento, cinta y materiales adhesivos' },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findUnique({ where: { name: cat.name } });
    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`[SEED] Categoria creada: ${cat.name}`);
    }
  }

  const brands = [
    { name: 'Faber-Castell', description: 'Material de escritura y tecnologia de calidad' },
    { name: 'Pilot', description: 'Plumas y marcadores de alta calidad' },
    { name: 'Staedtler', description: 'Instrumentos de dibujo y escritura' },
    { name: 'Moleskine', description: 'Cuadernos y agendas premium' },
    { name: 'BIC', description: 'Productos de escritura desechables' },
    { name: 'Sharpie', description: 'Marcadores permanentes y de pizarra' },
    { name: 'Maped', description: 'Material escolar y de oficina' },
    { name: 'Crayola', description: 'Materiales de arte y color para ninos' },
  ];

  for (const brand of brands) {
    const existing = await prisma.brand.findUnique({ where: { name: brand.name } });
    if (!existing) {
      await prisma.brand.create({ data: brand });
      console.log(`[SEED] Marca creada: ${brand.name}`);
    }
  }

  const categoryMap: Record<string, string> = {};
  const brandMap: Record<string, string> = {};
  const catList = await prisma.category.findMany();
  const brandList = await prisma.brand.findMany();
  catList.forEach(c => { categoryMap[c.name] = c.id; });
  brandList.forEach(b => { brandMap[b.name] = b.id; });

  const products = [
    { sku: 'CBA-001', barcode: '7891234560001', name: 'Cuaderno Universitario 100h', description: 'Cuaderno rayas universitario de 100 hojas', categoryId: categoryMap['Cuadernos'], brandId: brandMap['Faber-Castell'], unit: 'UNI', purchasePrice: 8.50, salePrice: 12.00, wholesalePrice: 10.00, stock: 150, stockMin: 10 },
    { sku: 'PEN-001', barcode: '7891234560002', name: 'Lapiz Grafito HB', description: 'Lapiz de grafito HB para escritura general', categoryId: categoryMap['Lapices'], brandId: brandMap['Staedtler'], unit: 'UNI', purchasePrice: 1.20, salePrice: 2.00, wholesalePrice: 1.50, stock: 500, stockMin: 50 },
    { sku: 'PLU-001', barcode: '7891234560003', name: 'Pluma Esferica Azul', description: 'Pluma esferica de tinta azul, punta 0.5mm', categoryId: categoryMap['Plumas'], brandId: brandMap['Pilot'], unit: 'UNI', purchasePrice: 3.50, salePrice: 5.50, wholesalePrice: 4.00, stock: 200, stockMin: 20 },
    { sku: 'MAR-001', barcode: '7891234560004', name: 'Marcador Permanente Negro', description: 'Marcador permanente punta fina, color negro', categoryId: categoryMap['Marcadores'], brandId: brandMap['Sharpie'], unit: 'UNI', purchasePrice: 4.00, salePrice: 6.50, wholesalePrice: 5.00, stock: 100, stockMin: 15 },
    { sku: 'PAP-001', barcode: '7891234560005', name: 'Set de 12 Colores de Lapices', description: 'Set con 12 colores de lapices de grafito', categoryId: categoryMap['Artesania'], brandId: brandMap['Faber-Castell'], unit: 'SET', purchasePrice: 15.00, salePrice: 22.00, wholesalePrice: 18.00, stock: 80, stockMin: 10 },
    { sku: 'ORG-001', barcode: '7891234560006', name: 'Carpeta A4 Argollas 200000', description: 'Carpeta de argollas A4 capacidad 200 hojas', categoryId: categoryMap['Organizadores'], brandId: brandMap['Maped'], unit: 'UNI', purchasePrice: 9.00, salePrice: 14.00, wholesalePrice: 11.00, stock: 120, stockMin: 15 },
    { sku: 'CAL-001', barcode: '7891234560007', name: 'Calculadora Cientifica FX-991', description: 'Calculadora cientifica con 417 funciones', categoryId: categoryMap['Calculadoras'], brandId: brandMap['Sharpie'], unit: 'UNI', purchasePrice: 25.00, salePrice: 35.00, wholesalePrice: 30.00, stock: 60, stockMin: 5 },
    { sku: 'BOR-001', barcode: '7891234560008', name: 'Borrador Profesional', description: 'Borrador de alta calidad para lapiz y tinta', categoryId: categoryMap['Borradores'], brandId: brandMap['Staedtler'], unit: 'UNI', purchasePrice: 1.50, salePrice: 2.50, wholesalePrice: 1.80, stock: 300, stockMin: 30 },
    { sku: 'PEG-001', barcode: '7891234560009', name: 'Pegamento en Barra 20g', description: 'Pegamento en barra no toxico para papeles', categoryId: categoryMap['Pegamento'], brandId: brandMap['Maped'], unit: 'UNI', purchasePrice: 3.00, salePrice: 5.00, wholesalePrice: 3.50, stock: 200, stockMin: 20 },
    { sku: 'MOC-001', barcode: '7891234560010', name: 'Mochila Escolar Grande', description: 'Mochila escolar con ruedas, gran capacidad', categoryId: categoryMap['Mochilas'], brandId: brandMap['BIC'], unit: 'UNI', purchasePrice: 45.00, salePrice: 65.00, wholesalePrice: 50.00, stock: 50, stockMin: 5 },
    { sku: 'MOC-002', barcode: '7891234560011', name: 'Marcador para Pizarra 4 colores', description: 'Set de 4 marcadores para pizarra con borrador', categoryId: categoryMap['Marcadores'], brandId: brandMap['Sharpie'], unit: 'SET', purchasePrice: 12.00, salePrice: 18.00, wholesalePrice: 14.00, stock: 80, stockMin: 10 },
    { sku: 'PLA-002', barcode: '7891234560012', name: 'Pluma Filamentosa Roja', description: 'Pluma filamentosa punta brush, color rojo', categoryId: categoryMap['Plumas'], brandId: brandMap['Pilot'], unit: 'UNI', purchasePrice: 4.50, salePrice: 7.00, wholesalePrice: 5.00, stock: 150, stockMin: 15 },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { sku: product.sku } });
    if (!existing) {
      await prisma.product.create({ data: product });
      console.log(`[SEED] Producto creado: ${product.name} (${product.sku})`);
    }
  }

  console.log('\n[SEED] ¡Semilla completada exitosamente!');
  console.log('[SEED] Usuarios: admin/admin123, cajero/cajero123');
  console.log(`[SEED] ${categories.length} categorias, ${brands.length} marcas, ${products.length} productos`);
}

main()
  .catch((e) => { console.error('[SEED ERROR]', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
