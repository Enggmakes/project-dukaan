import { useEffect, useRef } from "react";

interface TechParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  type: number; // 0 = Arduino, 1 = HC-SR04, 2 = CPU, 3 = LED, 4 = Resistor
  size: number;
  colorTheme: string; // Used to color LEDs or highlights
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

    // Polyfill roundRect for browsers that don't support it (e.g. Safari < 15.4)
    if (typeof (ctx as any).roundRect !== "function") {
      (CanvasRenderingContext2D.prototype as any).roundRect = function (
        x: number, y: number, w: number, h: number, r: number
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
    const maxParticles = 40; // Maintain performance on heavy details

    const themes = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b"]; // Red, Green, Blue, Amber

    const spawnParticle = (x: number, y: number) => {
      if (particles.length >= maxParticles) {
        particles.shift();
      }

      const size = Math.random() * 10 + 20; // Slightly larger (20px to 30px) to see the high details!
      const colorTheme = themes[Math.floor(Math.random() * themes.length)];

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5, // gentle drift
        vy: -Math.random() * 1.2 - 0.4,   // float upwards gently (anti-gravity effect)
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.035, // slow spin
        type: Math.floor(Math.random() * 5),
        size,
        colorTheme,
        life: 1.0,
        decay: Math.random() * 0.014 + 0.008 // slower fadeout to admire details
      });
    };

    let lastX = 0;
    let lastY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 22) { // Spacing out the drops
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
        case 0: { // 1. Detailed Arduino Uno Board
          const w = s * 1.4;
          const h = s;
          
          // Draw Deep Blue PCB board base
          c.fillStyle = "#005f73";
          c.strokeStyle = "#0a9396";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(-w/2, -h/2, w, h, 3);
          c.fill();
          c.stroke();

          // Silver USB Port (top-left)
          c.fillStyle = "#ced4da";
          c.beginPath();
          c.rect(-w/2 - 1, -h/4 - 1, w/4, h/3);
          c.fill();
          c.strokeStyle = "#6c757d";
          c.lineWidth = 0.5;
          c.stroke();

          // Black Power Jack (bottom-left)
          c.fillStyle = "#212529";
          c.beginPath();
          c.rect(-w/2 + 2, h/6, w/5, h/4);
          c.fill();

          // Black ATmega328P Microchip (center)
          c.fillStyle = "#343a40";
          c.beginPath();
          c.rect(-w/6, -h/6, w/3, h/3);
          c.fill();
          // Chip leg pins (copper lines)
          c.strokeStyle = "#e9d8a6";
          c.lineWidth = 0.5;
          for (let offset = -w/8; offset <= w/8; offset += w/12) {
            c.beginPath();
            c.moveTo(offset, -h/6 - 1.5); c.lineTo(offset, -h/6);
            c.moveTo(offset, h/6); c.lineTo(offset, h/6 + 1.5);
            c.stroke();
          }

          // Header Pins (Top and Bottom edges)
          c.fillStyle = "#1a1a1a";
          c.beginPath();
          c.rect(-w/3, -h/2 + 1, w*2/3, 2.5); // top header
          c.rect(-w/4, h/2 - 3.5, w*2/3, 2.5); // bottom header
          c.fill();
          
          // Tiny gold header contacts
          c.fillStyle = "#ee9b00";
          for (let offset = -w/3 + 2; offset < w/3; offset += 3.5) {
            c.beginPath();
            c.arc(offset, -h/2 + 2.2, 0.4, 0, Math.PI * 2);
            c.arc(offset + 2, h/2 - 2.2, 0.4, 0, Math.PI * 2);
            c.fill();
          }

          // Glowing LED indicators (yellow/green indicator)
          c.shadowBlur = 6;
          c.shadowColor = "#e9d8a6";
          c.fillStyle = "#94d2bd";
          c.beginPath();
          c.arc(w/4, -h/4, 1.2, 0, Math.PI*2);
          c.fill();
          c.shadowBlur = 0;
          break;
        }

        case 1: { // 2. Detailed HC-SR04 Ultrasonic Sensor ("Sensor Eyes")
          const w = s * 1.5;
          const h = s * 0.85;

          // Blue PCB Board
          c.fillStyle = "#0077b6";
          c.strokeStyle = "#0096c7";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(-w/2, -h/2, w, h, 2.5);
          c.fill();
          c.stroke();

          // Silver Transmitters (The Eyes)
          c.fillStyle = "#adb5bd";
          c.strokeStyle = "#495057";
          c.lineWidth = 0.8;
          const r = h * 0.35;
          
          // Left Eye
          c.beginPath();
          c.arc(-w/4, 0, r, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          // Left Eye inner mesh core
          c.fillStyle = "#343a40";
          c.beginPath();
          c.arc(-w/4, 0, r * 0.7, 0, Math.PI * 2);
          c.fill();

          // Right Eye
          c.beginPath();
          c.arc(w/4, 0, r, 0, Math.PI * 2);
          c.fill();
          c.stroke();
          // Right Eye inner mesh core
          c.fillStyle = "#343a40";
          c.beginPath();
          c.arc(w/4, 0, r * 0.7, 0, Math.PI * 2);
          c.fill();

          // Tiny circuit details (SMD capacitors)
          c.fillStyle = "#e9d8a6"; // capacitor gold/brown
          c.beginPath();
          c.rect(-2, -h/3, 4, 2);
          c.fill();

          // Header connection pins on bottom
          c.strokeStyle = "#ced4da";
          c.lineWidth = 0.8;
          for (let offset = -6; offset <= 6; offset += 4) {
            c.beginPath();
            c.moveTo(offset, h/2);
            c.lineTo(offset, h/2 + 4);
            c.stroke();
          }
          break;
        }

        case 2: { // 3. Core CPU Processor Chip
          const size = s;

          // Green PCB substrate
          c.fillStyle = "#2d6a4f";
          c.strokeStyle = "#40916c";
          c.lineWidth = 1;
          c.beginPath();
          c.roundRect(-size/2, -size/2, size, size, 2);
          c.fill();
          c.stroke();

          // Metal lid (Heat spreader)
          c.fillStyle = "#e9ecef";
          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.roundRect(-size/3, -size/3, size*2/3, size*2/3, 1.5);
          c.fill();
          c.stroke();

          // Gold corner triangle marker
          c.fillStyle = "#ffb703";
          c.beginPath();
          c.moveTo(-size/2, -size/2);
          c.lineTo(-size/2 + 4, -size/2);
          c.lineTo(-size/2, -size/2 + 4);
          c.closePath();
          c.fill();

          // Silicon Core engraving markings
          c.strokeStyle = "#ced4da";
          c.lineWidth = 0.5;
          c.beginPath();
          c.moveTo(-size/5, -size/6); c.lineTo(size/5, -size/6);
          c.moveTo(-size/6, 0); c.lineTo(size/6, 0);
          c.stroke();

          // Bottom pins gold dots (copper pads)
          c.fillStyle = "#f7a072";
          for (let offset = -size/2 + 2; offset <= size/2 - 2; offset += 3.5) {
            c.beginPath();
            c.arc(offset, -size/2 + 2, 0.4, 0, Math.PI * 2);
            c.arc(offset, size/2 - 2, 0.4, 0, Math.PI * 2);
            c.arc(-size/2 + 2, offset, 0.4, 0, Math.PI * 2);
            c.arc(size/2 - 2, offset, 0.4, 0, Math.PI * 2);
            c.fill();
          }
          break;
        }

        case 3: { // 4. Shaded Translucent LED Bulb
          const legHeight = s * 0.6;
          const bulbSize = s * 0.5;

          // 1. Draw silver leads (the two legs)
          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          // Short Cathode Leg
          c.moveTo(-bulbSize/3, bulbSize/3);
          c.lineTo(-bulbSize/3, bulbSize/3 + legHeight);
          // Long Anode Leg
          c.moveTo(bulbSize/3, bulbSize/3);
          c.lineTo(bulbSize/3, bulbSize/3 + legHeight * 1.15);
          c.stroke();

          // 2. Draw interior wires (anode/cathode frames inside dome)
          c.strokeStyle = "#ced4da";
          c.lineWidth = 0.5;
          c.beginPath();
          c.moveTo(-bulbSize/3, bulbSize/3);
          c.lineTo(-bulbSize/4, -bulbSize/8);
          c.lineTo(-bulbSize/2, -bulbSize/4); // wider flag
          c.moveTo(bulbSize/3, bulbSize/3);
          c.lineTo(bulbSize/4, -bulbSize/6);
          c.stroke();

          // 3. Draw glowing translucent dome
          c.fillStyle = themeColor;
          c.shadowBlur = 10;
          c.shadowColor = themeColor;
          
          c.beginPath();
          // Rounded Dome Top
          c.arc(0, -bulbSize/4, bulbSize/2, Math.PI, 0);
          // Base Cylinder
          c.rect(-bulbSize/2, -bulbSize/4, bulbSize, bulbSize/2 + bulbSize/12);
          c.fill();

          // Reset shadow
          c.shadowBlur = 0;

          // 4. Solid bottom base rim
          c.fillStyle = themeColor; // opaque bottom rim
          c.beginPath();
          c.rect(-bulbSize/2 - 1, bulbSize/3, bulbSize + 2, 1.5);
          c.fill();
          break;
        }

        case 4: { // 5. Detailed Shaded Ceramic Resistor
          const w = s * 1.2;
          const h = s * 0.4;

          // Lead wires passing through the core
          c.strokeStyle = "#adb5bd";
          c.lineWidth = 0.8;
          c.beginPath();
          c.moveTo(-w*0.8, 0);
          c.lineTo(w*0.8, 0);
          c.stroke();

          // Shaded Ceramic Tan Body
          c.fillStyle = "#f4f1de";
          c.strokeStyle = "#e0dbcd";
          c.lineWidth = 0.6;
          c.beginPath();
          c.roundRect(-w/2, -h/2, w, h, 2);
          c.fill();
          c.stroke();

          // Color Ring Bands (Standard Resistor values)
          // Band 1: Red (Value 2)
          c.fillStyle = "#e63946";
          c.fillRect(-w/3, -h/2 + 0.3, w/10, h - 0.6);

          // Band 2: Purple (Value 7)
          c.fillStyle = "#8338ec";
          c.fillRect(-w/10, -h/2 + 0.3, w/10, h - 0.6);

          // Band 3: Black (Multiplier 1)
          c.fillStyle = "#212529";
          c.fillRect(w/10, -h/2 + 0.3, w/10, h - 0.6);

          // Band 4: Gold (Tolerance 5%)
          c.fillStyle = "#e5c583";
          c.fillRect(w/3, -h/2 + 0.3, w/10, h - 0.6);
          break;
        }
      }
    };

    let animationId: number;

    const render = () => {
      try {
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

          // Apply alpha fade based on remaining particle life
          ctx.globalAlpha = p.life * 0.85;

          try {
            drawDetailedComponent(ctx, p.type, p.size, p.colorTheme);
          } catch {
            // Skip this particle silently if drawing fails
          }
          ctx.restore();

          return true;
        });
      } catch {
        // silently ignore render errors — never crash the page
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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[9999]"
      style={{ opacity: 0.85 }}
    />
  );
}
