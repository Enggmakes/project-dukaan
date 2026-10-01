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
      {/* 1. DESKTOP STICKY NAVBAR                                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name (No LABS badge) */}
          <Link to="/" className="flex items-center gap-2.5 group select-none">
            <img 
              src="/logo.png" 
              alt="ProjectDukaan" 
              className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              Project<span className="text-blue-600">Dukaan</span>
            </span>
          </Link>

          {/* Central Navigation Links */}
          <nav className="flex items-center gap-1 p-1 rounded-lg bg-slate-100/70 border border-slate-200/80">
            {visibleDesktopLinks.map(l => {
              const isActive = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "relative px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 select-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
                    isActive
                      ? "text-blue-600 font-bold"
                      : "text-slate-600 hover:text-slate-950"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktop-active-pill"
                      className="absolute inset-0 bg-white rounded-md shadow-xs border border-slate-200 -z-10 pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                    />
                  )}
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right: Wishlist, Notification, Profile / Auth (NO search bar) */}
          <div className="flex items-center gap-2.5">
            <Link 
              to="/wishlist" 
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <NotificationBell />

            {!authChecked && !user ? (
              <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-lg flex items-center gap-2 p-1 h-9 hover:bg-slate-100">
                    <div className="w-7 h-7 rounded-md bg-slate-900 grid place-items-center text-white text-xs font-mono font-bold shadow-xs">
                      {user.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 text-xs text-slate-500 truncate mb-1 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user.email?.split("@")[0]}</p>
                    <p className="text-[11px] text-slate-400 truncate font-mono">{user.email}</p>
                  </div>
                  <DropdownMenuItem className="rounded-lg cursor-pointer py-2 hover:bg-slate-50 text-slate-800 font-medium text-xs" onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2 text-blue-600" /> My Profile & Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer py-2 hover:bg-slate-50 text-slate-800 font-medium text-xs" onClick={() => navigate("/wishlist")}>
                    <Heart className="w-4 h-4 mr-2 text-rose-500" /> My Saved Wishlist
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="rounded-lg cursor-pointer py-2 hover:bg-slate-50 text-slate-800 font-medium text-xs" onClick={() => navigate("/admin")}>
                      <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600 rounded-lg cursor-pointer py-2 hover:bg-rose-50 font-medium text-xs">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="rounded-lg text-slate-700 hover:text-slate-900 text-xs font-semibold h-8 px-3">
                    Sign in
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 h-8 shadow-xs transition-all active:scale-95">
                    Explore Blueprints <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP HEADER (Natural clean brand bar)                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 flex md:hidden items-center justify-between px-4 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <Link to="/" className="flex items-center gap-2 select-none">
          <img src="/logo.png" alt="ProjectDukaan" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-slate-900 tracking-tight text-base">
            Project<span className="text-blue-600">Dukaan</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/wishlist" className="relative p-1.5 text-slate-600 hover:text-rose-600" title="Wishlist">
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-mono text-[8px] font-bold flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>
          <NotificationBell />
          {user ? (
            <Link to="/profile" className="w-7 h-7 rounded-md bg-slate-900 text-white grid place-items-center text-xs font-mono font-bold shadow-xs">
              {user.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </Link>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold h-7 px-2.5 border-slate-200 text-slate-800">
                Sign in
              </Button>
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
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 pb-24 z-50 md:hidden border-t border-slate-200 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="ProjectDukaan" className="w-7 h-7 object-contain" />
                  <span className="font-extrabold text-slate-900 text-base">Project<span className="text-blue-600">Dukaan</span></span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 grid place-items-center text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Section inside Sheet */}
              {user ? (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                      {user.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user.email?.split("@")[0]}</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-lg text-xs font-semibold h-9 border-slate-200">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 shadow-xs">
                      Join Free
                    </Button>
                  </Link>
                </div>
              )}

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <Link 
                  to="/wishlist" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 hover:bg-rose-100/60 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white grid place-items-center text-rose-500 shadow-2xs">
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Wishlist</span>
                    <span className="text-[10px] text-slate-500">Saved projects</span>
                  </div>
                </Link>

                <Link 
                  to="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white grid place-items-center text-blue-600 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Orders</span>
                    <span className="text-[10px] text-slate-500">Track shipments</span>
                  </div>
                </Link>

                <Link 
                  to="/about" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white grid place-items-center text-blue-600 shadow-2xs">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">About</span>
                    <span className="text-[10px] text-slate-500">Our mission</span>
                  </div>
                </Link>

                <Link 
                  to="/contact" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-white grid place-items-center text-blue-600 shadow-2xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Contact</span>
                    <span className="text-[10px] text-slate-500">Get 24/7 help</span>
                  </div>
                </Link>

                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="col-span-2 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white grid place-items-center shadow-xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Admin Dashboard</span>
                        <span className="text-[10px] text-blue-600">Manage orders, blueprints & users</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-blue-600" />
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
