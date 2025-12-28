// Authentication Context
// Manages user authentication state across the application

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { storage } from '@/lib/utils';
import { authAPI } from '@/services/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return { ...initialState, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(undefined);

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    if (hasInitialized) return;
    
    const initAuth = async () => {
      // Get token directly from localStorage (stored as plain string)
      const token = localStorage.getItem('auth_token');
      const user = storage.get('user', null);

      if (token && user) {
        // Verify token with backend
        try {
          const response = await authAPI.getProfile();
          const updatedUser = response.data.data || response.data;
          if (updatedUser) {
            storage.set('user', updatedUser);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user: updatedUser, token } });
          } else {
            throw new Error('Invalid user data');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Don't clear storage immediately - might be a network issue
          // Only clear if it's definitely an auth error (401)
          if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            storage.remove('user');
            dispatch({ type: 'AUTH_FAILURE' });
          } else {
            // Network or other error - keep existing auth state
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
          }
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE' });
      }
      setHasInitialized(true);
    };

    // Only run initAuth once on mount
    initAuth();
  }, [hasInitialized]);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response.data);
      
      // Handle different response formats
      let responseData;
      if (response.data && response.data.data) {
        responseData = response.data.data;
      } else if (response.data && (response.data.user || response.data.token)) {
        responseData = response.data;
      } else {
        responseData = response.data;
      }
      
      const user = responseData.user;
      const token = responseData.token;
      
      if (!user || !token) {
        console.error('Missing user or token in response:', responseData);
        throw new Error('Invalid response from server');
      }
      
      // Store token as plain string (not JSON stringified)
      localStorage.setItem('auth_token', token);
      storage.set('user', user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      // Mark as initialized after successful login
      setHasInitialized(true);
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method
        }
      });
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  // Register function
  const register = async (name, email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authAPI.register({ name, email, password });
      const responseData = response.data.data || response.data;
      const { user, token } = responseData;
      
      // Store token as plain string (not JSON stringified)
      localStorage.setItem('auth_token', token);
      storage.set('user', user);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      // Mark as initialized after successful registration
      setHasInitialized(true);
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    }
    localStorage.removeItem('auth_token');
    storage.remove('user');
    dispatch({ type: 'LOGOUT' });
  };

  // Update user function
  const updateUser = (user) => {
    storage.set('user', user);
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

