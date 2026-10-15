import React, { useEffect, useRef } from 'react';
import { KINDS, GraphData } from './photoGraph';
import { T } from './theme';

const P = T.canvas;
const ADD = P.additive ? 'lighter' : 'source-over';

export function NetworkCanvas({
  graph,
  layout,
  live,
  reduced
}: {
  graph: GraphData;
  layout: Record<string, [number, number]>;
  live: React.MutableRefObject<any>;
  reduced?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let W = 0, H = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // BFS depth from core
    const depth = new Map([['core', 0]]);
    const q = ['core'];
    while (q.length) {
      const id = q.shift()!;
      for (const l of graph.links) {
        const o = l.a === id ? l.b : l.b === id ? l.a : null;
        if (o && !depth.has(o)) {
          depth.set(o, (depth.get(id) || 0) + 1);
          q.push(o);
        }
      }
    }

    const nodes = graph.nodes
      .filter(n => n.kind !== 'core')
      .map((n, i) => ({
        n,
        p: layout[n.id] || [0, 0],
        d: depth.get(n.id) ?? 4,
        seed: (i * 9301 + 49297) % 233280 / 233280,
        r: n.kind === 'folder' ? 3.2 : n.kind === 'tag' ? 1.6 : n.kind === 'location' ? 2.4 : 2.2 + Math.min(n.deg || 0, 14) * 0.22,
        s: [0, 0, 0] as [number, number, number]
      }));

    const byId = new Map(nodes.map(x => [x.n.id, x]));
    const links = graph.links
      .filter(l => byId.has(l.a) && byId.has(l.b))
      .map((l, i) => ({
        l,
        A: byId.get(l.a)!,
        B: byId.get(l.b)!,
        seed: (i * 7919 % 997) / 997
      }));

    const sparks = Array.from({ length: 90 }, (_, i) => ({
      a: i / 90 * Math.PI * 2 + Math.sin(i * 12.9) * 0.3,
      v: 0.35 + (i * 37 % 100) / 100,
      s: 1 + (i * 13 % 7) / 3
    }));

    const draw = (now: number) => {
      const L = live.current;
      if (!L) return;
      const t = Math.max(0, (now - L.t0) / 1000);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const cx = L.orb?.x ?? W / 2;
      const cy = L.orb?.y ?? H / 2;
      const sc = ((L.orb?.s ?? 400) / 440) * Math.min(W * 0.37 / 380, H * 0.36 / 300) * (L.stage === 'hub' ? 1 : 0.55);

      const hover = L.hover;
      const hl = hover ? new Set(graph.nodes.filter(n => n.kind === hover).map(n => n.id)) : null;
      if (hl) {
        for (const l of graph.links) {
          if (hl.has(l.a) && l.kind !== 'contain') hl.add(l.b);
        }
      }

      const grow = reduced ? 1 : Math.min(1, Math.max(0, (t - 0.35) / 2.2));
      const prog = (x: typeof nodes[0]) => reduced ? 1 : Math.min(1, Math.max(0, (t - 0.4 - x.d * 0.32 - x.seed * 0.35) / 0.9));

      const pos = (x: typeof nodes[0]): [number, number, number] => {
        const p = prog(x);
        const e = 1 - Math.pow(1 - p, 3);
        const sway = reduced || L.paused ? 0 : Math.sin(t * 0.5 + x.seed * 6.28) * 3;
        return [
          cx + x.p[0] * sc * e + sway,
          cy + x.p[1] * sc * e + Math.cos(t * 0.4 + x.seed * 9) * (reduced || L.paused ? 0 : 2.5),
          p
        ];
      };

      for (const x of nodes) x.s = pos(x);

      // 1. Initial Spark Explosion
      if (!reduced && t < 2.2) {
        const k = t / 2.2;
        ctx.globalCompositeOperation = ADD as GlobalCompositeOperation;
        for (const s of sparks) {
          const d = (40 + s.v * 420) * (1 - Math.pow(1 - k, 2.4)) * ((L.orb?.s ?? 400) / 440);
          const a = Math.max(0, 1 - k) * 0.9;
          const x = cx + Math.cos(s.a) * d, y = cy + Math.sin(s.a) * d;
          const g = ctx.createLinearGradient(cx + Math.cos(s.a) * d * 0.6, cy + Math.sin(s.a) * d * 0.6, x, y);
          g.addColorStop(0, `rgba(${P.spark[0]},0)`);
          g.addColorStop(1, `rgba(${P.spark[1]},${a})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = s.s;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(s.a) * d * 0.6, cy + Math.sin(s.a) * d * 0.6);
          ctx.lineTo(x, y);
          ctx.stroke();

          ctx.fillStyle = `rgba(${P.spark[2]},${a})`;
          ctx.beginPath();
          ctx.arc(x, y, s.s * 0.9, 0, 7);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // 2. Links
      for (const k of links) {
        const [x1, y1, p1] = k.A.s, [x2, y2, p2] = k.B.s;
        const p = Math.min(p1, p2) * grow;
        if (p <= 0.02) continue;
        const on = !hl || (hl.has(k.l.a) && hl.has(k.l.b));
        let a = (k.l.both ? 0.32 : k.l.kind === 'wiki' ? 0.3 : k.l.kind === 'contain' ? 0.16 : 0.11) * p * (on ? 1 : 0.25) * (hl && on ? 2.2 : 1);
        ctx.strokeStyle = k.l.both ? `rgba(${P.mutual},${a})` : k.l.kind === 'wiki' ? `rgba(${P.wiki},${a})` : `rgba(${P.link},${a})`;
        ctx.lineWidth = k.l.both ? 0.6 + Math.min(k.l.w, 6) * 0.22 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        if (k.l.both) {
          const mx = (x1 + x2) / 2 + (y2 - y1) * 0.12;
          const my = (y1 + y2) / 2 - (x2 - x1) * 0.12;
          ctx.quadraticCurveTo(mx, my, x2, y2);
        } else {
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }

      // 3. Bidirectional Traveling Pulses
      if (!reduced && !L.paused && grow > 0.6) {
        ctx.globalCompositeOperation = ADD as GlobalCompositeOperation;
        for (const k of links) {
          if (k.l.kind === 'contain' || k.l.kind === 'tag') continue;
          const on = !hl || (hl.has(k.l.a) && hl.has(k.l.b));
          const speed = k.l.both ? 0.16 : 0.12;
          const lanes = k.l.both ? [0, 1] : [0];
          for (const lane of lanes) {
            const u = ((t * speed + k.seed + lane * 0.5) % 1);
            const fwd = lane === 0 ? (k.l.s === k.l.a) : !(k.l.s === k.l.a);
            const [x1, y1] = fwd ? k.A.s : k.B.s, [x2, y2] = fwd ? k.B.s : k.A.s;
            let x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u;
            if (k.l.both) {
              const mx = (k.A.s[0] + k.B.s[0]) / 2 + (k.B.s[1] - k.A.s[1]) * 0.12;
              const my = (k.A.s[1] + k.B.s[1]) / 2 - (k.B.s[0] - k.A.s[0]) * 0.12;
              const uu = fwd ? u : 1 - u;
              x = (1 - uu) ** 2 * k.A.s[0] + 2 * (1 - uu) * uu * mx + uu * uu * k.B.s[0];
              y = (1 - uu) ** 2 * k.A.s[1] + 2 * (1 - uu) * uu * my + uu * uu * k.B.s[1];
            }
            const a = Math.sin(u * Math.PI) * (on ? 0.95 : 0.2);
            const g = ctx.createRadialGradient(x, y, 0, x, y, 6);
            const c = k.l.both ? (lane ? P.mutualIn : P.mutual) : P.pulseOne;
            g.addColorStop(0, `rgba(${c},${a})`);
            g.addColorStop(1, `rgba(${c},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 7);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // 4. Nodes
      for (const x of nodes) {
        const [px, py, p] = x.s;
        if (p <= 0) continue;
        const on = !hl || hl.has(x.n.id);
        const color = KINDS[x.n.kind]?.color || '#ffffff';
        const a = p * (on ? 1 : 0.22);
        const r = x.r * (hl && on ? 1.35 : 1);
        ctx.globalAlpha = a;
        ctx.globalCompositeOperation = ADD as GlobalCompositeOperation;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
        g.addColorStop(0, color + P.glow);
        g.addColorStop(1, color + '00');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r * 5, 0, 7);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        if (x.n.kind === 'ghost') {
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, r + 1, 0, 7);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          const b = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, 0, px, py, r);
          b.addColorStop(0, P.light);
          b.addColorStop(0.45, color);
          b.addColorStop(1, color + 'aa');
          ctx.fillStyle = b;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, 7);
          ctx.fill();
        }

        if (L.stage === 'hub' && p > 0.9 && (hl ? on && x.n.kind !== 'tag' : x.n.kind === 'location')) {
          ctx.globalAlpha = a * (hl ? 0.9 : 0.42);
          ctx.fillStyle = P.label;
          ctx.font = `${hl ? 11 : 10}px -apple-system, "PingFang SC", sans-serif`;
          ctx.fillText((x.n.short || x.n.title).slice(0, 14), px + r + 5, py + 3.5);
        }
        ctx.globalAlpha = 1;
      }
    };

    let warned = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      try {
        draw(now);
      } catch (err) {
        if (!warned) {
          warned = true;
          console.error(err);
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [graph, layout, live, reduced]);

  return <canvas ref={ref} className="network-canvas" aria-hidden="true" />;
}
