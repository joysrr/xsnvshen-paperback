import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", resize);
    resize();

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Create a very subtle moving gradient blob
      const cx = width * 0.5 + Math.sin(time) * (width * 0.2);
      const cy = height * 0.5 + Math.cos(time * 0.8) * (height * 0.2);
      const radius = Math.max(width, height) * 0.6;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      
      // Use CSS variable values but highly transparent
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.03)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      } else {
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.03)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
