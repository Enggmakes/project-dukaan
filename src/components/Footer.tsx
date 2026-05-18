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
    <footer className="bg-navy text-white/80 mt-24">
      <div className="container-px py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="ProjectDukaan" className="w-9 h-9 object-contain brightness-0 invert" />
              <span className="font-semibold text-white">Project<span className="text-primary-glow">Dukaan</span></span>
            </div>
            <p className="text-sm max-w-sm text-white/60 mb-6">Build faster. Learn smarter. Ship real projects. The premium marketplace for engineering, AI & final-year projects.</p>
            <form onSubmit={submit} className="flex gap-2 max-w-sm">
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="rounded-full bg-primary hover:bg-primary/90 px-6">
                {isLoading ? "Wait..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-[11px] text-white/40 mt-2 ml-2">We will notify you when new premium projects are added. Yes!</p>
          </div>

          <FooterCol title="Product" items={productItems} />
          <FooterCol title="Company" items={[["About", "/about"], ["Contact", "/contact"], ["Pricing", "/marketplace"]]} />
          <FooterCol title="Legal" items={[["Privacy", "#"], ["Terms", "#"], ["Refunds", "#"]]} />
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">© {new Date().getFullYear()} ProjectDukaan. Crafted for builders.</p>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center"><Github className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center"><Linkedin className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="text-white text-sm font-medium mb-4">{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map(([label, href]) => (
          <li key={label}><Link to={href} className="text-white/60 hover:text-white">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
