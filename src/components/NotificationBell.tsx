import { Bell, Sparkles, ArrowRight, Radio, Package } from "lucide-react";
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
    <div className="relative font-mono" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className={cn(
          "relative w-9 h-9 rounded-lg grid place-items-center transition-all duration-200 cursor-pointer",
          open
            ? "bg-[#090e1c] text-amber-400 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            : "hover:bg-slate-800/80 text-slate-400 hover:text-white border border-transparent hover:border-slate-800"
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black grid place-items-center animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel - Cyber-Deck Dark Theme */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#090e1c] border border-slate-800/90 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85)] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {/* Ambient Top Glow Line */}
          <div className="h-0.5 w-full bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20" />

          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#070a12]/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <h4 className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                SYS:\BROADCAST_FEED
              </h4>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#0d121e] border border-slate-800 text-slate-400">
              {notifications.length === 0 ? "STATUS: CAUGHT_UP" : `${notifications.length} NEW_DROPS`}
            </span>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#070a12] border border-slate-800 grid place-items-center mx-auto mb-3 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-xs font-mono font-bold text-white tracking-wide">NO_ACTIVE_TRANSMISSIONS</p>
                <p className="text-[11px] font-mono text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                  Repository index is synchronized. New blueprint drops will stream here live.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={`/project/${n.id}`}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-[#070a12] transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#070a12] flex-shrink-0 border border-slate-800 group-hover:border-amber-500/50 transition-colors">
                    {n.thumb ? (
                      <img src={n.thumb} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-bold text-slate-200 group-hover:text-amber-300 truncate transition-colors">
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono font-semibold bg-[#070a12] text-cyan-400 border border-slate-800 px-1.5 py-0.5 rounded">
                        {n.category}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        ₹{Number(n.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* New badge */}
                  <span className="text-[9px] font-mono font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    NEW_DROP
                  </span>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-800 bg-[#070a12] flex items-center justify-between">
            <Link
              to="/marketplace"
              onClick={() => setOpen(false)}
              className="text-xs font-mono font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>ACCESS_MARKETPLACE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[10px] font-mono text-slate-500">v2.6 // SECURE</span>
          </div>
        </div>
      )}
    </div>
  );
}
