import { PhotoItem, FolderAssetSource } from '../../types/photo';
import { JourneyCluster } from '../../types/journey';
import { T } from './theme';

export interface GraphNode {
  id: string;
  kind: 'core' | 'folder' | 'photo' | 'folder_item' | 'trip' | 'timeline_item' | 'location' | 'tag' | 'ghost';
  title: string;
  short: string;
  path?: string;
  folder?: string;
  level?: number;
  tags?: string[];
  text?: string;
  date?: string;
  deg?: number;
  in?: number;
  out?: number;
  mutual?: number;
  photo?: PhotoItem;
  folderData?: FolderAssetSource;
  tripData?: JourneyCluster;
  cover?: string;
  media?: 'image' | 'video';
  [key: string]: any;
}

export interface GraphLink {
  a: string;
  b: string;
  kind: 'contain' | 'wiki' | 'source' | 'tag' | 'mention' | 'resonance';
  ab: number;
  ba: number;
  w: number;
  both?: boolean;
  s?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  index: Map<string, GraphNode>;
}

export const KINDS: Record<string, { label: string; en: string; color: string }> = {
  core: { label: '图库空间', en: 'Core', color: T.kinds.core },
  folder: { label: '根分类', en: 'Category', color: T.kinds.folder },
  photo: { label: '相册原图', en: 'Photo', color: T.kinds.photo },
  folder_item: { label: '导入目录', en: 'Folder', color: T.kinds.folder_item },
  timeline_item: { label: '时间档案', en: 'Timeline', color: T.kinds.timeline_item },
  location: { label: '地理足迹', en: 'Location', color: T.kinds.location },
  tag: { label: '相机机型', en: 'Camera Model', color: T.kinds.tag },
  ghost: { label: '未归档', en: 'Unassigned', color: T.kinds.ghost }
};

export const LINK_KINDS: Record<string, string> = {
  contain: '目录归属',
  wiki: '[[双链]]',
  source: '来源索引',
  tag: '相机归属',
  mention: '足迹坐标'
};

export const LINK_EN: Record<string, string> = {
  contain: 'Contains',
  wiki: 'Linked',
  source: 'Source',
  tag: 'Camera',
  mention: 'Geo'
};

export const CONTENT = new Set(['photo', 'folder_item', 'timeline_item']);

const FOLDERS = [
  { id: 'f:library', title: '相册原图', path: '01-相册原图', angle: 180 },
  { id: 'f:folders', title: '导入目录', path: '02-导入目录', angle: 0 },
  { id: 'f:locations', title: '拍摄足迹', path: '03-拍摄足迹', angle: -90 },
  { id: 'f:timeline', title: '时间档案', path: '04-时间档案', angle: 90 }
];

export const MODULES = [
  { id: 'library', title: '相册原图', en: 'Library', kind: 'photo', folder: 'f:library', angle: 180, icon: 'works' },
  { id: 'folders', title: '导入目录', en: 'Folders', kind: 'folder_item', folder: 'f:folders', angle: 0, icon: 'methods' },
  { id: 'locations', title: '拍摄足迹', en: 'Locations', kind: 'location', folder: 'f:locations', angle: -90, icon: 'concept' },
  { id: 'timeline', title: '时间档案', en: 'Timeline', kind: 'timeline_item', folder: 'f:timeline', angle: 90, icon: 'draft' }
];

export const moduleOf = (node: GraphNode | null | undefined) => MODULES.find(m => m.kind === node?.kind) || null;

function safeDate(val: any): { full: string; month: string } {
  try {
    if (!val) return { full: '2024-08-15', month: '2024-08' };
    const num = Number(val);
    const d = !isNaN(num) ? new Date(num) : new Date(val);
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString();
      return { full: iso.slice(0, 10), month: iso.slice(0, 7) };
    }
  } catch { }
  return { full: '2024-08-15', month: '2024-08' };
}

