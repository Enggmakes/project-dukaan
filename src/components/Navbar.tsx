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
      scrolled ? "py-3" : "py-5"
    )}>
      <div className="container-px">
        <nav className={cn(
          "mx-auto max-w-6xl flex items-center justify-between rounded-full px-4 md:px-6 py-2.5 transition-all",
          scrolled ? "glass shadow-soft" : "bg-transparent"
        )}>
          <Link to="/" className="flex items-center gap-2 pl-2">
            <img src="/logo.png" alt="ProjectDukaan" className="w-9 h-9 object-contain" />
            <span className="font-semibold text-navy tracking-tight">Project<span className="text-primary">Dukaan</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  isActive ? "text-navy bg-secondary" : "text-muted-foreground hover:text-navy"
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
                  <Button variant="ghost" className="rounded-full flex items-center gap-2 px-3 h-10 hover:bg-transparent">
                    <div className="w-8 h-8 rounded-full bg-primary-gradient grid place-items-center text-white text-xs font-medium shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/90 backdrop-blur-xl border-border rounded-2xl shadow-elegant p-2">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate mb-1">
                    {user.email}
                  </div>
                  <DropdownMenuItem className="rounded-xl cursor-pointer py-2 mb-1" onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2" /> My Profile
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem className="rounded-xl cursor-pointer py-2 mb-1" onClick={() => navigate("/admin")}>
                      <User className="w-4 h-4 mr-2" /> Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 rounded-xl cursor-pointer py-2 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login"><Button variant="ghost" className="rounded-full text-sm">Sign in</Button></Link>
                <Link to="/register"><Button className="rounded-full bg-navy hover:bg-navy-light text-white text-sm px-5">Get started →</Button></Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden mt-2 glass rounded-2xl p-4 mx-auto max-w-6xl animate-fade-in">
            <div className="flex flex-col gap-1">
              {visibleLinks.map(l => (
                <NavLink key={l.to} to={l.to} className="px-3 py-2 rounded-lg hover:bg-secondary text-navy">
                  {l.label}
                </NavLink>
              ))}
              {user ? (
                <div className="flex flex-col gap-1 pt-2 border-t border-border mt-2">
                  <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <Button variant="ghost" className="w-full justify-start rounded-lg text-navy" onClick={() => { navigate("/profile"); setOpen(false); }}>
                    <User className="w-4 h-4 mr-2" /> My Profile
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="w-full justify-start rounded-lg text-navy" onClick={() => { navigate("/admin"); setOpen(false); }}>
                      <User className="w-4 h-4 mr-2" /> Admin Dashboard
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full justify-start rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t border-border mt-2">
                  <Link to="/login" className="flex-1"><Button variant="outline" className="w-full rounded-full">Sign in</Button></Link>
                  <Link to="/register" className="flex-1"><Button className="w-full rounded-full bg-navy text-white">Get started</Button></Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
