import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BUMDes BANYUBENING...');

  // Users
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@bumdes.id',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@bumdes.id',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Users created:', superAdmin.username, admin.username);

  // Identity
  await prisma.identity.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'BUMDes BANYUBENING',
      shortName: 'BUMDes',
      description: 'Badan Usaha Milik Desa Banyubening - Membangun Desa, Mensejahterakan Warga',
      address: 'Desa Banyubening, Kec. ... Kab. ...',
      phone: '0812-3456-7890',
      email: 'info@bumdes-banyubening.id',
      villageName: 'Banyubening',
      district: '... ',
      regency: '... ',
      province: 'Jawa Tengah',
    },
  });

  // Settings - PIN
  const pinHash = await bcrypt.hash('123456', 10);
  await prisma.setting.upsert({
    where: { key: 'PIN_HASH' },
    update: { value: pinHash },
    create: { key: 'PIN_HASH', value: pinHash, isSecret: true },
  });

  console.log('✅ Identity & PIN configured (default PIN: 123456)');

  // CoA Default
  const coaDefaults = [
    { code: '1-100', name: 'Kas & Bank', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1-101', name: 'Kas Tunai', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1-200', name: 'Piutang Usaha', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1-300', name: 'Persediaan Barang', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '1-400', name: 'Aset Tetap', type: 'ASSET', normalBalance: 'DEBIT' },
    { code: '2-100', name: 'Hutang Usaha', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '2-200', name: 'Hutang Lainnya', type: 'LIABILITY', normalBalance: 'CREDIT' },
    { code: '3-100', name: 'Modal Desa', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '3-200', name: 'Laba Ditahan', type: 'EQUITY', normalBalance: 'CREDIT' },
    { code: '4-100', name: 'Pendapatan Usaha Jasa', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '4-200', name: 'Pendapatan Perdagangan', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '4-300', name: 'Pendapatan Produksi', type: 'REVENUE', normalBalance: 'CREDIT' },
    { code: '5-100', name: 'Beban Operasional', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '5-200', name: 'Beban Gaji', type: 'EXPENSE', normalBalance: 'DEBIT' },
    { code: '5-300', name: 'Beban Lainnya', type: 'EXPENSE', normalBalance: 'DEBIT' },
  ];

  for (const coa of coaDefaults) {
    await prisma.coa.upsert({
      where: { code: coa.code },
      update: {},
      create: coa as any,
    });
  }

  console.log('✅ CoA seeded');

  // Running Text
  await prisma.runningText.createMany({
    data: [
      { text: 'Selamat Datang di Website Resmi BUMDes BANYUBENING 🎉', emoji: '🌊', order: 1, isActive: true },
      { text: 'Membangun Desa, Mensejahterakan Warga - Bersama BUMDes BANYUBENING 💙', emoji: '🏘️', order: 2, isActive: true },
      { text: 'Produk UMKM Desa Tersedia - Belanja Mudah & Murah 🛍️', emoji: '🛒', order: 3, isActive: true },
    ],
    skipDuplicates: true,
  });

  // Pengurus
  const pengurusData = [
    { name: 'Budi Santoso', role: 'DIREKTUR', roleLabel: 'Direktur', order: 1, bio: 'Direktur BUMDes Banyubening' },
    { name: 'Siti Aminah', role: 'SEKRETARIS_1', roleLabel: 'Sekretaris 1', order: 2 },
    { name: 'Ahmad Wijaya', role: 'SEKRETARIS_2', roleLabel: 'Sekretaris 2', order: 3 },
    { name: 'Dewi Lestari', role: 'BENDAHARA', roleLabel: 'Bendahara', order: 4 },
    { name: 'Joko Purnomo', role: 'MANAGER_JASA', roleLabel: 'Manager Jasa', order: 5 },
    { name: 'Rina Wati', role: 'MANAGER_PRODUKSI', roleLabel: 'Manager Produksi', order: 6 },
    { name: 'Agus Prasetyo', role: 'MANAGER_PERDAGANGAN', roleLabel: 'Manager Perdagangan', order: 7 },
  ];

  for (const p of pengurusData) {
    await prisma.pengurus.upsert({
      where: { id: `pengurus-${p.order}` },
      update: {},
      create: { id: `pengurus-${p.order}`, ...p } as any,
    });
  }

  console.log('✅ Pengurus seeded');

  // Sample Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Beras Organik Premium 5kg',
        slug: 'beras-organik-premium-5kg',
        description: 'Beras organik asli Desa Banyubening, tanpa pestisida, pulen dan wangi. Kualitas premium untuk keluarga sehat.',
        shortDesc: 'Beras organik premium pulen wangi',
        price: 75000,
        stock: 100,
        category: 'Produksi',
        sku: 'BR-ORG-5KG',
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Gula Aren Asli 1kg',
        slug: 'gula-aren-asli-1kg',
        description: 'Gula aren murni 100% tanpa campuran, manis alami, cocok untuk minuman dan kue.',
        shortDesc: 'Gula aren murni 100%',
        price: 35000,
        stock: 50,
        category: 'Perdagangan',
        sku: 'GL-AREN-1KG',
        isFeatured: true,
        isActive: true,
      },
      {
        name: 'Jasa Sewa Traktor',
        slug: 'jasa-sewa-traktor',
        description: 'Layanan sewa traktor untuk olah lahan sawah dengan operator berpengalaman.',
        shortDesc: 'Sewa traktor + operator',
        price: 500000,
        stock: 10,
        category: 'Jasa',
        sku: 'JASA-TRAK',
        isFeatured: true,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Products seeded');

  // Articles
  await prisma.article.createMany({
    data: [
      {
        title: 'BUMDes Banyubening Raih Penghargaan Desa Mandiri 2024',
        slug: 'bumdes-banyubening-raih-penghargaan-desa-mandiri-2024',
        excerpt: 'Banyubening berhasil meraih penghargaan desa mandiri tingkat kabupaten...',
        content: 'Lorem ipsum... Prestasi membanggakan diraih BUMDes Banyubening...',
        category: 'Berita',
        isPublished: true,
        publishedAt: new Date(),
      },
      {
        title: 'Program Kerja 2025: Fokus Pemberdayaan UMKM',
        slug: 'program-kerja-2025-fokus-pemberdayaan-umkm',
        excerpt: 'Tahun 2025 BUMDes Banyubening fokus pada pemberdayaan UMKM desa...',
        content: 'Program kerja 2025 telah disusun dengan fokus utama...',
        category: 'Program',
        isPublished: true,
        publishedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Articles seeded');

  // Program Kerja
  await prisma.programKerja.createMany({
    data: [
      {
        title: 'Pelatihan Digital Marketing UMKM 2025',
        slug: 'pelatihan-digital-marketing-umkm-2025',
        description: 'Program pelatihan untuk UMKM desa agar mampu memasarkan produk secara digital',
        category: 'Pemberdayaan',
        status: 'PLANNED',
        progress: 20,
        budget: 10000000,
        isPublished: true,
      },
      {
        title: 'Pembangunan Toko BUMDes',
        slug: 'pembangunan-toko-bumdes',
        description: 'Pembangunan toko fisik BUMDes untuk menampung produk UMKM',
        category: 'Infrastruktur',
        status: 'ONGOING',
        progress: 60,
        budget: 50000000,
        isPublished: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Program Kerja seeded');

  // Carousel
  await prisma.carouselItem.createMany({
    data: [
      { title: 'Selamat Datang di BUMDes Banyubening', imageUrl: '/uploads/carousel/welcome.jpg', order: 1, isActive: true },
      { title: 'Produk UMKM Unggulan', imageUrl: '/uploads/carousel/umkm.jpg', order: 2, isActive: true },
    ],
    skipDuplicates: true,
  });

  // Themes
  await prisma.themeConfig.createMany({
    data: [
      { type: 'DEFAULT', name: 'Default Ocean Blue', isActive: true, primaryColor: '#0ea5e9', secondaryColor: '#0284c7', accentColor: '#f97316' },
      { type: 'INDEPENDENCE_DAY', name: 'HUT RI Merah Putih', isActive: false, primaryColor: '#ef4444', secondaryColor: '#ffffff', accentColor: '#f59e0b' },
      { type: 'CHINESE_NEW_YEAR', name: 'Imlek Angpao', isActive: false, primaryColor: '#ef4444', secondaryColor: '#facc15', accentColor: '#f97316' },
      { type: 'RAMADAN_EID', name: 'Ramadan Kareem', isActive: false, primaryColor: '#22c55e', secondaryColor: '#facc15', accentColor: '#0ea5e9' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Themes seeded');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
