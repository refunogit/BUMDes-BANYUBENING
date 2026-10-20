/** Image pick + compression (expo-image-picker + expo-image-manipulator). */
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { copyToLogos, copyToProductImages, deleteFileSafe } from './storageService';

export type PickedImage = { uri: string; width: number; height: number };

export async function pickImage(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 1,
  });
  if (result.canceled || !result.assets.length) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width ?? 0, height: asset.height ?? 0 };
}

/** Produk: max 800x800, JPEG q0.7, disimpan ke product_images/. */
export async function compressProductImage(sourceUri: string, width: number, height: number): Promise<string> {
  const scale = Math.min(1, 800 / Math.max(width || 800, height || 800));
  const targetWidth = Math.max(1, Math.round((width || 800) * scale));
  const targetHeight = Math.max(1, Math.round((height || 800) * scale));
  const result = await manipulateAsync(sourceUri, [{ resize: { width: targetWidth, height: targetHeight } }], {
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  return copyToProductImages(result.uri, fileName);
}

/** Logo: crop 1:1, 512x512 PNG, disimpan ke logos/. */
export async function compressLogo(sourceUri: string, width: number, height: number): Promise<string> {
  const side = Math.min(width || 512, height || 512);
  const originX = Math.max(0, Math.round(((width || side) - side) / 2));
  const originY = Math.max(0, Math.round(((height || side) - side) / 2));
  const result = await manipulateAsync(
    sourceUri,
    [
      { crop: { originX, originY, width: side, height: side } },
      { resize: { width: 512, height: 512 } },
    ],
    { compress: 1, format: SaveFormat.PNG },
  );
  const fileName = `logo_${Date.now()}.png`;
  return copyToLogos(result.uri, fileName);
}

/** QRIS: no crop required, keep aspect (max 1200), PNG. */
export async function compressQris(sourceUri: string, width: number, height: number): Promise<string> {
  const scale = Math.min(1, 1200 / Math.max(width || 1200, height || 1200));
  const result = await manipulateAsync(
    sourceUri,
    [{ resize: { width: Math.round((width || 1200) * scale), height: Math.round((height || 1200) * scale) } }],
    { compress: 0.95, format: SaveFormat.PNG },
  );
  return copyToLogos(result.uri, `qris_${Date.now()}.png`);
}

export function deleteImageSafe(uri: string | null | undefined): void {
  deleteFileSafe(uri);
}
