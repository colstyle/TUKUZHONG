import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MODULES, KINDS, stats, askGraph, moduleOf, GraphData, GraphNode } from './photoGraph';
import { Icon } from './icons';
import { NetworkCanvas } from './NetworkCanvas';
import { Analysis } from './Analysis';
import { T } from './theme';

const FLIP: Record<string, number> = { library: 1, locations: -1, folders: -1, trips: -1, timeline: 1 };
export const MOD_STYLE: Record<string, any> = Object.fromEntries(
  Object.entries(T.modules).map(([id, m]) => [id, { ...m, flip: FLIP[id] || 1 }])
);

export const split = (n: GraphNode) => ({
  out: (n.out || 0) - (n.mutual || 0),
  back: (n.in || 0) - (n.mutual || 0),
  both: n.mutual || 0
});

const fmt = (v: any) => v == null ? '—' : Number(v).toLocaleString('zh-CN');

export function moduleItems(graph: GraphData, modId: string | null) {
  const m = MODULES.find(x => x.id === modId);
  if (!m) return [];
  const list = graph.nodes.filter(n => n.kind === m.kind);
  if (m.kind === 'photo') list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  if (m.kind === 'location') list.sort((a, b) => (b.in || 0) - (a.in || 0));
  return list.slice(0, 15);
}

function moduleSummary(graph: GraphData, m: typeof MODULES[0]) {
  const items = graph.nodes.filter(n => n.kind === m.kind);
  const sub = ({
    library: () => [fmt(items.length), '张原片', 'photos'],
    locations: () => [fmt(items.length), '处足迹', 'locations'],
    folders: () => [fmt(items.length), '个目录', 'folders'],
    timeline: () => [fmt(items.length), '个时段', 'chronos']
  } as Record<string, () => string[]>)[m.id]?.() || [fmt(items.length), '项', 'items'];
  return { count: items.length, sub };
}

