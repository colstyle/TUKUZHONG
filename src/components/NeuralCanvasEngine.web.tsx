import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

export interface PodNode {
  id: string;
  name: string;
  en: string;
  count: number;
  icon: string;
  color: string;
  cx: number;
  cy: number;
}

interface NeuralCanvasEngineProps {
  viewMode: 'overview' | 'expanded';
  activePodId: string;
  pods: PodNode[];
  branchCount: number;
  onPodClick?: (podId: string) => void;
  width?: number;
  height?: number;
}

// 3D Math Utilities for Geodesic Sphere
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// 12 vertices of an icosahedron
const PHI = (1 + Math.sqrt(5)) / 2;
const BASE_VERTICES: Point3D[] = [
  { x: -1, y: PHI, z: 0 },
  { x: 1, y: PHI, z: 0 },
  { x: -1, y: -PHI, z: 0 },
  { x: 1, y: -PHI, z: 0 },
  { x: 0, y: -1, z: PHI },
  { x: 0, y: 1, z: PHI },
  { x: 0, y: -1, z: -PHI },
  { x: 0, y: 1, z: -PHI },
  { x: PHI, y: 0, z: -1 },
  { x: PHI, y: 0, z: 1 },
  { x: -PHI, y: 0, z: -1 },
  { x: -PHI, y: 0, z: 1 },
];

// Scale vertices to refined sphere radius
const SPHERE_RADIUS = 54;
const IC_VERTICES: Point3D[] = BASE_VERTICES.map((v) => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  return {
    x: (v.x / len) * SPHERE_RADIUS,
    y: (v.y / len) * SPHERE_RADIUS,
    z: (v.z / len) * SPHERE_RADIUS,
  };
});

// Compute edges between vertices
const IC_EDGES: [number, number][] = [];
const EDGE_THRESHOLD = SPHERE_RADIUS * 1.15;
for (let i = 0; i < IC_VERTICES.length; i++) {
  for (let j = i + 1; j < IC_VERTICES.length; j++) {
    const dx = IC_VERTICES[i].x - IC_VERTICES[j].x;
    const dy = IC_VERTICES[i].y - IC_VERTICES[j].y;
    const dz = IC_VERTICES[i].z - IC_VERTICES[j].z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist <= EDGE_THRESHOLD) {
      IC_EDGES.push([i, j]);
    }
  }
}

// Accretion disk particles
interface Particle {
  radius: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  alpha: number;
}

const PARTICLE_COLORS = [
  '#FFFFFF',
  '#FDE047',
  '#F59E0B',
  '#FB923C',
  '#67E8F9',
  '#FFFFFF',
];

const NUM_PARTICLES = 160;

