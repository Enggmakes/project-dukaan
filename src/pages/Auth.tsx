import { Link } from "react-router-dom";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.includes("@") || form.password.length < 6) return toast.error("Check your details");
    toast.success(mode === "login" ? "Welcome back!" : "Account created (demo)");
  };
  const isLogin = mode === "login";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-mesh">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/20" />
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-gradient grid place-items-center"><Sparkles className="w-4 h-4 text-white" /></div>
          <span className="font-semibold text-navy">ProjectForge<span className="text-primary">AI</span></span>
        </Link>
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="text-display text-4xl text-navy">Build faster.<br />Ship real projects.</h2>
          <p className="text-navy/60 mt-3">Join 38,000+ builders shipping with ProjectForge AI.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-primary-gradient grid place-items-center"><Sparkles className="w-4 h-4 text-white" /></div>
            <span className="font-semibold text-navy">ProjectForge<span className="text-primary">AI</span></span>
          </Link>
          <h1 className="text-display text-4xl text-navy">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="text-muted-foreground mt-2">{isLogin ? "Sign in to access your projects." : "Start shipping in minutes."}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {!isLogin && (
              <div>
                <Label className="text-navy text-sm">Full name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5" placeholder="Jane Doe" />
              </div>
            )}
            <div>
              <Label className="text-navy text-sm">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1.5" placeholder="you@example.com" />
            </div>
            <div>
              <Label className="text-navy text-sm">Password</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1.5" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90 h-11">{isLogin ? "Sign in" : "Create account"}</Button>
          </form>

          <div className="text-sm text-center mt-6 text-muted-foreground">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} className="text-primary font-medium">{isLogin ? "Create an account" : "Sign in"}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
