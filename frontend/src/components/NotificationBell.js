'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  Loader2, 
  ShoppingBag, 
  Info, 
  AlertTriangle, 
  Sparkles
} from 'lucide-react';
import { 
  useGetNotificationsQuery, 
  useMarkNotificationReadMutation, 
  useMarkAllNotificationsReadMutation, 
  useDeleteNotificationMutation 
} from '@/store/api';

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const { data: notificationsRes, isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();

  const notifications = notificationsRes?.data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    if (!notif.read) {
      await markRead(notif._id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'promotion':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-805/45 rounded-full transition active:scale-95 flex items-center justify-center"
        aria-label="View Notifications"
      >
        <Bell className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-secondary text-white font-black text-[8px] sm:text-[9px] rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-[-48px] sm:right-0 mt-3.5 w-[88vw] sm:w-[360px] max-h-[460px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 shadow-xl z-[100] flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-805/70 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <div>
              <h3 className="text-xxs font-black text-slate-900 dark:text-white uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
                  {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
                className="inline-flex items-center gap-1 text-[9px] font-extrabold text-secondary hover:text-cyan-600 disabled:opacity-50 transition"
              >
                {isMarkingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[300px] scrollbar-thin">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-5 h-5 text-secondary animate-spin" />
                <span className="text-[10px] font-bold text-slate-400">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 text-slate-400 rounded-full mb-3">
                  <Bell className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">All caught up!</h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                  You have no notifications yet. Status updates will show up here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`group relative px-5 py-3.5 flex gap-3.5 items-start hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all duration-200 cursor-pointer ${
                    !notif.read ? 'bg-cyan-50/15 dark:bg-cyan-950/5 border-l-2 border-secondary' : 'pl-[22px]'
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {/* Icon Block */}
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h5 className="text-[11px] font-black text-slate-850 dark:text-slate-200 leading-tight">
                      {notif.title}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[8px] font-extrabold text-slate-400 dark:text-slate-550 block mt-1 tracking-wider uppercase">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotif(notif._id);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-350 dark:text-slate-650 hover:bg-red-50 dark:hover:bg-red-955/10 hover:text-red-650 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
