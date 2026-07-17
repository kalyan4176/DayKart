import { createSlice } from '@reduxjs/toolkit';

const getLocalStorageItem = (key) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
  return null;
};

const getLocalStorageString = (key) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) || null;
  }
  return null;
};

const initialState = {
  user: getLocalStorageItem('user'),
  token: getLocalStorageString('token'),
  refreshToken: getLocalStorageString('refreshToken'),
  isAuthenticated: !!getLocalStorageString('token'),
  darkMode: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.token = accessToken;
      if (refreshToken) {
        state.refreshToken = refreshToken;
      }
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    },
    toggleDarkMode: (state) => {
      state.darkMode = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', 'false');
        document.documentElement.classList.remove('dark');
      }
    },
    initTheme: (state) => {
      state.darkMode = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', 'false');
        document.documentElement.classList.remove('dark');
      }
    }
  },
});

export const { setCredentials, updateUser, logoutUser, toggleDarkMode, initTheme } = authSlice.actions;
export default authSlice.reducer;
