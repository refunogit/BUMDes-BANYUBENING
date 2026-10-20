/** Canonical app_settings keys (single source of truth). */
export const SETTINGS_KEYS = {
  bumdesNama: 'bumdes_nama',
  userNamaLengkap: 'user_nama_lengkap',
  bumdesLogo: 'bumdes_logo',
  plnLogo: 'pln_logo',
  printerMac: 'printer_mac',
  printerPaperSize: 'printer_paper_size',
  printerAutoPrint: 'printer_auto_print',
  invoiceTemplate: 'invoice_template',
  invoices: 'invoices',
  invoiceCounter: 'invoice_counter',
  customUnits: 'custom_units',
  customCategories: 'custom_categories',
  lastCloseBookDate: 'last_close_book_date',
  qrisImage: 'qris_image',
  notifikasi: 'notifikasi',
  notifHistory: 'notif_history',
  notifSound: 'notif_sound',
  notifVibrate: 'notif_vibrate',
  notifTaskbar: 'notif_taskbar',
  notifSticky: 'notif_sticky',
  struk: 'struk',
  strukNama: 'struk_nama',
  strukAlamat: 'struk_alamat',
  strukTelp: 'struk_telp',
  strukFooter: 'struk_footer',
  strukCatatan: 'struk_catatan',
  strukLogo: 'struk_logo',
  strukQr: 'struk_qr',
  printerName: 'printer_name',
  printerConnectedAt: 'printer_connected_at',
  printerHistory: 'printer_history',
  printQueue: 'print_queue',
  testExtraSafe: 'test_extra_safe',
  lastCacheCleanDate: 'last_cache_clean_date',
  // accounting / v15
  customExpenseCategories: 'custom_expense_categories',
  lastAutoCloseBookDate: 'last_auto_close_book_date',
  initialCapital: 'initial_capital',
} as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS];

export const PRINT_PAPER = {
  mm58: '58',
  mm80: '80',
} as const;

export const CHAR_WIDTH: Record<string, number> = {
  '58': 32,
  '80': 48,
};
