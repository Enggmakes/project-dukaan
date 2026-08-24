import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";
const links = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/custom-request", label: "Custom Build" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/admin", label: "Admin" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL);
    });
    
    return () => {
      window.removeEventListener("scroll", onScroll);
      subscription.unsubscribe();
    };
  }, []);

  const visibleLinks = isAdmin ? links : links.filter(l => l.to !== "/admin");

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-300",
      scrolled ? "py-2.5" : "py-4"
    )}>
      <div className="container-px">
        <nav className={cn(
          "mx-auto max-w-6xl flex items-center justify-between rounded-full px-4 md:px-6 py-2 transition-all",
          scrolled ? "bg-white border border-slate-200 shadow-md" : "bg-white/95 border border-slate-200/80 shadow-sm"
        )}>
          <Link to="/" className="flex items-center gap-2 pl-2 group">
            <img src="/logo.png" alt="ProjectDukaan" className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-105" />
            <span className="font-bold text-slate-900 tracking-tight text-base">Project<span className="text-indigo-600">Dukaan</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-slate-100/80 border border-slate-200/60">
            {visibleLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => cn(
                  "px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200",
                  isActive 
                    ? "text-indigo-600 bg-white shadow-sm border border-slate-200/80" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <NotificationBell />
            {user ? (
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
                      <User className="w-4 h-4 mr-2 text-indigo-600" /> Admin Dashboard
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

          <button className="md:hidden p-2 text-slate-700" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 mx-auto max-w-6xl shadow-xl animate-fade-in">
            <div className="flex flex-col gap-1">
              {visibleLinks.map(l => (
                <NavLink key={l.to} to={l.to} className="px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-800 text-sm font-medium">
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 mt-2">
                  <div className="px-3 py-2 text-xs text-slate-500 truncate">
                    {user.email}
                  </div>
                  <Button variant="ghost" className="w-full justify-start rounded-lg text-slate-800 text-xs font-medium" onClick={() => { navigate("/profile"); setOpen(false); }}>
                    <User className="w-4 h-4 mr-2 text-indigo-600" /> My Profile
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="w-full justify-start rounded-lg text-slate-800 text-xs font-medium" onClick={() => { navigate("/admin"); setOpen(false); }}>
                      <User className="w-4 h-4 mr-2 text-indigo-600" /> Admin Dashboard
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full justify-start rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                  <Link to="/login" className="flex-1"><Button variant="outline" className="w-full rounded-full text-xs font-semibold">Sign in</Button></Link>
                  <Link to="/register" className="flex-1"><Button className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm">Get started</Button></Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
