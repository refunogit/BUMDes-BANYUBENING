/* Utility checks — run with `npx tsx scripts/utils-check.ts` */
import { ceil500 } from '../src/core/utils/ceil500';
import { formatPlain, formatRupiah, parseNumber, formatQuantity } from '../src/core/utils/currency';
import { formatDate, dayName, monthName } from '../src/core/utils/date';
import { mathParser } from '../src/core/utils/mathParser';
import { autoUsername, isPin, isUsername } from '../src/core/utils/validators';
import { terbilang } from '../src/core/utils/terbilang';
import { invoiceRef } from '../src/core/utils/id';
import { wrapText, toAsciiSafe } from '../src/core/utils/string';

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL ${label}: got ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok   ${label}`);
  }
}

check('ceil500 24271', ceil500(24271), 24500);
check('ceil500 25500', ceil500(25500), 25500);
check('ceil500 25501', ceil500(25501), 26000);
check('ceil500 0', ceil500(0), 0);
check('formatRupiah 10000', formatRupiah(10000), 'Rp 10.000');
check('formatPlain 2500000', formatPlain(2500000), '2.500.000');
check('parse "Rp 10.000"', parseNumber('Rp 10.000'), 10000);
check('parse "10,5"', parseNumber('10,5'), 10.5);
check('formatQuantity 2.50', formatQuantity(2.5), '2,5');
check('formatDate', formatDate(new Date(2023, 9, 25)), '25 Okt 2023');
check('dayName', dayName(new Date(2023, 9, 25)), 'Rabu');
check('monthName', monthName(new Date(2023, 9, 25)), 'Oktober');
check('math 2+3*4', mathParser('2+3*4'), { ok: true, value: 14 });
check('math invalid', mathParser('alert(1)'), { ok: false, error: 'invalid' });
check('autoUsername', autoUsername('Budi Santoso'), 'budi_santoso');
check('isPin 123456', isPin('123456'), true);
check('isPin 12345', isPin('12345'), false);
check('isUsername', isUsername('budi_santoso'), true);
check('terbilang 26000', terbilang(26000), 'dua puluh enam ribu rupiah');
check('invoiceRef 7', invoiceRef(7), 'INV/000007');
check('invoiceRef 1000000', invoiceRef(1000000), 'INV/000001');
check('wrapText', wrapText('BARANG YANG SUDAH DITERIMA', 12).length, 3);
check('ascii', toAsciiSafe('— • é'), '- * e');

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll utility checks passed.');
