import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface TechParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  type: number; // 0=Arduino, 1=HC-SR04, 2=CPU, 3=LED, 4=Resistor
  size: number;
  radius: number;
  mass: number;
  colorTheme: string;
  settled: boolean;
}

const THEMES = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function GravityLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settledCount, setSettledCount] = useState(0);

  const particlesRef = useRef<TechParticle[]>([]);
  const mouseRef = useRef({
    x: -9999,
    y: -9999,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
  });

  // Polyfill roundRect for Safari / older browsers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx && typeof (ctx as any).roundRect !== "function") {
      (CanvasRenderingContext2D.prototype as any).roundRect = function (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) {
        const radius = Math.min(r, w / 2, h / 2);
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + w - radius, y);
        this.quadraticCurveTo(x + w, y, x + w, y + radius);
        this.lineTo(x + w, y + h - radius);
        this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        this.lineTo(x + radius, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }
  }, []);

  const clearParticles = useCallback(() => {
    particlesRef.current = [];
    setSettledCount(0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // EXACT spawn parameters from the regular GlobalTechParticles trail
    const spawnParticle = (x: number, y: number) => {
      // Keep up to 600 components max for silky smooth 60fps
      if (particlesRef.current.length >= 600) {
        // Drop the oldest settled particle if reached max capacity
        const settledIndex = particlesRef.current.findIndex((p) => p.settled);
        if (settledIndex !== -1) {
          particlesRef.current.splice(settledIndex, 1);
        } else {
          particlesRef.current.shift();
        }
      }

      const size = Math.random() * 10 + 20; // 20px - 30px (identical to main site)
      const colorTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
      const radius = size * 0.58;

      particlesRef.current.push({
        id: Math.random() + Date.now(),
        x,
        y,
        // Regular site trail: floats upward and drifts initially behind cursor
        vx: (Math.random() - 0.5) * 2.2,
        vy: -Math.random() * 2.5 - 0.8, // gentle upward plume
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.05,
        type: Math.floor(Math.random() * 5),
        size,
        radius,
        mass: radius * radius * 0.1,
        colorTheme,
        settled: false,
      });
    };

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseRef.current.vx = x - mouseRef.current.lastX;
      mouseRef.current.vy = y - mouseRef.current.lastY;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.lastX = x;
      mouseRef.current.lastY = y;

      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Same 22px distance threshold as the regular site
      if (dist > 22) {
        spawnParticle(x, y);
        lastX = x;
        lastY = y;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        mouseRef.current.vx = x - mouseRef.current.lastX;
        mouseRef.current.vy = y - mouseRef.current.lastY;
        mouseRef.current.x = x;
        mouseRef.current.y = y;
        mouseRef.current.lastX = x;
        mouseRef.current.lastY = y;

        const dx = x - lastX;
        const dy = y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 22) {
          spawnParticle(x, y);
          lastX = x;
          lastY = y;
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Detailed Hardware Component Canvas Renderer
    const drawComponent = (c: CanvasRenderingContext2D, type: number, s: number, themeColor: string) => {
      c.lineCap = "round";
      c.lineJoin = "round";

      switch (type) {
        case 0: {
          // 1. Arduino Uno Board
          const w = s * 1.4;
          const h = s;

          c.fillStyle = "#005f73";
          c.strokeStyle = "#0a9396";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(-w / 2, -h / 2, w, h, 3);
          c.fill();
          c.stroke();

          // USB Port
          c.fillStyle = "#ced4da";
          c.beginPath();
          c.rect(-w / 2 - 1, -h / 4 - 1, w / 4, h / 3);
          c.fill();
          c.strokeStyle = "#6c757d";
          c.lineWidth = 0.5;
          c.stroke();

          // Power Jack
          c.fillStyle = "#212529";
          c.beginPath();
          c.rect(-w / 2 + 2, h / 6, w / 5, h / 4);
          c.fill();

          // Microchip
          c.fillStyle = "#343a40";
          c.beginPath();
          c.rect(-w / 6, -h / 6, w / 3, h / 3);
          c.fill();

          // Copper Pin contacts
          c.strokeStyle = "#e9d8a6";
          c.lineWidth = 0.5;
          for (let offset = -w / 8; offset <= w / 8; offset += w / 12) {
            c.beginPath();
            c.moveTo(offset, -h / 6 - 1.5);
            c.lineTo(offset, -h / 6);
            c.moveTo(offset, h / 6);
            c.lineTo(offset, h / 6 + 1.5);
            c.stroke();
          }

          // Header Pins
          c.fillStyle = "#1a1a1a";
          c.beginPath();
          c.rect(-w / 3, -h / 2 + 1, (w * 2) / 3, 2.5);
          c.rect(-w / 4, h / 2 - 3.5, (w * 2) / 3, 2.5);
          c.fill();

          // Indicator LED
          c.shadowBlur = 6;
          c.shadowColor = "#94d2bd";
          c.fillStyle = "#94d2bd";
          c.beginPath();
          c.arc(w / 4, -h / 4, 1.2, 0, Math.PI * 2);
          c.fill();
          c.shadowBlur = 0;
          break;
        }

        case 1: {
          // 2. HC-SR04 Ultrasonic Sensor
          const w = s * 1.5;
          const h = s * 0.85;

          c.fillStyle = "#0077b6";
          c.strokeStyle = "#0096c7";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(-w / 2, -h / 2, w, h, 2.5);
          c.fill();
          c.stroke();

          const r = h * 0.35;
          c.fillStyle = "#adb5bd";
          c.strokeStyle = "#495057";
          c.lineWidth = 0.8;

          c.beginPath();
          c.arc(-w / 4, 0, r, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#343a40";
          c.beginPath();
          c.arc(-w / 4, 0, r * 0.7, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#adb5bd";
          c.beginPath();
          c.arc(w / 4, 0, r, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          c.fillStyle = "#343a40";
          c.beginPath();
          c.arc(w / 4, 0, r * 0.7, 0, Math.PI * 2);
          c.fill();

          c.strokeStyle = "#ced4da";
          c.lineWidth = 0.8;
          for (let offset = -6; offset <= 6; offset += 4) {
            c.beginPath();
            c.moveTo(offset, h / 2);
            c.lineTo(offset, h / 2 + 4);
            c.stroke();
          }
          break;
        }

        case 2: {
          // 3. CPU Microchip IC
          const size = s;

          c.fillStyle = "#2d6a4f";
          c.strokeStyle = "#40916c";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(-size / 2, -size / 2, size, size, 2);
          c.fill();
          c.stroke();

          c.fillStyle = "#e9ecef";
          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.roundRect(-size / 3, -size / 3, (size * 2) / 3, (size * 2) / 3, 1.5);
          c.fill();
          c.stroke();

          c.fillStyle = "#ffb703";
          c.beginPath();
          c.moveTo(-size / 2, -size / 2);
          c.lineTo(-size / 2 + 4, -size / 2);
          c.lineTo(-size / 2, -size / 2 + 4);
          c.closePath();
          c.fill();

          c.strokeStyle = "#ced4da";
          c.lineWidth = 0.5;
          c.beginPath();
          c.moveTo(-size / 5, -size / 6);
          c.lineTo(size / 5, -size / 6);
          c.moveTo(-size / 6, 0);
          c.lineTo(size / 6, 0);
          c.stroke();
          break;
        }

        case 3: {
          // 4. Glowing Translucent LED
          const legHeight = s * 0.6;
          const bulbSize = s * 0.5;

          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.moveTo(-bulbSize / 3, bulbSize / 3);
          c.lineTo(-bulbSize / 3, bulbSize / 3 + legHeight);
          c.moveTo(bulbSize / 3, bulbSize / 3);
          c.lineTo(bulbSize / 3, bulbSize / 3 + legHeight * 1.15);
          c.stroke();

          c.fillStyle = themeColor;
          c.shadowBlur = 10;
          c.shadowColor = themeColor;
          c.beginPath();
          c.arc(0, -bulbSize / 4, bulbSize / 2, Math.PI, 0);
          c.rect(-bulbSize / 2, -bulbSize / 4, bulbSize, bulbSize / 2 + bulbSize / 12);
          c.fill();
          c.shadowBlur = 0;

          c.fillStyle = themeColor;
          c.beginPath();
          c.rect(-bulbSize / 2 - 1, bulbSize / 3, bulbSize + 2, 1.5);
          c.fill();
          break;
        }

        case 4: {
          // 5. Ceramic 4-Band Resistor
          const w = s * 1.2;
          const h = s * 0.4;

          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.moveTo(-w * 0.8, 0);
          c.lineTo(w * 0.8, 0);
          c.stroke();

          c.fillStyle = "#f4f1de";
          c.strokeStyle = "#e0dbcd";
          c.lineWidth = 0.6;
          c.beginPath();
          c.roundRect(-w / 2, -h / 2, w, h, 2);
          c.fill();
          c.stroke();

          c.fillStyle = "#e63946";
          c.fillRect(-w / 3, -h / 2 + 0.3, w / 10, h - 0.6);
          c.fillStyle = "#8338ec";
          c.fillRect(-w / 10, -h / 2 + 0.3, w / 10, h - 0.6);
          c.fillStyle = "#212529";
          c.fillRect(w / 10, -h / 2 + 0.3, w / 10, h - 0.6);
          c.fillStyle = "#e5c583";
          c.fillRect(w / 3, -h / 2 + 0.3, w / 10, h - 0.6);
          break;
        }
      }
    };

    let animationId: number;

    // Continuous downward gravity acceleration
    const gravity = 0.36;
    const floorYOffset = 12;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      const floorY = height - floorYOffset;
      const leftX = 12;
      const rightX = width - 12;

      const particles = particlesRef.current;
      const len = particles.length;
      const mouse = mouseRef.current;

      let settledTally = 0;

      // 1. Continuous Physics Update (NEVER stops mid-air!)
      for (let i = 0; i < len; i++) {
        const p = particles[i];

        if (!p.settled) {
          // Always apply continuous gravity while in the air!
          p.vy += gravity;

          // Gentle air drag
          p.vx *= 0.985;
          p.vy *= 0.992;

          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.spin;

          // Wall bounces
          if (p.x - p.radius < leftX) {
            p.x = leftX + p.radius;
            p.vx = -p.vx * 0.45;
          } else if (p.x + p.radius > rightX) {
            p.x = rightX - p.radius;
            p.vx = -p.vx * 0.45;
          }

          // Floor collision
          if (p.y + p.radius >= floorY) {
            p.y = floorY - p.radius;
            p.vy = -p.vy * 0.32; // bounce
            p.vx *= 0.82; // ground friction
            p.spin *= 0.7;

            // Settle when downward energy dissipates on the floor
            if (Math.abs(p.vy) < 0.4 && Math.abs(p.vx) < 0.4) {
              p.vy = 0;
              p.vx = 0;
              p.settled = true;
            }
          }
        } else {
          settledTally++;

          // Keep settled particle on ground or bounds
          if (p.y + p.radius > floorY) {
            p.y = floorY - p.radius;
            p.vy = 0;
          }

          // Mouse sweep / push through settled pile
          if (mouse.x > 0 && mouse.y > 0) {
            const mdx = p.x - mouse.x;
            const mdy = p.y - mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            const pushRadius = 75;

            if (mdist < pushRadius && mdist > 0.01) {
              const push = (pushRadius - mdist) / pushRadius;
              p.vx += (mdx / mdist) * push * 6 + mouse.vx * 0.18;
              p.vy += (mdy / mdist) * push * 6 + mouse.vy * 0.18 - 1.5;
              p.spin += (Math.random() - 0.5) * 0.15;
              p.settled = false; // re-awaken with gravity!
            }
          }
        }
      }

      // 2. Stacking Collision ONLY for particles near the floor or settled
      // (This guarantees particles falling through the air never freeze or get stuck!)
      const floorThreshold = height - 280;
      const nearFloorParticles: number[] = [];

      for (let i = 0; i < len; i++) {
        if (particles[i].y > floorThreshold || particles[i].settled) {
          nearFloorParticles.push(i);
        }
      }

      const nLen = nearFloorParticles.length;
      for (let a = 0; a < nLen; a++) {
        const p1 = particles[nearFloorParticles[a]];
        for (let b = a + 1; b < nLen; b++) {
          const p2 = particles[nearFloorParticles[b]];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distSq = dx * dx + dy * dy;
          const minDist = p1.radius + p2.radius;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate physical positions
            p1.x -= nx * overlap;
            p1.y -= ny * overlap;
            p2.x += nx * overlap;
            p2.y += ny * overlap;

            // Dampen resting velocities against each other
            if (p1.settled || p2.settled) {
              p1.vx *= 0.88;
              p2.vx *= 0.88;
              if (Math.abs(p1.vy) < 0.5) p1.settled = true;
              if (Math.abs(p2.vy) < 0.5) p2.settled = true;
            }
          }
        }
      }

      // 3. Render all components
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        ctx.globalAlpha = 0.92;

        try {
          drawComponent(ctx, p.type, p.size, p.colorTheme);
        } catch {
          // Skip if glitch
        }

        ctx.restore();
      }

      // Floor Guide Line
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, floorY);
      ctx.lineTo(width - 12, floorY);
      ctx.stroke();

      setSettledCount(settledTally);
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#070a12] overflow-hidden select-none font-mono selection:bg-amber-500 selection:text-amber-950">
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 pointer-events-none blueprint-grid opacity-40 z-0" />

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 z-0" />

      {/* Full Screen Interactive Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-default z-10" />

      {/* Top Header */}
      <header className="absolute top-5 left-5 right-5 z-20 flex items-center justify-between pointer-events-none">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#0d121e]/90 hover:bg-[#161d2d] text-slate-300 hover:text-amber-400 text-xs font-mono font-bold border border-slate-700 hover:border-amber-500/60 shadow-lg pointer-events-auto transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
          <span>SYS:\RETURN_TO_DUKAAN</span>
        </Link>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="px-3 py-1 rounded bg-[#0d121e]/90 border border-slate-800 text-xs text-amber-400 font-mono font-bold shadow-md">
            <span>STORED_AT_BOTTOM: </span>
            <span className="text-white">{settledCount}</span>
          </div>

          {settledCount > 0 && (
            <button
              onClick={clearParticles}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#0d121e]/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/50 text-xs font-mono transition-all"
              title="Clear stored pile"
            >
              <RotateCcw className="w-3 h-3" />
              <span>CLEAR</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Center Prompt */}
      {settledCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
          <div className="p-4 rounded-xl bg-[#0a0e17]/85 border border-slate-800 text-center space-y-1 backdrop-blur-sm shadow-2xl">
            <p className="text-sm font-bold text-amber-400 font-mono tracking-wide">
              ✨ WAVE YOUR MOUSE ACROSS THE SCREEN
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Components trail from your mouse, arc gracefully, and fall all the way down to fill the floor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
