'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-production-194a.up.railway.app';

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Spawn particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas!.width;
        if (p.x > canvas!.width) p.x = 0;
        if (p.y < 0) p.y = canvas!.height;
        if (p.y > canvas!.height) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.alpha;
        ctx!.fill();
      });

      // Draw connections
      ctx!.globalAlpha = 0.04;
      ctx!.strokeStyle = '#3b82f6';
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Invalid password');

      localStorage.setItem('aevaos_token', data.token);
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `aevaos_token=${data.token}; expires=${expires}; path=/; SameSite=Strict`;
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--aeva-bg)] flex items-center justify-center p-4 overflow-hidden">
      <ParticleField />

      {/* Aurora blobs */}
      <div className="aurora w-[600px] h-[600px] bg-blue-600/[0.06] top-0 left-1/4" style={{ animationDuration: '25s' }} />
      <div className="aurora w-[500px] h-[500px] bg-purple-600/[0.05] bottom-0 right-1/4" style={{ animationDuration: '20s', animationDelay: '-8s' }} />
      <div className="aurora w-[400px] h-[400px] bg-cyan-500/[0.04] top-1/2 left-1/2" style={{ animationDuration: '30s', animationDelay: '-15s' }} />

      <div className={`relative z-10 w-full max-w-sm animate-in ${shake ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4 animate-float">🌀</div>
          <h1 className="text-4xl font-extrabold text-shimmer tracking-tight">AevaOS</h1>
          <p className="text-[var(--aeva-text-muted)] mt-2 text-xs tracking-[0.3em] uppercase">Mission Control</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="text-[var(--aeva-text-dim)] text-[10px] uppercase tracking-[0.2em] block mb-2">
                Access Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                required
                placeholder="••••••••••••"
                className="w-full bg-[var(--aeva-surface)] text-white border border-[var(--aeva-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--aeva-blue)] focus:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all placeholder-[var(--aeva-text-muted)]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2.5 text-red-400 text-sm">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-[var(--aeva-surface)] disabled:text-[var(--aeva-text-muted)] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]"
            >
              {loading
                ? <><span className="animate-spin inline-block">⟳</span> Authenticating…</>
                : 'Enter Mission Control →'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[var(--aeva-text-muted)] text-[10px] mt-6 tracking-widest uppercase">
          v1.5.0 · Secured
        </p>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-8px); }
          40%,80%  { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}
