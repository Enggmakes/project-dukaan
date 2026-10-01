import { cn } from "@/lib/utils";

interface MeshGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export default function MeshGradient({ className, children }: MeshGradientProps) {
  return (
    <div className={cn("relative overflow-hidden pointer-events-none bg-slate-50/50", className)}>
      {/* Precision Blueprint Hairline Grid */}
      <div 
        className="absolute inset-0 blueprint-grid opacity-70 pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white pointer-events-none" 
        aria-hidden="true" 
      />

      {children && <div className="relative z-10 pointer-events-auto">{children}</div>}
    </div>
  );
}
