import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { 
  PopupConfig, 
  getPopupConfig, 
  fetchPopupFromDb,
  dbToConfig,
  isPopupSnoozed, 
  snoozePopup 
} from "@/lib/popupConfig";
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Radio,
  Tag,
  Percent,
  Terminal,
  ShieldCheck,
  Zap,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";

interface SmartSchemeModalProps {
  /** If passed, forces display in preview mode for the Admin Dashboard */
  previewConfig?: PopupConfig | null;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export default function SmartSchemeModal({
  previewConfig,
  isPreview = false,
  onClosePreview,
}: SmartSchemeModalProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<PopupConfig>(() => previewConfig || getPopupConfig());
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync with previewConfig if in admin preview mode
  useEffect(() => {
    if (previewConfig) {
      setConfig(previewConfig);
      setIsMuted(previewConfig.videoMuted);
      if (isPreview) setIsOpen(true);
    }
  }, [previewConfig, isPreview]);

  // Auth session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Normal visitor schedule, Database sync, and real-time broadcast listener
  useEffect(() => {
    if (isPreview) return;

    let timer: NodeJS.Timeout | null = null;

    // Check if audience matches current user state
    const matchesAudience = (cfg: PopupConfig, currentUser: any) => {
      if (!cfg.enabled) return false;
      if (cfg.audience === "all_visitors") return true;
      if (cfg.audience === "guests_only") return !currentUser;
      if (cfg.audience === "authenticated_only") return !!currentUser;
      return true;
    };

    // 1. Fetch live configuration from Supabase PostgreSQL Database
    const initializeFromDb = async () => {
      const dbConfig = await fetchPopupFromDb();
      const activeConfig = dbConfig || getPopupConfig();
      setConfig(activeConfig);
      setIsMuted(activeConfig.videoMuted);

      if (matchesAudience(activeConfig, user) && !isPopupSnoozed()) {
        const delayMs = (activeConfig.showDelaySeconds || 4) * 1000;
        timer = setTimeout(() => {
          setIsOpen(true);
        }, delayMs);
      }
    };

    initializeFromDb();

    // 2. Config changed locally
    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
        setIsMuted(e.detail.videoMuted);
      }
    };
    window.addEventListener("dukaan_popup_config_changed", handleConfigChange);

    // 3. PostgreSQL Database Realtime listener on marketing_popups table
    const dbChangesChannel = supabase
      .channel("marketing_popups_db_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marketing_popups" },
        (payload: any) => {
          if (payload.new) {
            const updatedConfig = dbToConfig(payload.new);
            setConfig(updatedConfig);
            setIsMuted(updatedConfig.videoMuted);
            if (matchesAudience(updatedConfig, user)) {
              setIsOpen(true);
            }
          }
        }
      )
      .subscribe();

