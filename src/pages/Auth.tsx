import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import MeshGradient from "@/components/MeshGradient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLogin = mode === "login";

  const redirectUrl = searchParams.get("redirect");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.includes("@") || form.password.length < 6) return toast.error("Check your details");
    
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Login successful!");
        
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (form.email === adminEmail) {
          navigate("/admin");
        } else {
          navigate("/profile");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
            }
          }
        });
        if (error) throw error;
        toast.success("Account created successfully!");
        
        if (redirectUrl) {
          navigate(redirectUrl);
        } else {
          navigate("/profile");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <img src="/logo.png" alt="ProjectDukaan" className="w-9 h-9 object-contain" />
          <span className="font-bold text-white text-lg">Project<span className="text-indigo-400">Dukaan</span></span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-display text-4xl font-bold leading-tight">Build faster.<br />Ship real projects.</h2>
          <p className="text-slate-400 mt-3 text-base">Join 38,000+ builders shipping with ProjectDukaan.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="ProjectDukaan" className="w-9 h-9 object-contain" />
            <span className="font-bold text-slate-900">Project<span className="text-indigo-600">Dukaan</span></span>
          </Link>
          <h1 className="text-display text-4xl font-bold text-slate-900">{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className="text-slate-600 mt-2">{isLogin ? "Sign in to access your projects." : "Start shipping in minutes."}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {!isLogin && (
              <div>
                <Label className="text-slate-700 font-semibold text-sm">Full name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-slate-50 border-slate-200" placeholder="Jane Doe" />
              </div>
            )}
            <div>
              <Label className="text-slate-700 font-semibold text-sm">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1.5 bg-slate-50 border-slate-200" placeholder="you@example.com" />
            </div>
            <div>
              <Label className="text-slate-700 font-semibold text-sm">Password</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="mt-1.5 bg-slate-50 border-slate-200" placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-11 shadow-sm">
              {loading ? "Please wait..." : (isLogin ? "Sign in" : "Create account")}
            </Button>
          </form>

          <div className="text-sm text-center mt-6 text-slate-600">
            {isLogin ? "New here? " : "Already have an account? "}
            <Link to={isLogin ? "/register" : "/login"} className="text-indigo-600 font-semibold hover:underline">{isLogin ? "Create an account" : "Sign in"}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
