import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../config/pino';

// Auto-activate theme based on date
export function initThemeCron() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const date = now.getDate();

      // Independence Day: August
      if (month === 8) {
        await activateTheme('INDEPENDENCE_DAY');
      }
      // Chinese New Year: Jan-Feb (simplified check - would need lunar calendar in production)
      else if (month === 1 || month === 2) {
        // Check if near CN y - for demo, keep default
      }
      // Ramadan/Eid: Dynamic based on hijri - simplified to check config dates
      else {
        // Check theme configs with date ranges
        const themes = await prisma.themeConfig.findMany({
          where: {
            startDate: { lte: now },
            endDate: { gte: now },
          },
        });
        if (themes.length > 0) {
          for (const theme of themes) {
            await activateTheme(theme.type);
          }
        } else {
          await activateTheme('DEFAULT');
        }
      }

      logger.info('Theme cron checked');
    } catch (error) {
      logger.error({ error }, 'Theme cron failed');
    }
  });

  logger.info('🎨 Theme cron scheduled daily');
}

async function activateTheme(type: any) {
  await prisma.themeConfig.updateMany({ data: { isActive: false } });
  await prisma.themeConfig.update({ where: { type }, data: { isActive: true } }).catch(async () => {
    // Create if not exists
    await prisma.themeConfig.create({
      data: {
        type,
        name: type,
        isActive: true,
      },
    });
  });
  logger.info({ type }, `Theme activated: ${type}`);
}
