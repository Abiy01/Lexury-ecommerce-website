// Wishlist Context
// Manages user wishlist with localStorage persistence and backend sync

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '@/lib/utils';
import { wishlistAPI } from '@/services/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Initial state
const initialState = {
  items: [],
  isLoading: true,
};

// Reducer
function wishlistReducer(state, action) {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, isLoading: false };
    
    case 'ADD_ITEM': {
      const product = action.payload;
      const productId = product._id || product.id;
      const exists = state.items.some((item) => {
        const itemProductId = item.product?._id || item.product?.id || item._id || item.id;
        return itemProductId === productId;
      });
      
      if (exists) return state;
      
      const newItem = {
        id: productId,
        product,
        addedAt: new Date().toISOString(),
      };
      return { ...state, items: [...state.items, newItem] };
    }
    
    case 'REMOVE_ITEM': {
      const productId = action.payload;
      return {
        ...state,
        items: state.items.filter((item) => {
          const itemProductId = item.product?._id || item.product?.id || item._id || item.id;
          return itemProductId !== productId;
        }),
      };
    }
    
    case 'CLEAR_WISHLIST':
      return { ...state, items: [] };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    default:
      return state;
  }
}

// Create context
const WishlistContext = createContext(undefined);

// Provider component
export function WishlistProvider({ children }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load wishlist from backend or localStorage on mount
  useEffect(() => {
    const loadWishlist = async () => {
      if (isAuthenticated) {
        try {
          const response = await wishlistAPI.get();
          const wishlistData = response.data.data || response.data;
          // Transform backend format to frontend format
          if (Array.isArray(wishlistData)) {
            const transformedItems = wishlistData.map((item) => {
              const product = item.product || item;
              const productId = product._id || product.id || item._id || item.id;
              return {
                id: productId,
                product: product,
                addedAt: item.addedAt || new Date().toISOString(),
              };
            });
            dispatch({ type: 'SET_ITEMS', payload: transformedItems });
          } else {
            dispatch({ type: 'SET_ITEMS', payload: [] });
          }
        } catch (error) {
          console.error('Failed to load wishlist from backend:', error);
          // Fallback to localStorage
          const savedWishlist = storage.get('wishlist', []);
          dispatch({ type: 'SET_ITEMS', payload: savedWishlist });
        }
      } else {
        // Load from localStorage for guest users
        const savedWishlist = storage.get('wishlist', []);
        dispatch({ type: 'SET_ITEMS', payload: savedWishlist });
      }
    };

    loadWishlist();
  }, [isAuthenticated]);

  // Persist wishlist to localStorage on changes (for guest users)
  useEffect(() => {
    if (!state.isLoading && !isAuthenticated) {
      storage.set('wishlist', state.items);
    }
  }, [state.items, state.isLoading, isAuthenticated]);

  // Actions
  const addItem = async (product) => {
    if (isAuthenticated) {
      try {
        await wishlistAPI.add(product.id || product._id);
        // Reload wishlist from backend
        const response = await wishlistAPI.get();
        const wishlistData = response.data.data || response.data;
        if (Array.isArray(wishlistData)) {
          const transformedItems = wishlistData.map((item) => ({
            id: item.product?._id || item.product?.id || item._id || item.id,
            product: item.product || item,
            addedAt: item.addedAt || new Date().toISOString(),
          }));
          dispatch({ type: 'SET_ITEMS', payload: transformedItems });
        }
      } catch (error) {
        console.error('Failed to add item to wishlist:', error);
        // Fallback to local state
        dispatch({ type: 'ADD_ITEM', payload: product });
      }
    } else {
      // Guest user - use local state
      dispatch({ type: 'ADD_ITEM', payload: product });
    }
  };

  const removeItem = async (productId) => {
    if (!productId) {
      console.error('Product ID is required to remove from wishlist');
      toast.error('Product ID is required');
      return;
    }

    if (isAuthenticated) {
      try {
        // Convert to string to ensure proper matching
        const productIdStr = String(productId);
        console.log('Removing product from wishlist with ID:', productIdStr);
        
        const response = await wishlistAPI.remove(productIdStr);
        console.log('Wishlist removal response:', response.data);
        
        // Reload wishlist from backend
        const getResponse = await wishlistAPI.get();
        const wishlistData = getResponse.data.data || getResponse.data;
        if (Array.isArray(wishlistData)) {
          const transformedItems = wishlistData.map((item) => {
            const product = item.product || item;
            const itemProductId = product._id || product.id || item._id || item.id;
            return {
              id: itemProductId,
              product: product,
              addedAt: item.addedAt || new Date().toISOString(),
            };
          });
          dispatch({ type: 'SET_ITEMS', payload: transformedItems });
          toast.success('Item removed from wishlist');
        } else {
          dispatch({ type: 'SET_ITEMS', payload: [] });
          toast.success('Item removed from wishlist');
        }
      } catch (error) {
        console.error('Failed to remove item from wishlist:', error);
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.message || 'Failed to remove item from wishlist';
        toast.error(errorMessage);
        // Fallback to local state update
        dispatch({ type: 'REMOVE_ITEM', payload: productId });
      }
    } else {
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
      toast.success('Item removed from wishlist');
    }
  };

  const toggleItem = async (product) => {
    const productId = product._id || product.id;
    if (isInWishlist(productId)) {
      await removeItem(productId);
    } else {
      await addItem(product);
    }
  };

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
  };

  // Helpers
  const isInWishlist = (productId) => {
    if (!productId) return false;
    return state.items.some((item) => {
      const itemProductId = item.product?._id || item.product?.id || item._id || item.id;
      return String(itemProductId) === String(productId);
    });
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

