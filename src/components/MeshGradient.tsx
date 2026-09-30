import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface MeshGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export default function MeshGradient({ className, children }: MeshGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Never run mouse tracking on mobile touch devices (iPhones/Androids)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        container.style.setProperty("--mouse-x", `${x}px`);
        container.style.setProperty("--mouse-y", `${y}px`);
        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden bg-mesh-container pointer-events-none", className)}>
      {/* Mobile ultra-fast static CSS mesh (0% GPU blur cost, 120 FPS) */}
      <div 
        className="absolute inset-0 block md:hidden bg-gradient-to-tr from-indigo-100/40 via-violet-50/30 to-sky-100/40" 
        aria-hidden="true" 
      />

      {/* Desktop ambient glows */}
      <div className="absolute inset-0 hidden md:block bg-mesh-glows" aria-hidden="true">
        <div className="bg-mesh-blob bg-mesh-blob-1" />
        <div className="bg-mesh-blob bg-mesh-blob-2" />
        <div className="bg-mesh-blob bg-mesh-blob-3" />
        <div className="bg-mesh-blob bg-mesh-blob-interactive" />
      </div>

      {children && <div className="relative z-10 pointer-events-auto">{children}</div>}
    </div>
  );
}
