import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check existing session from recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setCheckingSession(false);
    });

    // 2. Listen for PASSWORD_RECOVERY event triggered by clicking recovery link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("🎉 Passkey successfully updated! Your account is secured.");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password. Please try again or request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#070a12] blueprint-grid overflow-hidden font-mono selection:bg-amber-500 selection:text-amber-950">
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 z-0" />

      {/* Back to Login Button */}
      <Link
        to="/login"
        className="fixed top-6 left-6 z-20 hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#0d121e] hover:bg-[#161d2d] text-slate-300 hover:text-amber-400 text-xs font-mono font-bold border border-slate-700 hover:border-amber-500/60 shadow-md transition-all active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
        <span>SYS:\RETURN_TO_LOGIN</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-md w-full bg-[#0a0e17] border-2 border-slate-800 shadow-2xl rounded-md overflow-hidden relative z-10 p-6 sm:p-8"
      >
        {/* CRT Corner Decal Ticks */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none z-20" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none z-20" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none z-20" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none z-20" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto grid place-items-center mb-3">
            <KeyRound className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
            SYS:\RESET_PASSKEY_SEQUENCE
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
            CONFIGURE NEW PASSKEY
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-mono">
            Set a strong cryptographic passkey to restore full console access to your repository licenses.
          </p>
        </div>

        {checkingSession ? (
          <div className="py-8 text-center space-y-3 font-mono">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
            <p className="text-xs text-slate-400 font-mono">VERIFYING_RECOVERY_SESSION...</p>
          </div>
        ) : !sessionReady ? (
          <div className="space-y-4 text-center py-4">
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left leading-relaxed">
              <span className="font-bold block mb-1">⚠️ RECOVERY_SESSION_INVALID:</span>
              The recovery token link has expired or has already been used. Please return to the login screen and request a fresh reset link.
            </div>
            <Link to="/login" className="block">
              <Button className="w-full bg-[#0d121e] hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs h-10">
                RETURN_TO_LOGIN
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide block mb-1.5">
                NEW_PASSKEY (MIN_6_CHARS)
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-10 rounded bg-[#0d121e] border-slate-700 pr-10 text-sm font-mono text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500"
                  required
                  autoFocus
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

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wide block mb-1.5">
                CONFIRM_NEW_PASSKEY
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-10 rounded bg-[#0d121e] border-slate-700 pr-10 text-sm font-mono text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 pt-1 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 ${password.length >= 6 ? "text-emerald-400" : "text-slate-600"}`} />
                <span>At least 6 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-3.5 h-3.5 ${password && password === confirmPassword ? "text-emerald-400" : "text-slate-600"}`} />
                <span>Passwords match</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="w-full rounded bg-amber-500 hover:bg-amber-400 text-amber-950 font-black font-mono h-11 text-xs shadow-[0_3px_0_#92400e] border border-amber-300 transition-all active:translate-y-0.5 mt-3 retro-btn flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-950" />
                  UPDATING_PASSKEY...
                </span>
              ) : (
                "[EXEC] SAVE_NEW_PASSKEY"
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
