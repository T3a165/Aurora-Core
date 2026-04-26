import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  // Particle field animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Radial gradient background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.20 0.08 270 / 0.4) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 40% at 20% 80%, oklch(0.65 0.22 290 / 0.08) 0%, transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 40% at 80% 20%, oklch(0.72 0.18 200 / 0.06) 0%, transparent 60%)" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-3xl">
        {/* Logo orb */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl scale-150" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-600/30 to-cyan-500/20 border border-purple-500/40 flex items-center justify-center aurora-glow-purple">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 orb-pulse" />
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="text-xs font-mono tracking-widest text-purple-400/70 mb-2 uppercase">Beta Testing — April 2026</div>
          <h1 className="text-5xl md:text-6xl font-bold neon-text-purple tracking-tight mb-3">Aurora Core</h1>
          <p className="text-xl text-cyan-300/80 font-light">Frictionless Cognitive-Energy Ecosystem</p>
          <p className="text-sm text-muted-foreground mt-2">Seven-Layer AI Platform · Multi-Agent Orchestration · TurnBot Integration</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {["7-Layer AI Architecture", "4 Cognitive Agents", "Real-Time Circuit Monitor", "Predictive Simulation", "TurnBot Devices", "AI Chat Interface"].map(f => (
            <span key={f} className="px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30 bg-purple-500/10 text-purple-300">
              {f}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 aurora-glow-purple transition-all"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            Launch Dashboard
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-purple-500/40 text-purple-300 hover:bg-purple-500/10 px-8"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            Sign In
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Patent Pending · Garrett McLain · Galveston Island, TX · inventor@turnbot.org
        </p>
      </div>
    </div>
  );
}
