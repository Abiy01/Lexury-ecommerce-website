// Wishlist Context
// Manages user wishlist with localStorage persistence

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Product, WishlistItem } from '@/types';
import { storage } from '@/lib/utils';

// Wishlist state type
interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
}

// Action types
type WishlistAction =
  | { type: 'SET_ITEMS'; payload: WishlistItem[] }
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_WISHLIST' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: WishlistState = {
  items: [],
  isLoading: true,
};

// Reducer
function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false };
    
    case 'ADD_ITEM': {
      const product = action.payload;
      const exists = state.items.some((item) => item.product.id === product.id);
      
      if (exists) return state;
      
      const newItem: WishlistItem = {
        id: product.id,
        product,
        addedAt: new Date().toISOString(),
      };
      return { ...state, items: [...state.items, newItem] };
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.payload),
      };
    
    case 'CLEAR_WISHLIST':
      return { ...state, items: [] };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
}

// Context type
interface WishlistContextType extends WishlistState {
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
  itemCount: number;
}

// Create context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Provider component
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = storage.get<WishlistItem[]>('wishlist', []);
    dispatch({ type: 'SET_ITEMS', payload: savedWishlist });
  }, []);

  // Persist wishlist to localStorage on changes
  useEffect(() => {
    if (!state.isLoading) {
      storage.set('wishlist', state.items);
    }
  }, [state.items, state.isLoading]);

  // Actions
  const addItem = (product: Product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const toggleItem = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
  };

  // Helpers
  const isInWishlist = (productId: string): boolean => {
    return state.items.some((item) => item.product.id === productId);
  };

  const itemCount = state.items.length;

  return (
    <WishlistContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        toggleItem,
        clearWishlist,
        isInWishlist,
        itemCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// Custom hook to use wishlist context
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

export default WishlistContext;
