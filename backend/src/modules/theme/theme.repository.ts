import { prisma } from '../../shared/prisma/client';
import { ThemeSetting } from '@prisma/client';

export class ThemeRepository {
  async getThemeSetting(): Promise<ThemeSetting | null> {
    return prisma.themeSetting.findFirst();
  }

  async upsertThemeSetting(data: Partial<ThemeSetting>): Promise<ThemeSetting> {
    const existing = await this.getThemeSetting();
    if (existing) {
      return prisma.themeSetting.update({
        where: { id: existing.id },
        data,
      });
    }
    return prisma.themeSetting.create({
      data: {
        activeTheme: data.activeTheme || 'NORMAL',
        isAutoSchedule: data.isAutoSchedule ?? false,
        scheduledStart: data.scheduledStart || null,
        scheduledEnd: data.scheduledEnd || null,
      },
    });
  }
}

export const themeRepository = new ThemeRepository();
