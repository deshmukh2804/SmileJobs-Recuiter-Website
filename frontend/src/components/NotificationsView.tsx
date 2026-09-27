import React from 'react';
import { NotificationItem, AppRoute } from '../types';
import {
  Bell,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCheck,
} from 'lucide-react';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onNavigate,
}) => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'application':
        return <CheckCircle2 className="w-4 h-4 text-[#42326E]" />;
      case 'verification':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'interview':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'system':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C1B57] tracking-tight">
            Notifications Center
          </h1>
          <p className="text-sm text-[#6F687A] mt-1">
            Real-time updates on candidate applications, verifications, and interview bookings.
          </p>
        </div>

        <button
          onClick={onMarkAllAsRead}
          className="px-3.5 py-1.5 bg-white border border-[#E8E3EF] hover:border-[#D7C8ED] text-xs font-bold text-[#2C1B57] rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E8E3EF] shadow-xs divide-y divide-[#EFEAF6] overflow-hidden">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => n.linkRoute && onNavigate(n.linkRoute)}
            className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
              !n.read ? 'bg-[#EDE6FA]/30 hover:bg-[#EDE6FA]/60' : 'hover:bg-[#FCFCF7]'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E3EF] shadow-2xs flex items-center justify-center shrink-0">
              {getIcon(n.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#2C1B57] truncate">
                  {n.title}
                </h3>
                <span className="text-[10px] text-[#6F687A] font-medium shrink-0">
                  {n.time}
                </span>
              </div>
              <p className="text-xs text-[#49454F] mt-1 leading-relaxed">{n.body}</p>
            </div>

            {!n.read && (
              <span className="w-2 h-2 rounded-full bg-[#42326E] shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
