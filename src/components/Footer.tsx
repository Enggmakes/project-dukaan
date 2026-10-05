import { Link } from "react-router-dom";
import { Twitter, Github, Linkedin, ShieldCheck, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isUserAdmin } from "@/lib/authUtils";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(isUserAdmin(session?.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(isUserAdmin(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Enter a valid email address");
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') {
          toast.error("You're already subscribed to radar transmissions!");
        } else {
          toast.error("Failed to subscribe. Please try again.");
          console.error(error);
        }
      } else {
        toast.success("Subscribed! You will receive verified blueprint releases.");
        setEmail("");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const productItems: [string, string][] = [
    ["Marketplace Catalog", "/marketplace"],
    ["Custom Build Studio", "/custom-request"]
  ];

  if (isAdmin) {
    productItems.push(["Admin Console", "/admin"]);
  }

  return (
    <footer className="bg-[#070a12] text-slate-300 mt-20 border-t border-slate-800/80 relative overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-24 bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="container-px pt-14 pb-28 sm:py-16 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand & Newsletter Console */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shadow-inner group-hover:border-amber-500/60 transition-colors">
                <img src="/logo.png" alt="ProjectDukaan" className="w-full h-full object-contain transition-transform group-hover:scale-110" />
              </div>
              <span className="font-extrabold text-white text-xl tracking-tight font-mono">
                Project<span className="text-amber-400">Dukaan</span>
                <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 align-middle">v2.6</span>
              </span>
            </Link>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md font-sans">
              The verified engineering repository. Production AI models, embedded IoT builds, and robotics capstones with complete source code, hardware schematics, and IEEE defense documentation.
            </p>

            {/* Newsletter Dispatch Box */}
            <div className="pt-2">
              <label htmlFor="newsletter-email" className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Subscribe to Blueprint Radar
              </label>
              <form onSubmit={submit} className="flex items-center gap-2 max-w-md">
                <div className="relative flex-1">
                  <Input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="engineer@domain.edu"
                    className="w-full bg-[#0d121e] border-slate-700/80 text-slate-100 placeholder:text-slate-500 rounded-lg text-xs font-mono h-10 px-3.5 focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:border-amber-400 transition-all"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs h-10 px-4 shrink-0 transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:shadow-[0_0_16px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  {isLoading ? "SYNCING..." : "EXEC_DROP ↵"}
                </Button>
              </form>
            </div>

            {/* Daemon Telemetry Indicator */}
            <div className="pt-2 flex items-center gap-2.5 font-mono text-[11px] text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </span>
              <span className="tracking-wider">SYS_DAEMON: ONLINE</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">SHA-256 VERIFIED</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400/90">115200 BAUD</span>
            </div>
          </div>

          {/* Directory Navigation */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
            <FooterCol title="Blueprints" items={productItems} />
            <FooterCol 
              title="Ecosystem" 
              items={[
                ["About ProjectDukaan", "/about"], 
                ["Custom Build Studio", "/custom-request"],
                ["Contact Engineering", "/contact"], 
                ["Verified Licensing", "/marketplace"]
              ]} 
            />
            <div className="col-span-2 sm:col-span-1">
              <FooterCol 
                title="Standards & Legal" 
                items={[
                  ["Privacy Policy", "/privacy"], 
                  ["Terms of Service", "/terms"], 
                  ["IEEE Documentation", "/marketplace"]
                ]} 
              />
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="max-w-6xl mx-auto mt-12 md:mt-16 pt-6 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-slate-400 font-mono">
            © {new Date().getFullYear()} ProjectDukaan Workstation. Built for engineering defense & production deployment.
          </p>
          <div className="flex items-center gap-2.5">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              aria-label="GitHub Repository" 
              className="w-9 h-9 rounded-lg bg-[#0d121e] border border-slate-700/80 hover:border-amber-400/60 hover:text-amber-400 grid place-items-center text-slate-400 transition-all shadow-xs"
            >
              <Github className="w-4 h-4" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noreferrer" 
              aria-label="X / Twitter Feed" 
              className="w-9 h-9 rounded-lg bg-[#0d121e] border border-slate-700/80 hover:border-amber-400/60 hover:text-amber-400 grid place-items-center text-slate-400 transition-all shadow-xs"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer" 
              aria-label="LinkedIn Profile" 
              className="w-9 h-9 rounded-lg bg-[#0d121e] border border-slate-700/80 hover:border-amber-400/60 hover:text-amber-400 grid place-items-center text-slate-400 transition-all shadow-xs"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200 mb-3.5 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
        {title}
      </div>
      <ul className="space-y-2.5 text-xs font-mono">
        {items.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("#") ? (
              <span className="text-slate-400 hover:text-amber-300 cursor-pointer transition-colors">
                {label}
              </span>
            ) : (
              <Link to={href} className="text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 group">
                <span className="text-slate-600 group-hover:text-amber-400 transition-colors">›</span>
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
