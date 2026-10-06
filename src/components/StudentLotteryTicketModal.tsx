import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Sparkles, Ticket, CheckCircle2, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLotteryConfig } from "@/lib/lotteryConfig";

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
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState<number>(25);
  const [couponCode, setCouponCode] = useState<string>("STUDENT-25");
  const [ticketId, setTicketId] = useState<string>("#PD-7829-STU");
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
      const randomId = `#PD-${Math.floor(1000 + Math.random() * 9000)}-STU`;

      setDiscountPercent(randomDisc);
      setCouponCode(code);
      setTicketId(randomId);
      setIsScratched(false);
      setScratchPercent(0);

      // Setup canvas on next tick
      setTimeout(initCanvas, 50);
    }
  }, [isOpen]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = canvas.offsetWidth || 340);
    const height = (canvas.height = canvas.offsetHeight || 130);

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";

    // Silver-cyan conductive foil gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(0.3, "#334155");
    grad.addColorStop(0.5, "#475569");
    grad.addColorStop(0.7, "#334155");
    grad.addColorStop(1, "#1e293b");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Circuit grid overlay texture
    ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
    ctx.lineWidth = 1;
    for (let x = 15; x < width; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 15; y < height; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Metallic border
    ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Instructions on foil
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡ SCRATCH FOIL TO REVEAL ⚡", width / 2, height / 2 - 10);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px 'Courier New', monospace";
    ctx.fillText("RUB WITH CURSOR OR TOUCH", width / 2, height / 2 + 14);
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

      if (percent >= 42 && !isScratched) {
        setIsScratched(true);
        // Clear remaining canvas completely with smooth reveal
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch {
      // Ignore security errors if any
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
      ctx.lineWidth = 36;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
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

  if (!isOpen) return null;

  const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));
  const savingsAmount = originalPrice - discountedPrice;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:-right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-900 border border-slate-700 hover:border-amber-500 transition-all z-20 cursor-pointer"
          title="Close lottery modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Vintage Ticket Shell with Punched Notch Edges */}
        <div className="relative rounded-2xl bg-gradient-to-br from-[#0c1222] via-[#090d18] to-[#05070e] border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden font-mono select-none">
          
          {/* Top Vintage Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-amber-950 px-6 py-2.5 flex items-center justify-between border-b-2 border-amber-600 font-mono">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 fill-amber-950" />
              <span className="text-xs font-black tracking-wider uppercase">
                STUDENT BLUEPRINT RAFFLE
              </span>
            </div>
            <div className="text-[11px] font-bold tracking-tight bg-amber-950/15 px-2.5 py-0.5 rounded border border-amber-950/30">
              {ticketId}
            </div>
          </div>

          {/* Ticket Body with Decorative Cutout Notches */}
          <div className="relative p-6 sm:p-8">
            {/* Left Notch */}
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-500/60 z-10" />
            {/* Right Notch */}
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-500/60 z-10" />

            {/* Header Info */}
            <div className="text-center space-y-1.5 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Ticket className="w-3.5 h-3.5" />
                VERIFIED STUDENT RAFFLE PASS
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Scratch To Claim Your Discount
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Applies directly toward <span className="text-slate-200 font-bold">{projectTitle}</span>
              </p>
            </div>

            {/* Ticket Perforation Dashed Line */}
            <div className="border-b-2 border-dashed border-slate-700/80 my-4 relative">
              <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-[#090d18] px-3 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                CUT_HERE_TO_VERIFY
              </span>
            </div>

            {/* Scratch Stage Container */}
            <div className="relative mt-6 rounded-xl border-2 border-amber-500/50 bg-[#060912] shadow-inner p-1 overflow-hidden">
              {/* Underlying Revealed Prize Content */}
              <div className="py-7 px-5 text-center flex flex-col items-center justify-center space-y-2 select-text">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  LUCKY STUDENT VOUCHER REVEALED!
                </span>

                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                  {discountPercent}% OFF
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400 font-mono">PROMO_CODE:</span>
                  <span className="px-3 py-1 rounded bg-[#0d1424] border border-amber-500/50 text-amber-300 font-mono font-black text-sm tracking-wider">
                    {couponCode}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-mono mt-2 pt-2 border-t border-slate-800/80 w-full flex items-center justify-around">
                  <div>
                    <span className="text-slate-500 text-[10px] block">ORIGINAL</span>
                    <span className="line-through text-slate-400">₹{originalPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[10px] block font-bold">YOU PAY</span>
                    <span className="text-emerald-400 font-bold text-sm">₹{discountedPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-amber-400 text-[10px] block font-bold">YOU SAVE</span>
                    <span className="text-amber-400 font-bold text-sm">₹{savingsAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Scratch-off Canvas Overlay */}
              {!isScratched && (
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute inset-0 w-full h-full cursor-crosshair touch-none transition-opacity duration-300"
                  style={{
                    opacity: scratchPercent > 40 ? 0 : 1,
                    pointerEvents: scratchPercent > 40 ? "none" : "auto",
                  }}
                />
              )}
            </div>

            {/* Scratch progress indicator */}
            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SCRATCH_COMPLETION:</span>
              <span className="text-amber-400 font-bold">{isScratched ? "100%" : `${scratchPercent}%`}</span>
            </div>

            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-150"
                style={{ width: `${isScratched ? 100 : scratchPercent}%` }}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {isScratched ? (
                <Button
                  onClick={() => {
                    onApplyDiscount(discountPercent, couponCode);
                    onClose();
                  }}
                  className="w-full rounded bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black font-mono text-xs h-12 shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 retro-btn"
                >
                  <Zap className="w-4 h-4 fill-emerald-950" />
                  [⚡ APPLY {discountPercent}% DISCOUNT TO ORDER]
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    setIsScratched(true);
                    setScratchPercent(100);
                  }}
                  variant="outline"
                  className="w-full rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-mono text-xs h-11 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Auto-Scratch Card
                </Button>
              )}
            </div>

            <div className="mt-3 text-center">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                100% Guaranteed academic discount · 1 ticket per verification cycle
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
