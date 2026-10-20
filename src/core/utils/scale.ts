/**
 * scale.ts — React Native bindings for scaleCore + a property-aware global
 * patch of StyleSheet.create.
 *
 * Convention used by this app: StyleSheet.create() receives RAW design values
 * (360x800 canvas) and the patch scales them once. Inline runtime sizes (icon
 * wrappers, circles, computed columns) call ms()/sw()/sh() explicitly.
 * Never pass ms() values into StyleSheet.create — that would scale twice.
 */
import { Dimensions, PixelRatio, StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  computeMetrics,
  moderateScale,
  scaleHeight,
  scaleStyleValue,
  scaleWidth,
  type Metrics,
} from './scaleCore';

let metrics: Metrics = computeMetrics(
  Dimensions.get('window').width || BASE_WIDTH,
  Dimensions.get('window').height || BASE_HEIGHT,
  PixelRatio.get(),
);

let patched = false;

export function refreshScale(): Metrics {
  const { width, height } = Dimensions.get('window');
  metrics = computeMetrics(width, height, PixelRatio.get());
  return metrics;
}

export function getMetrics(): Metrics {
  return metrics;
}

export const ms = (value: number): number => moderateScale(value, metrics);
export const sw = (value: number): number => scaleWidth(value, metrics);
export const sh = (value: number): number => scaleHeight(value, metrics);
export const rw = (value: number): number => scaleWidth(value, metrics);
export const rh = (value: number): number => scaleHeight(value, metrics);

export function patchStyleSheet(): void {
  if (patched) return;
  patched = true;
  const original = StyleSheet.create.bind(StyleSheet);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (StyleSheet as any).create = ((styles: Record<string, any>) => {
    const scaled: Record<string, unknown> = {};
    const current = refreshScale();
    for (const key of Object.keys(styles)) {
      const style = styles[key];
      if (!style || typeof style !== 'object' || Array.isArray(style)) {
        scaled[key] = style;
        continue;
      }
      const out: Record<string, unknown> = {};
      for (const prop of Object.keys(style)) {
        out[prop] = scaleStyleValue(prop, style[prop], current);
      }
      scaled[key] = out;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return original(scaled as any) as unknown;
  }) as typeof StyleSheet.create;
}

patchStyleSheet();

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/** Drop-in replacement that guarantees the patch ran (for tests/utilities). */
export function createStyles<T extends NamedStyles<T>>(styles: T | NamedStyles<T>): T {
  return StyleSheet.create(styles) as T;
}

export { BASE_WIDTH, BASE_HEIGHT };
