import { atom } from 'jotai';
import { type Product } from '@shared/schema';

export interface CartItem {
  product: Product;
  quantity: number;
}

export const cartAtom = atom<CartItem[]>([]);