export function buildPhotoGraph({
  photos = [],
  folders = [],
  journeys = []
}: {
  photos?: PhotoItem[];
  folders?: FolderAssetSource[];
  journeys?: JourneyCluster[];
}): GraphData {
  const nodes = new Map<string, GraphNode>();
  const add = (n: Partial<GraphNode> & { id: string; kind: any; title: string }) => {
    if (!nodes.has(n.id)) {
      nodes.set(n.id, { tags: [], text: '', short: n.title, ...n });
    }
    return nodes.get(n.id)!;
  };

  const edges = new Map<string, GraphLink>();
  const link = (s: string, t: string, kind: GraphLink['kind'], w = 1) => {
    if (!nodes.has(s) || !nodes.has(t) || s === t) return;
    const [a, b] = s < t ? [s, t] : [t, s];
    const key = a + '|' + b + '|' + kind;
    const e = edges.get(key) || { a, b, kind, ab: 0, ba: 0, w: 0 };
    if (s === a) e.ab += 1; else e.ba += 1;
    e.w = Math.max(e.w, w);
    edges.set(key, e);
  };

  // 1. Central Core Node: 图库中
  add({ id: 'core', kind: 'core', title: '图库中', short: '图库中心', path: '/', text: '图库总览' });

  // 2. Root Category Anchors
  for (const f of FOLDERS) {
    add({ ...f, kind: 'folder', short: f.title });
    link('core', f.id, 'contain');
  }

  // 3. Folders
  for (const f of folders) {
    const fid = 'folder:' + f.id;
    add({
      id: fid,
      kind: 'folder_item',
      title: f.name,
      short: f.name,
      path: f.path || `/${f.name}`,
      folder: 'f:folders',
      folderData: f,
      cover: f.coverUri,
      text: `${f.name} ${f.path} ${f.photoCount}件作品`
    });
    link('f:folders', fid, 'contain');
  }

  // 4. Locations & Timeline Bundles
  const citySet = new Set<string>();
  const monthSet = new Set<string>();
  let hasUnlocated = false;
  let hasUnknownCamera = false;

  for (const p of photos) {
    if (p.location?.city) {
      citySet.add(p.location.city);
    } else {
      hasUnlocated = true;
    }

    if (!p.exif?.model) {
      hasUnknownCamera = true;
    }

    const m = safeDate(p.creationTime).month;
    monthSet.add(m);
  }

  for (const city of citySet) {
    const cid = 'loc:' + city;
    add({
      id: cid,
      kind: 'location',
      title: city,
      short: city,
      path: `足迹/${city}`,
      folder: 'f:locations',
      text: `拍摄城市足迹 ${city}`
    });
    link('f:locations', cid, 'contain');
  }

  if (hasUnlocated && photos.length > 0) {
    add({
      id: 'loc:unlocated',
      kind: 'location',
      title: '未定位',
      short: '未定位',
      path: '足迹/未定位',
      folder: 'f:locations',
      text: '未记录 GPS 经纬度的作品'
    });
    link('f:locations', 'loc:unlocated', 'contain');
  }

  for (const m of monthSet) {
    const tid = 'timeline:' + m;
    add({
      id: tid,
      kind: 'timeline_item',
      title: m,
      short: m,
      path: `时间档案/${m}`,
      folder: 'f:timeline',
      text: `拍摄时间档案 ${m}`
    });
    link('f:timeline', tid, 'contain');
  }

  // 5. Camera Model Tags
  const cameraSet = new Set<string>();
  for (const p of photos) {
    if (p.exif?.model) cameraSet.add(p.exif.model);
  }
  for (const cam of cameraSet) {
    const camId = 'cam:' + cam;
    add({
      id: camId,
      kind: 'tag',
      title: cam,
      short: cam,
      path: `机型/${cam}`,
      text: `相机机身 ${cam}`
    });
  }
  if (hasUnknownCamera && photos.length > 0) {
    add({
      id: 'cam:unknown',
      kind: 'tag',
      title: '未知机型',
      short: '未知机型',
      path: '机型/未知机型',
      text: '未录入相机 EXIF 机型参数'
    });
  }

  // 6. Photos
  for (const p of photos) {
    const pid = 'photo:' + p.id;
    const dateObj = safeDate(p.creationTime);
    const dateStr = dateObj.full;
    const monthStr = dateObj.month;
    const tags = [
      p.exif?.model || '未知机型',
      p.exif?.lensModel,
      p.location?.city || '未定位',
      p.folderName
    ].filter(Boolean) as string[];

    add({
      id: pid,
      kind: 'photo',
      title: p.filename || `IMG_${p.id.slice(0, 8)}`,
      short: p.filename || `IMG_${p.id.slice(0, 8)}`,
      path: `${p.folderName || 'Default'}/${p.filename}`,
      folder: 'f:library',
      photo: p,
      cover: p.uri,
      date: dateStr,
      media: p.mediaType || 'image',
      tags,
      text: `${p.filename} ${p.folderName || ''} ${p.exif?.model || '未知机型'} ${p.location?.city || '未定位'} ${p.exif?.iso ? 'ISO' + p.exif.iso : ''}`
    });

    // Link to Library
    link('f:library', pid, 'contain');

    // Link to Folder (by ID or name)
    const folderKey = p.folderId ? 'folder:' + p.folderId : (p.folderName ? 'folder:' + p.folderName : null);
    if (folderKey && nodes.has(folderKey)) {
      link(folderKey, pid, 'source');
    }

    // Link to Timeline
    if (nodes.has('timeline:' + monthStr)) {
      link('timeline:' + monthStr, pid, 'contain');
    }

    // Link to Location or Unlocated
    if (p.location?.city && nodes.has('loc:' + p.location.city)) {
      link('loc:' + p.location.city, pid, 'mention');
    } else if (nodes.has('loc:unlocated')) {
      link('loc:unlocated', pid, 'mention');
    }

    // Link to Camera Model or Unknown
    if (p.exif?.model && nodes.has('cam:' + p.exif.model)) {
      link('cam:' + p.exif.model, pid, 'tag');
    } else if (nodes.has('cam:unknown')) {
      link('cam:unknown', pid, 'tag');
    }
  }

  // Resolve Degrees, In/Out
  const nodeArr = [...nodes.values()];
  const index = new Map(nodeArr.map(n => [n.id, n]));

  for (const n of nodeArr) {
    n.in = 0;
    n.out = 0;
    n.deg = 0;
  }

  const linkArr = [...edges.values()].map(e => {
    const s = e.ab >= e.ba ? e.a : e.b;
    const l: GraphLink = { ...e, s };
    const A = index.get(l.a);
    const B = index.get(l.b);
    if (A && B) {
      A.deg = (A.deg || 0) + 1;
      B.deg = (B.deg || 0) + 1;
      if (s === l.a) {
        A.out = (A.out || 0) + 1;
        B.in = (B.in || 0) + 1;
      } else {
        B.out = (B.out || 0) + 1;
        A.in = (A.in || 0) + 1;
      }
    }
    return l;
  });

  return { nodes: nodeArr, links: linkArr, index };
}

