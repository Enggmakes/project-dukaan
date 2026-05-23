import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface MeshGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export default function MeshGradient({ className, children }: MeshGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      container.style.setProperty("--mouse-x", `${x}px`);
      container.style.setProperty("--mouse-y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden bg-mesh-container", className)}>
      <div className="absolute inset-0 bg-mesh-glows" aria-hidden="true">
        <div className="bg-mesh-blob bg-mesh-blob-1" />
        <div className="bg-mesh-blob bg-mesh-blob-2" />
        <div className="bg-mesh-blob bg-mesh-blob-3" />
        <div className="bg-mesh-blob bg-mesh-blob-4" />
        <div className="bg-mesh-blob bg-mesh-blob-5" />
        <div className="bg-mesh-blob bg-mesh-blob-6" />
        <div className="bg-mesh-blob bg-mesh-blob-interactive" />
      </div>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
