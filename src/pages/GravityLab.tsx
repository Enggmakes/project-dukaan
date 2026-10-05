import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  Activity,
  Sliders,
  Maximize2,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Simulation Controls State
  const [gravityMode, setGravityMode] = useState<"earth" | "moon" | "zero" | "reverse" | "vortex">("earth");
  const [inflowActive, setInflowActive] = useState(false);
  const [componentFilter, setComponentFilter] = useState<number | "all">("all");
  const [particleCount, setParticleCount] = useState(0);
  const [fillPercent, setFillPercent] = useState(0);
  const [fps, setFps] = useState(60);

  // References to keep state available inside animation frame loop without re-subscribing
  const particlesRef = useRef<ComponentParticle[]>([]);
  const gravityModeRef = useRef(gravityMode);
  gravityModeRef.current = gravityMode;
  const inflowActiveRef = useRef(inflowActive);
  inflowActiveRef.current = inflowActive;
  const componentFilterRef = useRef(componentFilter);
  componentFilterRef.current = componentFilter;

  const mouseRef = useRef({
    x: -9999,
    y: -9999,
    vx: 0,
    vy: 0,
    isDown: false,
    lastX: 0,
    lastY: 0,
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

  // Spawn particle helper
  const createParticle = useCallback(
    (x: number, y: number, initialVx?: number, initialVy?: number, forcedType?: number) => {
      const type =
        forcedType !== undefined
          ? forcedType
          : componentFilterRef.current === "all"
          ? Math.floor(Math.random() * 5)
          : componentFilterRef.current;

      const size = Math.random() * 8 + 24; // 24px - 32px
      const colorTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
      const radius = size * 0.65;

      return {
        id: Math.random() + Date.now(),
        x,
        y,
        vx: initialVx ?? (Math.random() - 0.5) * 4,
        vy: initialVy ?? Math.random() * 2,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
        type,
        size,
        radius,
        mass: radius * radius * 0.1,
        colorTheme,
      };
    },
    []
  );

  // Spawn a shower batch of components
  const dumpComponents = useCallback(
    (count = 35) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const newItems: ComponentParticle[] = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * (w - 120) + 60;
        const y = Math.random() * -180 - 20; // spawn slightly above screen
        const vx = (Math.random() - 0.5) * 3;
        const vy = Math.random() * 4 + 2;
        newItems.push(createParticle(x, y, vx, vy));
      }

      particlesRef.current = [...particlesRef.current, ...newItems].slice(-450); // limit max 450 for silky 60fps
      setParticleCount(particlesRef.current.length);
    },
    [createParticle]
  );

  // EMP Shockwave (blasts all components upward & outward)
  const triggerEMPShockwave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.75;

    particlesRef.current.forEach((p) => {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 30);
      const force = Math.min(2200 / dist, 32);

      p.vx += (dx / dist) * force + (Math.random() - 0.5) * 6;
      p.vy -= force * 1.25 + Math.random() * 6;
      p.spin += (Math.random() - 0.5) * 0.4;
    });
  }, []);

  // Clear all particles
  const clearSimulation = useCallback(() => {
    particlesRef.current = [];
    setParticleCount(0);
    setFillPercent(0);
  }, []);

  // Main Canvas Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initial dump on mount so the page starts vibrant!
    if (particlesRef.current.length === 0) {
      dumpComponents(45);
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      mouseRef.current.vx = currentX - mouseRef.current.lastX;
      mouseRef.current.vy = currentY - mouseRef.current.lastY;
      mouseRef.current.x = currentX;
      mouseRef.current.y = currentY;
      mouseRef.current.lastX = currentX;
      mouseRef.current.lastY = currentY;

      // If mouse is held down, spawn continuous components at mouse position!
      if (mouseRef.current.isDown && particlesRef.current.length < 450) {
        particlesRef.current.push(
          createParticle(
            currentX + (Math.random() - 0.5) * 15,
            currentY + (Math.random() - 0.5) * 15,
            mouseRef.current.vx * 0.4 + (Math.random() - 0.5) * 3,
            mouseRef.current.vy * 0.4 - 2
          )
        );
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Spawn immediate 3 components on click
      for (let i = 0; i < 3; i++) {
        if (particlesRef.current.length < 450) {
          particlesRef.current.push(
            createParticle(
              x + (Math.random() - 0.5) * 20,
              y + (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 6,
              -Math.random() * 4 - 2
            )
          );
        }
      }
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    // Touch support for mobile devices
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentX = touch.clientX - rect.left;
        const currentY = touch.clientY - rect.top;

        mouseRef.current.vx = currentX - mouseRef.current.lastX;
        mouseRef.current.vy = currentY - mouseRef.current.lastY;
        mouseRef.current.x = currentX;
        mouseRef.current.y = currentY;
        mouseRef.current.lastX = currentX;
        mouseRef.current.lastY = currentY;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Drawing Routine for Electronic Components
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

          // Black Power Jack
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

          // Glowing LED indicator
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

          // 4 Connection Pins
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

          // Heat spreader metal lid
          c.fillStyle = "#e9ecef";
          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.roundRect(-size / 3, -size / 3, (size * 2) / 3, (size * 2) / 3, 1.5);
          c.fill();
          c.stroke();

          // Gold corner index
          c.fillStyle = "#ffb703";
          c.beginPath();
          c.moveTo(-size / 2, -size / 2);
          c.lineTo(-size / 2 + 4, -size / 2);
          c.lineTo(-size / 2, -size / 2 + 4);
          c.closePath();
          c.fill();

          // Silicon engraving
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
          // 5. Ceramic 4-Band Resistor
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

          // Color bands
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
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let frameCounter = 0;

    // Simulation Tick Loop
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // FPS Calculation
      frameCounter++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCounter * 1000) / (now - lastFpsUpdate)));
        frameCounter = 0;
        lastFpsUpdate = now;
      }

      // Auto Inflow waterfall every 5 frames if toggled ON
      frameCount++;
      if (inflowActiveRef.current && frameCount % 6 === 0 && particlesRef.current.length < 450) {
        const x = Math.random() * (width - 160) + 80;
        particlesRef.current.push(createParticle(x, -30, (Math.random() - 0.5) * 3, Math.random() * 3 + 2));
      }

      // Physics Constants based on active mode
      let gravity = 0.42;
      let bounceDamping = 0.32;
      let wallDamping = 0.45;
      let floorFriction = 0.88;
      let airDrag = 0.994;

      const currentMode = gravityModeRef.current;
      if (currentMode === "moon") {
        gravity = 0.12;
        bounceDamping = 0.65;
        airDrag = 0.998;
      } else if (currentMode === "zero") {
        gravity = 0.0;
        bounceDamping = 0.85;
        airDrag = 0.999;
      } else if (currentMode === "reverse") {
        gravity = -0.4;
        bounceDamping = 0.32;
      }

      const floorY = height - 12;
      const ceilingY = 12;
      const leftX = 12;
      const rightX = width - 12;

      const particles = particlesRef.current;
      const len = particles.length;

      // Mouse position and velocity
      const mouse = mouseRef.current;

      // 1. Apply Forces, Gravity & Boundary Constraints
      for (let i = 0; i < len; i++) {
        const p = particles[i];

        // Gravity or Vortex pull
        if (currentMode === "vortex" && mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 20);
          const pull = Math.min(180 / dist, 1.2);
          p.vx += (dx / dist) * pull - (dy / dist) * pull * 0.4;
          p.vy += (dy / dist) * pull + (dx / dist) * pull * 0.4;
        } else {
          p.vy += gravity;
        }

        // Mouse Stir / Push Interaction
        if (mouse.x > 0 && mouse.y > 0) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const pushRadius = 85;

          if (mdist < pushRadius && mdist > 0.01) {
            const pushFactor = (pushRadius - mdist) / pushRadius;
            const force = pushFactor * 7.5;
            p.vx += (mdx / mdist) * force + mouse.vx * 0.15;
            p.vy += (mdy / mdist) * force + mouse.vy * 0.15;
            p.spin += (Math.random() - 0.5) * 0.12;
          }
        }

        // Air Drag
        p.vx *= airDrag;
        p.vy *= airDrag;

        // Position Step
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        // Floor collision
        if (p.y + p.radius > floorY) {
          p.y = floorY - p.radius;
          p.vy = -p.vy * bounceDamping;
          p.vx *= floorFriction;
          p.spin *= 0.8;
          if (Math.abs(p.vy) < 0.25) p.vy = 0;
        }

        // Ceiling collision
        if (p.y - p.radius < ceilingY) {
          p.y = ceilingY + p.radius;
          p.vy = -p.vy * bounceDamping;
          p.vx *= floorFriction;
        }

        // Left / Right Walls
        if (p.x - p.radius < leftX) {
          p.x = leftX + p.radius;
          p.vx = -p.vx * wallDamping;
        } else if (p.x + p.radius > rightX) {
          p.x = rightX - p.radius;
          p.vx = -p.vx * wallDamping;
        }
      }

      // 2. Spatial Grid Particle-to-Particle Collision & Stacking
      // This allows components to pile up and stack at the bottom!
      const cellSize = 65;
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

      // Resolve overlaps
      for (let cellIdx = 0; cellIdx < grid.length; cellIdx++) {
        const cell = grid[cellIdx];
        if (!cell || cell.length === 0) continue;

        const cellX = cellIdx % cols;
        const cellY = Math.floor(cellIdx / cols);

        // Check self and neighboring 4 cells to avoid duplicate checks
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

                  // Separate positions
                  p1.x -= nx * overlap;
                  p1.y -= ny * overlap;
                  p2.x += nx * overlap;
                  p2.y += ny * overlap;

                  // Momentum transfer
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

      // 3. Render Settled/Floating Components
      let bottomHalfCount = 0;

      for (let i = 0; i < len; i++) {
        const p = particles[i];
        if (p.y > height * 0.5) bottomHalfCount++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        try {
          drawComponent(ctx, p.type, p.size, p.colorTheme);
        } catch {
          // ignore any drawing glitches
        }

        ctx.restore();
      }

      // Draw Floor Boundary Barrier (Cyberpunk Treadline)
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, floorY);
      ctx.lineTo(width - 12, floorY);
      ctx.stroke();

      // Floor Hazard Stripes
      ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
      ctx.fillRect(12, floorY, width - 24, height - floorY);

      // Fill percentage telemetry
      if (len > 0) {
        const estimatedFill = Math.min(Math.round((bottomHalfCount / 380) * 100), 100);
        setFillPercent(estimatedFill);
      } else {
        setFillPercent(0);
      }

      setParticleCount(len);
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [createParticle, dumpComponents]);

  return (
    <div className="fixed inset-0 bg-[#06080e] overflow-hidden select-none font-mono selection:bg-amber-500 selection:text-amber-950">
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 pointer-events-none blueprint-grid opacity-35 z-0" />

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] opacity-40 z-0" />

      {/* Interactive Physics Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-10" />

      {/* Top Floating Telemetry & Control Deck */}
      <header className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Brand & Return */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#0b0f19]/90 hover:bg-[#151c2e] text-slate-300 hover:text-amber-400 text-xs font-mono font-bold border border-slate-800 hover:border-amber-500/50 shadow-xl backdrop-blur-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
            <span>SYS:\RETURN_TO_DUKAAN</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0b0f19]/90 border border-slate-800 text-[11px] text-amber-400 font-bold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GRAVITY_SANDBOX_V1.0</span>
          </div>
        </div>

        {/* Right: Live Telemetry Gauges */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Component Count */}
          <div className="px-3 py-1.5 rounded-md bg-[#0b0f19]/90 border border-slate-800/80 backdrop-blur-md flex items-center gap-2 text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[10px]">PIECES:</span>
            <span className="text-white font-bold">{particleCount}</span>
          </div>

          {/* Fill Percentage */}
          <div className="px-3 py-1.5 rounded-md bg-[#0b0f19]/90 border border-slate-800/80 backdrop-blur-md flex items-center gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[10px]">BOTTOM_FILL:</span>
            <span className={`font-bold ${fillPercent > 80 ? "text-rose-400" : "text-amber-400"}`}>
              {fillPercent}%
            </span>
          </div>

          {/* FPS Gauge */}
          <div className="hidden md:flex px-3 py-1.5 rounded-md bg-[#0b0f19]/90 border border-slate-800/80 backdrop-blur-md items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[10px]">RATE:</span>
            <span className="text-emerald-400 font-bold">{fps} FPS</span>
          </div>
        </div>
      </header>

      {/* Instructions Tip Banner (Dismissible on hover) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden md:block">
        <div className="px-4 py-1.5 rounded-full bg-[#0b0f19]/80 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-sm text-center shadow-lg">
          💡 <strong className="text-slate-200">INTERACTIVE:</strong> Move mouse to push & stir pile • Click & drag
          to throw components • Watch them accumulate at the floor!
        </div>
      </div>

      {/* Bottom Control Dock */}
      <footer className="absolute bottom-5 left-4 right-4 z-30 flex flex-wrap items-center justify-center gap-2.5 pointer-events-none">
        <div className="p-2 sm:p-2.5 rounded-xl bg-[#0b0f19]/95 border border-slate-800 shadow-2xl backdrop-blur-md pointer-events-auto flex flex-wrap items-center justify-center gap-2 max-w-4xl">
          {/* Dump Batch */}
          <Button
            size="sm"
            onClick={() => dumpComponents(30)}
            className="h-8 sm:h-9 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold font-mono text-[11px] px-3 shadow-[0_2px_0_#92400e]"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            +30 DUMP
          </Button>

          {/* Inflow Waterfall Stream Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInflowActive(!inflowActive)}
            className={`h-8 sm:h-9 font-mono text-[11px] px-3 border-slate-700 transition-colors ${
              inflowActive
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60"
                : "bg-[#070b14] text-slate-300 hover:text-white"
            }`}
          >
            {inflowActive ? (
              <Pause className="w-3.5 h-3.5 mr-1.5 text-emerald-400 animate-pulse" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            )}
            {inflowActive ? "STREAM: ACTIVE" : "STREAM: OFF"}
          </Button>

          {/* EMP Shockwave */}
          <Button
            size="sm"
            variant="outline"
            onClick={triggerEMPShockwave}
            className="h-8 sm:h-9 bg-[#070b14] hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 border-slate-700 font-mono text-[11px] px-3"
          >
            <Flame className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            EMP BLAST
          </Button>

          {/* Gravity Mode Selector */}
          <div className="flex items-center rounded-lg bg-[#070b14] border border-slate-800 p-0.5 text-[10px]">
            <button
              onClick={() => setGravityMode("earth")}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                gravityMode === "earth"
                  ? "bg-amber-500 text-amber-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EARTH (9.8m/s²)
            </button>
            <button
              onClick={() => setGravityMode("moon")}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                gravityMode === "moon"
                  ? "bg-amber-500 text-amber-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              MOON (1.6m/s²)
            </button>
            <button
              onClick={() => setGravityMode("zero")}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                gravityMode === "zero"
                  ? "bg-amber-500 text-amber-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ZERO-G
            </button>
            <button
              onClick={() => setGravityMode("reverse")}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                gravityMode === "reverse"
                  ? "bg-amber-500 text-amber-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ANTI-GRAVITY
            </button>
            <button
              onClick={() => setGravityMode("vortex")}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                gravityMode === "vortex"
                  ? "bg-cyan-500 text-cyan-950 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              VORTEX
            </button>
          </div>

          {/* Component Type Filter */}
          <select
            value={componentFilter}
            onChange={(e) => {
              const val = e.target.value;
              setComponentFilter(val === "all" ? "all" : parseInt(val, 10));
            }}
            className="h-8 sm:h-9 px-2 bg-[#070b14] border border-slate-800 text-slate-300 hover:text-white rounded text-[11px] font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">ALL (MIXED)</option>
            <option value="0">ONLY ARDUINO</option>
            <option value="1">ONLY SENSORS</option>
            <option value="2">ONLY CPU ICs</option>
            <option value="3">ONLY LEDs</option>
            <option value="4">ONLY RESISTORS</option>
          </select>

          {/* Clear Bin */}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSimulation}
            className="h-8 sm:h-9 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 font-mono text-[11px] px-2.5"
            title="Clear all accumulated components"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            CLEAR
          </Button>
        </div>
      </footer>
    </div>
  );
}
