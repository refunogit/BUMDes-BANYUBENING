/* eslint-disable */
/**
 * BUMDes POS — icon manifest generator.
 *
 * Draws every icon of the app manifest as a flat-line pictogram on a 24x24
 * design grid, then rasterizes it to a transparent 512x512 PNG using librsvg
 * (via sharp). Consistent stroke weight (2.1 on the 24 grid => 44.8 px at
 * 512), rounded caps, and the official palette:
 *   navy #0C3B6E | blue #2F86D1 | gold #D8A93E | red #D64545
 *
 * Output: assets/icon/{key}.png (512x512, transparent)
 * Launcher: assets/iconaplikasi.png (152x152) — storefront mark.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets', 'icon');
const NAVY = '#0C3B6E';
const BLUE = '#2F86D1';
const GOLD = '#D8A93E';
const RED = '#D64545';
const SIZE = 512;
const GRID = 24;

const P = (d, color = NAVY, w = 2.1, extra = '') =>
  `<path d="${d}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const C = (cx, cy, r, color = NAVY, w = 2.1, fill = 'none') =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${color}" stroke-width="${w}"/>`;
const R = (x, y, wd, ht, color = NAVY, w = 2.1, rx = 1.6, fill = 'none') =>
  `<rect x="${x}" y="${y}" width="${wd}" height="${ht}" rx="${rx}" fill="${fill}" stroke="${color}" stroke-width="${w}"/>`;
const L = (x1, y1, x2, y2, color = NAVY, w = 2.1) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
const DOT = (cx, cy, r = 0.9, color = NAVY) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;

const icons = {
  running_text: [
    P('M4 9.5h3l4-3.5v12l-4-3.5H4z', BLUE, 2, `fill="${BLUE}"`),
    P('M14.5 8.5a5 5 0 0 1 0 7', NAVY),
    P('M17.3 6.4a8.6 8.6 0 0 1 0 11.2', GOLD),
    P('M20 4.6a12 12 0 0 1 0 14.8', NAVY, 1.8),
  ],
  login_gembok: [
    P('M7.2 10.5V8a4.8 4.8 0 0 1 9.6 0v2.5', NAVY),
    R(4.6, 10.5, 14.8, 9.8, BLUE, 2.1, 2.2),
    C(12, 14.7, 1.4, GOLD, 1.8, GOLD),
    L(12, 15.9, 12, 17.5, GOLD, 1.8),
    L(6.6, 12.2, 8.2, 12.2, GOLD, 1.6),
  ],
  register_upload: [
    P('M6.5 17.5A4 4 0 0 1 6.8 9.6a5.5 5.5 0 0 1 10.5 1.1 3.6 3.6 0 0 1 .4 7.1', BLUE),
    L(12, 20.5, 12, 11.2, NAVY),
    P('M8.6 14.2 12 10.8l3.4 3.4', GOLD, 2.2),
    L(8, 21, 16, 21, NAVY, 1.8),
  ],
  nav_dashboard: [
    P('M3.8 10.6 12 3.8l8.2 6.8v8.6a1.6 1.6 0 0 1-1.6 1.6H5.4a1.6 1.6 0 0 1-1.6-1.6z', BLUE),
    R(9.4, 13.5, 5.2, 7.3, GOLD, 1.8, 1.2),
    L(16.2, 9.2, 16.2, 10.2, GOLD, 1.8),
  ],
  nav_produk: [
    P('M12 3.2 20.4 7.6v8.8L12 20.8 3.6 16.4V7.6z', NAVY),
    P('M3.6 7.6 12 12l8.4-4.4M12 12v8.8', BLUE),
    L(7.8, 5.4, 16.2, 9.8, GOLD, 1.9),
  ],
  nav_riwayat: [
    C(12, 12, 8.6, BLUE),
    L(12, 7.4, 12, 12, GOLD, 2.3),
    L(12, 12, 15.6, 14, NAVY, 2.3),
    DOT(12, 12, 1.2, NAVY),
    P('M3.4 7.5 3.4 3.6 7.3 3.6', GOLD, 1.8),
  ],
  nav_pengaturan: [
    P('M10.3 3.6h3.4l.5 2.2 2 .9 2-1.1 2.4 2.4-1.1 2 .9 2 2.2.5v3.4l-2.2.5-.9 2 1.1 2-2.4 2.4-2-1.1-2 .9-.5 2.2h-3.4l-.5-2.2-2-.9-2 1.1-2.4-2.4 1.1-2-.9-2-2.2-.5v-3.4l2.2-.5.9-2-1.1-2L5.8 6.9l2 1.1 2-.9z', NAVY, 1.9),
    C(12, 12.6, 3.1, GOLD, 2),
  ],
  btn_kasir: [
    P('M3.2 5.2h2.4l2.2 9.6h9.8l2-7.2H7.1', BLUE),
    C(9.4, 18.6, 1.5, NAVY, 1.9),
    C(17.2, 18.6, 1.5, NAVY, 1.9),
    C(15.4, 9.4, 1.15, GOLD, 1.2, GOLD),
    P('M13.8 8.2 11 11l2.8 2.8', GOLD, 1.7),
  ],
  dash_theme: [
    C(9.2, 9.2, 4.4, GOLD, 2),
    L(9.2, 2.4, 9.2, 4.1, GOLD, 1.8),
    L(9.2, 14.3, 9.2, 16, GOLD, 1.8),
    L(2.4, 9.2, 4.1, 9.2, GOLD, 1.8),
    L(14.3, 9.2, 16, 9.2, GOLD, 1.8),
    L(4.4, 4.4, 5.6, 5.6, GOLD, 1.8),
    L(12.8, 12.8, 14, 14, GOLD, 1.8),
    P('M17.2 12.8a6.4 6.4 0 1 0 5 7.9 6.9 6.9 0 0 1-5-7.9z', BLUE),
    DOT(18.6, 5.4, 1.1, NAVY),
    DOT(21.2, 8.2, 0.8, NAVY),
  ],
  dash_kunci: [
    R(4.2, 4.2, 13.2, 16.6, BLUE, 2, 1.8),
    L(4.2, 8.6, 17.4, 8.6, NAVY, 1.9),
    L(17.4, 8.6, 19.6, 6.4, GOLD, 1.9),
    L(16.2, 8.6, 16.2, 12, NAVY, 1.6),
    P('M8.4 12.2v-1.4a2.4 2.4 0 0 1 4.8 0v1.4', NAVY, 1.7),
    R(7.4, 12.2, 6.8, 5.2, GOLD, 1.7, 1.2),
    DOT(10.8, 14.8, 0.9, NAVY),
  ],
  dash_menu_kasir: [
    P('M2.8 6.2h2.6l2.2 9h9.6l2.2-6.8H7.4', BLUE),
    C(9, 19, 1.3, NAVY, 1.8),
    C(16.4, 19, 1.3, NAVY, 1.8),
    L(17.8, 4.2, 20.6, 4.2, GOLD, 2),
    P('M19 5.6 21.6 8.2 19 10.8', GOLD, 2),
  ],
  dash_menu_produk: [
    P('M12 2.8 20.6 7.2v9.2L12 20.8 3.4 16.4V7.2z', BLUE),
    P('M3.4 7.2 12 11.6l8.6-4.4M12 11.6v9.2', NAVY, 1.9),
    R(9.2, 14.6, 5.6, 2.2, GOLD, 1.4, 0.8),
  ],
  dash_menu_laporan: [
    P('M6.2 3.2h8.4l4.4 4.4v13.2H6.2z', NAVY, 2),
    P('M14.2 3.2v4.8h4.8', BLUE, 1.9),
    R(8.6, 14.2, 2, 4.4, GOLD, 1.1, 0.5, GOLD),
    R(11.8, 11.2, 2, 7.4, BLUE, 1.1, 0.5, BLUE),
    R(15, 13, 2, 5.6, NAVY, 1.1, 0.5, NAVY),
  ],
  dash_menu_hutang: [
    C(9.2, 7.6, 3.4, NAVY, 1.9),
    P('M3.2 19.2a6 6 0 0 1 12 0', BLUE),
    C(17.4, 15.8, 2.1, GOLD, 1.6, GOLD),
    C(17.4, 15.8, 2.1, GOLD, 1.6),
    L(17.4, 14.3, 17.4, 15.8, NAVY, 1.2),
    L(17.4, 15.8, 18.6, 16.6, NAVY, 1.2),
    C(19.4, 9.2, 1.8, BLUE, 1.6),
  ],
  dash_menu_pengaturan: [
    L(4, 7.2, 20, 7.2, NAVY, 1.9),
    C(9, 7.2, 2.2, BLUE, 1.9, '#FFFFFF'),
    L(4, 12, 20, 12, NAVY, 1.9),
    C(15.4, 12, 2.2, GOLD, 1.9, '#FFFFFF'),
    L(4, 16.8, 20, 16.8, NAVY, 1.9),
    C(11, 16.8, 2.2, BLUE, 1.9, '#FFFFFF'),
  ],
  dash_stok_alert: [
    P('M12 2.8 21 7.2v9.2L12 20.8 3 16.4V7.2z', BLUE, 1.9),
    P('M3 7.2 12 11.6l9-4.4M12 11.6v9.2', NAVY, 1.7),
    P('M17.4 2.4 22 10.4h-9.2z', RED, 1.8, 'fill="#FFFFFF"'),
    L(17.4, 5.2, 17.4, 7.6, RED, 1.7),
    DOT(17.4, 9.1, 0.8, RED),
  ],
  panah_naik: [
    L(12, 20, 12, 5, BLUE, 2.3),
    P('M5.6 11.4 12 5l6.4 6.4', BLUE, 2.3),
    P('M5 21h14', GOLD, 2.2),
    DOT(12, 3.4, 1, GOLD),
  ],
  panah_turun: [
    L(12, 4, 12, 19, RED, 2.3),
    P('M5.6 12.6 12 19l6.4-6.4', RED, 2.3),
    P('M5 3h14', GOLD, 2.2),
    DOT(12, 20.6, 1, GOLD),
  ],
  kasir_scan: [
    L(3.6, 8, 3.6, 4.4, NAVY, 2.2),
    L(3.6, 4.4, 7.2, 4.4, NAVY, 2.2),
    L(20.4, 8, 20.4, 4.4, NAVY, 2.2),
    L(20.4, 4.4, 16.8, 4.4, NAVY, 2.2),
    L(3.6, 16, 3.6, 19.6, NAVY, 2.2),
    L(3.6, 19.6, 7.2, 19.6, NAVY, 2.2),
    L(20.4, 16, 20.4, 19.6, NAVY, 2.2),
    L(20.4, 19.6, 16.8, 19.6, NAVY, 2.2),
    L(5.6, 9.4, 5.6, 14.6, BLUE, 1.8),
    L(8.4, 8.6, 8.4, 15.4, NAVY, 1.8),
    L(11.2, 10, 11.2, 14, BLUE, 1.8),
    L(14, 8.6, 14, 15.4, NAVY, 1.8),
    L(16.8, 9.4, 16.8, 14.6, BLUE, 1.8),
    L(18.8, 12, 23, 12, GOLD, 1.8),
  ],
  kasir_kalkulator: [
    R(5, 2.8, 14, 18.4, NAVY, 2, 2.2),
    R(7.4, 5.4, 9.2, 3.4, BLUE, 1.6, 0.8),
    ...[
      [8.2, 12.2],
      [12, 12.2],
      [15.8, 12.2],
      [8.2, 15.6],
      [12, 15.6],
      [15.8, 15.6],
      [8.2, 19],
      [12, 19],
    ].map(([x, y]) => DOT(x, y, 0.9, GOLD)),
    DOT(15.8, 19, 0.9, RED),
  ],
  kasir_bayar: [
    R(2.8, 6.6, 18.4, 10.8, BLUE, 2, 1.6),
    C(12, 12, 3.2, NAVY, 1.8),
    C(12, 12, 1.1, GOLD, 1.2, GOLD),
    L(5.6, 9.4, 7.2, 9.4, NAVY, 1.4),
    L(16.8, 14.6, 18.4, 14.6, NAVY, 1.4),
    C(19.8, 19.4, 2, GOLD, 1.7, GOLD),
  ],
  kasir_keranjang: [
    P('M3.2 4.6h2.8l2.4 10.6h9.8', NAVY, 2.1),
    P('M6.8 7.8h14l-1.7 6.6H8.3', BLUE, 2.1),
    L(9.4, 15.2, 8.4, 18.2, NAVY, 1.8),
    L(15.6, 15.2, 16.6, 18.2, NAVY, 1.8),
    L(8, 19.6, 9.6, 19.6, GOLD, 1.8),
    L(15.4, 19.6, 17, 19.6, GOLD, 1.8),
    P('M11 11.2h5', GOLD, 1.8),
  ],
  scanner_senter: [
    P('M9 3.4h6l1.4 6.2h-8.8z', NAVY, 1.9),
    R(6.2, 9.6, 11.6, 11.2, BLUE, 2, 1.6),
    L(12, 14.4, 12, 19.6, NAVY, 2),
    P('M8 20.6h8', GOLD, 2),
    P('M17.6 4.2 20.4 2M19 7.2l2.8-.6M16.6 2.2l.6 2.6', GOLD, 1.7),
  ],
  produk_tambah: [
    P('M12 3.6 20.2 7.8v8.4L12 20.4 3.8 16.2V7.8z', BLUE),
    P('M3.8 7.8 12 12l8.2-4.2M12 12v8.4', NAVY, 1.8),
    C(17.8, 17.2, 4, GOLD, 1.9, '#FFFFFF'),
    L(17.8, 15.2, 17.8, 19.2, GOLD, 1.9),
    L(15.8, 17.2, 19.8, 17.2, GOLD, 1.9),
  ],
  produk_edit: [
    P('M4 16.6 16.8 3.8l3.4 3.4L7.4 20H4z', GOLD, 2),
    L(14.8, 5.8, 18.2, 9.2, NAVY, 1.7),
    L(4.6, 20.4, 8.4, 20.4, BLUE, 1.7),
    L(15.6, 20.4, 20, 20.4, NAVY, 1.7),
  ],
  produk_stok: [
    R(3.4, 9.4, 7.4, 6.4, BLUE, 1.9, 1.2),
    R(13.2, 9.4, 7.4, 6.4, NAVY, 1.9, 1.2),
    R(8.3, 3.2, 7.4, 5.4, GOLD, 1.9, 1.2),
    L(12, 15.8, 12, 20.8, NAVY, 2),
    P('M9.2 18.2 12 21l2.8-2.8', GOLD, 2),
  ],
  produk_hapus: [
    R(6.4, 7.2, 11.2, 13.8, RED, 2, 1.6),
    L(4.2, 6.2, 19.8, 6.2, RED, 2.2),
    P('M9.2 6V4.2h5.6V6', NAVY, 1.8),
    L(10, 11, 10, 17, NAVY, 1.7),
    L(14, 11, 14, 17, NAVY, 1.7),
    L(9, 21, 15, 21, GOLD, 1.6),
  ],
  produk_upload: [
    R(3.4, 4.2, 17.2, 14, BLUE, 2, 1.8),
    C(8.6, 9.2, 1.8, GOLD, 1.6),
    P('M4.4 16.4 10.2 11l4 3.8 2.6-2.2 3.6 3.4', NAVY, 1.8),
    L(12, 23, 12, 18.2, GOLD, 2.2),
    P('M9.4 20.8 12,18l2.6,2.8', GOLD, 2.2),
  ],
  laporan_pdf: [
    P('M6.2 2.8h8.2l4.4 4.4v14H6.2z', NAVY, 2),
    P('M14.4 2.8v4.6h4.4', BLUE, 1.8),
    R(15.2, 14.4, 6.2, 6.4, RED, 1.7, 1.2, '#FFFFFF'),
    L(17, 17.2, 19.6, 17.2, RED, 1.2),
    L(17, 19, 19.6, 19, RED, 1.2),
    L(8.8, 11.2, 12.4, 11.2, GOLD, 1.7),
    L(8.8, 14.4, 12.4, 14.4, GOLD, 1.7),
    L(8.8, 17.6, 11.6, 17.6, GOLD, 1.7),
  ],
  laporan_csv: [
    P('M6.2 2.8h8.2l4.4 4.4v14H6.2z', NAVY, 2),
    P('M14.4 2.8v4.6h4.4', BLUE, 1.8),
    R(8.4, 11.2, 8, 7.2, BLUE, 1.5, 0.8),
    L(8.4, 13.6, 16.4, 13.6, NAVY, 1.2),
    L(8.4, 16, 16.4, 16, NAVY, 1.2),
    L(12.2, 11.2, 12.2, 18.4, NAVY, 1.2),
    L(9.6, 20.4, 14.4, 20.4, GOLD, 1.8),
  ],
  invoice_buat: [
    P('M5.4 3.2h9l4.2 4.2v9.4H5.4z', BLUE, 2),
    P('M14.4 3.2v4.2h4.2', NAVY, 1.8),
    L(8.4, 11, 13.4, 11, NAVY, 1.6),
    L(8.4, 14, 11.6, 14, NAVY, 1.6),
    P('M12.6 21.4 14 17.4l5.4-5.4 2 2-5.4 5.4z', GOLD, 1.8, 'fill="#FFFFFF"'),
    L(17.4, 13.6, 18.8, 15), 
    L(5.4, 20.4, 9.8, 20.4, NAVY, 1.8),
  ],
  hutang_add: [
    C(9.6, 7.4, 3.4, NAVY, 1.9),
    P('M3.4 19.4a6.2 6.2 0 0 1 12.4 0', BLUE, 2),
    C(18.2, 16.4, 3.9, GOLD, 1.9, '#FFFFFF'),
    L(18.2, 14.4, 18.2, 18.4, GOLD, 1.9),
    L(16.2, 16.4, 20.2, 16.4, GOLD, 1.9),
  ],
  hutang_lunas: [
    C(9.6, 7.4, 3.4, NAVY, 1.9),
    P('M3.4 19.4a6.2 6.2 0 0 1 12.4 0', BLUE, 2),
    C(18.2, 16.4, 3.9, GOLD, 1.9, '#FFFFFF'),
    P('M16 16.4 17.6 18l3-3.2', GOLD, 2),
    L(14, 9.6, 17, 9.6, NAVY, 1.4),
  ],
  hutang_list: [
    P('M5 2.8h13.4v18.4l-3-2-2.4 2-2.4-2-2.4 2-3.2-2z', BLUE, 2),
    L(8.4, 8, 15, 8, NAVY, 1.7),
    L(8.4, 12, 15, 12, NAVY, 1.7),
    L(8.4, 16, 12.4, 16, GOLD, 1.7),
    C(17.6, 18.4, 2, GOLD, 1.5, '#FFFFFF'),
  ],
  set_akun: [
    C(12, 9, 4.2, BLUE, 2),
    P('M4.6 20.4a7.4 7.4 0 0 1 14.8 0', NAVY, 2),
    C(12, 12, 10.4, GOLD, 1.4),
  ],
  set_ubah_pin: [
    R(4, 3.4, 16, 17.6, BLUE, 2, 2),
    C(8.6, 8, 1.1, GOLD, 1.1, GOLD),
    C(12, 8, 1.1, GOLD, 1.1, GOLD),
    C(15.4, 8, 1.1, GOLD, 1.1, GOLD),
    C(8.6, 12.4, 1.1, NAVY, 1.1, NAVY),
    C(12, 12.4, 1.1, NAVY, 1.1, NAVY),
    C(15.4, 12.4, 1.1, NAVY, 1.1, NAVY),
    P('M8.4 18.2h7.2', GOLD, 1.9),
    C(18.6, 18.6, 2.8, NAVY, 1.7, '#FFFFFF'),
    P('M17.2 18.8l1.2 1.3 2-2.4', NAVY, 1.4),
  ],
  set_printer: [
    P('M6.6 8.2V3.6h10.8v4.6', NAVY, 1.9),
    R(3.4, 8.2, 17.2, 8.4, BLUE, 2, 1.6),
    R(6.6, 13, 10.8, 7.4, NAVY, 1.8, 1),
    L(9, 15.4, 15, 15.4, GOLD, 1.4),
    L(9, 17.6, 15, 17.6, GOLD, 1.4),
    DOT(17.8, 11.2, 1, GOLD),
  ],
  set_backup: [
    P('M3.6 8.2A4.2 4.2 0 0 1 8 4.2h1.4l1.8 2.4h6.8a2 2 0 0 1 2 2v9.4a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2z', BLUE, 2),
    L(12, 10.4, 12, 15.6, NAVY, 2),
    P('M9.4 13l2.6 2.6L14.6 13', GOLD, 2),
    L(8.6, 18.4, 15.4, 18.4, GOLD, 1.6),
  ],
  set_invoice: [
    P('M5.4 2.8h13.2v18.4H5.4z', BLUE, 2),
    L(8.4, 7.6, 15.6, 7.6, NAVY, 1.6),
    L(8.4, 11.2, 15.6, 11.2, NAVY, 1.6),
    L(8.4, 14.8, 12.6, 14.8, NAVY, 1.6),
    C(16.4, 18.4, 2.6, GOLD, 1.7, GOLD),
    P('M15.4 18.4l.9.9 1.5-1.8', NAVY, 1.3),
  ],
  set_logout: [
    P('M9.4 3.2H5.4a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h4', NAVY, 2),
    L(10, 12, 20.4, 12, BLUE, 2.2),
    P('M17 8.4 20.8 12 17 15.6', RED, 2.2),
    L(3.4, 7, 7.4, 7, GOLD, 1.5),
  ],
  set_darkmode: [
    P('M14.6 3.4a8.6 8.6 0 1 0 6.8 13.8 9.4 9.4 0 0 1-6.8-13.8z', BLUE, 2, 'fill="#0C3B6E22"'),
    P('M18.2 4.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z', GOLD, 1.2, 'fill="#D8A93E"'),
    DOT(21, 10, 0.8, GOLD),
  ],
  set_cache: [
    P('M4 6.4c0-1.7 3.6-3 8-3s8 1.3 8 3v3.2c0 1.7-3.6 3-8 3s-8-1.3-8-3z', BLUE, 1.9),
    P('M4 9.6c0 1.7 3.6 3 8 3s8-1.3 8-3', NAVY, 1.6),
    P('M4 12.8c0 1.7 3.6 3 8 3s8-1.3 8-3v4.8c0 1.7-3.6 3-8 3s-8-1.3-8-3z', NAVY, 1.9),
    P('M18 3.4l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z', GOLD, 1, 'fill="#D8A93E"'),
  ],
  storage_info: [
    R(3, 6, 18, 12, NAVY, 2, 1.8),
    L(3, 13.4, 21, 13.4, BLUE, 1.6),
    R(5.8, 8.6, 12.4, 2.2, BLUE, 1.2, 0.8, BLUE),
    DOT(18, 16.2, 1, GOLD),
    L(15.4, 16.2, 16.6, 16.2, GOLD, 1.4),
    L(6.4, 19.6, 7.8, 21.4, NAVY, 1.6),
    L(17.6, 19.6, 16.2, 21.4, NAVY, 1.6),
  ],
  printer_scan: [
    R(3.6, 11.6, 16.8, 7.6, NAVY, 1.9, 1.4),
    P('M6.8 11.6V7h10.4v4.6', BLUE, 1.9),
    R(7.4, 15, 9.2, 5.4, BLUE, 1.5, 0.8),
    P('M17.2 4.6a4.4 4.4 0 0 1 0 4.4M19.8 2.6a7.4 7.4 0 0 1 0 8.4', GOLD, 1.7),
  ],
  printer_test: [
    R(3.6, 10.4, 16.8, 8.2, BLUE, 2, 1.6),
    P('M6.8 10.4V4.8h10.4v5.6', NAVY, 1.9),
    R(7.4, 14.6, 9.2, 5.6, NAVY, 1.5, 0.8),
    C(19.4, 8, 3.4, GOLD, 1.8, '#FFFFFF'),
    P('M17.8 8l1.2 1.3 2-2.4', GOLD, 1.6),
  ],
  pln_upload: [
    P('M13.6 2.8 6 13.8h4.8l-1.2 7.4 7.8-11h-4.8z', GOLD, 1.9, 'fill="#D8A93E"'),
    P('M20.6 15.2a5.4 5.4 0 0 1-5.4 5.4H9.4', BLUE, 1.8),
    P('M11.4 18.6 9 20.6l2.4 2', BLUE, 1.8),
    L(4.4, 3.4, 7.4, 3.4, NAVY, 1.5),
    L(4.4, 6.4, 6.6, 6.4, NAVY, 1.5),
  ],
  panah_kembali: [
    L(21, 12, 4.4, 12, NAVY, 2.4),
    P('M10.4 5.6 4,12l6.4,6.4', NAVY, 2.4),
    L(4.8, 18.6, 4.8, 21.2, GOLD, 2),
    L(4.8, 5.4, 4.8, 2.8, GOLD, 2),
  ],
};

const ALLOWED = new Set([NAVY, BLUE, GOLD, RED, '#FFFFFF', NAVY + '22']);

function toSvg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${GRID} ${GRID}" fill="none">
  <g stroke-linecap="round" stroke-linejoin="round">${inner.join('')}</g>
</svg>`;
}

const keys = Object.keys(icons);
if (new Set(keys).size !== keys.length) throw new Error('Duplicate icon key');

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const key of keys) {
    const svg = toSvg(icons[key]);
    const bad = [...svg.matchAll(/(?:stroke|fill)="(#[0-9A-Fa-f]{3,8})"/g)]
      .map((m) => m[1].toUpperCase())
      .filter((c) => !ALLOWED.has(c) && !ALLOWED.has(c + '22'));
    if (bad.length) throw new Error(`${key}: palette violation ${bad.join(',')}`);
    const out = path.join(OUT, `${key}.png`);
    await sharp(Buffer.from(svg)).resize(SIZE, SIZE).png().toFile(out);
    total += 1;
  }
  console.log(`Generated ${total} icons -> assets/icon/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