// Neighbors for Inspector
export function neighbors(graph: GraphData, id: string) {
  const rank = (it: any) => (it.link.kind === 'mention' ? 20 : it.link.kind === 'source' ? 15 : 10);
  const best = new Map<string, any>();
  for (const l of graph.links) {
    if ((l.a !== id && l.b !== id) || l.kind === 'contain') continue;
    const other = l.a === id ? l.b : l.a;
    const item = { id: other, link: l, dir: l.s === id ? 'out' : 'back' };
    const prev = best.get(other);
    if (!prev || rank(item) > rank(prev)) best.set(other, item);
  }
  const lists: { out: any[]; back: any[]; mutual: any[] } = { out: [], back: [], mutual: [] };
  for (const x of best.values()) {
    (lists as any)[x.dir].push({ id: x.id, link: x.link });
  }
  return lists;
}

// Latent 2nd-degree connections
export function latent(graph: GraphData, id: string) {
  const near = new Set([id, ...graph.links.filter(l => l.a === id || l.b === id).map(l => l.a === id ? l.b : l.a)]);
  const hubs = graph.links.filter(l => (l.a === id || l.b === id) && (l.kind === 'mention' || l.kind === 'tag')).map(l => l.a === id ? l.b : l.a);
  const score = new Map<string, string[]>();
  for (const h of hubs) {
    for (const l of graph.links) {
      if (l.a !== h && l.b !== h) continue;
      const other = l.a === h ? l.b : l.a;
      if (near.has(other) || !CONTENT.has(graph.index.get(other)?.kind || '')) continue;
      score.set(other, [...(score.get(other) || []), graph.index.get(h)?.title || '']);
    }
  }
  return [...score].sort((a, b) => b[1].length - a[1].length).map(([other, via]) => ({ id: other, via }));
}

