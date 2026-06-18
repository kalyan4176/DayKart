'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { useEffect } from 'react';
import { initTheme } from '@/store/authSlice';
import ToastProvider from '@/components/ToastProvider';

export default function StoreProvider({ children }) {
  useEffect(() => {
    store.dispatch(initTheme());
  }, []);

  return (
    <Provider store={store}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </Provider>
  );
}
