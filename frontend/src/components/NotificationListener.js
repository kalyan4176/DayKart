'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from '@/components/ToastProvider';
import { api } from '@/store/api';
import { setCredentials, logoutUser } from '@/store/authSlice';

export default function NotificationListener() {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const { showToast } = useToast();
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (!isAuthenticated || !token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api/v1';
    let eventSource;
    let retryTimeout;
    let retryCount = 0;
    const maxRetries = 5;

    const refreshAccessToken = async () => {
      try {
        const response = await fetch(`${apiUrl}/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        if (response.ok) {
          const resData = await response.json();
          if (resData?.accessToken) {
            dispatch(setCredentials({
              user: resData.data?.user,
              accessToken: resData.accessToken,
            }));
            return resData.accessToken;
          }
        }
      } catch (err) {
        console.error('Silent token refresh failed:', err);
      }
      return null;
    };

    const connectSSE = () => {
      try {
        eventSource = new EventSource(`${apiUrl}/notifications/stream?token=${token}`, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          retryCount = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Skip handshake frame or heartbeats
            if (data.connected || !data.title) return;

            // Trigger beautiful custom toast message
            showToast(
              <div className="flex flex-col gap-0.5 text-left">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  {data.title}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                  {data.message}
                </span>
              </div>,
              'info'
            );

            // Invalidate the RTK Query cache to instantly refresh the unread count/dropdown lists
            dispatch(api.util.invalidateTags(['Notifications']));
          } catch (err) {
            // Keep parsing robust in case of heartbeat text
          }
        };

        eventSource.onerror = async (err) => {
          console.warn('SSE stream disconnected, checking authentication token...');
          eventSource.close();
          clearTimeout(retryTimeout);
          
          // Attempt silent token refresh
          const newToken = await refreshAccessToken();
          if (!newToken) {
            console.warn('Token expired or invalid during SSE reconnect. Logging out user.');
            dispatch(logoutUser());
            return;
          }
          
          if (retryCount < maxRetries) {
            retryCount++;
            const backoffTime = Math.min(30000, 2000 * Math.pow(2, retryCount));
            retryTimeout = setTimeout(connectSSE, backoffTime);
          } else {
            console.error('SSE connection failed repeatedly. Stopping retries until authentication status changes.');
          }
        };
      } catch (err) {
        console.error('Failed to initialize SSE EventSource:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(retryTimeout);
    };
  }, [isAuthenticated, token, dispatch, showToast]);

  return null;
}
