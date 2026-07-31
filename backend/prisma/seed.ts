import bcrypt from 'bcryptjs';
import { prisma } from '../src/shared/prisma/client';
import { logger } from '../src/shared/logger';

async function main() {
  logger.info('Starting clean enterprise database seeding for BUMDes Banyubening Platform...');

  // 1. AdminUser (Master Admin) - Required for Admin login
  const masterEmail = process.env.ADMIN_EMAIL || 'admin@bumdesbanyubening.id';
  const passwordHash = bcrypt.hashSync('BanyuBening2026!', 10);
  const pinHash = bcrypt.hashSync('1234567890', 10);

  await prisma.adminUser.upsert({
    where: { email: masterEmail },
    update: {
      passwordHash,
      pinHash,
      phone: process.env.ADMIN_WA_NUMBER || '081234567890',
    },
    create: {
      email: masterEmail,
      passwordHash,
      pinHash,
      phone: process.env.ADMIN_WA_NUMBER || '081234567890',
    },
  });
  logger.info('Master Admin user seeded successfully');

  // 2. Identity - Basic default identity without maps or public content
  await prisma.identity.deleteMany({});
  await prisma.identity.create({
    data: {
      name: 'BUMDes Banyubening',
      villageName: 'Desa Banyubening, Kecamatan Bejen, Kabupaten Temanggung, Jawa Tengah',
      logoUrl: '/images/logo-bumdes.svg',
      faviconUrl: '/favicon.ico',
      heroBackgroundUrl: '/images/hero-mountain-spring.jpg',
      address: 'Jl. Mata Air Bening No. 1, Desa Banyubening, Kec. Bejen, Kab. Temanggung 56258',
      phone: '081234567890',
      email: 'info@bumdesbanyubening.id',
      description:
        'Badan Usaha Milik Desa Banyubening - Mewujudkan Kemandirian Ekonomi Desa melalui Pengelolaan Mata Air Gunung yang Bersih dan Potensi Usaha Berkelanjutan.',
      mapsEmbedUrl: '',
    },
  });
  logger.info('Identity seeded successfully (Clean state without public maps)');

  // 3. ThemeSetting
  await prisma.themeSetting.deleteMany({});
  await prisma.themeSetting.create({
    data: {
      activeTheme: 'NORMAL',
      isAutoSchedule: true,
    },
  });
  logger.info('ThemeSetting seeded successfully');

  // 4. Ensure public data tables start 100% EMPTY (Zero sample/dummy data)
  await prisma.pengurus.deleteMany({});
  await prisma.runningText.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.programKerja.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.unitUsaha.deleteMany({});
  await prisma.pengaduanMessage.deleteMany({});
  logger.info('Public content tables reset to EMPTY [] state as required');

  // 5. Initial AuditLog
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      performedBy: 'SUPER_ADMIN_SEEDER',
      details: JSON.stringify({ message: 'Database initialized with clean zero-data state for BUMDes Banyubening' }),
    },
  });
  logger.info('Audit log seeded successfully');

  logger.info('Clean BUMDes Banyubening Database seeding COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    logger.error({ err: e }, 'Seed script error');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
