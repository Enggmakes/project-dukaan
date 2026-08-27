import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className={cn(
          "relative w-9 h-9 rounded-full grid place-items-center transition-all duration-200",
          "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold grid place-items-center animate-pulse shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">🔔 New Projects</h4>
            <span className="text-[11px] text-slate-500 font-medium">
              {notifications.length === 0 ? "All caught up!" : `${notifications.length} new`}
            </span>
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm text-slate-600 font-medium">No new projects yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">We'll notify you when something drops!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={`/project/${n.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200/60">
                    {n.thumb ? (
                      <img src={n.thumb} alt={n.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-lg">📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                        {n.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ₹{n.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* New badge */}
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                    NEW
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <Link
              to="/marketplace"
              onClick={() => setOpen(false)}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Browse all projects →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
