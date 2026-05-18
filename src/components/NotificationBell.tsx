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
          "hover:bg-secondary text-muted-foreground hover:text-navy"
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-xl border border-border rounded-2xl shadow-elegant overflow-hidden z-50 animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h4 className="text-sm font-semibold text-navy">🔔 New Projects</h4>
            <span className="text-[11px] text-muted-foreground">
              {notifications.length === 0 ? "All caught up!" : `${notifications.length} new`}
            </span>
          </div>

          {/* Notification List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm text-muted-foreground">No new projects yet.</p>
                <p className="text-[11px] text-muted-foreground mt-1">We'll notify you when something drops!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={`/project/${n.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors border-b border-border/50 last:border-0"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                    {n.thumb ? (
                      <img src={n.thumb} alt={n.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-lg">📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                        {n.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ₹{n.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* New badge */}
                  <span className="text-[9px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                    NEW
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-secondary/30">
            <Link
              to="/marketplace"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline font-medium"
            >
              Browse all projects →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
