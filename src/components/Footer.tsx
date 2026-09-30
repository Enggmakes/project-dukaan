import { Link } from "react-router-dom";
import { Sparkles, Twitter, Github, Linkedin } from "lucide-react";
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
        if (error.code === '23505') { // Unique violation
          toast.error("You're already subscribed!");
        } else {
          toast.error("Failed to subscribe. Please try again.");
          console.error(error);
        }
      } else {
        toast.success("You're subscribed! We will notify you when new projects are added.");
        setEmail("");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const productItems: [string, string][] = [
    ["Marketplace", "/marketplace"],
    ["Custom Build", "/custom-request"]
  ];

  if (isAdmin) {
    productItems.push(["Admin", "/admin"]);
  }

  return (
    <footer className="bg-white text-slate-700 mt-16 sm:mt-24 border-t border-slate-200/80">
      <div className="container-px pt-12 pb-28 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand & Newsletter Capsule */}
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
              <img src="/logo.png" alt="ProjectDukaan" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
              <span className="font-extrabold text-slate-900 text-xl tracking-tight">Project<span className="text-indigo-600">Dukaan</span></span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed max-w-md">
              Build faster. Learn smarter. Ship real engineering projects. The verified marketplace for AI, IoT, Web & Robotics blueprints with IEEE documentation.
            </p>

            <form onSubmit={submit} className="relative flex items-center max-w-md bg-slate-50 rounded-full border border-slate-200/90 p-1 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all shadow-2xs">
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email for project alerts..."
                className="flex-1 border-0 bg-transparent text-slate-900 placeholder:text-slate-400 text-xs font-medium focus-visible:ring-0 h-9 px-3.5 shadow-none"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 sm:px-5 shrink-0 transition-all border-0 shadow-xs"
              >
                {isLoading ? "Wait..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-[11px] text-slate-400 mt-2 ml-1">No spam. Only verified blueprint drops.</p>
          </div>

          {/* Responsive Multi-Column Navigation for Mobile & Desktop */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <FooterCol title="Blueprints" items={productItems} />
            <FooterCol title="Company" items={[["About", "/about"], ["Contact", "/contact"], ["Pricing", "/marketplace"]]} />
            <div className="col-span-2 sm:col-span-1">
              <FooterCol title="Legal & Trust" items={[["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "#"]]} />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-6xl mx-auto mt-10 md:mt-14 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} ProjectDukaan. Crafted with precision for engineers.
          </p>
          <div className="flex items-center gap-2.5">
            <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-2xl bg-slate-100/80 border border-slate-200/80 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 grid place-items-center text-slate-600 transition-all shadow-2xs">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Github" className="w-9 h-9 rounded-2xl bg-slate-100/80 border border-slate-200/80 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 grid place-items-center text-slate-600 transition-all shadow-2xs">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-2xl bg-slate-100/80 border border-slate-200/80 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 grid place-items-center text-slate-600 transition-all shadow-2xs">
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
      <h4 className="text-slate-900 text-xs uppercase tracking-wider font-extrabold mb-3">{title}</h4>
      <ul className="space-y-2 text-xs sm:text-sm">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link to={href} className="text-slate-600 hover:text-indigo-600 font-medium transition-colors inline-block py-0.5">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
