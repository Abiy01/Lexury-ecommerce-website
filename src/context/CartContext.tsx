// Cart Context
// Manages shopping cart state with localStorage persistence

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, Product, ProductVariant } from '@/types';
import { storage } from '@/lib/utils';

// Cart state type
interface CartState {
  items: CartItem[];
  isLoading: boolean;
}

// Action types
type CartAction =
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number; variant?: ProductVariant } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: CartState = {
  items: [],
  isLoading: true,
};

// Generate unique cart item ID
function generateCartItemId(productId: string, variantId?: string): string {
  return variantId ? `${productId}-${variantId}` : productId;
}

// Reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false };
    
    case 'ADD_ITEM': {
      const { product, quantity, variant } = action.payload;
      const itemId = generateCartItemId(product.id, variant?.id);
      const existingIndex = state.items.findIndex((item) => item.id === itemId);
      
      if (existingIndex >= 0) {
        // Update existing item quantity
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + quantity,
        };
        return { ...state, items: newItems };
      }
      
      // Add new item
      const newItem: CartItem = {
        id: itemId,
        product,
        quantity,
        variant,
      };
      return { ...state, items: [...state.items, newItem] };
    }
    
    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((item) => item.id !== itemId) };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        ),
      };
    }
    
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
    
    case 'CLEAR_CART':
      return { ...state, items: [] };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
}

// Context type
interface CartContextType extends CartState {
  // Item actions
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  
  // Computed values
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  
  // Helpers
  getItemQuantity: (productId: string, variantId?: string) => number;
  isInCart: (productId: string, variantId?: string) => boolean;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Constants
const SHIPPING_THRESHOLD = 100; // Free shipping over $100
const SHIPPING_COST = 9.99;
const TAX_RATE = 0.08; // 8% tax

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = storage.get<CartItem[]>('cart', []);
    dispatch({ type: 'SET_ITEMS', payload: savedCart });
  }, []);

  // Persist cart to localStorage on changes
  useEffect(() => {
    if (!state.isLoading) {
      storage.set('cart', state.items);
    }
  }, [state.items, state.isLoading]);

  // Item actions
  const addItem = (product: Product, quantity = 1, variant?: ProductVariant) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variant } });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Computed values
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = state.items.reduce((sum, item) => {
    const price = item.product.price + (item.variant?.priceModifier || 0);
    return sum + price * item.quantity;
  }, 0);

  const discount = 0;

  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  const tax = (subtotal - discount) * TAX_RATE;

  const total = subtotal - discount + shipping + tax;

  // Helper functions
  const getItemQuantity = (productId: string, variantId?: string): number => {
    const itemId = generateCartItemId(productId, variantId);
    const item = state.items.find((i) => i.id === itemId);
    return item?.quantity || 0;
  };

  const isInCart = (productId: string, variantId?: string): boolean => {
    const itemId = generateCartItemId(productId, variantId);
    return state.items.some((item) => item.id === itemId);
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        getItemQuantity,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