export const NeuralCanvasEngine: React.FC<NeuralCanvasEngineProps> = ({
  viewMode,
  activePodId,
  pods,
  branchCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Current state with smooth interpolation
  const stateRef = useRef({
    coreX: 500,
    coreY: 300,
    rotX: 0.18,
    rotY: 0,
    time: 0,
    particles: [] as Particle[],
    constellationStars: [] as { x: number; y: number; vx: number; vy: number; r: number }[],
  });

  // Initialize particles once
  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        radius: 28 + Math.random() * 68,
        angle: Math.random() * Math.PI * 2,
        speed: (0.018 + Math.random() * 0.032),
        size: 0.7 + Math.random() * 1.8,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        alpha: 0.35 + Math.random() * 0.65,
      });
    }

    const constellationStars = [];
    for (let i = 0; i < 35; i++) {
      constellationStars.push({
        x: Math.random() * 1400,
        y: Math.random() * 800,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: 0.8 + Math.random() * 1.8,
      });
    }

    stateRef.current.particles = particles;
    stateRef.current.constellationStars = constellationStars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      if (width === 0 || height === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const st = stateRef.current;
      st.time += 0.02;
      st.rotY += 0.005;
      st.rotX += 0.002;

      // Smooth camera interpolation
      const targetCoreX = viewMode === 'overview' ? width * 0.5 : 120;
      const targetCoreY = viewMode === 'overview' ? height * 0.46 : height * 0.45;
      st.coreX += (targetCoreX - st.coreX) * 0.09;
      st.coreY += (targetCoreY - st.coreY) * 0.09;

      ctx.clearRect(0, 0, width, height);

      // 1. Cosmic Vignette & Ambient Radial Glow
      const bgGrad = ctx.createRadialGradient(
        st.coreX,
        st.coreY,
        10,
        st.coreX,
        st.coreY,
        viewMode === 'overview' ? 380 : 220
      );
      bgGrad.addColorStop(0, 'rgba(245, 158, 11, 0.09)');
      bgGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.04)');
      bgGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Background Constellation Stars & Plexus
      ctx.save();
      const stars = st.constellationStars;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby stars with subtle faint hair-lines
        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          const dist = Math.hypot(s.x - s2.x, s.y - s2.y);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 3. 3D Geodesic Icosphere Wireframe Cage (Rotating around Singularity)
      ctx.save();
      const fov = 280;
      const cosY = Math.cos(st.rotY);
      const sinY = Math.sin(st.rotY);
      const cosX = Math.cos(st.rotX);
      const sinX = Math.sin(st.rotX);

      const projected: { x: number; y: number; z: number }[] = [];

      for (let i = 0; i < IC_VERTICES.length; i++) {
        const v = IC_VERTICES[i];
        const x1 = v.x * cosY - v.z * sinY;
        const z1 = v.z * cosY + v.x * sinY;
        const y1 = v.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + v.y * sinX;

        const scale = fov / (fov + z2);
        projected.push({
          x: st.coreX + x1 * scale,
          y: st.coreY + y1 * scale,
          z: z2,
        });
      }

      // Draw wireframe edges
      for (let k = 0; k < IC_EDGES.length; k++) {
        const [p1Idx, p2Idx] = IC_EDGES[k];
        const p1 = projected[p1Idx];
        const p2 = projected[p2Idx];
        const avgZ = (p1.z + p2.z) / 2;

        const depthAlpha = Math.max(0.1, Math.min(0.75, (avgZ + SPHERE_RADIUS) / (SPHERE_RADIUS * 2)));
        ctx.strokeStyle = `rgba(253, 224, 71, ${depthAlpha * 0.7})`;
        ctx.lineWidth = avgZ > 0 ? 1.2 : 0.6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Vertices dots
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        if (p.z > -10) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.z > 0 ? 1.8 : 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 4. Accretion Disk Orbiting Particles (Keplerian Velocity & Inclined Disc)
      ctx.save();
      const tilt = 0.38;
      for (let i = 0; i < st.particles.length; i++) {
        const p = st.particles[i];
        p.angle += p.speed;

        const px = st.coreX + p.radius * Math.cos(p.angle);
        const py = st.coreY + p.radius * Math.sin(p.angle) * tilt;

        const isFront = Math.sin(p.angle) > 0;
        const alpha = isFront ? p.alpha : p.alpha * 0.28;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isFront ? 6 : 1;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 5. Central Gravitational Singularity (Event Horizon Corona)
      ctx.save();
      const corona = ctx.createRadialGradient(
        st.coreX,
        st.coreY,
        14,
        st.coreX,
        st.coreY,
        36
      );
      corona.addColorStop(0, '#000000');
      corona.addColorStop(0.7, '#07090E');
      corona.addColorStop(0.85, 'rgba(245, 158, 11, 0.85)');
      corona.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(st.coreX, st.coreY, 36, 0, Math.PI * 2);
      ctx.fill();

      // Absolute black center event horizon
      ctx.fillStyle = '#020306';
      ctx.beginPath();
      ctx.arc(st.coreX, st.coreY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 6. VIEWPORT MODES: OVERVIEW VS EXPANDED
      if (viewMode === 'overview') {
        for (let i = 0; i < pods.length; i++) {
          const pod = pods[i];
          const targetX = (pod.cx / 1000) * width;
          const targetY = (pod.cy / 600) * height;

          // A. Laser Synaptic Connection Beam
          ctx.save();
          ctx.strokeStyle = pod.color;
          ctx.globalAlpha = 0.2;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(st.coreX, st.coreY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          ctx.strokeStyle = '#FFFFFF';
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(st.coreX, st.coreY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();

          // Traveling photon packet (Synapse action potential)
          const photonProgress = (st.time * 0.75 + i * 0.2) % 1;
          const photonX = st.coreX + (targetX - st.coreX) * photonProgress;
          const photonY = st.coreY + (targetY - st.coreY) * photonProgress;

          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(photonX, photonY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // B. Procedural Bioluminescent Glass Jellyfish / Neural Brain
          // Offset position so it floats gracefully beside the card without obscuring text
          let jx = targetX;
          let jy = targetY - 42;
          if (pod.id === 'folders' || pod.id === 'locations') {
            jx = targetX - 65;
            jy = targetY;
          } else if (pod.id === 'trips' || pod.id === 'timeline') {
            jx = targetX + 65;
            jy = targetY;
          }

          drawProceduralJellyfish(
            ctx,
            jx,
            jy,
            pod.color,
            st.time + i * 1.5
          );
        }
      } else {
        // VIEW B: EXPANDED BRANCH FAN-OUT (Matching Frame 016 & 020)
        // Pod selector starts at paddingHorizontal: 20, width: 140 -> right edge is at 160
        const branchStartX = 160;
        const activeIdx = pods.findIndex((p) => p.id === activePodId);
        const cardH = 68;
        const cardGap = 12;
        const branchStartY = 16 + (activeIdx >= 0 ? activeIdx : 0) * (cardH + cardGap) + cardH / 2;
        const branchEndX = 290; // Left edge of the branch pills list

        ctx.save();
        const numBranches = Math.max(1, Math.min(branchCount, 20));

        for (let b = 0; b < numBranches; b++) {
          const itemH = 46;
          const itemGap = 10;
          const itemY = 16 + b * (itemH + itemGap) + itemH / 2;

          const cpX1 = branchStartX + (branchEndX - branchStartX) * 0.38;
          const cpX2 = branchStartX + (branchEndX - branchStartX) * 0.72;

          // Smooth luminous gradient bezier ribbon
          const branchGrad = ctx.createLinearGradient(branchStartX, branchStartY, branchEndX, itemY);
          branchGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          branchGrad.addColorStop(0.35, 'rgba(103, 232, 249, 0.75)');
          branchGrad.addColorStop(1, 'rgba(245, 158, 11, 0.85)');

          ctx.strokeStyle = branchGrad;
          ctx.lineWidth = 1.1;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(branchStartX, branchStartY);
          ctx.bezierCurveTo(cpX1, branchStartY, cpX2, itemY, branchEndX, itemY);
          ctx.stroke();

          // Anchor glowing dot at branch tip
          ctx.fillStyle = '#F59E0B';
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 6;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.arc(branchEndX, itemY, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Traveling photon packet along the curve
          const t = (st.time * 0.65 + b * 0.12) % 1;
          const bpx =
            Math.pow(1 - t, 3) * branchStartX +
            3 * Math.pow(1 - t, 2) * t * cpX1 +
            3 * (1 - t) * Math.pow(t, 2) * cpX2 +
            Math.pow(t, 3) * branchEndX;
          const bpy =
            Math.pow(1 - t, 3) * branchStartY +
            3 * Math.pow(1 - t, 2) * t * branchStartY +
            3 * (1 - t) * Math.pow(t, 2) * itemY +
            Math.pow(t, 3) * itemY;

          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(bpx, bpy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [viewMode, activePodId, pods, branchCount]);

  // Handle Canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          if (el) {
            const dpr = window.devicePixelRatio || 1;
            el.width = el.clientWidth * dpr;
            el.height = el.clientHeight * dpr;
            const ctx = el.getContext('2d');
            if (ctx) {
              ctx.scale(dpr, dpr);
            }
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />
    </View>
  );
};

/**
 * Procedural Bioluminescent Glass Jellyfish / Neural Brain
 * 100% Vector Canvas Rendering with Refined Scale and Organic Tentacles
 */
function drawProceduralJellyfish(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  accentColor: string,
  time: number
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Bobbing floating harmonic motion
  const bobY = Math.sin(time * 1.8) * 3;
  ctx.translate(0, bobY);

  // 1. Sinuous Undulating Tentacles
  const numTentacles = 6;
  for (let i = 0; i < numTentacles; i++) {
    const offsetX = (i - (numTentacles - 1) / 2) * 4;
    const len = 24 + (i % 2 === 0 ? 8 : 0);

    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = i === 2 || i === 3 ? 1.1 : 0.7;
    ctx.globalAlpha = 0.55;

    ctx.beginPath();
    ctx.moveTo(offsetX, 6);

    const cp1x = offsetX + Math.sin(time * 2.2 + i * 0.8) * 6;
    const cp1y = 6 + len * 0.45;
    const cp2x = offsetX + Math.sin(time * 2.5 + i * 0.8 + 1.2) * 8;
    const cp2y = 6 + len * 0.8;
    const endX = offsetX + Math.sin(time * 2.8 + i * 0.8 + 2.4) * 5;
    const endY = 6 + len;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.arc(endX, endY, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Translucent Glass Umbrella Dome
  ctx.save();
  const capGrad = ctx.createRadialGradient(0, -3, 2, 0, 0, 18);
  capGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  capGrad.addColorStop(0.35, 'rgba(103, 232, 249, 0.65)');
  capGrad.addColorStop(0.7, 'rgba(167, 139, 250, 0.35)');
  capGrad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');

  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.moveTo(-16, 6);
  ctx.bezierCurveTo(-18, -14, 18, -14, 16, 6);
  ctx.bezierCurveTo(10, 8, -10, 8, -16, 6);
  ctx.closePath();
  ctx.fill();

  // Glass edge rim stroke
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. Inner Glowing Brain Nucleus
  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 10;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(-3, -1, 3.5, 0, Math.PI * 2);
  ctx.arc(3, -1, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, -1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
});
