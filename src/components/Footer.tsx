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
    if (!email.includes("@")) return toast.error("Enter a valid email");
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') {
          toast.error("You're already subscribed!");
        } else {
          toast.error("Failed to subscribe. Please try again.");
          console.error(error);
        }
      } else {
        toast.success("Subscribed! You will receive new blueprint releases.");
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
    <footer className="bg-white text-slate-700 mt-16 sm:mt-24 border-t border-slate-200">
      <div className="container-px pt-12 pb-28 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Newsletter Console */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
              <img src="/logo.png" alt="ProjectDukaan" className="w-7 h-7 object-contain transition-transform group-hover:scale-105" />
              <span className="font-extrabold text-slate-950 text-xl tracking-tight">Project<span className="text-blue-600">Dukaan</span></span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed max-w-md">
              The verified engineering repository. Production AI models, embedded IoT builds, and robotics capstones with complete source code and IEEE defense documentation.
            </p>

            <form onSubmit={submit} className="flex items-center gap-2 max-w-md">
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="developer@domain.edu"
                className="flex-1 bg-slate-50 border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 text-xs font-mono h-9 px-3 focus-visible:ring-1 focus-visible:ring-blue-600"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="rounded bg-slate-950 hover:bg-slate-800 text-white font-mono font-bold text-xs h-9 px-4 shrink-0 transition-all shadow-xs retro-btn"
              >
                {isLoading ? "Subscribing..." : "EXEC_DROP ↵"}
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse shrink-0" />
              <span>SYS_DAEMON: ONLINE • SHA-256 VERIFIED • 115200 BAUD</span>
            </div>
          </div>

          {/* Directory Navigation */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <FooterCol title="Blueprints" items={productItems} />
            <FooterCol title="Ecosystem" items={[["About ProjectDukaan", "/about"], ["Contact Engineering", "/contact"], ["Pricing & Licensing", "/marketplace"]]} />
            <div className="col-span-2 sm:col-span-1">
              <FooterCol title="Standards & Legal" items={[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["IEEE Documentation", "/marketplace"]]} />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-6xl mx-auto mt-10 md:mt-14 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-slate-500 font-mono">
            © {new Date().getFullYear()} ProjectDukaan. Built for engineering defense & production deployment.
          </p>
          <div className="flex items-center gap-2">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="Github" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 grid place-items-center text-slate-600 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 grid place-items-center text-slate-600 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 grid place-items-center text-slate-600 transition-colors">
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
      <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3.5">
        {title}
      </div>
      <ul className="space-y-2 text-xs">
        {items.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("#") ? (
              <span className="text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">
                {label}
              </span>
            ) : (
              <Link to={href} className="text-slate-600 hover:text-blue-600 transition-colors">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