function itemMeta(n: GraphNode) {
  switch (n.kind) {
    case 'photo':
      return [
        ['ISO', '', n.photo?.exif?.iso ? String(n.photo.exif.iso) : '100'],
        ['光圈', '', n.photo?.exif?.aperture ? `f/${n.photo.exif.aperture}` : 'f/2.8'],
        ['快门', '', n.photo?.exif?.shutterSpeed || '1/500s']
      ];
    case 'folder_item':
      return [
        ['照片', 'Photos', n.folderData?.photoCount || 0],
        ['存储', '', '本地目录']
      ];
    case 'location':
      return [
        ['照片', 'Photos', n.in || 0],
        ['坐标', '', 'GPS 记录']
      ];
    case 'timeline_item':
      return [
        ['照片', 'Photos', n.in || 0],
        ['档案', '', '时间分期']
      ];
    default:
      return [];
  }
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function targets(L: any, t: number) {
  const { w: W, h: H } = L.size, st = L.stage, narrow = W < 760;
  const swim = L.reduced ? 0 : 1;
  const res: any = { orb: {}, jelly: {}, fan: null };

  if (st === 'hub') {
    const s = narrow ? clamp(W * 0.56, 180, 280) : clamp(Math.min(W, H) * 0.5, 250, 440);
    const cy = narrow ? H * 0.47 : H * 0.53;
    res.orb = { x: W / 2, y: cy, s };
    const rx = narrow ? W * 0.36 : Math.min(W * 0.36, 540);
    const ry = narrow ? H * 0.21 : Math.min(H * 0.32, 262);

    MODULES.forEach((m, i) => {
      const a = (m.angle + swim * 7 * Math.sin(t * 0.17 + i * 1.7)) * Math.PI / 180;
      const r = 1 + swim * 0.04 * Math.sin(t * 0.23 + i);
      res.jelly[m.id] = {
        x: W / 2 + Math.cos(a) * rx * r,
        y: cy + Math.sin(a) * ry * r + swim * 9 * Math.sin(t * 0.9 + i * 2.1),
        s: narrow ? 92 : clamp(W * 0.12, 120, 184),
        o: 1,
        tilt: swim * 6 * Math.sin(t * 0.6 + i)
      };
    });
  } else if (narrow) {
    res.orb = { x: 40, y: 156, s: 86 };
    MODULES.forEach((m, i) => {
      const sel = m.id === L.mod, k = slotOf(L.mod, m.id);
      res.jelly[m.id] = {
        x: 104 + k * (W - 136) / 4,
        y: 152 + swim * 4 * Math.sin(t * 0.9 + i * 2),
        s: sel ? 76 : 54,
        o: sel ? 1 : 0.55,
        tilt: swim * 3 * Math.sin(t * 0.6 + i)
      };
    });
    const n = L.items.length, gap = clamp((H - 330) / Math.max(n - 1, 1), 22, 54);
    res.fan = { x: 34, y0: 286, gap };
  } else {
    const ox = Math.max(124, W * 0.09), cy = H * 0.53;
    res.orb = { x: ox, y: cy, s: 178 };
    const colX = ox + 158, gap = Math.min(122, (H - 150) / 5);

    MODULES.forEach((m, i) => {
      const sel = m.id === L.mod, k = slotOf(L.mod, m.id);
      res.jelly[m.id] = {
        x: colX + (sel ? 16 : 0),
        y: cy + (k - 2) * gap + swim * 5 * Math.sin(t * 0.9 + i * 2),
        s: sel ? 128 : 92,
        o: sel ? 1 : 0.6,
        tilt: swim * 3 * Math.sin(t * 0.6 + i)
      };
    });

    const panelLeft = W - clamp(W * 0.33, 380, 470) - 44;
    const n = L.items.length;
    const span = Math.min(H - 130, Math.max(0, n - 1) * 54);
    const originX = colX + 16 + 128 * 0.5 + 10 + 168;
    res.fan = {
      x: Math.min(Math.max(panelLeft - 270 - 90, originX + 60), panelLeft - 280),
      y0: cy - span / 2,
      gap: n > 1 ? span / (n - 1) : 0
    };
  }
  return res;
}

function slotOf(selId: string | null, id: string) {
  const others = MODULES.filter(m => m.id !== selId).map(m => m.id);
  const order = [others[0], others[1], selId, others[2], others[3]];
  const k = order.indexOf(id);
  return k < 0 ? MODULES.findIndex(m => m.id === id) : k;
}

function spring(st: any, target: number, dt: number, k = 62) {
  const c = 2 * Math.sqrt(k);
  st.v += (-k * (st.x - target) - c * st.v) * dt;
  st.x += st.v * dt;
  return st.x;
}
const sp = (x: number) => ({ x, v: 0 });

const DUST = Array.from({ length: 110 }, (_, i) => ({
  a: i * 2.39996,
  v: 0.035 + (i * 37 % 100) / 100 * 0.06,
  o: (i * 0.618034) % 1,
  w: (i % 2 ? 1 : -1) * (0.15 + (i % 7) * 0.05),
  s: 0.7 + (i % 5) * 0.32,
  b: 0.45 + (i % 3) * 0.25,
  c: T.dust[i % T.dust.length]
}));

const posterCache = new Map<string, HTMLImageElement>();
const posterOf = (url: string) => {
  if (!posterCache.has(url)) {
    const img = new Image();
    img.src = url;
    posterCache.set(url, img);
  }
  return posterCache.get(url)!;
};

function paintVideo(pair: any) {
  const { video, canvas } = pair;
  if (!video || !canvas) return;
  const cw = canvas.clientWidth, ch = canvas.clientHeight;
  if (!cw || !ch) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(cw * dpr), H = Math.round(ch * dpr);
  const resized = canvas.width !== W || canvas.height !== H;
  if (resized) { canvas.width = W; canvas.height = H; }

  const ready = video.readyState >= 2 && video.videoWidth;
  const src = ready ? video : posterOf(video.poster);
  const sw0 = ready ? video.videoWidth : src.naturalWidth;
  const sh0 = ready ? video.videoHeight : src.naturalHeight;
  if (!sw0 || !sh0) return;

  const stamp = ready ? video.currentTime : -1;
  if (!resized && stamp === pair.stamp && ready === pair.ready) return;
  pair.stamp = stamp;
  pair.ready = ready;

  const k = Math.max(W / sw0, H / sh0), sw = W / k, sh = H / k;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(src, (sw0 - sw) / 2, (sh0 - sh) / 2, sw, sh, 0, 0, W, H);
}

const bez = (p0: number, p1: number, p2: number, p3: number, u: number) => {
  const m = 1 - u;
  return m * m * m * p0 + 3 * m * m * u * p1 + 3 * m * u * u * p2 + u * u * u * p3;
};

function Scene({
  graph,
  items,
  onModule,
  onItem,
  live,
  sel
}: {
  graph: GraphData;
  items: GraphNode[];
  onModule: (id: string) => void;
  onItem: (id: string) => void;
  live: React.MutableRefObject<any>;
  sel: string | null;
}) {
  const dustRef = useRef<HTMLCanvasElement | null>(null);
  const orbRef = useRef<HTMLDivElement | null>(null);
  const jellyRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const innerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const threadRefs = useRef<Record<string, any>>({});
  const pulseRefs = useRef<Record<string, any[]>>({});
  const itemRefs = useRef<any[]>([]);
  const fanRefs = useRef<any[]>([]);
  const fanPulseRefs = useRef<any[]>([]);
  const vids = useRef<Record<string, any>>({});
  const vidRef = (id: string, part: string) => (el: any) => {
    (vids.current[id] ||= {})[part] = el;
  };

  const summaries = useMemo(() => Object.fromEntries(MODULES.map(m => [m.id, moduleSummary(graph, m)])), [graph]);

  useLayoutEffect(() => {
    live.current.itemState = items.map(() => null);
    live.current.fanStart = performance.now();
  }, [items, live]);

  useEffect(() => {
    let raf: number, last = performance.now();
    const S = live.current.springs;

    const step = (now: number) => {
      const L = live.current;
      const dt = Math.max(0, Math.min(1 / 30, (now - last) / 1000));
      last = Math.max(last, now);
      if (!L.paused) L.time += dt;
      const t = L.time, since = (now - L.t0) / 1000;
      const Tgt = targets(L, t);
      const intro = L.stage === 'hub' && !L.reduced;

      // 1. Orb Springs
      const orbS = intro && since < 0.15 ? Tgt.orb.s * 0.35 : Tgt.orb.s;
      const ox = spring(S.orb.x, Tgt.orb.x, dt);
      const oy = spring(S.orb.y, Tgt.orb.y, dt);
      const os = spring(S.orb.s, orbS, dt, 40);
      const oo = spring(S.orb.o, intro && since < 0.1 ? 0 : 1, dt, 30);
      L.orb = { x: ox, y: oy, s: os };

      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${ox - os / 2}px,${oy - os / 2}px,0) scale(${os / 460})`;
        orbRef.current.style.opacity = String(clamp(oo, 0, 1));
      }

      // 2. Orb Dust Particles
      const dust = dustRef.current;
      if (dust) {
        const di = clamp(spring(S.dust, L.stage === 'hub' ? 0.3 : 1, dt, 18), 0, 1);
        const ctx = dust.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 1012, 1012);
          if (!L.reduced && di > 0.02) {
            const sc = Math.max(os / 460, 0.2);
            ctx.globalCompositeOperation = 'lighter';
            for (const p of DUST) {
              const ph = ((t * p.v + p.o) % 1 + 1) % 1;
              const r = 150 + ph * 340;
              const a = p.a + ph * p.w;
              const x = 506 + Math.cos(a) * r;
              const y = 506 + Math.sin(a) * r * 0.96;
              const al = di * Math.pow(Math.max(0, Math.sin(ph * Math.PI)), 1.3) * p.b;
              const rad = p.s / sc * 2.2;
              const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
              g.addColorStop(0, `rgba(${p.c},${al})`);
              g.addColorStop(1, `rgba(${p.c},0)`);
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(x, y, rad, 0, 7);
              ctx.fill();
            }
          }
        }
      }

      // 3. Jellyfish
      MODULES.forEach((m, i) => {
        const j = S.jelly[m.id], tg = Tgt.jelly[m.id];
        const gated = intro && since < 1 + i * 0.17;
        const x = spring(j.x, gated ? ox : tg.x, dt);
        const y = spring(j.y, gated ? oy : tg.y, dt);
        const s = spring(j.s, gated ? 24 : tg.s, dt);
        const o = spring(j.o, gated ? 0 : tg.o, dt, 40);
        const lo = spring(j.lo, intro && since < 2 + i * 0.1 ? 0 : tg.o, dt, 40);
        j.cur = { x, y, s };

        const el = jellyRefs.current[m.id], inner = innerRefs.current[m.id], lab = labelRefs.current[m.id];
        if (el) {
          el.style.transform = `translate3d(${x - s / 2}px,${y - s * 0.375}px,0) scale(${s / 200})`;
          el.style.opacity = String(clamp(o, 0, 1));
        }
        if (inner) {
          inner.style.transform = `rotate(${tg.tilt}deg) scaleX(${MOD_STYLE[m.id].flip})`;
        }
        if (lab) {
          const lw = lab.offsetWidth, lh = lab.offsetHeight;
          const hub = L.stage === 'hub', narrow = L.size.w < 760;
          const lx = hub ? x - lw / 2 : narrow ? x - lw / 2 : x + s * 0.5 + 10;
          const ly = hub ? y + s * 0.36 : narrow ? y + s * 0.36 : y - lh / 2;
          lab.style.transform = `translate3d(${lx}px,${ly}px,0)`;
          lab.style.opacity = String(clamp(narrow && !hub && m.id !== L.mod ? 0 : lo, 0, 1));
          j.label = { x: lx, y: ly, w: lw, h: lh };
        }

        // Connecting threads
        const g = threadRefs.current[m.id];
        if (g && g.glow && g.core) {
          let x1: number, y1: number, x2: number, y2: number, c1x: number, c1y: number, c2x: number, c2y: number;
          if (L.stage === 'hub') {
            const dx = x - ox, dy = y - oy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
            x1 = ox + ux * os * 0.2;
            y1 = oy + uy * os * 0.2;
            x2 = x - ux * s * 0.22;
            y2 = y - uy * s * 0.1;
            const bend = 26 * Math.sin(t * 0.5 + i);
            c1x = x1 + dx * 0.35 - uy * bend;
            c1y = y1 + dy * 0.35 + ux * bend;
            c2x = x1 + dx * 0.7 + uy * bend;
            c2y = y1 + dy * 0.7 - ux * bend;
          } else {
            x1 = ox + os * 0.3;
            y1 = oy;
            x2 = x - s * 0.34;
            y2 = y;
            const dx = x2 - x1;
            c1x = x1 + dx * 0.55;
            c1y = y1;
            c2x = x2 - dx * 0.55;
            c2y = y2;
          }
          const d = `M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`;
          const active = m.id === L.mod || m.kind === L.hover;
          g.glow.setAttribute('d', d);
          g.core.setAttribute('d', d);
          const vis = clamp(o, 0, 1) * (L.stage === 'hub' ? 1 : active ? 1 : 0.45);
          g.glow.style.opacity = String(vis * (active ? 0.9 : 0.45));
          g.core.style.opacity = String(vis);

          const pulses = pulseRefs.current[m.id] || [];
          pulses.forEach((c, k) => {
            if (!c) return;
            const inbound = k === 2;
            let u = ((t * (inbound ? 0.23 : 0.31) + k * 0.5 + i * 0.17) % 1);
            if (inbound) u = 1 - u;
            c.setAttribute('cx', String(bez(x1, c1x, c2x, x2, u)));
            c.setAttribute('cy', String(bez(y1, c1y, c2y, y2, u)));
            c.style.opacity = String(L.reduced || L.paused ? 0 : vis * Math.sin(u * Math.PI));
          });
        }
      });

      // 4. Fan-out Tentacles to Items
      const sj = L.mod && S.jelly[L.mod];
      if (Tgt.fan && sj?.label) {
        const narrow = L.size.w < 760;
        const ox2 = narrow ? sj.label.x + sj.label.w / 2 : sj.label.x + sj.label.w + 6;
        const oy2 = narrow ? sj.label.y + sj.label.h + 4 : sj.cur.y;

        items.forEach((n, i) => {
          if (!L.itemState[i]) L.itemState[i] = { x: sp(ox2), y: sp(oy2), o: sp(0) };
          const stItem = L.itemState[i];
          const ready = L.reduced || now - L.fanStart > 160 + i * Math.min(90, 1800 / Math.max(items.length, 1));
          const tx = Tgt.fan.x;
          const ty = Tgt.fan.y0 + i * Tgt.fan.gap + (L.reduced ? 0 : Math.sin(t * 0.8 + i * 0.9) * 2);

          const x = spring(stItem.x, ready ? tx : ox2, dt, 70);
          const y = spring(stItem.y, ready ? ty : oy2, dt, 70);
          const o = spring(stItem.o, ready ? 1 : 0, dt, 50);

          const el = itemRefs.current[i];
          if (el) {
            el.style.transform = `translate3d(${x}px,${y - 15}px,0)`;
            el.style.opacity = String(clamp(o, 0, 1));
          }

          const p = fanRefs.current[i];
          if (p) {
            const dx = x - ox2, sway = L.reduced ? 0 : Math.sin(t * 1.1 + i * 0.7) * 7;
            const c1x = ox2 + dx * 0.5, c1y = oy2 + sway, c2x = x - dx * 0.45, c2y = y - sway * 0.5;
            p.setAttribute('d', `M${ox2},${oy2} C${c1x},${c1y} ${c2x},${c2y} ${x},${y}`);
            const on = sel === n.id;
            p.style.opacity = String(clamp(o, 0, 1) * (sel ? (on ? 1 : 0.35) : 0.8));
            p.style.strokeWidth = String(on ? 1.8 : 1);

            (fanPulseRefs.current[i] || []).forEach((c: any, k: number) => {
              if (!c) return;
              let u = (t * (k ? 0.27 : 0.36) + i * 0.13 + k * 0.5) % 1;
              if (k) u = 1 - u;
              c.setAttribute('cx', String(bez(ox2, c1x, c2x, x, u)));
              c.setAttribute('cy', String(bez(oy2, c1y, c2y, y, u)));
              c.style.opacity = String(L.reduced || L.paused ? 0 : clamp(o, 0, 1) * Math.sin(u * Math.PI) * (sel && !on ? 0.3 : 1));
            });
          }
        });
      }

      // 5. Paint Video Frames onto Canvases
      for (const pair of Object.values(vids.current)) {
        paintVideo(pair);
      }
    };

    let warned = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      try {
        step(now);
      } catch (err) {
        if (!warned) {
          warned = true;
          console.error(err);
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [items, live, sel]);

  useEffect(() => {
    const sync = () => {
      document.querySelectorAll('.scene video').forEach((v: any) => {
        if (live.current.paused || live.current.reduced || document.hidden) v.pause();
        else v.play().catch(() => { });
      });
    };
    live.current.syncVideo = sync;
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [live]);

  const hub = live.current.stage === 'hub';

  return (
    <div className={`scene stage-${live.current.stage}`}>
      {/* Central Luminous 3D Orb */}
      <div className="orb" ref={orbRef} aria-hidden="true">
        <div className="orb-halo" />
        <video
          className="vsrc"
          ref={vidRef('orb', 'video')}
          src={T.media.orb}
          poster={T.media.orbPoster}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
        <canvas className="vid" ref={vidRef('orb', 'canvas')} />
        <canvas className="orb-dust" ref={dustRef} width="1012" height="1012" />
      </div>

      {/* Dynamic Cubic Bezier Threads & Pulses */}
      <svg className="threads" aria-hidden="true">
        <defs>
          <filter id="thread-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <radialGradient id="pulse-out">
            <stop offset="0" stopColor={T.pulse.out[0]} />
            <stop offset="0.4" stopColor={T.pulse.out[1]} />
            <stop offset="1" stopColor={T.pulse.out[1]} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pulse-in">
            <stop offset="0" stopColor={T.pulse.in[0]} />
            <stop offset="0.4" stopColor={T.pulse.in[1]} />
            <stop offset="1" stopColor={T.pulse.in[1]} stopOpacity="0" />
          </radialGradient>
        </defs>
        {MODULES.map(m => (
          <g key={m.id} style={{ color: MOD_STYLE[m.id].color }}>
            <path
              ref={el => { threadRefs.current[m.id] = { ...threadRefs.current[m.id], glow: el }; }}
              className="thread-glow"
              filter="url(#thread-blur)"
            />
            <path
              ref={el => { threadRefs.current[m.id] = { ...threadRefs.current[m.id], core: el }; }}
              className="thread-core"
            />
            {[0, 1, 2].map(k => (
              <circle
                key={k}
                r={k === 2 ? 4.5 : 5.5}
                fill={`url(#${k === 2 ? 'pulse-in' : 'pulse-out'})`}
                ref={el => { (pulseRefs.current[m.id] ||= [])[k] = el; }}
              />
            ))}
          </g>
        ))}
        {items.map((n, i) => (
          <g key={n.id} style={{ color: KINDS[n.kind]?.color || '#ffffff' }}>
            <path className="fan-thread" ref={el => { fanRefs.current[i] = el; }} />
            {[0, 1].map(k => (
              <circle
                key={k}
                r={k ? 3.5 : 4.5}
                fill={`url(#${k ? 'pulse-in' : 'pulse-out'})`}
                ref={el => { (fanPulseRefs.current[i] ||= [])[k] = el; }}
              />
            ))}
          </g>
        ))}
      </svg>

      {/* 5 Bioluminescent Jellyfish Modules */}
      {MODULES.map(m => {
        const sum = summaries[m.id], active = live.current.mod === m.id;
        return (
          <React.Fragment key={m.id}>
            <button
              className={`jelly ${active ? 'active' : ''}`}
              ref={el => { jellyRefs.current[m.id] = el; }}
              onClick={() => onModule(m.id)}
              onPointerEnter={() => { live.current.hover = m.kind; }}
              onPointerLeave={() => { live.current.hover = null; }}
              aria-label={`${m.title} ${m.en}，${sum.count} 条`}
            >
              <div
                className="jelly-inner"
                ref={el => { innerRefs.current[m.id] = el; }}
                style={{ filter: MOD_STYLE[m.id].filter }}
              >
                <video
                  className="vsrc"
                  ref={vidRef(m.id, 'video')}
                  src={T.media.jelly}
                  poster={T.media.jellyPoster}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="auto"
                  onLoadedMetadata={(e: any) => {
                    e.currentTarget.currentTime = (MODULES.indexOf(m) * 1.37) % 6;
                  }}
                />
                <canvas className="vid" ref={vidRef(m.id, 'canvas')} />
              </div>
            </button>

            {/* Translucent Frosted Glass Label */}
            <button
              className={`jelly-label ${active ? 'active' : ''} ${hub ? 'below' : 'side'}`}
              ref={el => { labelRefs.current[m.id] = el; }}
              onClick={() => onModule(m.id)}
              tabIndex={-1}
              onPointerEnter={() => { live.current.hover = m.kind; }}
              onPointerLeave={() => { live.current.hover = null; }}
              style={{ '--mod': MOD_STYLE[m.id].color } as any}
            >
              <span className="jl-icon"><Icon name={m.icon} size={14} /></span>
              <span className="jl-count">{sum.count}</span>
              <span className="jl-name">{m.title}<em>{m.en}</em></span>
              <span className="jl-sub">{sum.sub[0]} {sum.sub[1]} <em>{sum.sub[2]}</em></span>
            </button>
          </React.Fragment>
        );
      })}

      {/* Fan-out Items (Photos / Folders / Trips) */}
      {items.map((n, i) => {
        const meta = itemMeta(n);
        return (
          <button
            key={n.id}
            className={`fan-item ${sel === n.id ? 'active' : ''} kind-${n.kind}`}
            ref={el => { itemRefs.current[i] = el; }}
            onClick={() => onItem(n.id)}
            style={{ '--kc': KINDS[n.kind]?.color || '#ffffff' } as any}
            aria-label={`打开 ${n.title} 的分析`}
          >
            <span className="fi-dot" />
            <span className="fi-body">
              <span className="fi-title">{n.short || n.title}</span>
              <span className="fi-meta">
                {meta.map(([k, en, v], j) => (
                  <span key={j} className={k === '↔' ? 'mutual' : ''}>
                    {k}{en && <em>{en}</em>} {v !== '' && <b>{v}</b>}
                  </span>
                ))}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Dock({ graph, onGo }: { graph: GraphData; onGo: (id: string) => void }) {
  const s = useMemo(() => stats(graph), [graph]);
  const [q, setQ] = useState('');
  const [cards, setCards] = useState<any>(null);
  const typing = useRef<any>(null);

  const ask = (text: string) => {
    if (text.trim()) setCards({ q: text, list: askGraph(graph, text) });
  };

  const typeAsk = (text: string) => {
    clearInterval(typing.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setQ(text);
      ask(text);
      return;
    }
    let i = 0;
    setQ('');
    typing.current = setInterval(() => {
      i++;
      setQ(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typing.current);
        setTimeout(() => ask(text), 220);
      }
    }, 45);
  };

  useEffect(() => () => clearInterval(typing.current), []);

  const kpis = [
    ['相册原图', 'Photos', s.photos],
    ['图谱连接', 'Links', s.links],
    ['拍摄足迹', 'Locations', s.locations],
    ['导入目录', 'Folders', s.folders]
  ];

  return (
    <div className="dock">
      {cards && (
        <section className="ask-results glass" aria-live="polite">
          <header>
            <span><Icon name="spark" size={14} />图库检索 <em>Graph analysis</em></span>
            <small>本地规则检索 · Local rules, no cloud</small>
            <button className="icon-btn" aria-label="关闭分析" onClick={() => setCards(null)}>
              <Icon name="close" size={14} />
            </button>
          </header>
          <div className="ask-cards">
            {cards.list.map((c: any, i: number) => (
              <article key={i} className={`ask-card tone-${c.tone}`} style={{ animationDelay: i * 90 + 'ms' }}>
                <h4>{c.title} <em>{c.en}</em></h4>
                <p>{c.text}</p>
                {c.items?.length > 0 && (
                  <div className="chip-row">
                    {c.items.slice(0, 8).map((id: string, k: number) => (
                      <button
                        key={id}
                        className="chip"
                        style={{ '--kc': KINDS[graph.index.get(id)?.kind || '']?.color || '#999' } as any}
                        onClick={() => onGo(id)}
                      >
                        {c.names[k]}
                        {c.meta?.[k] && <small>{c.meta[k]}</small>}
                      </button>
                    ))}
                  </div>
                )}
                {c.pairs && (
                  <div className="pair-list">
                    {c.pairs.map(([a, b, why]: any, k: number) => (
                      <button key={k} onClick={() => onGo(a)}>
                        <span>{graph.index.get(a)?.short}</span>
                        <i>⇄</i>
                        <span>{graph.index.get(b)?.short}</span>
                        <small>{why}</small>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="dock-panel glass">
        <div className="dock-kpis">
          {kpis.map(([k, en, v]) => (
            <div key={k}>
              <span>{k} <em>{en}</em></span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
        <form className="ask" onSubmit={e => { e.preventDefault(); ask(q); }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="问问你的相册图谱… Ask your gallery graph"
            aria-label="向图谱提问"
          />
          <button className="send" aria-label="提交问题"><Icon name="send" size={16} /></button>
        </form>
        <div className="dock-chips">
          <span className="me"><Icon name="agent" size={13} />智能索引 <em>Indexed</em></span>
          {['相册摄影原图', '相机与器材档案', '地理足迹分布', '导入文件夹'].map(x => (
            <button key={x} onClick={() => typeAsk(x)}>{x}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Home({
  graph,
  layout,
  focus,
  setFocus,
  onAction,
  onAbout,
  reduced
}: {
  graph: GraphData;
  layout: Record<string, [number, number]>;
  focus: { mod: string | null; sel: string | null };
  setFocus: React.Dispatch<React.SetStateAction<{ mod: string | null; sel: string | null }>>;
  onAction: (a: any) => void;
  onAbout: () => void;
  reduced?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1280, h: 760 });
  const [paused, setPaused] = useState(false);
  const { mod, sel } = focus;
  const stage = sel ? 'note' : mod ? 'module' : 'hub';
  const items = useMemo(() => moduleItems(graph, mod), [graph, mod]);

  const live = useRef<any>(null);
  if (!live.current) {
    const now = performance.now();
    live.current = {
      t0: now,
      time: 0,
      stage,
      mod,
      items,
      size,
      reduced,
      paused: false,
      hover: null,
      itemState: [],
      fanStart: now,
      orb: { x: 640, y: 380, s: 400 },
      springs: {
        dust: sp(0.3),
        orb: { x: sp(size.w / 2), y: sp(size.h / 2), s: sp(120), o: sp(0) },
        jelly: Object.fromEntries(MODULES.map(m => [m.id, { x: sp(size.w / 2), y: sp(size.h / 2), s: sp(20), o: sp(0), lo: sp(0) }]))
      }
    };
    let seen = false;
    try { seen = !!sessionStorage.getItem('neural-intro-seen'); } catch { }
    live.current.introSeen = reduced || seen;
    if (live.current.introSeen) live.current.t0 = now - 6000;
  }
  Object.assign(live.current, { stage, mod, items, size, reduced, paused });

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight, L = live.current, S = L.springs;
      if (L.stage === 'hub' && performance.now() - L.t0 < 300) {
        const o = targets({ ...L, size: { w, h } }, 0).orb;
        Object.assign(S.orb, { x: sp(o.x), y: sp(o.y) });
        for (const m of MODULES) Object.assign(S.jelly[m.id], { x: sp(o.x), y: sp(o.y) });
        L.orb = { ...L.orb, x: o.x, y: o.y };
      }
      setSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem('neural-intro-seen', '1'); } catch { }
  }, []);

  useEffect(() => {
    live.current.syncVideo?.();
  }, [paused]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing || document.querySelector('.veil')) return;
      if (sel) setFocus({ mod, sel: null });
      else if (mod) setFocus({ mod: null, sel: null });
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [mod, sel, setFocus]);

  const go = useCallback((id: string) => {
    const n = graph.index.get(id), m = moduleOf(n);
    if (m) setFocus({ mod: m.id, sel: id });
  }, [graph, setFocus]);

  const replay = () => {
    const L = live.current, now = performance.now();
    L.t0 = now;
    L.time = 0;
    const S = L.springs;
    S.orb.s.x = 120;
    S.orb.o.x = 0;
    for (const m of MODULES) {
      Object.assign(S.jelly[m.id], { x: sp(L.orb.x), y: sp(L.orb.y), s: sp(20), o: sp(0), lo: sp(0) });
    }
    setFocus({ mod: null, sel: null });
  };

  const node = sel ? graph.index.get(sel) : null;
  const m = MODULES.find(x => x.id === mod);
  const s = stats(graph);

  return (
    <section
      ref={stageRef}
      className={`home-stage stage-${stage} ${live.current.introSeen ? 'intro-done' : ''}`}
      aria-label="相册图谱"
    >
      <div className="stage-bg" />
      <NetworkCanvas graph={graph} layout={layout} live={live} reduced={reduced} />
      <Scene
        graph={graph}
        items={stage === 'hub' ? [] : items}
        sel={sel}
        live={live}
        onModule={id => setFocus({ mod: id === mod && stage !== 'hub' ? mod : id, sel: null })}
        onItem={id => setFocus({ mod, sel: id })}
      />

      {/* Hero Typography */}
      <div className="hub-copy" aria-hidden={stage !== 'hub'}>
        <p className="eyebrow">TUKUZHONG · 图库中 </p>
        <h1>让记忆，<br />彼此相连。</h1>
        <p className="hub-en">从一张照片出发，寻回与它有关的记忆.</p>
        <p className="hub-hint">点击水母，进入回忆 · <em>Tap a jellyfish to expand</em></p>
      </div>

      {/* Breadcrumbs Navigation */}
      {stage !== 'hub' && (
        <nav className="crumbs" aria-label="图谱路径">
          <button
            className="crumb-back"
            onClick={() => setFocus(sel ? { mod, sel: null } : { mod: null, sel: null })}
            aria-label="返回上一层"
          >
            <Icon name="back" size={16} />
          </button>
          <button onClick={() => setFocus({ mod: null, sel: null })}>图库中心 <em>Core</em></button>
          <span>/</span>
          <button onClick={() => setFocus({ mod, sel: null })} style={{ color: mod ? MOD_STYLE[mod]?.color : '#fff' }}>
            {m?.title} <em>{m?.en}</em>
          </button>
          {node && <><span>/</span><b>{node.short || node.title}</b></>}
        </nav>
      )}

      {/* Stage Tools */}
      <div className="stage-tools glass" role="toolbar" aria-label="动画控制">
        <button onClick={replay} title="重播开场 Replay">
          <Icon name="replay" size={15} /><span>重播 <em>Replay</em></span>
        </button>
        <button onClick={() => setPaused(!paused)} title={paused ? '继续 Resume' : '暂停 Pause'} aria-pressed={paused}>
          <Icon name={paused ? 'play' : 'pause'} size={15} /><span>{paused ? '继续' : '暂停'} <em>{paused ? 'Resume' : 'Pause'}</em></span>
        </button>
        <button onClick={onAbout} title="关于相册图谱 About">
          <Icon name="info" size={15} /><span>数据源 <em>Sources</em></span>
        </button>
      </div>

      {/* Legend */}
      {stage === 'hub' && (
        <div className="legend glass" aria-label="图例">
          <h3>图例 <em>Legend</em></h3>
          {['photo', 'folder_item', 'timeline_item', 'location', 'tag'].map(k => (
            <div key={k}>
              <i style={{ '--kc': KINDS[k]?.color } as any} />
              {KINDS[k]?.label} <em>{KINDS[k]?.en}</em>
              <b>{graph.nodes.filter(n => n.kind === k).length}</b>
            </div>
          ))}
          <div className="legend-lines">
            <span><i className="ln one" />目录与足迹关联 <em>Direct Index</em></span>
          </div>
        </div>
      )}

      {stage === 'hub' && <Dock graph={graph} onGo={go} />}
      {stage === 'module' && <p className="module-hint">选择单幅照片或目录查看全部分析 · <em>Select an item to see its full analysis</em></p>}

      {/* Slide-in Telemetry Analysis Drawer */}
      {node && (
        <aside className="analysis-wrap" key={sel || ''}>
          <Analysis
            graph={graph}
            node={node}
            module={m}
            onGo={go}
            onAction={onAction}
            onClose={() => setFocus({ mod, sel: null })}
          />
        </aside>
      )}
    </section>
  );
}
