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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";

const desktopLinks = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace", badge: "100+" },
  { to: "/custom-request", label: "Custom Build", badge: "Fast" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/admin", label: "Admin" },
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
            cachedIsAdmin = parsed.user.email === import.meta.env.VITE_ADMIN_EMAIL;
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      const admin = currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL;
      cachedUser = currentUser;
      cachedIsAdmin = admin;
      hasCheckedAuth = true;
      setUser(currentUser);
      setIsAdmin(admin);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      const admin = currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL;
      cachedUser = currentUser;
      cachedIsAdmin = admin;
      hasCheckedAuth = true;
      setUser(currentUser);
      setIsAdmin(admin);
      setAuthChecked(true);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const visibleDesktopLinks = isAdmin 
    ? desktopLinks 
    : desktopLinks.filter(l => l.to !== "/admin");

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP FLOATING TACTILE CAPSULE DOCK (Mondly x Grubbe Style)          */}
      {/* ========================================================================= */}
      <header className="fixed top-0 inset-x-0 z-50 py-3.5 hidden md:flex justify-center pointer-events-none px-6">
        <nav className="pointer-events-auto max-w-5xl w-full mx-auto flex items-center justify-between px-4 py-2 rounded-full bg-white/85 backdrop-blur-2xl border border-slate-200/80 shadow-[0_10px_35px_-4px_rgba(15,23,42,0.08)] transition-all">
          
          {/* Brand Logo & Tag */}
          <Link to="/" className="flex items-center gap-2.5 pl-2 group select-none">
            <img 
              src="/logo.png" 
              alt="ProjectDukaan" 
              className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="font-black text-slate-900 tracking-tight text-base">
              Project<span className="text-indigo-600">Dukaan</span>
            </span>
          </Link>

          {/* Central Sliding Pill Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100/80 border border-slate-200/60 relative">
            {visibleDesktopLinks.map(l => {
              const isActive = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors duration-150 select-none flex items-center gap-1.5 z-10 cursor-pointer",
                    isActive
                      ? "text-indigo-600 font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {/* Butter-smooth active sliding pill indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="desktop-active-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-xs border border-slate-200/90 -z-10 pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                    />
                  )}
                  <span>{l.label}</span>
                  {l.badge && (
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none",
                      isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"
                    )}>
                      {l.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Side: Actions & Profile */}
          <div className="flex items-center gap-2.5 pr-1">
            <NotificationBell />

            {!authChecked && !user ? (
              <div className="w-8 h-8 rounded-full bg-slate-100/60 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full flex items-center gap-2 p-1 h-9 hover:bg-slate-100/80">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 grid place-items-center text-white text-xs font-bold shadow-xs transition-transform hover:scale-105">
                      {user.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 text-xs text-slate-500 truncate mb-1 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user.email?.split("@")[0]}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem className="rounded-xl cursor-pointer py-2 hover:bg-slate-50 text-slate-800 font-medium text-xs" onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2 text-indigo-600" /> My Profile & Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="rounded-xl cursor-pointer py-2 hover:bg-slate-50 text-slate-800 font-medium text-xs" onClick={() => navigate("/admin")}>
                      <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600 rounded-xl cursor-pointer py-2 hover:bg-rose-50 font-medium text-xs">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link to="/login">
                  <Button variant="ghost" className="rounded-full text-slate-700 hover:text-slate-900 text-xs font-semibold h-8 px-3">
                    Sign in
                  </Button>
                </Link>
                <Link to="/marketplace">
                  <Button className="rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 h-8 shadow-xs transition-all active:scale-95">
                    Explore Blueprints <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP MINIMAL BRAND HEADER                                        */}
      {/* ========================================================================= */}
      <header className="fixed top-2.5 inset-x-3 z-40 flex md:hidden items-center justify-between px-3.5 py-2 rounded-2xl bg-white/95 border border-slate-200/90 shadow-xs transform-gpu will-change-transform">
        <Link to="/" className="flex items-center gap-2 select-none">
          <img src="/logo.png" alt="ProjectDukaan" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-slate-900 tracking-tight text-base">
            Project<span className="text-indigo-600">Dukaan</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell />
          {user ? (
            <Link to="/profile" className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center text-xs font-bold shadow-xs">
              {user.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </Link>
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline" className="rounded-full text-xs font-bold h-7 px-2.5 border-slate-200 text-slate-800">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. MOBILE FLOATING BOTTOM NAVIGATION ISLAND (Grubbe Style)                 */}
      {/* ========================================================================= */}
      <div className="fixed bottom-3 inset-x-0 z-50 flex md:hidden justify-center pointer-events-none px-4 transform-gpu will-change-transform">
        <nav className="pointer-events-auto w-full max-w-sm bg-slate-950/95 text-white border border-white/10 rounded-full px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] flex items-center justify-between">
          
          {/* Tab 1: Home */}
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-full relative cursor-pointer",
              isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {({ isActive }) => (
              <>
                <Home className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] tracking-tight">Home</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-bottom-dot" 
                    className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" 
                  />
                )}
              </>
            )}
          </NavLink>

          {/* Tab 2: Marketplace */}
          <NavLink 
            to="/marketplace" 
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-full relative cursor-pointer",
              isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {({ isActive }) => (
              <>
                <ShoppingBag className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] tracking-tight">Shop</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-bottom-dot" 
                    className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" 
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
                  "w-11 h-11 rounded-full grid place-items-center transition-all shadow-lg border-2 border-slate-950",
                  isActive 
                    ? "bg-white text-indigo-600 shadow-indigo-500/50 scale-105" 
                    : "bg-indigo-600 text-white shadow-indigo-600/40 hover:scale-105 active:scale-95"
                )}>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <span className={cn(
                  "text-[9px] font-bold mt-1 tracking-tight",
                  isActive ? "text-indigo-400" : "text-slate-300"
                )}>
                  Custom
                </span>
              </>
            )}
          </NavLink>

          {/* Tab 4: Contact / Support */}
          <NavLink 
            to="/contact" 
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-full relative cursor-pointer",
              isActive ? "text-white font-bold" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {({ isActive }) => (
              <>
                <MessageSquare className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] tracking-tight">Help</span>
                {isActive && (
                  <motion.div 
                    layoutId="mobile-bottom-dot" 
                    className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" 
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
            <span className="text-[10px] tracking-tight">More</span>
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
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[2rem] p-6 pb-24 z-50 md:hidden border-t border-slate-200 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="ProjectDukaan" className="w-7 h-7 object-contain" />
                  <span className="font-extrabold text-slate-900 text-lg">Project<span className="text-indigo-600">Dukaan</span></span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 grid place-items-center text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Section inside Sheet */}
              {user ? (
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {user.email ? user.email[0].toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.email?.split("@")[0]}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full text-xs font-bold h-10 border-slate-200">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-10 shadow-xs">
                      Join Free
                    </Button>
                  </Link>
                </div>
              )}

              {/* Navigation Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <Link 
                  to="/about" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-white grid place-items-center text-indigo-600 shadow-2xs">
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
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-white grid place-items-center text-indigo-600 shadow-2xs">
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
                    className="col-span-2 p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white grid place-items-center shadow-2xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block">Admin Dashboard</span>
                        <span className="text-[10px] text-purple-600">Manage orders, blueprints & users</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-purple-600" />
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
