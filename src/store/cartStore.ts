/**
 * Cart store — decimals allowed (REAL quantities), subtotal = qty x price.
 * Service items (listrik/pulsa) carry structured data for receipt template B/C.
 */
import { create } from 'zustand';

import { roundMoney } from '@/core/utils/currency';
import { newId } from '@/core/utils/id';

export type ListrikServiceData = {
  type: 'listrik';
  idpel: string;
  nama: string;
  tarifDaya: string;
  tagihan: number;
  kwh: number;
  bl: string;
  th: string;
  admBank: number;
  biayaLyn: number;
  denda: number;
  total: number;
};

export type PulsaServiceData = {
  type: 'pulsa';
  nomor: string;
  provider: string;
  jenis: string;
  paket: string;
  harga: number;
};

export type ServiceData = ListrikServiceData | PulsaServiceData;

export type CartItem = {
  key: string;
  productId: string | null;
  name: string;
  price: number;
  qty: number;
  unit: string;
  costPrice: number;
  imagePath: string | null;
  serviceType: 'listrik' | 'pulsa' | null;
  serviceData?: ServiceData;
  costAmount?: number;
};

export type AddProductInput = {
  id: string;
  name: string;
  price: number;
  unit: string;
  costPrice?: number;
  imagePath?: string | null;
};

type CartState = {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: AddProductInput, qty?: number) => void;
  addServiceItem: (input: {
    name: string;
    price: number;
    unit: string;
    serviceType: 'listrik' | 'pulsa';
    serviceData: ServiceData;
    costAmount?: number;
  }) => void;
  updateQuantity: (key: string, qty: number) => void;
  updatePrice: (key: string, price: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

function recalc(items: CartItem[]): Pick<CartState, 'items' | 'total' | 'itemCount'> {
  const total = roundMoney(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const itemCount = roundMoney(items.reduce((sum, item) => sum + item.qty, 0));
  return { items, total, itemCount };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  itemCount: 0,

  addItem: (product, qty = 1) => {
    const items = [...get().items];
    const existing = items.find((item) => item.productId === product.id && item.serviceType === null);
    if (existing) {
      existing.qty = roundMoney(existing.qty + qty);
    } else {
      items.push({
        key: newId(),
        productId: product.id,
        name: product.name,
        price: product.price,
        qty,
        unit: product.unit,
        costPrice: product.costPrice ?? 0,
        imagePath: product.imagePath ?? null,
        serviceType: null,
      });
    }
    set(recalc(items));
  },

  addServiceItem: (input) => {
    const items = [...get().items];
    items.push({
      key: newId(),
      productId: null,
      name: input.name,
      price: input.price,
      qty: 1,
      unit: input.unit,
      costPrice: 0,
      imagePath: null,
      serviceType: input.serviceType,
      serviceData: input.serviceData,
      costAmount: input.costAmount,
    });
    set(recalc(items));
  },

  updateQuantity: (key, qty) => {
    if (!Number.isFinite(qty) || qty < 0) return;
    const items = get()
      .items.map((item) => (item.key === key ? { ...item, qty: roundMoney(qty) } : item))
      .filter((item) => item.qty > 0);
    set(recalc(items));
  },

  updatePrice: (key, price) => {
    if (!Number.isFinite(price) || price < 0) return;
    const items = get().items.map((item) => (item.key === key ? { ...item, price: roundMoney(price) } : item));
    set(recalc(items));
  },

  removeItem: (key) => {
    set(recalc(get().items.filter((item) => item.key !== key)));
  },

  clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
}));

export const selectCartTotal = (state: CartState): number => state.total;
export const selectCartCount = (state: CartState): number => state.itemCount;
