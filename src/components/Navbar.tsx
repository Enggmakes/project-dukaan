import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Home,
  Menu, 
  X, 
  User, 
  LogOut, 
  ShoppingBag, 
  Sparkles, 
  Info, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";

const links = [
  { to: "/", label: "Home", icon: Home, desc: "Main landing & featured showcase" },
  { to: "/marketplace", label: "Marketplace", icon: ShoppingBag, desc: "Explore ready-to-ship projects" },
  { to: "/custom-request", label: "Custom Build", icon: Sparkles, desc: "Order tailored software blueprints", badge: "Fast" },
  { to: "/about", label: "About", icon: Info, desc: "Our mission & background" },
  { to: "/contact", label: "Contact", icon: MessageSquare, desc: "Support & project queries" },
  { to: "/admin", label: "Admin", icon: ShieldCheck, desc: "Control center & analytics" },
];

// Module-level auth cache to prevent flicker/glitch on page navigation
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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(initialAuth.isAdmin);
  const [user, setUser] = useState<SupabaseUser | null>(initialAuth.user);
  const [authChecked, setAuthChecked] = useState(initialAuth.hasChecked);
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
    let lastScrolled = window.scrollY > 12;
    setScrolled(lastScrolled);

    // Highly optimized passive scroll listener that only triggers state on boolean threshold change
    const onScroll = () => {
      const isScrolled = window.scrollY > 12;
      if (isScrolled !== lastScrolled) {
        lastScrolled = isScrolled;
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    
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
      window.removeEventListener("scroll", onScroll);
      subscription.unsubscribe();
    };
  }, []);

  const visibleLinks = isAdmin ? links : links.filter(l => l.to !== "/admin");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-[padding] duration-200 ease-out",
      scrolled ? "py-2.5" : "py-4"
    )}>
      <div className="container-px">
        <nav className={cn(
          "mx-auto max-w-6xl flex items-center justify-between rounded-full px-4 md:px-6 py-2 transition-[background-color,border-color,box-shadow] duration-200 relative z-50",
          scrolled ? "bg-white border border-slate-200 shadow-md" : "bg-white/95 border border-slate-200/80 shadow-sm"
        )}>
          <Link to="/" className="flex items-center gap-2 pl-2 group select-none">
            <img src="/logo.png" alt="ProjectDukaan" className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105" />
            <span className="font-bold text-slate-900 tracking-tight text-base">Project<span className="text-indigo-600">Dukaan</span></span>
          </Link>

          {/* Desktop Navigation - Butter Smooth Sliding Pill */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 border border-slate-200/70 relative">
            {visibleLinks.map(l => {
              const isActive = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-150 select-none block z-10 cursor-pointer",
                    isActive
                      ? "text-indigo-600 font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {/* Butter-smooth sliding active pill */}
                  {isActive && (
                    <motion.span
                      layoutId="desktop-active-pill"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/90 -z-10 pointer-events-none"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                    />
                  )}
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-2 min-w-[80px] justify-end">
            <NotificationBell />
            {!authChecked && !user ? (
              // Invisible spacer while initial cold check completes (prevents flashing 'Get started')
              <div className="w-8 h-8 rounded-full bg-slate-100/60 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full flex items-center gap-2 p-1 h-9 hover:bg-transparent">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 grid place-items-center text-white text-xs font-semibold shadow-sm transition-transform hover:scale-105">
                      <User className="w-4 h-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 text-xs text-slate-500 truncate mb-1 border-b border-slate-100 pb-2">
                    {user.email}
                  </div>
                  <DropdownMenuItem className="rounded-xl cursor-pointer py-2 mb-1 hover:bg-slate-50 text-slate-800 font-medium text-xs" onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2 text-indigo-600" /> My Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="rounded-xl cursor-pointer py-2 mb-1 hover:bg-slate-50 text-slate-800 font-medium text-xs" onClick={() => navigate("/admin")}>
                      <ShieldCheck className="w-4 h-4 mr-2 text-indigo-600" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600 rounded-xl cursor-pointer py-2 hover:bg-rose-50 font-medium text-xs">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" className="rounded-full text-slate-700 text-xs font-semibold">Sign in</Button></Link>
                <Link to="/register"><Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 shadow-sm">Get started →</Button></Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <NotificationBell />
            <button 
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border",
                open 
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                  : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100 active:scale-95"
              )} 
              onClick={() => setOpen(!open)} 
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
            >
              {open ? <X className="w-4 h-4 transition-transform duration-200 rotate-90" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown & Backdrop */}
        {open && (
          <>
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <div className="relative z-50 md:hidden mt-2.5 max-w-lg mx-auto animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl p-3.5 shadow-2xl shadow-slate-900/15 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
                
                {/* Header User / Guest Card */}
                {!authChecked && !user ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mb-3 animate-pulse h-16" />
                ) : user ? (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/80 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-white shrink-0">
                        {user.email ? user.email[0].toUpperCase() : <User className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {user.email?.split("@")[0]}
                          </span>
                          {isAdmin ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 leading-none">
                              Admin
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
                              Online
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[170px] mt-0.5">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setOpen(false); }}
                      title="Log out"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100/70 mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900">ProjectDukaan</p>
                      <p className="text-[11px] text-slate-500 truncate">Ship real blueprints today</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link to="/login" onClick={() => setOpen(false)}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-8 px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
                          Sign in
                        </Button>
                      </Link>
                      <Link to="/register" onClick={() => setOpen(false)}>
                        <Button size="sm" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-8 px-3 shadow-sm">
                          Join
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Bento Grid Navigation */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Bento Tile 0: Home */}
                  <NavLink
                    to="/"
                    end
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => cn(
                      "col-span-2 relative overflow-hidden rounded-2xl p-3 transition-all duration-200 group border text-left flex items-center justify-between",
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                        : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                          )}>
                            <Home className="w-4 h-4" />
                          </div>
                          <div>
                            <span className={cn(
                              "text-xs font-bold block",
                              isActive ? "text-white" : "text-slate-900"
                            )}>
                              Home
                            </span>
                            <span className={cn(
                              "text-[10px] block leading-tight",
                              isActive ? "text-slate-300" : "text-slate-500"
                            )}>
                              Landing page & featured showcase
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-4 h-4 shrink-0",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                        )} />
                      </>
                    )}
                  </NavLink>

                  {/* Bento Tile 1: Marketplace (Full Width) */}
                  <NavLink
                    to="/marketplace"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => cn(
                      "col-span-2 relative overflow-hidden rounded-2xl p-3.5 transition-all duration-200 group border text-left",
                      isActive
                        ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-600/20"
                        : "bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border-indigo-100/90 hover:border-indigo-300 hover:shadow-sm"
                    )}
                  >
                    {({ isActive }) => (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shrink-0 shadow-sm",
                            isActive ? "bg-white/20 text-white" : "bg-indigo-600 text-white shadow-indigo-600/20"
                          )}>
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-sm font-bold tracking-tight",
                                isActive ? "text-white" : "text-slate-900"
                              )}>
                                Marketplace
                              </span>
                              <span className={cn(
                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                                isActive ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                              )}>
                                100+ Projects
                              </span>
                            </div>
                            <p className={cn(
                              "text-[11px] leading-tight mt-1",
                              isActive ? "text-indigo-100" : "text-slate-500"
                            )}>
                              Explore ready-to-ship blueprints, code & docs
                            </p>
                          </div>
                        </div>
                        <ArrowUpRight className={cn(
                          "w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                        )} />
                      </div>
                    )}
                  </NavLink>

                  {/* Bento Tile 2: Custom Build */}
                  <NavLink
                    to="/custom-request"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => cn(
                      "col-span-1 relative overflow-hidden rounded-2xl p-3.5 transition-all duration-200 group border flex flex-col justify-between min-h-[112px] text-left",
                      isActive
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
                        : "bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 border-amber-100/90 hover:border-amber-300 hover:shadow-sm"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                            isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                          )}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                            isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                          )}>
                            Custom
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className={cn(
                            "text-xs font-bold block",
                            isActive ? "text-white" : "text-slate-900"
                          )}>
                            Custom Build
                          </span>
                          <span className={cn(
                            "text-[10px] leading-tight block mt-0.5",
                            isActive ? "text-amber-100" : "text-slate-500"
                          )}>
                            Bespoke delivery
                          </span>
                        </div>
                      </>
                    )}
                  </NavLink>

                  {/* Bento Tile 3: Contact & Support */}
                  <NavLink
                    to="/contact"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => cn(
                      "col-span-1 relative overflow-hidden rounded-2xl p-3.5 transition-all duration-200 group border flex flex-col justify-between min-h-[112px] text-left",
                      isActive
                        ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20"
                        : "bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 border-emerald-100/90 hover:border-emerald-300 hover:shadow-sm"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                            isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                          )}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                            isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                          )}>
                            Support
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className={cn(
                            "text-xs font-bold block",
                            isActive ? "text-white" : "text-slate-900"
                          )}>
                            Contact Us
                          </span>
                          <span className={cn(
                            "text-[10px] leading-tight block mt-0.5",
                            isActive ? "text-emerald-100" : "text-slate-500"
                          )}>
                            Queries & help
                          </span>
                        </div>
                      </>
                    )}
                  </NavLink>

                  {/* Bento Tile 4: About Us */}
                  <NavLink
                    to="/about"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => cn(
                      "col-span-1 relative overflow-hidden rounded-2xl p-3.5 transition-all duration-200 group border flex flex-col justify-between min-h-[112px] text-left",
                      isActive
                        ? "bg-gradient-to-br from-sky-600 to-blue-600 text-white border-sky-700 shadow-md shadow-sky-600/20"
                        : "bg-gradient-to-br from-sky-50/50 via-white to-slate-50 border-sky-100/90 hover:border-sky-300 hover:shadow-sm"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                            isActive ? "bg-white/20 text-white" : "bg-sky-100 text-sky-700"
                          )}>
                            <Info className="w-4 h-4" />
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                            isActive ? "bg-white/20 text-white" : "bg-sky-100 text-sky-800"
                          )}>
                            Mission
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className={cn(
                            "text-xs font-bold block",
                            isActive ? "text-white" : "text-slate-900"
                          )}>
                            About Us
                          </span>
                          <span className={cn(
                            "text-[10px] leading-tight block mt-0.5",
                            isActive ? "text-sky-100" : "text-slate-500"
                          )}>
                            Story & team
                          </span>
                        </div>
                      </>
                    )}
                  </NavLink>

                  {/* Bento Tile 5: Admin Dashboard OR Profile */}
                  {isAdmin ? (
                    <NavLink
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => cn(
                        "col-span-1 relative overflow-hidden rounded-2xl p-3.5 transition-all duration-200 group border flex flex-col justify-between min-h-[112px] text-left",
                        isActive
                          ? "bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-700 shadow-md shadow-purple-600/20"
                          : "bg-gradient-to-br from-purple-50/60 via-white to-slate-50 border-purple-100 hover:border-purple-300 hover:shadow-sm"
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                              isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"
                            )}>
                              <ShieldCheck className="w-4 h-4" />
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                              isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"
                            )}>
                              Staff
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className={cn(
                              "text-xs font-bold block",
                              isActive ? "text-white" : "text-slate-900"
                            )}>
                              Admin Studio
                            </span>
                            <span className={cn(
                              "text-[10px] leading-tight block mt-0.5",
                              isActive ? "text-purple-100" : "text-slate-500"
                            )}>
                              Control & analytics
                            </span>
                          </div>
                        </>
                      )}
                    </NavLink>
                  ) : (
                    <NavLink
                      to={user ? "/profile" : "/login"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => cn(
                        "col-span-1 relative overflow-hidden rounded-2xl p-3.5 transition-all duration-200 group border flex flex-col justify-between min-h-[112px] text-left",
                        isActive
                          ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-indigo-700 shadow-md shadow-indigo-600/20"
                          : "bg-gradient-to-br from-violet-50/50 via-white to-slate-50 border-violet-100/90 hover:border-violet-300 hover:shadow-sm"
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                              isActive ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"
                            )}>
                              <User className="w-4 h-4" />
                            </div>
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                              isActive ? "bg-white/20 text-white" : "bg-violet-100 text-violet-800"
                            )}>
                              {user ? "Account" : "Login"}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className={cn(
                              "text-xs font-bold block",
                              isActive ? "text-white" : "text-slate-900"
                            )}>
                              {user ? "My Profile" : "Sign In"}
                            </span>
                            <span className={cn(
                              "text-[10px] leading-tight block mt-0.5",
                              isActive ? "text-violet-100" : "text-slate-500"
                            )}>
                              {user ? "Orders & files" : "Access your account"}
                            </span>
                          </div>
                        </>
                      )}
                    </NavLink>
                  )}
                </div>

                {/* Bottom Quick Row for logged in user (Direct Profile link if admin, or Sign Out) */}
                {user && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    {isAdmin && (
                      <NavLink
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-indigo-600" /> My Profile
                      </NavLink>
                    )}
                    <button
                      onClick={() => { handleLogout(); setOpen(false); }}
                      className="ml-auto text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}

              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
