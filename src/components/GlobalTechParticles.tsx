import { useEffect, useRef } from "react";

interface TechParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  type: number; // 0 = IC, 1 = LED, 2 = Resistor, 3 = Gear, 4 = Code brackets
  color: string;
  size: number;
  life: number;     // 1.0 down to 0.0
  decay: number;    // how fast it fades
}

export default function GlobalTechParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles: TechParticle[] = [];
    const maxParticles = 50; // Cap to maintain high framerate (60fps)

    // Brand color options for the floating tech symbols
    const colors = [
      "rgba(139, 92, 246, ",  // Primary Purple/Indigo
      "rgba(219, 39, 119, ",  // Accent Pink/Magenta
      "rgba(99, 102, 241, ",  // Indigo
      "rgba(236, 72, 153, ",  // Rose
    ];

    const spawnParticle = (x: number, y: number) => {
      if (particles.length >= maxParticles) {
        particles.shift();
      }

      const size = Math.random() * 8 + 10; // 10px to 18px (delicate, elegant size)
      const color = colors[Math.floor(Math.random() * colors.length)];

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.6, // gentle drift
        vy: -Math.random() * 1.4 - 0.5,   // float upwards (anti-gravity effect)
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.04, // slow spin
        type: Math.floor(Math.random() * 5),
        color,
        size,
        life: 1.0,
        decay: Math.random() * 0.018 + 0.012 // gradual fadeout
      });
    };

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      // Since canvas is fixed viewport, we use clientX and clientY directly!
      const x = e.clientX;
      const y = e.clientY;

      // Throttle spawning by distance to keep it clean and performant
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 18) {
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

    const drawIcon = (c: CanvasRenderingContext2D, type: number, size: number) => {
      c.beginPath();
      switch (type) {
        case 0: // Microchip / IC
          c.rect(-size/2, -size/2, size, size);
          const legOffset = size / 4;
          for (let offset of [-legOffset, 0, legOffset]) {
            // Left legs
            c.moveTo(-size/2 - 2.5, offset);
            c.lineTo(-size/2, offset);
            // Right legs
            c.moveTo(size/2, offset);
            c.lineTo(size/2 + 2.5, offset);
            // Top legs
            c.moveTo(offset, -size/2 - 2.5);
            c.lineTo(offset, -size/2);
            // Bottom legs
            c.moveTo(offset, size/2);
            c.lineTo(offset, size/2 + 2.5);
          }
          break;
        case 1: // LED
          c.arc(0, -size/6, size/3, Math.PI, 0);
          c.rect(-size/3, -size/6, size*2/3, size/3);
          c.moveTo(-size/3 - 1, size/6);
          c.lineTo(size/3 + 1, size/6);
          c.moveTo(-size/6, size/6);
          c.lineTo(-size/6, size*2/3);
          c.moveTo(size/6, size/6);
          c.lineTo(size/6, size*4/5);
          break;
        case 2: // Resistor
          c.rect(-size/2, -size/4, size, size/2);
          c.moveTo(-size*4/5, 0);
          c.lineTo(-size/2, 0);
          c.moveTo(size/2, 0);
          c.lineTo(size*4/5, 0);
          c.moveTo(-size/4, -size/4); c.lineTo(-size/4, size/4);
          c.moveTo(0, -size/4); c.lineTo(0, size/4);
          c.moveTo(size/4, -size/4); c.lineTo(size/4, size/4);
          break;
        case 3: // Gear
          c.arc(0, 0, size/3, 0, Math.PI * 2);
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            c.moveTo(Math.cos(angle) * (size/3), Math.sin(angle) * (size/3));
            c.lineTo(Math.cos(angle) * (size/2), Math.sin(angle) * (size/2));
          }
          break;
        case 4: // Code Brackets < >
          c.moveTo(-size/4, -size/3);
          c.lineTo(-size/2, 0);
          c.lineTo(-size/4, size/3);
          
          c.moveTo(size/4, -size/3);
          c.lineTo(size/2, 0);
          c.lineTo(size/4, size/3);
          
          c.moveTo(size/8, -size/2);
          c.lineTo(-size/8, size/2);
          break;
      }
      c.stroke();
    };

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles = particles.filter(p => {
        p.life -= p.decay;
        if (p.life <= 0) return false;

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color + "0.45)";

        ctx.strokeStyle = p.color + `${p.life * 0.75})`;
        ctx.lineWidth = 1.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        drawIcon(ctx, p.type, p.size);
        ctx.restore();

        return true;
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[9999] opacity-70"
    />
  );
}
