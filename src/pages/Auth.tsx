import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, X, ArrowLeft, Loader2, ShieldCheck, Terminal, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { checkAdminStatus } from "@/lib/authUtils";

export default function Auth({ mode }: { mode: "login" | "register" }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLogin = mode === "login";
  const redirectUrl = searchParams.get("redirect");

  // Email & Password Auth
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.includes("@")) return toast.error("Please enter a valid email address");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (!isLogin && !agreed) return toast.error("Please agree to the Terms of Service & Privacy Policy");

    setLoading(true);
    try {
      if (isLogin) {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");

        const admin = await checkAdminStatus(signInData?.user);
        if (redirectUrl) {
          navigate(redirectUrl);
        } else if (admin) {
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
            },
          },
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

  // Google OAuth Auth
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to initialize Google login");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#070a12] blueprint-grid overflow-hidden font-mono selection:bg-amber-500 selection:text-amber-950">
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 z-0" />

      {/* Back to Home Button */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#0d121e] hover:bg-[#161d2d] text-slate-300 hover:text-amber-400 text-xs font-mono font-bold border border-slate-700 hover:border-amber-500/60 shadow-md transition-all active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
        <span>[←] SYS:\RETURN_TO_DUKAAN</span>
      </Link>

      {/* Main Console Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-4xl w-full bg-[#0a0e17] border-2 border-slate-800 shadow-2xl rounded-md overflow-hidden relative z-10 grid lg:grid-cols-12"
      >
        {/* CRT Corner Decal Ticks */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none z-20" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none z-20" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none z-20" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none z-20" />

        {/* Left Column: Industrial Engineering Telemetry (5 cols) */}
        <div className="lg:col-span-5 bg-[#05070c] text-white p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
              <div className="relative">
                <img src="/logo.png" alt="ProjectDukaan" className="w-7 h-7 object-contain" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
              </div>
              <span className="font-extrabold text-white tracking-tight text-lg font-mono">
                Project<span className="text-amber-400">Dukaan</span>
              </span>
            </Link>

            <div className="font-mono text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>SYS:\DEVELOPER_AUTH</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight font-mono">
              BUILD & SHIP <br />
              <span className="text-amber-400">REAL_ENGINEERING.</span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed font-mono">
              Instant access to verified IEEE capstones, circuit schematics, and complete source code repositories.
            </p>

            <div className="mt-8 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="w-4 h-4 rounded bg-emerald-950/60 border border-emerald-800 grid place-items-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <span>100% Compiles on First Run</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="w-4 h-4 rounded bg-emerald-950/60 border border-emerald-800 grid place-items-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <span>IEEE Format Thesis Included</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="w-4 h-4 rounded bg-emerald-950/60 border border-emerald-800 grid place-items-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <span>Senior Engineer WhatsApp Desk</span>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> SHA-256 ENCRYPTED
            </span>
            <span>v2.6.4_RELEASE</span>
          </div>
        </div>

        {/* Right Column: Clean Authentication Form (7 cols) */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-[#0a0e17]">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-mono">
              {isLogin ? "// SIGN_IN_CONSOLE" : "// REGISTER_ENGINEER"}
            </h2>
            <div className="text-xs text-slate-400 font-mono">
              {isLogin ? "NEW_USER? " : "EXISTING? "}
              <Link
                to={isLogin ? "/register" : "/login"}
                className="text-amber-400 font-bold hover:text-amber-300 hover:underline"
              >
                {isLogin ? "[SIGN_UP]" : "[LOG_IN]"}
              </Link>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">FULL_NAME *</Label>
                <div className="relative">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ada Lovelace"
                    className="h-10 rounded bg-[#0d121e] border-slate-700 text-sm font-mono text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500"
                  />
                  {form.name && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, name: "" })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Email Address Field */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">EMAIL_ADDRESS *</Label>
              <div className="relative">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="engineer@college.edu"
                  className="h-10 rounded bg-[#0d121e] border-slate-700 text-sm font-mono text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500"
                />
                {form.email && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, email: "" })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">PASSWORD *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="h-10 rounded bg-[#0d121e] border-slate-700 pr-10 text-sm font-mono text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Privacy Agreement Checkbox */}
            {!isLogin && (
              <div className="flex items-start gap-2.5 pt-1 text-left font-mono">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(!!checked)}
                  className="mt-0.5 rounded border-slate-700 data-[state=checked]:bg-amber-500 data-[state=checked]:text-amber-950"
                />
                <label htmlFor="terms" className="text-xs text-slate-400 leading-tight select-none">
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="font-semibold text-amber-400 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" target="_blank" className="font-semibold text-amber-400 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            )}

            {/* Primary Action Button */}
            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-black font-mono h-11 text-xs shadow-[0_3px_0_#92400e] border border-amber-300 transition-all active:translate-y-0.5 mt-3 retro-btn flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                  AUTHENTICATING_CREDENTIALS...
                </span>
              ) : isLogin ? (
                "[EXEC] SIGN_IN_TO_CONSOLE"
              ) : (
                "[EXEC] INITIALIZE_ACCOUNT"
              )}
            </Button>
          </form>

          {/* Social Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono text-slate-500 uppercase">
              <span className="bg-[#0a0e17] px-3">// OR_CONTINUE_WITH</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full h-10 rounded bg-[#0d121e] hover:bg-slate-800 border border-slate-700 hover:border-slate-600 shadow-sm flex items-center justify-center gap-2.5 text-xs font-mono font-bold text-slate-200 transition-all active:translate-y-0.5 disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.13z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.26C.46 8.19 0 10.03 0 12s.46 3.81 1.26 5.41l4.02-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.63 1.26 6.59l4.02 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                  />
                </svg>
                <span>GOOGLE_SINGLE_SIGN_ON</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
