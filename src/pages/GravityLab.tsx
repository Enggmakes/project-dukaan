import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface ComponentParticle {
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
}

const THEMES = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function GravityLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particleCount, setParticleCount] = useState(0);

  const particlesRef = useRef<ComponentParticle[]>([]);
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
    setParticleCount(0);
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

    // Spawns a single hardware particle right at the cursor position
    const spawnFromMouseTrail = (x: number, y: number, nudgeX = 0, nudgeY = 0) => {
      // Keep up to 500 components on screen
      if (particlesRef.current.length >= 500) {
        particlesRef.current.shift();
      }

      const size = Math.random() * 8 + 22; // 22px to 30px
      const colorTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
      const radius = size * 0.6;

      particlesRef.current.push({
        id: Math.random() + Date.now(),
        x,
        y,
        // Inherits slight nudge from mouse movement + subtle drift
        vx: nudgeX * 0.15 + (Math.random() - 0.5) * 1.5,
        vy: nudgeY * 0.15 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
        type: Math.floor(Math.random() * 5),
        size,
        radius,
        mass: radius * radius * 0.1,
        colorTheme,
      });
    };

    let lastSpawnX = 0;
    let lastSpawnY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const vx = currentX - mouseRef.current.lastX;
      const vy = currentY - mouseRef.current.lastY;

      mouseRef.current.vx = vx;
      mouseRef.current.vy = vy;
      mouseRef.current.x = currentX;
      mouseRef.current.y = currentY;
      mouseRef.current.lastX = currentX;
      mouseRef.current.lastY = currentY;

      // Distance check to smoothly trail particles behind cursor
      const dx = currentX - lastSpawnX;
      const dy = currentY - lastSpawnY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 22) {
        spawnFromMouseTrail(currentX, currentY, vx, vy);
        lastSpawnX = currentX;
        lastSpawnY = currentY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        const vx = currentX - mouseRef.current.lastX;
        const vy = currentY - mouseRef.current.lastY;

        mouseRef.current.vx = vx;
        mouseRef.current.vy = vy;
        mouseRef.current.x = currentX;
        mouseRef.current.y = currentY;
        mouseRef.current.lastX = currentX;
        mouseRef.current.lastY = currentY;

        const dx = currentX - lastSpawnX;
        const dy = currentY - lastSpawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 22) {
          spawnFromMouseTrail(currentX, currentY, vx, vy);
          lastSpawnX = currentX;
          lastSpawnY = currentY;
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Drawing Routine for Detailed Electronic Components
    const drawComponent = (c: CanvasRenderingContext2D, type: number, s: number, themeColor: string) => {
      c.lineCap = "round";
      c.lineJoin = "round";

      switch (type) {
        case 0: {
          // 1. Arduino Uno Board
          const w = s * 1.45;
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
          c.rect(-w / 2 - 2, -h / 4 - 1, w / 4, h / 3);
          c.fill();
          c.strokeStyle = "#6c757d";
          c.lineWidth = 0.5;
          c.stroke();

          // Power Jack
          c.fillStyle = "#212529";
          c.beginPath();
          c.rect(-w / 2 + 2, h / 6, w / 5, h / 4);
          c.fill();

          // ATmega328P Chip
          c.fillStyle = "#343a40";
          c.beginPath();
          c.rect(-w / 6, -h / 6, w / 3, h / 3);
          c.fill();

          // Copper Pin contacts
          c.strokeStyle = "#e9d8a6";
          c.lineWidth = 0.6;
          for (let offset = -w / 8; offset <= w / 8; offset += w / 12) {
            c.beginPath();
            c.moveTo(offset, -h / 6 - 1.5);
            c.lineTo(offset, -h / 6);
            c.moveTo(offset, h / 6);
            c.lineTo(offset, h / 6 + 1.5);
            c.stroke();
          }

          // Header sockets
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
          c.arc(w / 4, -h / 4, 1.3, 0, Math.PI * 2);
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

          // Metal Transducers
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

          // Pins
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

          // Metal Lid
          c.fillStyle = "#e9ecef";
          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.roundRect(-size / 3, -size / 3, (size * 2) / 3, (size * 2) / 3, 1.5);
          c.fill();
          c.stroke();

          // Gold corner
          c.fillStyle = "#ffb703";
          c.beginPath();
          c.moveTo(-size / 2, -size / 2);
          c.lineTo(-size / 2 + 4, -size / 2);
          c.lineTo(-size / 2, -size / 2 + 4);
          c.closePath();
          c.fill();
          break;
        }

        case 3: {
          // 4. Glowing Translucent LED
          const legHeight = s * 0.6;
          const bulbSize = s * 0.55;

          // Metal Leads
          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.moveTo(-bulbSize / 3, bulbSize / 3);
          c.lineTo(-bulbSize / 3, bulbSize / 3 + legHeight);
          c.moveTo(bulbSize / 3, bulbSize / 3);
          c.lineTo(bulbSize / 3, bulbSize / 3 + legHeight * 1.15);
          c.stroke();

          // Glowing Dome
          c.fillStyle = themeColor;
          c.shadowBlur = 10;
          c.shadowColor = themeColor;
          c.beginPath();
          c.arc(0, -bulbSize / 4, bulbSize / 2, Math.PI, 0);
          c.rect(-bulbSize / 2, -bulbSize / 4, bulbSize, bulbSize / 2 + bulbSize / 12);
          c.fill();
          c.shadowBlur = 0;

          // Rim
          c.fillStyle = themeColor;
          c.beginPath();
          c.rect(-bulbSize / 2 - 1, bulbSize / 3, bulbSize + 2, 1.5);
          c.fill();
          break;
        }

        case 4: {
          // 5. Ceramic Resistor
          const w = s * 1.25;
          const h = s * 0.42;

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

          // Bands
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

    const gravity = 0.45;
    const bounceDamping = 0.35;
    const floorFriction = 0.88;
    const airDrag = 0.994;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      const floorY = height - 10;
      const leftX = 10;
      const rightX = width - 10;

      const particles = particlesRef.current;
      const len = particles.length;
      const mouse = mouseRef.current;

      // 1. Move with Gravity & Handle Boundaries
      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // Apply downward Gravity
        p.vy += gravity;

        // Mouse Stir / Push when user sweeps through the pile
        if (mouse.x > 0 && mouse.y > 0) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const pushRadius = 70;

          if (mdist < pushRadius && mdist > 0.01) {
            const pushFactor = (pushRadius - mdist) / pushRadius;
            const force = pushFactor * 6;
            p.vx += (mdx / mdist) * force + mouse.vx * 0.12;
            p.vy += (mdy / mdist) * force + mouse.vy * 0.12;
            p.spin += (Math.random() - 0.5) * 0.1;
          }
        }

        // Air Drag
        p.vx *= airDrag;
        p.vy *= airDrag;

        // Step position
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        // Bottom floor collision
        if (p.y + p.radius > floorY) {
          p.y = floorY - p.radius;
          p.vy = -p.vy * bounceDamping;
          p.vx *= floorFriction;
          p.spin *= 0.75;
          if (Math.abs(p.vy) < 0.25) p.vy = 0;
        }

        // Left / Right walls
        if (p.x - p.radius < leftX) {
          p.x = leftX + p.radius;
          p.vx = -p.vx * 0.45;
        } else if (p.x + p.radius > rightX) {
          p.x = rightX - p.radius;
          p.vx = -p.vx * 0.45;
        }
      }

      // 2. Spatial Grid Collision & Stacking (so components stack on top of each other)
      const cellSize = 60;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      const grid: number[][] = new Array(cols * rows);

      for (let i = 0; i < len; i++) {
        const p = particles[i];
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
            const neighborIdx = neighborX + neighborY * cols;
            const neighborCell = grid[neighborIdx];
            if (!neighborCell) continue;

            const isSelfCell = cellIdx === neighborIdx;

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

                  const kx = p1.vx - p2.vx;
                  const ky = p1.vy - p2.vy;
                  const impulse = ((nx * kx + ny * ky) * 1.2) / (p1.mass + p2.mass);

                  p1.vx -= impulse * p2.mass * nx;
                  p1.vy -= impulse * p2.mass * ny;
                  p2.vx += impulse * p1.mass * nx;
                  p2.vy += impulse * p1.mass * ny;
                }
              }
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

        try {
          drawComponent(ctx, p.type, p.size, p.colorTheme);
        } catch {
          // Skip if glitch
        }

        ctx.restore();
      }

      // Bottom Floor Line
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, floorY);
      ctx.lineTo(width - 10, floorY);
      ctx.stroke();

      setParticleCount(len);
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

      {/* Full Screen Physics Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-crosshair z-10" />

      {/* Minimal Top Header */}
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
            <span>FALLEN_COMPONENTS: </span>
            <span className="text-white">{particleCount}</span>
          </div>

          {particleCount > 0 && (
            <button
              onClick={clearParticles}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#0d121e]/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/50 text-xs font-mono transition-all"
              title="Clear pile"
            >
              <RotateCcw className="w-3 h-3" />
              <span>CLEAR</span>
            </button>
          )}
        </div>
      </header>

      {/* Floating Center Prompt (fades away as soon as particles start falling) */}
      {particleCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-15">
          <div className="p-4 rounded-xl bg-[#0a0e17]/80 border border-slate-800 text-center space-y-1 backdrop-blur-sm shadow-2xl">
            <p className="text-sm font-bold text-amber-400 font-mono tracking-wide">
              ⚡ MOVE YOUR MOUSE ACROSS THE SCREEN
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Hardware components will drop from your cursor trail and pile up at the bottom.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
