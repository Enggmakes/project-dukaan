import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Sparkles, Ticket, CheckCircle2, Zap, Coins, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLotteryConfig } from "@/lib/lotteryConfig";
import { toast } from "sonner";

interface StudentLotteryTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  originalPrice: number;
  onApplyDiscount: (discountPercent: number, couponCode: string) => void;
}

export default function StudentLotteryTicketModal({
  isOpen,
  onClose,
  projectTitle,
  originalPrice,
  onApplyDiscount,
}: StudentLotteryTicketModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [couponCode, setCouponCode] = useState<string>("STUDENT-25");
  const [ticketId, setTicketId] = useState<string>("№ 008530 · SERIES 1984");
  const [isCopied, setIsCopied] = useState(false);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize or reset ticket when opened
  useEffect(() => {
    if (isOpen) {
      const config = getLotteryConfig();
      const min = Math.min(config.minDiscount, config.maxDiscount);
      const max = Math.max(config.minDiscount, config.maxDiscount);
      // Random integer between min and max (inclusive)
      const randomDisc = Math.floor(Math.random() * (max - min + 1)) + min;
      const code = `STUDENT-${randomDisc}`;
      const randomSerial = `№ 00${Math.floor(1000 + Math.random() * 9000)} · SERIES 1984`;

      setDiscountPercent(randomDisc);
      setCouponCode(code);
      setTicketId(randomSerial);
      setIsScratched(false);
      setScratchPercent(0);
      setIsCopied(false);

      // Setup canvas on next tick
      setTimeout(initCanvas, 60);
    }
  }, [isOpen]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use container dimensions for pixel-perfect scratch area
    const width = (canvas.width = canvas.offsetWidth || 380);
    const height = (canvas.height = canvas.offsetHeight || 150);

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";

    // Brushed Metallic Antique Gold / Brass Foil Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#7a5412");
    grad.addColorStop(0.18, "#ae8022");
    grad.addColorStop(0.35, "#dfb347");
    grad.addColorStop(0.5, "#faeb9e");
    grad.addColorStop(0.65, "#dfb347");
    grad.addColorStop(0.82, "#cfa33f");
    grad.addColorStop(1, "#8c671a");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Fine metallic stipple particle noise to simulate physical scratch-off latex
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    for (let i = 0; i < 900; i++) {
      const px = ((i * 37) % width);
      const py = ((i * 59) % height);
      ctx.fillRect(px, py, 1.5, 1.5);
    }
    ctx.fillStyle = "rgba(70, 40, 5, 0.18)";
    for (let i = 0; i < 900; i++) {
      const px = ((i * 43) % width);
      const py = ((i * 71) % height);
      ctx.fillRect(px, py, 1.5, 1.5);
    }

    // Vintage guilloché engraving security border on the foil
    ctx.strokeStyle = "rgba(90, 55, 10, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    ctx.strokeStyle = "rgba(255, 240, 180, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(9, 9, width - 18, height - 18);

    // Decorative corner stars on the foil
    ctx.fillStyle = "#5c3d06";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", 16, 16);
    ctx.fillText("★", width - 16, 16);
    ctx.fillText("★", 16, height - 16);
    ctx.fillText("★", width - 16, height - 16);

    // Embossed center vintage stamp on foil
    ctx.fillStyle = "#523405";
    ctx.font = "bold 13px 'Cinzel', serif, Georgia, 'Times New Roman'";
    ctx.fillText("★  OFFICIAL SCRATCH SEAL  ★", width / 2, height / 2 - 18);

    ctx.fillStyle = "#3e2503";
    ctx.font = "bold 14px 'Special Elite', 'Courier New', monospace";
    ctx.fillText("RUB WITH COIN OR CURSOR", width / 2, height / 2 + 3);

    ctx.fillStyle = "#6d470a";
    ctx.font = "italic 11px 'Special Elite', 'Courier New', monospace";
    ctx.fillText("★ SCRATCH TO REVEAL ACADEMIC GRANT ★", width / 2, height / 2 + 23);
  }, []);

  const calculateScratchPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      let transparentCount = 0;
      const totalPixels = data.length / 4;

      // Sample every 4th pixel for high performance
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] === 0) {
          transparentCount += 4;
        }
      }

      const percent = Math.min(100, Math.round((transparentCount / totalPixels) * 100));
      setScratchPercent(percent);

      if (percent >= 38 && !isScratched) {
        setIsScratched(true);
        // Clear remaining canvas completely with smooth reveal
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch {
      // Ignore cross-origin / image data edge cases
    }
  }, [isScratched]);

  const scratch = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 42;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 21, 0, Math.PI * 2);
        ctx.fill();
      }

      lastPointRef.current = { x, y };
      calculateScratchPercent();
    },
    [calculateScratchPercent]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setIsCopied(true);
    toast.success(`Coupon code ${couponCode} copied to clipboard!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
  const savingsAmount = originalPrice - discountedPrice;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg transition-all" ref={containerRef}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-11 right-1 sm:-right-2 text-slate-400 hover:text-amber-300 p-2 rounded-full bg-[#0a0f1d] border border-amber-500/40 hover:border-amber-400 transition-all z-30 cursor-pointer shadow-lg"
          title="Close lottery modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Vintage Gilded Raffle Ticket Shell */}
        <div className="relative rounded-2xl bg-[#080d18] border-2 border-amber-500/70 shadow-[0_0_60px_rgba(212,175,55,0.25),inset_0_0_40px_rgba(0,0,0,0.85)] overflow-hidden select-none">
          
          {/* Inner Golden Hairline Inset Border */}
          <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-amber-500/30 pointer-events-none z-10" />

          {/* Genuine Semicircular Scalloped Ticket Notches at Perforation Line */}
          <div className="absolute top-[88px] sm:top-[94px] -left-3.5 w-7 h-7 rounded-full bg-[#03060d] border-2 border-amber-500/70 z-20 shadow-[inset_-3px_0_6px_rgba(0,0,0,0.9)]" />
          <div className="absolute top-[88px] sm:top-[94px] -right-3.5 w-7 h-7 rounded-full bg-[#03060d] border-2 border-amber-500/70 z-20 shadow-[inset_3px_0_6px_rgba(0,0,0,0.9)]" />

          {/* ================================================================= */}
          {/* TICKET STUB HEADER (Vintage Letterpress / Carnival Style)          */}
          {/* ================================================================= */}
          <div className="relative bg-gradient-to-b from-[#181309] via-[#100d07] to-[#0a0d18] border-b border-amber-500/40 px-5 pt-5 pb-3.5 text-center">
            {/* Top Serial & Ornamental Filigree */}
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-400/90 tracking-widest uppercase mb-1.5 px-1">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>OFFICIAL ADMISSION</span>
              </span>
              <span className="font-['Special_Elite',monospace] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                {ticketId}
              </span>
            </div>

            {/* Vintage Carnival Headline */}
            <h2 className="text-xl sm:text-2xl font-black font-['Cinzel',serif] tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#f59e0b] to-[#b45309] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              ★ THE GREAT STUDENT RAFFLE ★
            </h2>

            <p className="text-[11px] font-mono text-slate-300 mt-1 max-w-sm mx-auto truncate">
              Voucher valid for: <span className="text-amber-300 font-bold">{projectTitle}</span>
            </p>
          </div>

          {/* ================================================================= */}
          {/* PERFORATED TEAR-OFF LINE WITH CIRCULAR PUNCH HOLES                 */}
          {/* ================================================================= */}
          <div className="relative flex items-center justify-center my-0 py-2 bg-[#080d18]">
            <div className="w-full border-t border-dashed border-amber-500/50" />
            <span className="absolute bg-[#080d18] px-3 text-[9px] font-['Special_Elite',monospace] text-amber-400/80 tracking-widest uppercase flex items-center gap-1">
              <span>●</span>
              <span>TEAR OR SCRATCH TO VALIDATE</span>
              <span>●</span>
            </span>
          </div>

          {/* ================================================================= */}
          {/* MAIN TICKET BODY & SCRATCH STAGE                                  */}
          {/* ================================================================= */}
          <div className="p-5 sm:p-6 pt-2">
            
            {/* Scratch Arena Shell with Sunburst Rays Backdrop */}
            <div className="relative rounded-xl border-2 border-amber-500/60 bg-[#050811] shadow-[inset_0_2px_12px_rgba(0,0,0,0.9)] overflow-hidden">
              
              {/* Radiating Vintage Sunburst Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none vintage-sunburst" />

              {/* Underlying Revealed Prize Content */}
              <div className="py-6 px-4 sm:px-6 text-center flex flex-col items-center justify-center select-text relative z-0">
                
                {/* Vintage Rubber Stamp: VERIFIED WINNER */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-[11px] font-['Special_Elite',monospace] font-bold tracking-widest uppercase mb-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>★ OFFICIAL STUDENT WINNER ★</span>
                </div>

                {/* Stately Gilded Prize Percentage */}
                <div className="text-5xl sm:text-6xl font-black font-['Cinzel',serif] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#fbbf24] to-[#b45309] drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)] my-1">
                  {discountPercent}% OFF
                </div>

                {/* Secret Promo Voucher Box */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-400 font-mono uppercase">VOUCHER_CODE:</span>
                  <div className="flex items-center gap-1.5 bg-[#0e1628] px-3 py-1 rounded border border-amber-500/50 text-amber-300 font-['Special_Elite',monospace] font-bold text-sm tracking-widest shadow-sm">
                    <span>{couponCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-slate-400 hover:text-amber-300 p-0.5 transition-colors cursor-pointer"
                      title="Copy promo code"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Stamped Receipt Accounting Breakdown */}
                <div className="w-full mt-3 pt-3 border-t border-dashed border-slate-800 font-mono text-xs flex items-center justify-between text-slate-300 px-2 sm:px-4">
                  <div className="text-left">
                    <span className="text-[9px] text-slate-500 uppercase block font-['Special_Elite',monospace]">REGULAR TALLY</span>
                    <span className="line-through text-slate-400 text-xs">₹{originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] text-amber-400 uppercase block font-['Special_Elite',monospace] font-bold">LUCKY GRANT</span>
                    <span className="text-amber-400 font-bold text-sm">-₹{savingsAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-400 uppercase block font-['Special_Elite',monospace] font-bold">FINAL PAYMENT</span>
                    <span className="text-emerald-400 font-black text-sm">₹{discountedPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Real Metallic Antique Gold Latex Scratch Canvas Overlay */}
              {!isScratched && (
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute inset-0 w-full h-full cursor-crosshair touch-none transition-opacity duration-300 z-10"
                  style={{
                    opacity: scratchPercent > 38 ? 0 : 1,
                    pointerEvents: scratchPercent > 38 ? "none" : "auto",
                  }}
                />
              )}
            </div>

            {/* Foil Clearance Progress Gauge */}
            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 font-['Special_Elite',monospace]">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>SCRATCH_COMPLETION:</span>
              </span>
              <span className="text-amber-400 font-bold font-mono">
                {isScratched ? "100% (REVEALED)" : `${scratchPercent}%`}
              </span>
            </div>

            <div className="w-full bg-[#050811] h-2 rounded-full overflow-hidden mt-1.5 border border-amber-500/30 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${isScratched ? 100 : scratchPercent}%` }}
              />
            </div>

            {/* Redeem or Auto-Scratch Action Buttons */}
            <div className="mt-5 flex flex-col gap-2.5">
              {isScratched ? (
                <Button
                  onClick={() => {
                    onApplyDiscount(discountPercent, couponCode);
                    onClose();
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black font-mono text-xs sm:text-sm h-12 shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 retro-btn"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>[ 🎟️ REDEEM TICKET · APPLY {discountPercent}% DISCOUNT ]</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setIsScratched(true);
                    setScratchPercent(100);
                  }}
                  variant="outline"
                  className="w-full rounded-xl bg-[#0c1322] hover:bg-[#121c33] text-amber-300 hover:text-amber-200 border border-amber-500/50 hover:border-amber-400 font-mono text-xs h-11 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>🪙 Auto-Scratch with Coin</span>
                </Button>
              )}
            </div>

            {/* Vintage Ticket Seal & Terms Footer */}
            <div className="mt-3.5 text-center">
              <p className="text-[9px] text-slate-500 font-['Special_Elite',monospace] tracking-wider uppercase">
                ★ 100% Guaranteed Academic Grant · Single Use Per Verification Cycle · Dukaan Capstone Labs ★
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
