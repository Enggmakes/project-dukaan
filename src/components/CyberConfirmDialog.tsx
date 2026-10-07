import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";

interface CyberConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
}

export default function CyberConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "CONFIRM_ACTION",
  cancelText = "ABORT",
  variant = "danger",
  isLoading = false,
}: CyberConfirmDialogProps) {
  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const isDanger = variant === "danger";

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto touch-manipulation"
      onClick={onClose}
    >
      <div 
        className="bg-[#090e1c] border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-[0_15px_60px_rgba(0,0,0,0.9)] relative overflow-hidden font-mono animate-in zoom-in-95 duration-150 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient scanline accent */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent ${
            isDanger ? "via-rose-500" : "via-amber-500"
          } to-transparent`} 
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer touch-manipulation"
          aria-label="Close confirmation dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5 mb-3">
          <div 
            className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 border ${
              isDanger 
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]" 
                : "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            }`}
          >
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className={`text-[10px] font-mono font-bold tracking-wider uppercase block mb-0.5 ${
              isDanger ? "text-rose-400" : "text-amber-400"
            }`}>
              SYS:\SECURITY_CONFIRMATION
            </span>
            <h3 className="text-base font-black text-white font-mono uppercase tracking-wide leading-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 font-mono leading-relaxed mt-2 pl-0.5">
          {description}
        </p>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-xl bg-[#070a12] text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white h-11 px-4 text-xs font-mono font-semibold cursor-pointer touch-manipulation active:scale-95"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            disabled={isLoading}
            onClick={async (e) => {
              e.stopPropagation();
              await onConfirm();
            }}
            className={`rounded-xl text-xs font-mono font-black h-11 px-5 shadow-lg flex items-center gap-2 cursor-pointer transition-all touch-manipulation active:scale-95 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-rose-400/40"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-300"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
