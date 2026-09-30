import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, X, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { isUserAdmin, checkAdminStatus } from "@/lib/authUtils";

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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-tr from-pink-200/50 via-purple-100/40 to-sky-200/60 overflow-hidden font-sans">
      {/* Background Soft Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pink-300/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-300/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-200/20 blur-[100px] pointer-events-none" />

      {/* Back to Home Button - Transparent & subtle */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/20 hover:bg-white/60 text-slate-600 hover:text-slate-950 text-xs font-medium backdrop-blur-xs border border-white/40 opacity-50 hover:opacity-100 transition-all hover:shadow-xs active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dukaan
      </Link>

      {/* Main Glassmorphism Card - Enlarged size */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-5xl xl:max-w-6xl w-full bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_25px_80px_-15px_rgba(79,70,229,0.18)] rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 md:p-14 lg:p-16 relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-20 items-center"
      >
        {/* Left Column: Heading & 3D Rocket */}
        <div className="flex flex-col justify-between h-full space-y-6 lg:space-y-10">
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-8">
              <img src="/logo.png" alt="ProjectDukaan" className="w-9 h-9 object-contain" />
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                Project<span className="text-indigo-600">Dukaan</span>
              </span>
            </Link>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
              Be <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
                limitless
              </span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-4 font-medium max-w-sm leading-relaxed">
              Explore production-ready blueprints, AI modules, and custom engineering builds.
            </p>
          </div>

          {/* 3D Animated Rocket */}
          <div className="relative flex justify-center items-center py-4 lg:py-8">
            <motion.div
              animate={{
                y: [0, -16, 0],
                rotate: [0, 1.5, 0, -1.5, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <img
                src="/rocket.jpg"
                alt="Rocket"
                className="w-64 h-64 sm:w-72 sm:h-72 lg:w-[340px] lg:h-[340px] xl:w-[380px] xl:h-[380px] object-cover rounded-3xl drop-shadow-[0_20px_40px_rgba(79,70,229,0.22)] select-none pointer-events-none"
              />
            </motion.div>
          </div>
        </div>

        {/* Right Column: Auth Form */}
        <div className="w-full">
          {/* Top Switcher */}
          <div className="flex items-center justify-between mb-7 pb-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLogin ? "Sign in" : "Sign up"}
            </h2>
            <div className="text-xs sm:text-sm text-slate-500 font-medium">
              {isLogin ? "No account? " : "Already have an account? "}
              <Link
                to={isLogin ? "/register" : "/login"}
                className="text-slate-900 font-bold underline underline-offset-4 hover:text-indigo-600 transition-colors"
              >
                {isLogin ? "Sign up" : "Log in"}
              </Link>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4 sm:space-y-5">
            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Name</Label>
                <div className="relative">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="h-12 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs pr-10 text-sm focus-visible:ring-indigo-500"
                  />
                  {form.name && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, name: "" })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Email Address Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Email address</Label>
              <div className="relative">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@example.com"
                  className="h-12 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs pr-10 text-sm focus-visible:ring-indigo-500"
                />
                {form.email && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, email: "" })}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter password (min. 6 characters)"
                  className="h-12 rounded-2xl bg-white/95 border-slate-200/90 shadow-xs pr-11 text-sm focus-visible:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Privacy Agreement Checkbox */}
            {!isLogin && (
              <div className="flex items-start gap-2.5 pt-1 text-left">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(!!checked)}
                  className="mt-0.5 rounded-md data-[state=checked]:bg-indigo-600 border-slate-300"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 leading-tight select-none">
                  I agree to the Platform's{" "}
                  <Link to="/terms" target="_blank" className="font-semibold text-pink-600 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" target="_blank" className="font-semibold text-pink-600 hover:underline">
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
              className="w-full rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold h-12 text-sm shadow-md transition-all active:scale-[0.99] mt-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </span>
              ) : isLogin ? (
                "Sign in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          {/* Social Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400 font-medium">
              <span className="bg-white/80 backdrop-blur-xs px-3">
                {isLogin ? "or sign in with" : "or sign up with"}
              </span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              title="Continue with Google"
              className="w-13 h-13 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