export function stats(graph: GraphData) {
  const content = graph.nodes.filter(n => CONTENT.has(n.kind));
  const real = graph.links.filter(l => l.kind !== 'contain');
  return {
    content: content.length,
    links: real.length,
    photos: graph.nodes.filter(n => n.kind === 'photo').length,
    folders: graph.nodes.filter(n => n.kind === 'folder_item').length,
    locations: graph.nodes.filter(n => n.kind === 'location').length,
    timeline: graph.nodes.filter(n => n.kind === 'timeline_item').length
  };
}

// Layout physics
function rng(seed: string) {
  let s = 0;
  for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const rad = (d: number) => d * Math.PI / 180;

export function forceLayout(graph: GraphData): Record<string, [number, number]> {
  const N = graph.nodes, idx = graph.index;
  const anchor = (id: string): [number, number] | null => {
    const n = idx.get(id);
    if (!n) return null;
    if (n.kind === 'location') return [0, -1];
    const f = FOLDERS.find(f => f.id === n.folder || f.id === id);
    return f ? [Math.cos(rad(f.angle)), Math.sin(rad(f.angle))] : null;
  };

  for (const n of N) {
    const r = rng(n.id), a = anchor(n.id);
    const R = n.kind === 'core' ? 0 : n.kind === 'folder' ? 210 : CONTENT.has(n.kind) ? 330 : 420;
    const base = a ? Math.atan2(a[1], a[0]) : r() * Math.PI * 2;
    const ang = base + (r() - .5) * (a ? 1.1 : 6.28);
    n.x = Math.cos(ang) * R * (0.8 + r() * .4);
    n.y = Math.sin(ang) * R * (0.8 + r() * .4);
    n.vx = 0;
    n.vy = 0;
  }

  const rest: Record<string, number> = { contain: 120, wiki: 95, source: 90, tag: 52, mention: 135, resonance: 170 };
  const strength: Record<string, number> = { contain: .05, wiki: .06, source: .08, tag: .09, mention: .018, resonance: .006 };

  for (let it = 0; it < 380; it++) {
    const alpha = 1 - it / 380;
    for (let i = 0; i < N.length; i++) {
      for (let j = i + 1; j < N.length; j++) {
        const A = N[i], B = N[j];
        let dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy || .01;
        const charge = (A.kind === 'tag' || B.kind === 'tag' ? 900 : 2600) * (A.kind === 'folder' && B.kind === 'folder' ? 3 : 1);
        const f = charge / d2 * alpha, d = Math.sqrt(d2);
        dx /= d; dy /= d;
        A.vx -= dx * f; A.vy -= dy * f; B.vx += dx * f; B.vy += dy * f;
      }
    }
    for (const l of graph.links) {
      const A = idx.get(l.a), B = idx.get(l.b);
      if (!A || !B) continue;
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || .01;
      const k = (d - (rest[l.kind] || 100)) * (strength[l.kind] || 0.05) * alpha;
      A.vx += dx / d * k; A.vy += dy / d * k; B.vx -= dx / d * k; B.vy -= dy / d * k;
    }
    for (const n of N) {
      const a = anchor(n.id);
      if (n.kind === 'folder' && a) {
        const R = n.level ? 300 : 230;
        n.vx += (a[0] * R - n.x) * .04;
        n.vy += (a[1] * R - n.y) * .04;
      } else if (a && CONTENT.has(n.kind)) {
        n.vx += (a[0] * 380 - n.x) * .006;
        n.vy += (a[1] * 380 - n.y) * .006;
      } else if (a) {
        n.vx += (a[0] * 300 - n.x) * .004;
        n.vy += (a[1] * 300 - n.y) * .004;
      }
      n.vx -= n.x * .002;
      n.vy -= n.y * .002;
      if (n.kind === 'core') {
        n.x = 0; n.y = 0; n.vx = 0; n.vy = 0;
        continue;
      }
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= .55;
      n.vy *= .55;
    }
  }

  return Object.fromEntries(N.map(n => [n.id, [n.x, n.y * .82]]));
}

// Rule-based natural language search
export function askGraph(graph: GraphData, question: string, scope?: string) {
  const q = question.trim();
  const C = graph.nodes.filter(n => CONTENT.has(n.kind));
  const real = graph.links.filter(l => l.kind !== 'contain');
  const name = (id: string) => graph.index.get(id)?.short || graph.index.get(id)?.title || '';
  const cards: any[] = [];

  if (/照片|原图|摄影|作品/.test(q)) {
    const photos = graph.nodes.filter(n => n.kind === 'photo').slice(0, 8);
    cards.push({
      tone: 'gold',
      title: '相册摄影原图',
      en: 'Photo library',
      text: `图库中收录了 ${graph.nodes.filter(n => n.kind === 'photo').length} 张照片。`,
      items: photos.map(p => p.id)
    });
  } else if (/相机|机身|镜头|参数|iso|快门|光圈/.test(q.toLowerCase())) {
    const topCams = graph.nodes.filter(n => n.kind === 'tag').slice(0, 5);
    cards.push({
      tone: 'gold',
      title: '相机与器材档案',
      en: 'Camera telemetry',
      text: `检测到 ${topCams.length} 台拍摄机身：${topCams.map(c => c.title).join('、')}`,
      items: topCams.map(c => c.id)
    });
  } else if (/足迹|城市|地理|地点|去过/.test(q)) {
    const locs = graph.nodes.filter(n => n.kind === 'location').slice(0, 8);
    cards.push({
      tone: 'info',
      title: '地理足迹分布',
      en: 'Geo footprints',
      text: `共记录 ${locs.length} 个拍摄城市：${locs.map(l => l.title).join('、')}`,
      items: locs.map(l => l.id)
    });
  } else if (/目录|文件夹|外部|导入/.test(q)) {
    const fldrs = graph.nodes.filter(n => n.kind === 'folder_item');
    cards.push({
      tone: 'info',
      title: '导入文件夹',
      en: 'Imported folders',
      text: `共扫描 ${fldrs.length} 个本地目录来源。`,
      items: fldrs.map(f => f.id)
    });
  } else {
    const words = q.replace(/[？?。，,！!]/g, ' ').split(/\s+/).filter(w => w.length >= 1);
    const hits = graph.nodes.filter(n => n.kind !== 'core').map(n => {
      const hay = (n.title + ' ' + (n.text || '') + ' ' + (n.path || '')).toLowerCase();
      const score = words.reduce((s, w) => s + (n.title.toLowerCase().includes(w.toLowerCase()) ? 3 : hay.includes(w.toLowerCase()) ? 1 : 0), 0);
      return { n, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

    cards.push(hits.length
      ? { tone: 'info', title: `检索到「${q}」`, en: 'Search match', text: `在相册、目录与足迹中找到 ${hits.length} 处匹配节点。`, items: hits.map(h => h.n.id) }
      : { tone: 'warn', title: '没有找到匹配', en: 'No match', text: '试试：相机参数、地理足迹、导入文件夹、时间档案。', items: [] });
  }

  if (scope) {
    cards.forEach(c => {
      if (c.items) c.items.sort((a: any, b: any) => (b === scope ? 1 : 0) - (a === scope ? 1 : 0));
    });
  }
  return cards.map(c => ({ ...c, names: (c.items || []).map(name) }));
}
