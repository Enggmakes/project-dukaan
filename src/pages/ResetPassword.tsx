import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Send,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Resend Link State
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(window.location.search);

        // 1. Check for error parameters emitted by Supabase verify link
        const errorParam =
          hashParams.get("error_description") ||
          searchParams.get("error_description") ||
          hashParams.get("error") ||
          searchParams.get("error");
        const errorCode =
          hashParams.get("error_code") || searchParams.get("error_code");

        if (errorParam || errorCode) {
          const rawMsg = errorParam || errorCode || "Email link is invalid or has expired";
          const formatted = rawMsg.replace(/\+/g, " ");
          if (isMounted) {
            setErrorMessage(formatted);
            setCheckingSession(false);
          }
          return;
        }

        // 2. PKCE flow (?code=...)
        const code = searchParams.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            if (isMounted) {
              setSessionReady(true);
              setCheckingSession(false);
            }
            return;
          } else if (error) {
            if (isMounted) {
              setErrorMessage(error.message);
              setCheckingSession(false);
            }
            return;
          }
        }

        // 3. Token hash verification (?token_hash=... or ?token=...)
        const tokenHash = searchParams.get("token_hash") || searchParams.get("token");
        const type = (searchParams.get("type") || hashParams.get("type")) as any;
        if (tokenHash && (!type || type === "recovery")) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (!error && data?.session) {
            if (isMounted) {
              setSessionReady(true);
              setCheckingSession(false);
            }
            return;
          } else if (error) {
            if (isMounted) {
              setErrorMessage(error.message);
              setCheckingSession(false);
            }
            return;
          }
        }

        // 4. Check existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          if (isMounted) {
            setSessionReady(true);
            setCheckingSession(false);
          }
          return;
        }

        // 5. If hash contains access_token, give supabase onAuthStateChange a grace period to process it
        const hasAccessToken = hashParams.has("access_token");
        if (hasAccessToken) {
          // Supabase auth listener will trigger PASSWORD_RECOVERY / SIGNED_IN shortly
          return;
        }

        // No tokens or session present
        if (isMounted) {
          setCheckingSession(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || "Failed to verify recovery session");
          setCheckingSession(false);
        }
      }
    };

    initializeAuth();

    // 6. Supabase auth event listener (handles implicit hash `#access_token=...`)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        (session && (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION"))
      ) {
        if (isMounted) {
          setSessionReady(true);
          setCheckingSession(false);
          setErrorMessage(null);
        }
      }
    });

    // 7. Safety timeout fallback: if URL has an access_token hash, do not hang forever if it fails
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setCheckingSession((current) => {
          if (current) return false;
          return current;
        });
      }
    }, 2800);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
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
      // Clean up URL hash / params
      window.history.replaceState(null, "", window.location.pathname);
      navigate("/profile");
    } catch (err: any) {
      toast.error(
        err.message || "Failed to update password. Please try again or request a new link."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || !resendEmail.includes("@")) {
      return toast.error("Please enter a valid email address");
    }

    setResending(true);
    try {
      const resetRedirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail.trim(), {
        redirectTo: resetRedirectUrl,
      });

      if (error) throw error;

      setResendSent(true);
      toast.success("Fresh recovery link dispatched! Please check your email inbox.", {
        duration: 8000,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch recovery link. Please try again.");
    } finally {
      setResending(false);
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
          <div className="py-10 text-center space-y-3 font-mono">
            <Loader2 className="w-7 h-7 animate-spin text-amber-400 mx-auto" />
            <p className="text-xs text-amber-400/90 font-bold font-mono tracking-wide">
              VERIFYING_RECOVERY_SESSION...
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Validating cryptographic handshake with Supabase Auth...
            </p>
          </div>
        ) : !sessionReady ? (
          <div className="space-y-4 py-2 font-mono">
            {/* Error Notification Banner */}
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>RECOVERY_SESSION_INVALID_OR_EXPIRED</span>
              </div>
              <p className="text-slate-300 text-[11.5px]">
                {errorMessage ||
                  "The recovery token link has expired or has already been used."}
              </p>
            </div>

            {/* Email prefetch explanation notice */}
            <div className="p-3 rounded-md bg-[#070b14] border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-300">Why did this happen?</strong> Supabase recovery
                links can only be used once. Some email clients (Gmail, Outlook) automatically scan links for safety, which can consume single-use tokens before you click.
              </span>
            </div>

            {/* Inline Resend Reset Link Box */}
            <div className="p-4 rounded-md bg-[#050811] border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  REQUEST_FRESH_LINK
                </span>
                <span className="text-[10px] text-slate-500">INSTANT DISPATCH</span>
              </div>

              {resendSent ? (
                <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    Recovery link dispatched to <strong>{resendEmail}</strong>! Open the new email and click the link directly.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleResendResetLink} className="space-y-2.5">
                  <Input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="registered-email@college.edu"
                    className="h-10 rounded bg-[#0d121e] border-slate-700 text-xs font-mono text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-amber-500"
                  />
                  <Button
                    type="submit"
                    disabled={resending || !resendEmail.trim()}
                    className="w-full h-9 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all shadow-[0_2px_0_#92400e]"
                  >
                    {resending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        DISPATCHING_LINK...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5" />
                        DISPATCH_NEW_RESET_LINK
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Return to Login */}
            <div className="pt-2">
              <Link to="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full bg-[#0d121e] hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700 font-mono text-xs h-10"
                >
                  SYS:\RETURN_TO_LOGIN
                </Button>
              </Link>
            </div>
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
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${password.length >= 6 ? "text-emerald-400" : "text-slate-600"}`}
                />
                <span>At least 6 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    password && password === confirmPassword ? "text-emerald-400" : "text-slate-600"
                  }`}
                />
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
