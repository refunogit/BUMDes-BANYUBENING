/**
 * Single source of truth for every pictogram in KASIRKU.
 * Icons are AI-generated flat-line PNGs (512x512, transparent) in assets/icon/.
 * `speaker` is the required running-text speaker asset (speaker.png).
 */
import type { ImageSourcePropType } from 'react-native';

export const appIcons = {
  // running text
  running_text: require('../../../assets/icon/running_text.png'),
  speaker: require('../../../assets/icon/speaker.png'),
  // auth
  login_gembok: require('../../../assets/icon/login_gembok.png'),
  register_upload: require('../../../assets/icon/register_upload.png'),
  // bottom nav
  nav_dashboard: require('../../../assets/icon/nav_dashboard.png'),
  nav_produk: require('../../../assets/icon/nav_produk.png'),
  nav_riwayat: require('../../../assets/icon/nav_riwayat.png'),
  nav_pengaturan: require('../../../assets/icon/nav_pengaturan.png'),
  btn_kasir: require('../../../assets/icon/btn_kasir.png'),
  // dashboard
  dash_theme: require('../../../assets/icon/dash_theme.png'),
  dash_kunci: require('../../../assets/icon/dash_kunci.png'),
  dash_menu_kasir: require('../../../assets/icon/dash_menu_kasir.png'),
  dash_menu_produk: require('../../../assets/icon/dash_menu_produk.png'),
  dash_menu_laporan: require('../../../assets/icon/dash_menu_laporan.png'),
  dash_menu_hutang: require('../../../assets/icon/dash_menu_hutang.png'),
  dash_menu_pengaturan: require('../../../assets/icon/dash_menu_pengaturan.png'),
  dash_stok_alert: require('../../../assets/icon/dash_stok_alert.png'),
  panah_naik: require('../../../assets/icon/panah_naik.png'),
  panah_turun: require('../../../assets/icon/panah_turun.png'),
  // kasir
  kasir_scan: require('../../../assets/icon/kasir_scan.png'),
  kasir_kalkulator: require('../../../assets/icon/kasir_kalkulator.png'),
  kasir_bayar: require('../../../assets/icon/kasir_bayar.png'),
  kasir_keranjang: require('../../../assets/icon/kasir_keranjang.png'),
  scanner_senter: require('../../../assets/icon/scanner_senter.png'),
  // produk
  produk_tambah: require('../../../assets/icon/produk_tambah.png'),
  produk_edit: require('../../../assets/icon/produk_edit.png'),
  produk_stok: require('../../../assets/icon/produk_stok.png'),
  produk_hapus: require('../../../assets/icon/produk_hapus.png'),
  produk_upload: require('../../../assets/icon/produk_upload.png'),
  // laporan & invoice
  laporan_pdf: require('../../../assets/icon/laporan_pdf.png'),
  laporan_csv: require('../../../assets/icon/laporan_csv.png'),
  invoice_buat: require('../../../assets/icon/invoice_buat.png'),
  // hutang
  hutang_add: require('../../../assets/icon/hutang_add.png'),
  hutang_lunas: require('../../../assets/icon/hutang_lunas.png'),
  hutang_list: require('../../../assets/icon/hutang_list.png'),
  // pengaturan
  set_akun: require('../../../assets/icon/set_akun.png'),
  set_ubah_pin: require('../../../assets/icon/set_ubah_pin.png'),
  set_printer: require('../../../assets/icon/set_printer.png'),
  set_backup: require('../../../assets/icon/set_backup.png'),
  set_invoice: require('../../../assets/icon/set_invoice.png'),
  set_logout: require('../../../assets/icon/set_logout.png'),
  set_darkmode: require('../../../assets/icon/set_darkmode.png'),
  set_cache: require('../../../assets/icon/set_cache.png'),
  storage_info: require('../../../assets/icon/storage_info.png'),
  // printer & PLN
  printer_scan: require('../../../assets/icon/printer_scan.png'),
  printer_test: require('../../../assets/icon/printer_test.png'),
  pln_upload: require('../../../assets/icon/pln_upload.png'),
  // navigation back (in-page back buttons)
  panah_kembali: require('../../../assets/icon/panah_kembali.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export type AppIconKey = keyof typeof appIcons;

export const APP_ICON_KEYS = Object.keys(appIcons) as AppIconKey[];

export function icon(key: AppIconKey): ImageSourcePropType {
  return appIcons[key];
}
