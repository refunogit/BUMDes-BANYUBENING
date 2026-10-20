/**
 * scaleCore — pure scaling math (no React Native imports, unit-testable).
 *
 * Baseline design canvas: 360 x 800 dp (TODO: calibrate against the ITEL
 * reference device once final hardware is confirmed). Portrait baseline is
 * swapped in landscape so horizontal/vertical rhythm keeps its meaning.
 */

export type Metrics = {
  width: number;
  height: number;
  landscape: boolean;
  /** horizontal ratio (width / baseline width) clamped */
  sw: number;
  /** vertical ratio (height / baseline height) clamped */
  sh: number;
  /** uniform ratio for fonts, radii, squares (clamped tighter) */
  ms: number;
  pixelRatio: number;
};

export const BASE_WIDTH = 360;
export const BASE_HEIGHT = 800;

export const SW_MIN = 0.8;
export const SW_MAX = 1.5;
export const SH_MIN = 0.8;
export const SH_MAX = 1.5;
export const MS_MIN = 0.85;
export const MS_MAX = 1.35;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const roundToNearestPixel = (value: number, pixelRatio = 1): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * pixelRatio) / pixelRatio;
};

export function computeMetrics(width: number, height: number, pixelRatio = 1): Metrics {
  const safeW = width > 0 ? width : BASE_WIDTH;
  const safeH = height > 0 ? height : BASE_HEIGHT;
  const landscape = safeW > safeH;
  // Landscape swaps the baseline so 360-wide design tokens follow the short edge.
  const baseW = landscape ? BASE_HEIGHT : BASE_WIDTH;
  const baseH = landscape ? BASE_WIDTH : BASE_HEIGHT;
  const ratioW = safeW / baseW;
  const ratioH = safeH / baseH;
  return {
    width: safeW,
    height: safeH,
    landscape,
    sw: clamp(ratioW, SW_MIN, SW_MAX),
    sh: clamp(ratioH, SH_MIN, SH_MAX),
    ms: clamp(Math.min(ratioW, ratioH), MS_MIN, MS_MAX),
    pixelRatio: pixelRatio > 0 ? pixelRatio : 1,
  };
}

export function scaleWidth(value: number, metrics: Metrics): number {
  return roundToNearestPixel(value * metrics.sw, metrics.pixelRatio);
}

export function scaleHeight(value: number, metrics: Metrics): number {
  return roundToNearestPixel(value * metrics.sh, metrics.pixelRatio);
}

export function moderateScale(value: number, metrics: Metrics): number {
  return roundToNearestPixel(value * metrics.ms, metrics.pixelRatio);
}

/** Properties that must scale uniformly to keep circles & glyphs undistorted. */
export const UNIFORM_STYLE_PROPS = [
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'gap',
  'rowGap',
  'columnGap',
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'top',
  'bottom',
  'left',
  'right',
  'flexBasis',
] as const;

/** Properties intentionally never touched by the scale patch. */
export const SKIP_STYLE_PROPS = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'opacity',
  'zIndex',
  'elevation',
  'fontWeight',
  'aspectRatio',
]);

const NEGATIVE_SAFE = new Set(['top', 'bottom', 'left', 'right', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight']);

export function scaleStyleValue(prop: string, value: unknown, metrics: Metrics): unknown {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  if (value === 0) return value;
  const uniform = (UNIFORM_STYLE_PROPS as readonly string[]).includes(prop);
  if (!uniform) return value;
  if (SKIP_STYLE_PROPS.has(prop)) return value;
  if (value < 0 && !NEGATIVE_SAFE.has(prop)) return value;
  return moderateScale(value, metrics);
}

export function isScaleableProp(prop: string): boolean {
  return (UNIFORM_STYLE_PROPS as readonly string[]).includes(prop);
}
