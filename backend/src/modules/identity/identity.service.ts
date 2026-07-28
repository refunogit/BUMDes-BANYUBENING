import { prisma } from '../../config/database';
import { createAuditLog } from '../../lib/audit';
import { AppError } from '../../middlewares/error.middleware';

export const identityService = {
  async get() {
    let identity = await prisma.identity.findFirst();
    if (!identity) {
      identity = await prisma.identity.create({
        data: { name: 'BUMDes BANYUBENING' },
      });
    }
    return identity;
  },

  async update(data: any, files: any, userId?: string, ip?: string, userAgent?: string) {
    const existing = await this.get();
    const oldValue = { ...existing };

    const updateData: any = { ...data };

    if (files?.logo?.[0]) {
      updateData.logoUrl = files.logo[0].path || `/uploads/identity/${files.logo[0].filename}`;
    }
    if (files?.favicon?.[0]) {
      updateData.faviconUrl = files.favicon[0].path || `/uploads/identity/${files.favicon[0].filename}`;
    }

    // Normalize multer auto path if using local storage via service
    // Actually storage provider already handled via route; fallback
    const updated = await prisma.identity.update({
      where: { id: existing.id },
      data: updateData,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Identity',
      entityId: updated.id,
      oldValue,
      newValue: updated,
      ipAddress: ip,
      userAgent,
    });

    return updated;
  },

  async updateWithUrls(data: any, logoUrl?: string, faviconUrl?: string, userId?: string, ip?: string, userAgent?: string) {
    const existing = await this.get();
    const oldValue = { ...existing };

    const updateData: any = { ...data };
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (faviconUrl) updateData.faviconUrl = faviconUrl;

    const updated = await prisma.identity.update({
      where: { id: existing.id },
      data: updateData,
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Identity',
      entityId: updated.id,
      oldValue,
      newValue: updated,
      ipAddress: ip,
      userAgent,
    });

    return updated;
  },
};
