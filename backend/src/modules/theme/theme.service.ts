import { themeRepository } from './theme.repository';
import { emitThemeUpdate } from '../../shared/socket';
import { logAudit } from '../../shared/logger';

export interface ThemeMetadata {
  name: string;
  code: string;
  emojis: string[];
  description: string;
  colorAccents: {
    primary: string;
    secondary: string;
  };
}

export const HOLIDAY_THEMES: Record<string, ThemeMetadata> = {
  NORMAL: {
    name: 'Normal (Desa & Mata Air Gunung)',
    code: 'NORMAL',
    emojis: ['🟢', '🟡', '🔵'],
    description: 'Tema standar tenang dengan estetika Air Bening Gunung & Hijau Pedesaan.',
    colorAccents: { primary: '#3B7A57', secondary: '#EBF4F6' },
  },
  KEMERDEKAAN: {
    name: 'Hari Kemerdekaan RI (Agustus)',
    code: 'KEMERDEKAAN',
    emojis: ['🇮🇩', '🦅', '🔴', '⚪'],
    description: 'Nuansa merah putih patriotik merayakan HUT Republik Indonesia.',
    colorAccents: { primary: '#E25858', secondary: '#FFFFFF' },
  },
  RAMADAN: {
    name: 'Ramadan & Idul Fitri',
    code: 'RAMADAN',
    emojis: ['🌙', '🕌', '🤲', '🕋', '⭐'],
    description: 'Nuansa Islami yang damai dengan sentuhan hijau zamrud & emas.',
    colorAccents: { primary: '#1E5631', secondary: '#FFD23F' },
  },
  IMLEK: {
    name: 'Hari Raya Imlek',
    code: 'IMLEK',
    emojis: ['🏮', '🐉', '🧧', '🎇', '🍊'],
    description: 'Perayaan Tahun Baru Imlek dengan nuansa merah emas yang membawa keberuntungan.',
    colorAccents: { primary: '#C8102E', secondary: '#FFD23F' },
  },
  NATAL: {
    name: 'Hari Raya Natal',
    code: 'NATAL',
    emojis: ['🎄', '🎅', '❄️', '🔔', '🕯️'],
    description: 'Suasana kehangatan Natal dengan sentuhan hijau cemara & aksen salju.',
    colorAccents: { primary: '#165B33', secondary: '#F8B229' },
  },
  TAHUN_BARU: {
    name: 'Malam Tahun Baru',
    code: 'TAHUN_BARU',
    emojis: ['🎆', '🎇', '🥂', '🎊', '🌟'],
    description: 'Suasana kemeriahan malam pergantian tahun dengan kembang api & emas.',
    colorAccents: { primary: '#1E1E24', secondary: '#FFD23F' },
  },
};

export class ThemeService {
  async getActiveTheme() {
    let setting = await themeRepository.getThemeSetting();
    if (!setting) {
      setting = await themeRepository.upsertThemeSetting({ activeTheme: 'NORMAL' });
    }

    const metadata = HOLIDAY_THEMES[setting.activeTheme] || HOLIDAY_THEMES.NORMAL;

    return {
      activeTheme: setting.activeTheme,
      metadata,
      isAutoSchedule: setting.isAutoSchedule,
      scheduledStart: setting.scheduledStart,
      scheduledEnd: setting.scheduledEnd,
    };
  }

  async activateTheme(themeCode: string, performedBy = 'ADMIN') {
    if (!HOLIDAY_THEMES[themeCode]) {
      throw new Error(`Tema liburan ${themeCode} tidak dikenal.`);
    }

    const updated = await themeRepository.upsertThemeSetting({ activeTheme: themeCode });
    const metadata = HOLIDAY_THEMES[updated.activeTheme];

    logAudit('ACTIVATE_THEME', 'ThemeSetting', updated.id, performedBy, { activeTheme: themeCode });
    emitThemeUpdate(themeCode, metadata);

    return {
      activeTheme: updated.activeTheme,
      metadata,
      isAutoSchedule: updated.isAutoSchedule,
    };
  }

  async setSchedule(isAutoSchedule: boolean, scheduledStart?: string, scheduledEnd?: string, performedBy = 'ADMIN') {
    const updated = await themeRepository.upsertThemeSetting({
      isAutoSchedule,
      scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
    });

    logAudit('UPDATE_THEME_SCHEDULE', 'ThemeSetting', updated.id, performedBy, { isAutoSchedule, scheduledStart, scheduledEnd });

    return updated;
  }
}

export const themeService = new ThemeService();
