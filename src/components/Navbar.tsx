import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <div className="w-8 h-8 rounded-xl bg-primary-gradient flex items-center justify-center shadow-elegant">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-navy tracking-tight">ProjectForge<span className="text-primary">AI</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
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
            <Link to="/login"><Button variant="ghost" className="rounded-full text-sm">Sign in</Button></Link>
            <Link to="/register"><Button className="rounded-full bg-navy hover:bg-navy-light text-white text-sm px-5">Get started →</Button></Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>

        {open && (
          <div className="md:hidden mt-2 glass rounded-2xl p-4 mx-auto max-w-6xl animate-fade-in">
            <div className="flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} className="px-3 py-2 rounded-lg hover:bg-secondary text-navy">
                  {l.label}
                </NavLink>
              ))}
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1"><Button variant="outline" className="w-full rounded-full">Sign in</Button></Link>
                <Link to="/register" className="flex-1"><Button className="w-full rounded-full bg-navy text-white">Get started</Button></Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
