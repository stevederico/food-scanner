import React, { createContext, useContext, useReducer } from 'react';
import constants from './constants.json';

const context = createContext();

// Create app-specific storage key
const getStorageKey = () => {
  const appName = constants.appName || 'food-scan';
  return `${appName.toLowerCase().replace(/\s+/g, '-')}_user`;
};

// Safely parse user from localStorage
const getInitialUser = () => {
  try {
    const storageKey = getStorageKey();
    const storedUser = localStorage.getItem(storageKey);
    if (!storedUser || storedUser === "undefined") return null;
    return JSON.parse(storedUser);
  } catch (e) {
    return null;
  }
};

const initialState = { user: getInitialUser() };

function reducer(state, action) {
  try {
    const storageKey = getStorageKey();
    const appName = constants.appName || 'food-scan';
    const csrfKey = `${appName.toLowerCase().replace(/\s+/g, '-')}_csrf`;

    switch (action.type) {
      case 'SET_USER':
        console.log("SET_USER: ", action.payload);
        localStorage.setItem(storageKey, JSON.stringify(action.payload));
        return { ...state, user: action.payload };
      case 'CLEAR_USER':
        localStorage.removeItem(storageKey);
        localStorage.removeItem(csrfKey); // Clear CSRF token
        return { ...state, user: null };
      default:
        return state;
    }
  } catch (e) {
    return state;
  }
}

export function ContextProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <context.Provider value={{ state, dispatch }}>{children}</context.Provider>;
}

export function getState() {
  return useContext(context);
}