    // 4. Ultra-low latency WebSocket broadcast listener (Admin pressed live broadcast)
    const broadcastChannel = supabase
      .channel("admin-global-broadcast")
      .on(
        "broadcast",
        { event: "popup_broadcast" },
        (payload: any) => {
          if (payload.payload) {
            const liveConfig: PopupConfig = payload.payload;
            setConfig(liveConfig);
            setIsMuted(liveConfig.videoMuted);
            if (matchesAudience(liveConfig, user)) {
              setIsOpen(true);
              try {
                // High-tech audio alert
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.15);
              } catch (_) {}
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("dukaan_popup_config_changed", handleConfigChange);
      supabase.removeChannel(dbChangesChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [isPreview, user]);

  // Auto-dismiss timer if configured
  useEffect(() => {
    if (isOpen && config.autoDismissSeconds > 0 && !isPreview) {
      const timer = setTimeout(() => {
        handleClose();
      }, config.autoDismissSeconds * 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, config.autoDismissSeconds, isPreview]);

  const handleClose = () => {
    if (dontShowAgain && !isPreview) {
      snoozePopup(24);
    }
    setIsOpen(false);
    if (onClosePreview) onClosePreview();
  };

  const handleCopyCode = () => {
    if (!config.couponCode) return;
    navigator.clipboard.writeText(config.couponCode);
    setCopied(true);
    toast.success(`Coupon code ${config.couponCode} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCtaClick = () => {
    handleClose();
    if (config.ctaLink) {
      if (config.ctaLink.startsWith("http")) {
        window.open(config.ctaLink, "_blank");
      } else {
        navigate(config.ctaLink);
      }
    }
  };

  const handleSecondaryCtaClick = () => {
    handleClose();
    if (config.secondaryCtaLink) {
      if (config.secondaryCtaLink.startsWith("http")) {
        window.open(config.secondaryCtaLink, "_blank");
      } else {
        navigate(config.secondaryCtaLink);
      }
    }
  };

  // Animation variants mapped to admin selection
  const getModalAnimationVariants = () => {
    switch (config.animation) {
      case "cyber_glitch":
        return {
          initial: { opacity: 0, scale: 0.85, y: 30, filter: "brightness(2) contrast(1.5)" },
          animate: { 
            opacity: 1, 
            scale: 1, 
            y: 0, 
            filter: "brightness(1) contrast(1)",
            transition: { type: "spring", stiffness: 350, damping: 25 } 
          },
          exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.15 } }
        };
      case "hologram_pulse":
        return {
          initial: { opacity: 0, scale: 0.7, boxShadow: "0 0 50px rgba(6,182,212,0.8)" },
          animate: { 
            opacity: 1, 
            scale: 1, 
            boxShadow: "0 0 25px rgba(6,182,212,0.3)",
            transition: { type: "spring", stiffness: 280, damping: 20 } 
          },
          exit: { opacity: 0, scale: 0.85, transition: { duration: 0.2 } }
        };
      case "terminal_boot":
        return {
          initial: { opacity: 0, scaleY: 0.05, scaleX: 0.9 },
          animate: { 
            opacity: 1, 
            scaleY: 1, 
            scaleX: 1,
            transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } 
          },
          exit: { opacity: 0, scaleY: 0.1, transition: { duration: 0.15 } }
        };
      case "smooth_fade":
      default:
        return {
          initial: { opacity: 0, y: 25, scale: 0.95 },
          animate: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } 
          },
          exit: { opacity: 0, y: 15, scale: 0.96, transition: { duration: 0.15 } }
        };
    }
  };

  if (!isOpen && !isPreview) return null;

  const hasMedia = config.mediaType !== "none" && Boolean(config.mediaUrl);

  const content = (
    <AnimatePresence>
      {(isOpen || isPreview) && (
        <div 
          className="fixed inset-0 z-[99998] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto"
          style={{ pointerEvents: "auto" }}
        >
          {/* Backdrop with dark vignette blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#050811]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            variants={getModalAnimationVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative w-full ${
              hasMedia ? "max-w-xl md:max-w-3xl" : "max-w-lg sm:max-w-xl"
            } bg-[#080d1a]/95 backdrop-blur-2xl border border-amber-500/35 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(245,158,11,0.12)] overflow-hidden z-10 flex flex-col my-auto text-slate-100`}
          >
            {/* Top scanning accent line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />

            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0a1020]/90 border-b border-slate-800/80">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                  <span>{config.badge || "SPECIAL SCHEME"}</span>
                </span>
                {isPreview && (
                  <span className="text-[9px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-1.5 py-0.5 rounded font-black font-mono">
                    ADMIN PREVIEW
                  </span>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleClose}
                className="w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700/80 hover:border-amber-400/80 hover:text-amber-300 text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                title="Close"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Content */}
            {hasMedia ? (
              /* Two-Column Layout When Media (Video/Image) is Present */
              <div className="p-4 sm:p-6 md:grid md:grid-cols-12 md:gap-6 items-center">
                {/* Media Showcase Column */}
                <div className="md:col-span-5 mb-4 md:mb-0">
                  <div className="relative w-full aspect-video md:aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center group shadow-md">
                    {config.mediaType === "video" ? (
                      <>
                        <video
                          ref={videoRef}
                          src={config.mediaUrl}
                          autoPlay={config.videoAutoplay}
                          loop
                          playsInline
                          muted={isMuted}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setIsMuted(prev => !prev)}
                          className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md border border-amber-500/50 hover:border-amber-400 text-amber-300 font-mono text-[9px] flex items-center gap-1 transition-all cursor-pointer z-10"
                        >
                          {isMuted ? (
                            <>
                              <VolumeX className="w-3 h-3 text-amber-400" />
                              <span>UNMUTE</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                              <span>AUDIO ON</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <img
                        src={config.mediaUrl}
                        alt={config.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    )}
                  </div>
                </div>

                {/* Content & Action Column */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-mono text-white leading-snug">
                      {config.title}
                    </h2>
                    {config.description && (
                      <p className="text-xs sm:text-[13px] text-slate-300 font-sans mt-2 leading-relaxed">
                        {config.description}
                      </p>
                    )}
                  </div>

                  {/* Coupon Box */}
                  {config.couponCode && (
                    <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 flex items-center justify-between gap-3 font-mono">
                      <div className="min-w-0">
                        <span className="text-[10px] text-amber-400/90 block uppercase tracking-wider font-semibold flex items-center gap-1">
                          <Percent className="w-3 h-3 text-amber-400" />
                          {config.discountPercent > 0 ? `${config.discountPercent}% OFF VOUCHER` : "COUPON"}
                        </span>
                        <span className="text-base font-black text-amber-300 tracking-wider">
                          {config.couponCode}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {config.layoutMode === "with_buttons" && (
                    <div className="space-y-2 pt-1 font-mono">
                      <button
                        type="button"
                        onClick={handleCtaClick}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>{config.ctaText || "CLAIM SCHEME NOW"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {config.secondaryCtaText && (
                        <button
                          type="button"
                          onClick={handleSecondaryCtaClick}
                          className="w-full py-1 text-center text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {config.secondaryCtaText}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Footer Snooze */}
                  {!isPreview && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={dontShowAgain}
                          onChange={(e) => setDontShowAgain(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                        />
                        <span>Don't show again today</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleClose}
                        className="hover:text-amber-300 underline cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* High-End Clean VIP Pass Layout (Default - No Image Clutter) */
              <div className="p-5 sm:p-7 space-y-5">
                {/* Hero Badge & Heading */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{config.discountPercent > 0 ? `${config.discountPercent}% DISCOUNT BENEFIT` : "OFFICIAL SCHEME"}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                    {config.title}
                  </h2>

                  {config.description && (
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                      {config.description}
                    </p>
                  )}
                </div>

                {/* Digital VIP Voucher Card with Perforated Edge Motif */}
                {config.couponCode && (
                  <div className="relative rounded-xl bg-[#0c1222] border border-amber-500/35 p-3.5 sm:p-4 overflow-hidden shadow-inner font-mono">
                    {/* Left & Right ticket perforations */}
                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#080d19] border-r border-amber-500/35" />
                    <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#080d19] border-l border-amber-500/35" />
                    
                    <div className="flex items-center justify-between gap-3 pl-3 pr-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span>VERIFIED VOUCHER CODE</span>
                        </div>
                        <div className="text-lg sm:text-2xl font-black text-amber-300 tracking-widest mt-0.5">
                          {config.couponCode}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Auto-applied or copy to checkout
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>COPY CODE</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* CTA Action Buttons */}
                {config.layoutMode === "with_buttons" && (
                  <div className="space-y-2.5 pt-1 font-mono">
                    <button
                      type="button"
                      onClick={handleCtaClick}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{config.ctaText || "CLAIM SCHEME NOW"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {config.secondaryCtaText && (
                      <button
                        type="button"
                        onClick={handleSecondaryCtaClick}
                        className="w-full py-1 text-center text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        {config.secondaryCtaText}
                      </button>
                    )}
                  </div>
                )}

                {/* Footer Snooze Controls */}
                {!isPreview && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Don't show again today</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleClose}
                      className="hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
