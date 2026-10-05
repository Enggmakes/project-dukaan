import { useEffect, useRef, useState } from "react";

interface TechParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  type: number; // 0 = Arduino, 1 = HC-SR04, 2 = CPU, 3 = LED, 4 = Resistor
  size: number;
  radius: number;
  colorTheme: string;
  life: number; // 1.0 down to 0.0
  decay: number;
  settled: boolean;
}

const THEMES = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b"]; // Red, Green, Blue, Amber

export default function GlobalTechParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gravityOn, setGravityOn] = useState(false);
  const gravityOnRef = useRef(false);
  gravityOnRef.current = gravityOn;

  const mouseRef = useRef({
    x: -9999,
    y: -9999,
    lastX: 0,
    lastY: 0,
    vx: 0,
    vy: 0,
  });

  const toggleGravity = () => {
    setGravityOn((prev) => !prev);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Polyfill roundRect for Safari < 15.4
    if (typeof (ctx as any).roundRect !== "function") {
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

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles: TechParticle[] = [];

    const spawnParticle = (x: number, y: number) => {
      const isGravity = gravityOnRef.current;
      const maxLimit = isGravity ? 350 : 40;

      if (particles.length >= maxLimit) {
        if (isGravity) {
          const settledIndex = particles.findIndex((p) => p.settled);
          if (settledIndex !== -1) {
            particles.splice(settledIndex, 1);
          } else {
            particles.shift();
          }
        } else {
          particles.shift();
        }
      }

      const size = Math.random() * 10 + 20; // 20px to 30px
      const radius = size * 0.58;
      const colorTheme = THEMES[Math.floor(Math.random() * THEMES.length)];

      if (isGravity) {
        // Initial gentle upward plume that immediately transitions to gravity drop
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2.2,
          vy: -Math.random() * 2.2 - 0.8,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.05,
          type: Math.floor(Math.random() * 5),
          size,
          radius,
          colorTheme,
          life: 1.0,
          decay: 0,
          settled: false,
        });
      } else {
        // Standard ambient floating mouse trail
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 1.2 - 0.4,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.035,
          type: Math.floor(Math.random() * 5),
          size,
          radius,
          colorTheme,
          life: 1.0,
          decay: Math.random() * 0.014 + 0.008,
          settled: false,
        });
      }
    };

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // If user is already on the dedicated /gravity page, do not double-render
      if (window.location.pathname === "/gravity") return;

      const x = e.clientX;
      const y = e.clientY;

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
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    const drawDetailedComponent = (c: CanvasRenderingContext2D, type: number, s: number, themeColor: string) => {
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

          // Chip
          c.fillStyle = "#343a40";
          c.beginPath();
          c.rect(-w / 6, -h / 6, w / 3, h / 3);
          c.fill();

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

          // Indicator
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
          // 2. Ultrasonic Sensor
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
          // 3. CPU IC
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
          break;
        }

        case 3: {
          // 4. Glowing LED
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
          // 5. Resistor
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
    let prevGravityState = false;

    const render = () => {
      try {
        if (window.location.pathname === "/gravity") {
          ctx.clearRect(0, 0, width, height);
          particles = [];
          animationId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);

        const isGravity = gravityOnRef.current;
        const floorY = height - 10;
        const leftX = 10;
        const rightX = width - 10;
        const mouse = mouseRef.current;

        // If user just toggled gravity OFF, gently fade out settled pieces
        if (prevGravityState && !isGravity) {
          particles.forEach((p) => {
            p.settled = false;
            p.decay = 0.035;
          });
        }
        prevGravityState = isGravity;

        particles = particles.filter((p) => {
          if (!isGravity) {
            // Standard ambient mouse trail mode
            p.life -= p.decay;
            if (p.life <= 0) return false;

            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.rotation += p.spin;
          } else {
            // GRAVITY MODE ACTIVE ON THIS PAGE!
            if (!p.settled) {
              p.vy += 0.36; // continuous downward gravity acceleration
              p.vx *= 0.988;
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
                p.vy = -p.vy * 0.32;
                p.vx *= 0.82;
                p.spin *= 0.7;

                if (Math.abs(p.vy) < 0.4 && Math.abs(p.vx) < 0.4) {
                  p.vy = 0;
                  p.vx = 0;
                  p.settled = true;
                }
              }
            } else {
              // Settled at the floor
              if (p.y + p.radius > floorY) {
                p.y = floorY - p.radius;
                p.vy = 0;
              }

              // Mouse stir / scatter through settled pile
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
                  p.settled = false;
                }
              }
            }
          }

          // Draw the component
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          ctx.globalAlpha = isGravity ? 0.92 : p.life * 0.85;

          try {
            drawDetailedComponent(ctx, p.type, p.size, p.colorTheme);
          } catch {
            // Skip particle if draw issue
          }

          ctx.restore();
          return true;
        });

        // Resolve inter-particle stacking near bottom when in gravity mode
        if (isGravity) {
          const floorThreshold = height - 260;
          const nearFloorIndices: number[] = [];

          for (let i = 0; i < particles.length; i++) {
            if (particles[i].y > floorThreshold || particles[i].settled) {
              nearFloorIndices.push(i);
            }
          }

          const nLen = nearFloorIndices.length;
          for (let a = 0; a < nLen; a++) {
            const p1 = particles[nearFloorIndices[a]];
            for (let b = a + 1; b < nLen; b++) {
              const p2 = particles[nearFloorIndices[b]];

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

                if (p1.settled || p2.settled) {
                  p1.vx *= 0.88;
                  p2.vx *= 0.88;
                  if (Math.abs(p1.vy) < 0.5) p1.settled = true;
                  if (Math.abs(p2.vy) < 0.5) p2.settled = true;
                }
              }
            }
          }
        }
      } catch {
        // Silently recover
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isDedicatedGravityPage = typeof window !== "undefined" && window.location.pathname === "/gravity";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-[9999]"
      />

      {/* Floating Gravity Switch for All Working Pages */}
      {!isDedicatedGravityPage && (
        <button
          type="button"
          onClick={toggleGravity}
          aria-label="Toggle Gravity Mode"
          className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9998] pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold shadow-2xl backdrop-blur-md transition-all active:scale-95 group cursor-pointer ${
            gravityOn
              ? "bg-amber-500 text-amber-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-500/30"
              : "bg-[#0b0f19]/90 hover:bg-[#151c2e] text-slate-400 hover:text-amber-400 border-slate-800 hover:border-amber-500/50"
          }`}
          title="Toggle Gravity Mode: Watch your cursor trail fall and stack at the bottom!"
        >
          <span
            className={`w-2 h-2 rounded-full transition-all ${
              gravityOn ? "bg-amber-950 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="tracking-wide">
            {gravityOn ? "⚡ GRAVITY: ON" : "⚛️ GRAVITY: OFF"}
          </span>
        </button>
      )}
    </>
  );
}
