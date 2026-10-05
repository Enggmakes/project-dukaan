import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home,
  User, 
  LogOut, 
  ShoppingBag, 
  Sparkles, 
  Info, 
  MessageSquare, 
  ShieldCheck, 
  ArrowUpRight,
  MoreHorizontal,
  X,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";
import { isUserAdmin, checkAdminStatus } from "@/lib/authUtils";

const desktopLinks = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/custom-request", label: "Custom Build" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

let cachedUser: SupabaseUser | null = null;
let cachedIsAdmin: boolean = false;
let hasCheckedAuth: boolean = false;

const getInitialAuth = (): { user: SupabaseUser | null; isAdmin: boolean; hasChecked: boolean } => {
  if (hasCheckedAuth) {
    return { user: cachedUser, isAdmin: cachedIsAdmin, hasChecked: true };
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.user) {
            cachedUser = parsed.user;
            cachedIsAdmin = isUserAdmin(parsed.user);
            hasCheckedAuth = true;
            return { user: cachedUser, isAdmin: cachedIsAdmin, hasChecked: true };
          }
        }
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return { user: null, isAdmin: false, hasChecked: false };
};

export default function Navbar() {
  const initialAuth = getInitialAuth();
  const [isAdmin, setIsAdmin] = useState(initialAuth.isAdmin);
  const [user, setUser] = useState<SupabaseUser | null>(initialAuth.user);
  const [authChecked, setAuthChecked] = useState(initialAuth.hasChecked);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    cachedUser = null;
    cachedIsAdmin = false;
    hasCheckedAuth = true;
    setUser(null);
    setIsAdmin(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    const updateWishlist = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("projectdukaan_wishlist") || "[]");
        setWishlistCount(saved.length);
      } catch {}
    };
    updateWishlist();
    window.addEventListener("wishlist-updated", updateWishlist);
    return () => window.removeEventListener("wishlist-updated", updateWishlist);
  }, []);

  useEffect(() => {
    const verifyUser = async (currentUser: any) => {
      if (!currentUser) {
        cachedUser = null;
        cachedIsAdmin = false;
        hasCheckedAuth = true;
        setUser(null);
        setIsAdmin(false);
        setAuthChecked(true);
        return;
      }
      cachedUser = currentUser;
      setUser(currentUser);
      const admin = await checkAdminStatus(currentUser);
      cachedIsAdmin = admin;
      hasCheckedAuth = true;
      setIsAdmin(admin);
      setAuthChecked(true);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      verifyUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      verifyUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const visibleDesktopLinks = isAdmin 
    ? [...desktopLinks, { to: "/admin", label: "Admin" }]
    : desktopLinks;

  return (
    <>
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. DESKTOP STICKY NAVBAR                                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#070a12]/95 backdrop-blur-md border-b border-slate-800 shadow-md hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name with Retro Workstation LED */}
          <Link to="/" className="flex items-center gap-2.5 group select-none">
            <div className="relative">
              <img 
                src="/logo-white.png" 
                alt="ProjectDukaan" 
                className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-105" 
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-white tracking-tight text-lg font-mono">
                Project<span className="text-amber-400">Dukaan</span>
              </span>
              <span className="font-mono text-[9px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-1 py-0.2 rounded select-none">
                V2.6
              </span>
            </div>
          </Link>

          {/* Central Navigation Links with Retro Workstation Hotkeys */}
          <nav className="flex items-center gap-1 p-1 rounded-md bg-[#0d121e] border border-slate-800 font-mono">
            {visibleDesktopLinks.map((l, idx) => {
              const isActive = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              const fKey = `F${idx + 1}`;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "relative px-3 py-1.5 text-xs font-semibold rounded transition-colors duration-150 select-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap retro-btn",
                    isActive
                      ? "text-amber-950 font-bold bg-amber-500 border border-amber-400 shadow-xs"
                      : "text-slate-400 hover:text-amber-400 bg-transparent"
                  )}
                >
                  <span className={cn("text-[10px]", isActive ? "text-amber-950 font-black" : "text-slate-500")}>
                    [{fKey}]
                  </span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right: Telemetry, Wishlist, Notification, Profile / Auth */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-[#0d121e] px-2 py-1 rounded border border-slate-800 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="text-emerald-400 font-semibold">115200 BAUD</span>
            </div>
            <Link 
              to="/wishlist" 
              className="relative p-2 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-800"
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-amber-950 font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <NotificationBell />

            {!authChecked && !user ? (
              <div className="w-8 h-8 rounded-md bg-slate-800 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-md flex items-center gap-2 p-1 h-9 hover:bg-slate-800 border border-slate-800">
                    <div className="w-7 h-7 rounded bg-amber-500 text-amber-950 grid place-items-center text-xs font-mono font-bold shadow-xs">
                      {user.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0d121e] border border-slate-800 rounded-md shadow-2xl p-1.5 text-slate-200">
                  <div className="px-3 py-2 text-xs text-slate-400 truncate mb-1 border-b border-slate-800">
                    <p className="font-semibold text-white truncate font-mono">{user.email?.split("@")[0]}</p>
                    <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
                  </div>
                  <DropdownMenuItem className="rounded cursor-pointer py-2 hover:bg-slate-800/80 text-slate-200 font-medium text-xs font-mono" onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2 text-amber-400" /> My Profile & Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded cursor-pointer py-2 hover:bg-slate-800/80 text-slate-200 font-medium text-xs font-mono" onClick={() => navigate("/wishlist")}>
                    <Heart className="w-4 h-4 mr-2 text-rose-400" /> My Saved Wishlist
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="rounded cursor-pointer py-2 hover:bg-slate-800/80 text-slate-200 font-medium text-xs font-mono" onClick={() => navigate("/admin")}>
                      <ShieldCheck className="w-4 h-4 mr-2 text-cyan-400" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-400 rounded cursor-pointer py-2 hover:bg-rose-950/40 font-medium text-xs font-mono">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/marketplace" 
                  className="retro-btn bg-[#0d121e] hover:bg-[#161d2d] text-cyan-400 font-mono font-bold text-xs px-3 py-1.5 rounded border border-slate-700 hover:border-cyan-500/60 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span className="text-[10px] text-cyan-500">[::]</span>
                  <span>BLUEPRINTS</span>
                </Link>
                <Link 
                  to="/login" 
                  className="retro-btn bg-amber-500 hover:bg-amber-400 text-amber-950 font-mono font-black text-xs px-3.5 py-1.5 rounded flex items-center gap-1.5 shadow-[0_2px_0_#92400e] border border-amber-300 active:translate-y-0.5 transition-all"
                >
                  <User className="w-3.5 h-3.5 text-amber-950" />
                  <span>SIGN IN</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP HEADER (Dark Retro Workstation Brand Bar)                   */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 flex md:hidden items-center justify-between px-4 py-2.5 bg-[#070a12]/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <Link to="/" className="flex items-center gap-2 select-none">
          <div className="relative">
            <img src="/logo-white.png" alt="ProjectDukaan" className="w-7 h-7 object-contain" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
          </div>
          <span className="font-extrabold text-white tracking-tight text-base font-mono">
            Project<span className="text-amber-400">Dukaan</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/wishlist" className="relative p-1.5 text-slate-400 hover:text-amber-400" title="Wishlist">
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-500 text-amber-950 font-mono text-[8px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <NotificationBell />
          {user ? (
            <Link to="/profile" className="w-7 h-7 rounded bg-amber-500 text-amber-950 grid place-items-center text-xs font-mono font-bold shadow-xs border border-amber-400">
              {user.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </Link>
          ) : (
            <Link 
              to="/login"
              className="retro-btn bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-amber-950 font-mono font-black text-xs px-3 py-1.5 rounded border border-amber-300 shadow-[0_2px_0_#92400e] flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-amber-950" />
              <span>SIGN IN</span>
            </Link>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE BOTTOM FLOATING DOCK (Loved by user)                             */}
      {/* ========================================================================= */}
      <div className="fixed bottom-3.5 inset-x-0 z-50 flex md:hidden justify-center pointer-events-none px-4">
        <nav className="pointer-events-auto w-full max-w-[400px] bg-slate-950/95 text-white border border-slate-800/80 rounded-2xl px-3 py-2 shadow-2xl flex items-center justify-between backdrop-blur-md">
          
          {/* Tab 1: Home */}
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-xl relative cursor-pointer",
              isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {({ isActive }) => (
              <>
                <Home className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-medium tracking-tight">Home</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-bottom-dot" 
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" 
                  />
                )}
              </>
            )}
          </NavLink>

          {/* Tab 2: Marketplace */}
          <NavLink 
            to="/marketplace" 
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-xl relative cursor-pointer",
              isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {({ isActive }) => (
              <>
                <ShoppingBag className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-medium tracking-tight">Shop</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-bottom-dot" 
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" 
                  />
                )}
              </>
            )}
          </NavLink>

          {/* Tab 3: Elevated Center Custom Build Capsule */}
          <NavLink 
            to="/custom-request" 
            className="flex flex-col items-center justify-center flex-1 relative -mt-6 group cursor-pointer"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "w-11 h-11 rounded-xl grid place-items-center transition-all shadow-md border-2 border-slate-950",
                  isActive 
                    ? "bg-white text-blue-600 shadow-blue-500/25 scale-105" 
                    : "bg-blue-600 text-white shadow-blue-600/25 hover:scale-105 active:scale-95"
                )}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className={cn(
                  "text-[9px] font-bold mt-0.5 tracking-tight",
                  isActive ? "text-blue-400" : "text-slate-300"
                )}>
                  Custom
                </span>
              </>
            )}
          </NavLink>

          {/* Tab 4: Contact / Help */}
          <NavLink 
            to="/contact" 
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-xl relative cursor-pointer",
              isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {({ isActive }) => (
              <>
                <MessageSquare className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-medium tracking-tight">Help</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-bottom-dot" 
                    className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-0.5" 
                  />
                )}
              </>
            )}
          </NavLink>

          {/* Tab 5: More Drawer Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 transition-all text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">More</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 4. MOBILE SLIDE-UP SHEET FOR SECONDARY LINKS & AUTH                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed bottom-0 inset-x-0 bg-[#0a0e17] rounded-t-2xl p-6 pb-24 z-50 md:hidden border-t border-slate-800 shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <img src="/logo-white.png" alt="ProjectDukaan" className="w-7 h-7 object-contain" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  </div>
                  <span className="font-extrabold text-white text-base font-mono">Project<span className="text-amber-400">Dukaan</span></span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-md bg-slate-900 border border-slate-800 grid place-items-center text-slate-400 hover:text-white hover:border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Section inside Sheet */}
              {user ? (
                <div className="mt-4 p-3.5 rounded-lg bg-[#0d121e] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded bg-amber-500 text-amber-950 font-mono font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                      {user.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate font-mono">{user.email?.split("@")[0]}</p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full retro-btn rounded text-xs font-mono font-bold h-9 bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800">
                      [SYS_LOGIN]
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full retro-btn rounded bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-mono font-bold h-9 shadow-xs border border-amber-400">
                      JOIN FREE
                    </Button>
                  </Link>
                </div>
              )}

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <Link 
                  to="/wishlist" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-lg bg-[#0d121e] border border-slate-800 hover:border-amber-500/50 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 grid place-items-center text-rose-400">
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block font-mono">Wishlist</span>
                    <span className="text-[10px] text-slate-400 font-mono">Saved projects</span>
                  </div>
                </Link>

                <Link 
                  to="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-lg bg-[#0d121e] border border-slate-800 hover:border-amber-500/50 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 grid place-items-center text-amber-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block font-mono">Orders</span>
                    <span className="text-[10px] text-slate-400 font-mono">Track blueprints</span>
                  </div>
                </Link>

                <Link 
                  to="/about" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-lg bg-[#0d121e] border border-slate-800 hover:border-amber-500/50 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 grid place-items-center text-cyan-400">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block font-mono">About</span>
                    <span className="text-[10px] text-slate-400 font-mono">Our mission</span>
                  </div>
                </Link>

                <Link 
                  to="/contact" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-lg bg-[#0d121e] border border-slate-800 hover:border-amber-500/50 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 grid place-items-center text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block font-mono">Contact</span>
                    <span className="text-[10px] text-slate-400 font-mono">Hotline & Discord</span>
                  </div>
                </Link>

                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="col-span-2 p-3.5 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-300 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-amber-500 text-amber-950 grid place-items-center shadow-xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block font-mono">Admin Dashboard</span>
                        <span className="text-[10px] text-amber-400/80 font-mono">Manage blueprints & orders</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
