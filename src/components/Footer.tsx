import { Link } from "react-router-dom";
import { Sparkles, Twitter, Github, Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdmin(session?.user?.email === import.meta.env.VITE_ADMIN_EMAIL);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.email === import.meta.env.VITE_ADMIN_EMAIL);
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
    <footer className="bg-white text-slate-700 mt-24 border-t border-slate-200/80">
      <div className="container-px py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="ProjectDukaan" className="w-8 h-8 object-contain" />
              <span className="font-bold text-slate-900 text-lg">Project<span className="text-indigo-600">Dukaan</span></span>
            </div>
            <p className="text-sm max-w-sm text-slate-600 mb-6 leading-relaxed">
              Build faster. Learn smarter. Ship real projects. The premium marketplace for engineering, AI & final-year projects.
            </p>
            <form onSubmit={submit} className="flex gap-2 max-w-sm">
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="rounded-full bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 text-xs h-10 px-4"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold transition-all shrink-0 px-5 text-xs h-10 border-0">
                {isLoading ? "Wait..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-[11px] text-slate-400 mt-2 ml-1">We will notify you when new premium projects are added.</p>
          </div>

          <FooterCol title="Product" items={productItems} />
          <FooterCol title="Company" items={[["About", "/about"], ["Contact", "/contact"], ["Pricing", "/marketplace"]]} />
          <FooterCol title="Legal" items={[["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "#"]]} />
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">© {new Date().getFullYear()} ProjectDukaan. Crafted for builders.</p>
          <div className="flex gap-2.5">
            <a href="#" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200/80 grid place-items-center text-slate-600 hover:text-slate-900 transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200/80 grid place-items-center text-slate-600 hover:text-slate-900 transition-colors"><Github className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200/80 grid place-items-center text-slate-600 hover:text-slate-900 transition-colors"><Linkedin className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="text-slate-900 text-sm font-semibold mb-4">{title}</h4>
      <ul className="space-y-2.5 text-sm">
        {items.map(([label, href]) => (
          <li key={label}><Link to={href} className="text-slate-600 hover:text-indigo-600 transition-colors">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
