import { prisma } from '../../shared/prisma/client';
import { Identity } from '@prisma/client';

export class IdentityRepository {
  async getIdentity(): Promise<Identity | null> {
    return prisma.identity.findFirst();
  }

  async upsertIdentity(data: Partial<Identity>): Promise<Identity> {
    const existing = await this.getIdentity();
    if (existing) {
      return prisma.identity.update({
        where: { id: existing.id },
        data,
      });
    }
    return prisma.identity.create({
      data: {
        name: data.name || 'BUMDes Banyubening',
        villageName: data.villageName || 'Desa Banyubening, Bejen, Temanggung',
        logoUrl: data.logoUrl || '/images/logo-bumdes.svg',
        faviconUrl: data.faviconUrl || '/favicon.ico',
        heroBackgroundUrl: data.heroBackgroundUrl || '/images/hero-mountain-spring.jpg',
        address: data.address || 'Jl. Mata Air Bening No. 1, Desa Banyubening, Bejen, Temanggung, Jawa Tengah',
        phone: data.phone || '081234567890',
        email: data.email || 'info@bumdesbanyubening.id',
        description: data.description || 'Badan Usaha Milik Desa Banyubening - Mengelola Mata Air Bening Gunung dan Potensi Ekonomi Desa Berkelanjutan.',
        mapsEmbedUrl: data.mapsEmbedUrl || '',
      },
    });
  }
}

export const identityRepository = new IdentityRepository();
