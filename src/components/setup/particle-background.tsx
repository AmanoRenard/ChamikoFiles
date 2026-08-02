"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Props {
  mode: "float" | "firework";
}

const COLORS = [
  "rgba(99, 102, 241, 0.6)",
  "rgba(139, 92, 246, 0.5)",
  "rgba(6, 182, 212, 0.5)",
  "rgba(34, 197, 94, 0.4)",
  "rgba(251, 146, 60, 0.4)",
  "rgba(236, 72, 153, 0.4)",
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function ParticleBackground({ mode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = [];

    // Spawn initial particles
    if (mode === "float") {
      const count = Math.min(80, Math.floor(window.innerWidth / 15));
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: randomBetween(-0.3, 0.3),
          vy: randomBetween(-0.5, -0.1),
          size: randomBetween(1.5, 4),
          alpha: randomBetween(0.15, 0.5),
          color: randomColor(),
          life: Infinity,
          maxLife: Infinity,
        });
      }
    }

    let lastSpawn = 0;
    const fireworkInterval = 120;

    const animate = (timestamp: number) => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const parts = particlesRef.current;

      if (mode === "firework") {
        // Spawn firework bursts
        if (timestamp - lastSpawn > fireworkInterval) {
          lastSpawn = timestamp;
          const cx = randomBetween(canvas.width * 0.15, canvas.width * 0.85);
          const cy = randomBetween(canvas.height * 0.15, canvas.height * 0.7);
          const burstCount = Math.floor(randomBetween(20, 45));
          const hue = Math.random() * 360;
          for (let i = 0; i < burstCount; i++) {
            const angle = (Math.PI * 2 * i) / burstCount + randomBetween(-0.2, 0.2);
            const speed = randomBetween(1.5, 5);
            const life = randomBetween(60, 140);
            parts.push({
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: randomBetween(1.5, 3.5),
              alpha: 1,
              color: `hsla(${hue + randomBetween(-30, 30)}, 80%, ${randomBetween(50, 70)}%, 0.8)`,
              life,
              maxLife: life,
            });
          }
        }
      }

      // Update and draw
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];

        if (mode === "float") {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha += randomBetween(-0.005, 0.005);
          p.alpha = Math.max(0.1, Math.min(0.55, p.alpha));

          // Wrap around edges
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;

          // Draw glowing dot
          ctx.save();
          ctx.globalAlpha = p.alpha;
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
          gradient.addColorStop(0, p.color);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Firework mode
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.03; // gravity
          p.vx *= 0.995;
          p.vy *= 0.995;
          p.life--;
          p.alpha = Math.max(0, p.life / p.maxLife);

          if (p.life <= 0 || p.alpha <= 0) {
            parts.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
