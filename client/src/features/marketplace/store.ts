import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  storeId: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  totalCount: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return { items: s.items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) };
          }
          return { items: [...s.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
      },

      setQty: (productId, qty) => {
        if (qty <= 0) {
          set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));
        } else {
          set((s) => ({ items: s.items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i) }));
        }
      },

      clear: () => set({ items: [] }),

      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "drivex-cart" }
  )
);
