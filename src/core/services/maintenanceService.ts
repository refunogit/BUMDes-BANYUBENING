/**
 * Startup maintenance: automatic cache clean once per calendar day and the
 * automatic monthly book closing (WIB) that replaced the manual button.
 */
import { getSetting, setSetting } from '@/data/repositories/settingsRepository';
import { SETTINGS_KEYS } from '@/core/constants/settingsKeys';
import { getIncomeStatement, logBookClosing } from '@/data/repositories/accountingRepository';
import { dailyCacheClean, type DailyCleanResult } from './storageService';
import { writeLog } from './logService';
import { toDateKey } from '@/core/utils/date';

const HOUR = 60 * 60 * 1000;

export function wibParts(now = new Date()): { year: number; month: number; day: number } {
  const wib = new Date(now.getTime() + 7 * HOUR);
  return { year: wib.getUTCFullYear(), month: wib.getUTCMonth() + 1, day: wib.getUTCDate() };
}

export type AutoCloseResult = { closed: boolean; monthKey?: string };

export async function autoCloseBookIfNeeded(): Promise<AutoCloseResult> {
  const now = new Date();
  const { year, month } = wibParts(now);
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const last = await getSetting(SETTINGS_KEYS.lastAutoCloseBookDate);
  const lastThrottle = await getSetting(`${SETTINGS_KEYS.lastAutoCloseBookDate}_throttle`);
  if (lastThrottle && now.getTime() - Number(lastThrottle) < HOUR) return { closed: false };
  await setSetting(`${SETTINGS_KEYS.lastAutoCloseBookDate}_throttle`, String(now.getTime()));
  if (last && last.startsWith(monthKey)) return { closed: false };
  if (!last) {
    await setSetting(SETTINGS_KEYS.lastAutoCloseBookDate, toDateKey(now));
    return { closed: false };
  }
  const statement = await getIncomeStatement();
  await logBookClosing({
    closingDate: toDateKey(now),
    grossProfit: statement.grossProfit,
    netProfit: statement.netProfit,
    totalExpenses: statement.expenses,
    totalRevenue: statement.revenue,
  });
  await setSetting(SETTINGS_KEYS.lastAutoCloseBookDate, now.toISOString());
  await setSetting(SETTINGS_KEYS.lastCloseBookDate, now.toISOString());
  writeLog('maintenance', `auto close book ${monthKey}`);
  return { closed: true, monthKey };
}

export async function runStartupMaintenance(): Promise<{ cache: DailyCleanResult; autoClose: AutoCloseResult }> {
  const cache = await dailyCacheClean();
  const autoClose = await autoCloseBookIfNeeded();
  return { cache, autoClose };
}
