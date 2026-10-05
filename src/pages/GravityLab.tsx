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
  phase: "trailing" | "falling" | "settled";
  trailTimer: number; // time spent floating gently behind cursor
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

  // Polyfill roundRect
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
      // Limit total particles on screen to 450 to maintain solid 60fps
      if (particlesRef.current.length >= 450) {
        // Remove the oldest settled particle if ceiling reached
        const settledIndex = particlesRef.current.findIndex((p) => p.phase === "settled");
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
        // EXACT gentle drift & upward anti-gravity float from regular mouse trail
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.2 - 0.4,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.035,
        type: Math.floor(Math.random() * 5),
        size,
        radius,
        mass: radius * radius * 0.1,
        colorTheme,
        phase: "trailing", // Phase 1: gentle float behind cursor
        trailTimer: Math.random() * 0.5 + 0.9, // trails behind cursor for ~0.9 - 1.4s
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

    const gravity = 0.38;
    const floorYOffset = 10;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      const floorY = height - floorYOffset;
      const leftX = 12;
      const rightX = width - 12;

      const particles = particlesRef.current;
      const len = particles.length;
      const mouse = mouseRef.current;

      let settledTally = 0;

      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // 1. PHASE 1: Trailing gently behind mouse (IDENTICAL to regular pages)
        if (p.phase === "trailing") {
          p.trailTimer -= 0.016;

          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.97;
          p.vy *= 0.97;
          p.rotation += p.spin;

          // When trailing phase ends, transition to gravity fall!
          if (p.trailTimer <= 0) {
            p.phase = "falling";
            p.vy = Math.random() * 0.5; // slight downward starting nudge
          }
        }
        // 2. PHASE 2: Falling with Gravity toward floor
        else if (p.phase === "falling") {
          p.vy += gravity; // Gravity pulls it down!
          p.vx *= 0.99;
          p.vy *= 0.99;

          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.spin;

          // Bounce on floor
          if (p.y + p.radius > floorY) {
            p.y = floorY - p.radius;
            p.vy = -p.vy * 0.35;
            p.vx *= 0.85;
            p.spin *= 0.75;

            // If resting on floor, mark as settled
            if (Math.abs(p.vy) < 0.3) {
              p.vy = 0;
              p.phase = "settled";
            }
          }

          // Wall boundaries
          if (p.x - p.radius < leftX) {
            p.x = leftX + p.radius;
            p.vx = -p.vx * 0.4;
          } else if (p.x + p.radius > rightX) {
            p.x = rightX - p.radius;
            p.vx = -p.vx * 0.4;
          }
        }
        // 3. PHASE 3: Settled at the bottom
        else if (p.phase === "settled") {
          settledTally++;

          // Keep in bounds
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
              p.vx += (mdx / mdist) * push * 6 + mouse.vx * 0.15;
              p.vy += (mdy / mdist) * push * 6 + mouse.vy * 0.15;
              p.spin += (Math.random() - 0.5) * 0.1;
              p.phase = "falling"; // awaken and let gravity handle it again
            }
          }
        }
      }

      // 4. Stacking Collision in the Settled Floor Pile (so components stack and fill up the floor)
      const cellSize = 55;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      const grid: number[][] = new Array(cols * rows);

      for (let i = 0; i < len; i++) {
        const p = particles[i];
        if (p.phase === "trailing") continue; // only check fallen/settled

        const cellX = Math.floor(Math.max(0, Math.min(width - 1, p.x)) / cellSize);
        const cellY = Math.floor(Math.max(0, Math.min(height - 1, p.y)) / cellSize);
        const cellIdx = cellX + cellY * cols;

        if (!grid[cellIdx]) grid[cellIdx] = [];
        grid[cellIdx].push(i);
      }

      for (let cellIdx = 0; cellIdx < grid.length; cellIdx++) {
        const cell = grid[cellIdx];
        if (!cell || cell.length === 0) continue;

        const cellX = cellIdx % cols;
        const cellY = Math.floor(cellIdx / cols);

        for (let ox = 0; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            if (ox === 0 && oy < 0) continue;
            const neighborX = cellX + ox;
            const neighborY = cellY + oy;

            if (neighborX < 0 || neighborX >= cols || neighborY < 0 || neighborY >= rows) continue;
            const neighborCell = grid[neighborX + neighborY * cols];
            if (!neighborCell) continue;

            const isSelfCell = cellIdx === neighborX + neighborY * cols;

            for (let a = 0; a < cell.length; a++) {
              const startB = isSelfCell ? a + 1 : 0;
              for (let b = startB; b < neighborCell.length; b++) {
                const p1 = particles[cell[a]];
                const p2 = particles[neighborCell[b]];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distSq = dx * dx + dy * dy;
                const minDist = p1.radius + p2.radius;

                if (distSq < minDist * minDist && distSq > 0.0001) {
                  const dist = Math.sqrt(distSq);
                  const overlap = (minDist - dist) * 0.5;
                  const nx = dx / dist;
                  const ny = dy / dist;

                  p1.x -= nx * overlap;
                  p1.y -= ny * overlap;
                  p2.x += nx * overlap;
                  p2.y += ny * overlap;

                  // Soft settle
                  p1.vx *= 0.85;
                  p2.vx *= 0.85;
                  p1.vy *= 0.85;
                  p2.vy *= 0.85;
                }
              }
            }
          }
        }
      }

      // 5. Draw all particles
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // While trailing, opacity is slightly softer (0.85) just like main site
        ctx.globalAlpha = p.phase === "trailing" ? 0.88 : 0.95;

        try {
          drawComponent(ctx, p.type, p.size, p.colorTheme);
        } catch {
          // Skip if glitch
        }

        ctx.restore();
      }

      // Subtle Hazard Floor Line
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

      {/* Floating Center Prompt (fades away once particles start settling) */}
      {settledCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
          <div className="p-4 rounded-xl bg-[#0a0e17]/85 border border-slate-800 text-center space-y-1 backdrop-blur-sm shadow-2xl">
            <p className="text-sm font-bold text-amber-400 font-mono tracking-wide">
              ✨ WAVE YOUR MOUSE ACROSS THE SCREEN
            </p>
            <p className="text-xs text-slate-400 font-mono">
              The trail floats behind your cursor, then gravity pulls it down to store and fill up the floor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
