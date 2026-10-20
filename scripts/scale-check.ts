/* Scale checks — run with `npx tsx scripts/scale-check.ts` */
import { computeMetrics, moderateScale, roundToNearestPixel, scaleStyleValue } from '../src/core/utils/scaleCore';

let failures = 0;
const check = (label: string, ok: boolean) => {
  if (!ok) { failures += 1; console.error(`FAIL ${label}`); } else console.log(`ok   ${label}`);
};

const portrait = computeMetrics(360, 800, 2);
check('portrait ms=1', portrait.ms === 1);
check('portrait sw=1', portrait.sw === 1);
const small = computeMetrics(320, 640, 3);
check('small clamp sw>=0.8', small.sw >= 0.8);
const big = computeMetrics(1080, 2400, 3);
check('big clamp sw<=1.5', big.sw <= 1.5);
check('big clamp ms<=1.35', big.ms <= 1.35);
const landscape = computeMetrics(800, 360, 2);
check('landscape detected', landscape.landscape);
check('landscape swaps baseline', Math.abs(landscape.sw - 800 / 800) < 1e-9);
check('roundToNearestPixel', roundToNearestPixel(10.3, 2) === 10.5 || roundToNearestPixel(10.3, 2) === 10);
check('uniform scale of width', scaleStyleValue('width', 76, portrait) === 76);
check('skip flex', scaleStyleValue('flex', 1, portrait) === 1);
check('hairline stays', scaleStyleValue('borderWidth', 1, portrait) === 1);
check('ms increases on large', moderateScale(100, big) > 100);
const doubled = computeMetrics(720, 1600, 2);
check('2x device clamped', moderateScale(100, doubled) === 135);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nScale checks passed.');
