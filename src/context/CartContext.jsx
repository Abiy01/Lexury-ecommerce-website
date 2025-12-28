// Cart Context
// Manages shopping cart state with localStorage persistence and backend sync

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '@/lib/utils';
import { cartAPI } from '@/services/api';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  items: [],
  isLoading: true,
};

// Generate unique cart item ID
function generateCartItemId(productId, variantId) {
  return variantId ? `${productId}-${variantId}` : productId;
}

// Reducer
function cartReducer(state, action) {
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
      const newItem = {
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

// Create context
const CartContext = createContext(undefined);

// Constants
const SHIPPING_THRESHOLD = 100; // Free shipping over $100
const SHIPPING_COST = 9.99;
const TAX_RATE = 0.08; // 8% tax

// Provider component
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load cart from backend or localStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      if (isAuthenticated) {
        try {
          const response = await cartAPI.get();
          const cartData = response.data.data || response.data;
          // Backend returns items as array of cart items with populated products
          if (cartData.items && Array.isArray(cartData.items)) {
            // Transform backend format to frontend format
            // IMPORTANT: Use item._id (MongoDB subdocument ID) as the ID for removal
            const transformedItems = cartData.items.map((item) => {
              // item._id is the MongoDB _id of the cart item subdocument
              const cartItemId = item._id?.toString() || item.id?.toString();
              return {
                id: cartItemId, // This is the ID we'll use for removal
                product: item.product || item,
                quantity: item.quantity || 1,
                variant: item.variant,
              };
            });
            dispatch({ type: 'SET_ITEMS', payload: transformedItems });
          } else {
            dispatch({ type: 'SET_ITEMS', payload: [] });
          }
        } catch (error) {
          console.error('Failed to load cart from backend:', error);
          // Fallback to localStorage
          const savedCart = storage.get('cart', []);
          dispatch({ type: 'SET_ITEMS', payload: savedCart });
        }
      } else {
        // Load from localStorage for guest users
        const savedCart = storage.get('cart', []);
        dispatch({ type: 'SET_ITEMS', payload: savedCart });
      }
    };

    loadCart();
  }, [isAuthenticated]);

  // Persist cart to backend or localStorage on changes
  useEffect(() => {
    if (!state.isLoading && isAuthenticated) {
      // Sync to backend when authenticated
      // Note: This could be debounced for better performance
      const syncToBackend = async () => {
        try {
          // The backend will handle cart persistence automatically
          // We just need to ensure items are synced when they change
        } catch (error) {
          console.error('Failed to sync cart to backend:', error);
        }
      };
      syncToBackend();
    } else if (!state.isLoading) {
      // Save to localStorage for guest users
      storage.set('cart', state.items);
    }
  }, [state.items, state.isLoading, isAuthenticated]);

  // Item actions
  const addItem = async (product, quantity = 1, variant) => {
    if (isAuthenticated) {
      try {
        await cartAPI.addItem(product.id || product._id, quantity, variant?.id || variant?._id);
        // Reload cart from backend
        const response = await cartAPI.get();
        const cartData = response.data.data || response.data;
        if (cartData.items && Array.isArray(cartData.items)) {
          const transformedItems = cartData.items.map((item) => {
            const cartItemId = item._id?.toString() || item.id?.toString();
            return {
              id: cartItemId,
              product: item.product || item,
              quantity: item.quantity || 1,
              variant: item.variant,
            };
          });
          dispatch({ type: 'SET_ITEMS', payload: transformedItems });
        }
      } catch (error) {
        console.error('Failed to add item to cart:', error);
        // Fallback to local state
        dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variant } });
      }
    } else {
      // Guest user - use local state
      dispatch({ type: 'ADD_ITEM', payload: { product, quantity, variant } });
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (isAuthenticated) {
      try {
        await cartAPI.updateItem(itemId, quantity);
        // Reload cart from backend
        const response = await cartAPI.get();
        const cartData = response.data.data || response.data;
        if (cartData.items && Array.isArray(cartData.items)) {
          const transformedItems = cartData.items.map((item) => {
            const cartItemId = item._id?.toString() || item.id?.toString();
            return {
              id: cartItemId,
              product: item.product || item,
              quantity: item.quantity || 1,
              variant: item.variant,
            };
          });
          dispatch({ type: 'SET_ITEMS', payload: transformedItems });
        }
      } catch (error) {
        console.error('Failed to update cart item:', error);
        dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
      }
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
    }
  };

  const removeItem = async (itemId) => {
    if (isAuthenticated) {
      try {
        // Ensure we're using the MongoDB _id, not a generated ID
        const cartItemId = String(itemId);
        console.log('Removing cart item with ID:', cartItemId);
        console.log('Current cart items:', state.items.map(i => ({ id: i.id, productName: i.product?.name })));
        
        const removeResponse = await cartAPI.removeItem(cartItemId);
        console.log('Remove response:', removeResponse.data);
        
        // Reload cart from backend
        const response = await cartAPI.get();
        const cartData = response.data.data || response.data;
        console.log('Cart data after removal:', cartData);
        
        if (cartData.items && Array.isArray(cartData.items)) {
          const transformedItems = cartData.items.map((item) => {
            const cartItemId = item._id?.toString() || item.id?.toString();
            return {
              id: cartItemId,
              product: item.product || item,
              quantity: item.quantity || 1,
              variant: item.variant,
            };
          });
          console.log('Transformed items after removal:', transformedItems);
          dispatch({ type: 'SET_ITEMS', payload: transformedItems });
          toast.success('Item removed from cart');
        } else {
          dispatch({ type: 'SET_ITEMS', payload: [] });
          toast.success('Item removed from cart');
        }
      } catch (error) {
        console.error('Failed to remove cart item:', error);
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.message || 'Failed to remove item from cart';
        toast.error(errorMessage);
        // Fallback to local state update
        dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      }
    } else {
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      toast.success('Item removed from cart');
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await cartAPI.clear();
      } catch (error) {
        console.error('Failed to clear cart:', error);
      }
    }
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
  const getItemQuantity = (productId, variantId) => {
    const itemId = generateCartItemId(productId, variantId);
    const item = state.items.find((i) => i.id === itemId);
    return item?.quantity || 0;
  };

  const isInCart = (productId, variantId) => {
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

