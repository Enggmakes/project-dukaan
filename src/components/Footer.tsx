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
    <footer className="bg-chocolate text-[#fefaf0]/90 mt-24 shadow-chocolate border-t border-[#fefaf0]/10">
      <div className="container-px py-16">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="ProjectDukaan" className="w-9 h-9 object-contain brightness-0 invert" />
              <span className="font-semibold text-white">Project<span className="text-[#8B5CF6]">Dukaan</span></span>
            </div>
            <p className="text-sm max-w-sm text-white/60 mb-6">Build faster. Learn smarter. Ship real projects. The premium marketplace for engineering, AI & final-year projects.</p>
            <form onSubmit={submit} className="flex gap-2 max-w-sm">
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                className="rounded-full text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-[#6E5BFF]/40 focus-visible:border-[#6E5BFF]/50"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading} className="rounded-full bg-gradient-to-r from-[#6E5BFF] to-[#8B5CF6] text-white hover:text-white shadow-[0_10px_30px_rgba(110,91,255,0.25)] font-semibold transition-all shrink-0 px-6 border-0">
                {isLoading ? "Wait..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-[11px] text-white/40 mt-2 ml-2">We will notify you when new premium projects are added. Yes!</p>
          </div>

          <FooterCol title="Product" items={productItems} />
          <FooterCol title="Company" items={[["About", "/about"], ["Contact", "/contact"], ["Pricing", "/marketplace"]]} />
          <FooterCol title="Legal" items={[["Privacy", "/privacy"], ["Terms", "/terms"], ["Refunds", "#"]]} />
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[#fefaf0]/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#fefaf0]/50">© {new Date().getFullYear()} ProjectDukaan. Crafted for builders.</p>
          <div className="flex gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-[#fefaf0]/5 hover:bg-[#fefaf0]/15 grid place-items-center"><Twitter className="w-4 h-4 text-[#fefaf0]/80 hover:text-white" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-[#fefaf0]/5 hover:bg-[#fefaf0]/15 grid place-items-center"><Github className="w-4 h-4 text-[#fefaf0]/80 hover:text-white" /></a>
            <a href="#" className="w-9 h-9 rounded-full bg-[#fefaf0]/5 hover:bg-[#fefaf0]/15 grid place-items-center"><Linkedin className="w-4 h-4 text-[#fefaf0]/80 hover:text-white" /></a>
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
