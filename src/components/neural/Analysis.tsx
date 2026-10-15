import React, { useEffect, useMemo, useState } from 'react';
import { KINDS, CONTENT, neighbors, latent, askGraph, LINK_KINDS, LINK_EN, GraphData, GraphNode } from './photoGraph';
import { Icon } from './icons';

const fmt = (v: any, d = 0) => v == null || Number.isNaN(v) ? '—' : Number(v).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Count({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [v, setV] = useState(reducedMotion() ? value : 0);
  useEffect(() => {
    if (value == null || reducedMotion()) {
      setV(value);
      return;
    }
    let raf: number;
    const t0 = performance.now();
    const run = (now: number) => {
      const p = Math.min(1, (now - t0) / 1000);
      setV(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{fmt(v, decimals)}{value != null && suffix}</>;
}

function Bars({ bars }: { bars: Array<{ v: number; on: boolean; label: string }> }) {
  const max = Math.max(...bars.map(b => b.v || 0), 1e-6);
  return (
    <div className="bars" aria-hidden="true">
      {bars.map((b, i) => (
        <i
          key={i}
          className={b.on ? 'on' : ''}
          title={b.label}
          style={{ '--h': Math.max(0.06, (b.v || 0) / max), animationDelay: 120 + i * 28 + 'ms' } as any}
        />
      ))}
    </div>
  );
}

function Metric({ label, en, value, decimals = 0, suffix = '', level, delta, deltaEn, bars }: any) {
  return (
    <section className="an-metric">
      <header>
        <span>{label} <em>{en}</em></span>
        {level && <b className={`lvl lvl-${level[2]}`}>{level[0]} <em>{level[1]}</em></b>}
      </header>
      <div className="an-metric-body">
        <strong><Count value={value} decimals={decimals} suffix={suffix} /></strong>
        {delta && <small className={String(delta).startsWith('-') ? 'down' : 'up'}>{delta}<em>{deltaEn}</em></small>}
        <Bars bars={bars || []} />
      </div>
    </section>
  );
}

function Tiles({ tiles }: { tiles: Array<[string, any, string, string, number?]> }) {
  return (
    <div className="an-tiles">
      {tiles.map(([icon, v, zh, en, d], i) => (
        <div className="an-tile" key={zh} style={{ animationDelay: 200 + i * 70 + 'ms' }}>
          <span className="t-icon"><Icon name={icon} size={16} /></span>
          <strong>{typeof v === 'number' ? <Count value={v} decimals={d || 0} /> : v}</strong>
          <p>{zh}<em>{en}</em></p>
        </div>
      ))}
    </div>
  );
}

function Chip({ graph, id, onGo, sub }: { graph: GraphData; id: string; onGo: (id: string) => void; sub?: string }) {
  const n = graph.index.get(id);
  if (!n) return null;
  const go = CONTENT.has(n.kind) || n.kind === 'location';
  const body = <>{n.short || n.title}{sub && <small>{sub}</small>}</>;
  return go ? (
    <button className="chip" style={{ '--kc': KINDS[n.kind]?.color || '#999' } as any} onClick={() => onGo(id)}>
      {body}
    </button>
  ) : (
    <span className={`chip static ${n.kind === 'ghost' ? 'ghost' : ''}`} style={{ '--kc': KINDS[n.kind]?.color || '#999' } as any}>
      {body}
    </span>
  );
}

function Links({ graph, node, onGo }: { graph: GraphData; node: GraphNode; onGo: (id: string) => void }) {
  const nb = useMemo(() => neighbors(graph, node.id), [graph, node.id]);
  const lat = useMemo(() => latent(graph, node.id).slice(0, 6), [graph, node.id]);
  const groups = [
    ['引申节点', 'Outgoing', '→', nb.out, (l: any) => LINK_EN[l.link.kind] || 'Link'],
    ['归属链接', 'Inbound', '←', nb.back, (l: any) => LINK_EN[l.link.kind] || 'Parent'],
    ['二度关联', 'Connected', '⋯', lat, (l: any) => 'via ' + (l.via || []).slice(0, 2).join('、')]
  ].filter(g => (g[3] as any[]).length);

  return (
    <section className="an-section">
      <h3>核心拓扑连接 <em>Topology Links</em></h3>
      {groups.map(([zh, en, arrow, list, sub]: any) => (
        <div className="link-group" key={zh}>
          <p><i>{arrow}</i>{zh} <em>{en}</em><b>{list.length}</b></p>
          <div className="chip-row">
            {list.slice(0, 14).map((l: any) => <Chip key={l.id} graph={graph} id={l.id} onGo={onGo} sub={sub(l)} />)}
            {list.length > 14 && <span className="chip static more">+{list.length - 14}</span>}
          </div>
        </div>
      ))}
    </section>
  );
}

function Insights({ items }: { items: Array<[string, string, string, string?]> }) {
  if (!items || !items.length) return null;
  return (
    <section className="an-section">
      <h3><Icon name="spark" size={14} />相册智能分析 <em>Graph insights</em></h3>
      {items.map(([title, en, text, tone], i) => (
        <article key={i} className={`insight tone-${tone || 'info'}`} style={{ animationDelay: 380 + i * 90 + 'ms' }}>
          <h4>{title} <em>{en}</em></h4>
          <p>{text}</p>
        </article>
      ))}
    </section>
  );
}

function AskBox({ graph, node, onGo }: { graph: GraphData; node: GraphNode; onGo: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[] | null>(null);
  return (
    <div className="an-ask">
      {res && (
        <div className="an-ask-res">
          {res.map((c, i) => (
            <div key={i} className={`ask-card mini tone-${c.tone}`}>
              <h4>{c.title} <em>{c.en}</em></h4>
              <p>{c.text}</p>
              {c.items?.length > 0 && (
                <div className="chip-row">
                  {c.items.slice(0, 6).map((id: string) => <Chip key={id} graph={graph} id={id} onGo={onGo} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <form onSubmit={e => { e.preventDefault(); if (q.trim()) setRes(askGraph(graph, q, node.id)); }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="追问这组照片… Ask about this photo" aria-label="追问这组照片" />
        <button aria-label="提交"><Icon name="send" size={15} /></button>
      </form>
      <div className="an-ask-foot">
        <span><Icon name="agent" size={13} />我的图库 <em>My gallery</em></span>
        <span><Icon name="spark" size={13} />本地分析 <em>Local analysis</em></span>
      </div>
    </div>
  );
}

function analyze(graph: GraphData, node: GraphNode) {
  const C = graph.nodes.filter(n => CONTENT.has(n.kind));

  if (node.kind === 'photo' && node.photo) {
    const p = node.photo;
    const P = C.filter(n => n.kind === 'photo');
    const isVideo = p.mediaType === 'video' || /\.(mp4|mov|webm|m4v|mkv)$/i.test(p.filename);
    const isoVal = p.exif?.iso;
    const iso = isoVal || 100;
    const avgIso = P.reduce((s, x) => s + (x.photo?.exif?.iso || 100), 0) / (P.length || 1);

    const modelDisplay = p.exif?.model || '未知相机型号';
    const lensDisplay = p.exif?.lensModel || p.exif?.lens || '未知镜头';
    const apertureDisplay = p.exif?.aperture ? `f/${p.exif.aperture}` : '未知光圈';
    const shutterDisplay = p.exif?.shutterSpeed || '未知快门';
    const isoDisplay = isoVal ? `ISO ${isoVal}` : '未知 ISO';
    const focalDisplay = p.exif?.focalLength ? `${p.exif.focalLength}mm` : '未知焦距';
    const locationDisplay = p.location?.city ? `${p.location.city}${p.location.placeName ? ' · ' + p.location.placeName : ''}` : '未定位 (未知地点)';

    return {
      badge: [modelDisplay, isVideo ? 'Video' : 'Camera'],
      status: `${node.date || '未知日期'} · ${p.folderName || '根目录'} · ${locationDisplay}`,
      action: ['全屏查看作品', 'Open Stage', { type: 'viewPhoto', photo: p }],
      deleteAction: {
        type: 'removePhoto',
        photoId: p.id,
        label: '移除此作品',
        labelEn: 'Delete',
        confirmText: `确定要从图库中移除作品「${p.filename}」吗？`
      },
      metric: {
        label: isoVal ? '感光度指数' : '画幅状态',
        en: isoVal ? 'ISO Sensitivity' : 'Frame Metric',
        value: iso,
        decimals: 0,
        level: isoVal ? (iso > 800 ? ['高感', 'High ISO', 'high'] : iso > 320 ? ['适中', 'Moderate', 'mid'] : ['原生基底', 'Base ISO', 'low']) : ['未知', 'Unknown', 'mid'],
        delta: isoVal ? `${iso - avgIso >= 0 ? '+' : ''}${Math.round(iso - avgIso)} ISO` : undefined,
        deltaEn: isoVal ? 'vs. album average' : undefined,
        bars: P.map(x => ({ v: x.photo?.exif?.iso || 100, on: x.id === node.id, label: x.short }))
      },
      tiles: [
        ['camera', apertureDisplay, '光圈', 'Aperture'],
        ['pulse', shutterDisplay, '快门', 'Shutter'],
        ['eye', isoDisplay, '感光度', 'ISO'],
        ['methods', p.folderName || '未分类目录', '归属目录', 'Folder']
      ],
      all: [
        ['焦距', 'Focal Length', focalDisplay],
        ['镜头机身', 'Lens Model', lensDisplay],
        ['文件大小', 'File Size', p.size ? `${(p.size / 1024 / 1024).toFixed(1)} MB` : (p.sizeBytes ? `${(p.sizeBytes / 1024 / 1024).toFixed(1)} MB` : '未知大小')],
        ['分辨率', 'Resolution', p.width && p.height ? `${p.width} × ${p.height}` : '未知分辨率'],
        ['媒介类型', 'Media Type', isVideo ? '动态视频 (Video)' : '静态照片 (Image)'],
        ['经纬度', 'Geo Coords', p.location?.latitude && p.location?.longitude ? `${p.location.latitude.toFixed(2)}°N, ${p.location.longitude.toFixed(2)}°E` : '未嵌入 GPS 坐标']
      ],
      insights: [
        ['硬件与光学记录', 'Optics Telemetry', `记录硬件：${modelDisplay}，搭配镜头：${lensDisplay}。`, 'gold'],
        ['档案归集', 'Archival status', `归属于逻辑影集「${p.folderName || '默认'}」，未检测到杂质截屏标记。`, 'info']
      ]
    };
  }

  if (node.kind === 'folder_item' && node.folderData) {
    const f = node.folderData;
    return {
      badge: ['导入目录', 'Folder'],
      status: `${f.path} · 共 ${f.photoCount} 件作品`,
      action: ['打开并管理该目录', 'Manage Folder', { type: 'viewFolder', folder: f }],
      deleteAction: {
        type: 'removeFolder',
        folderId: f.id,
        label: '移除此目录',
        labelEn: 'Remove',
        confirmText: `确定要从图库索引中移除目录「${f.name}」吗？（不会删除原文件）`
      },
      metric: {
        label: '目录容量',
        en: 'Folder Size',
        value: f.photoCount,
        decimals: 0,
        suffix: ' 件',
        level: f.photoCount >= 20 ? ['大型库', 'Large', 'high'] : ['常规库', 'Standard', 'mid'],
        bars: graph.nodes.filter(n => n.kind === 'folder_item').map(x => ({ v: x.folderData?.photoCount || 0, on: x.id === node.id, label: x.short }))
      },
      tiles: [
        ['file', f.photoCount, '作品数', 'Works'],
        ['location', '本地扫描', '来源', 'Source'],
        ['spark', 1, '目录层级', 'Level'],
        ['check', '已索引', '状态', 'Status']
      ],
      insights: [
        ['本地扫描路径', 'Source Path', `已索引本地路径：${f.path}。`, 'gold'],
        ['目录资产状态', 'Assets status', `共收录 ${f.photoCount} 件作品，从图库中移除仅删除应用索引，不删除硬盘原文件。`, 'info']
      ]
    };
  }

  if (node.kind === 'location') {
    return {
      badge: ['足迹地点', 'Location'],
      status: node.id === 'loc:unlocated' ? '未记录 GPS 经纬度的作品聚集' : `拍摄城市「${node.short || node.title}」`,
      action: ['进入展厅查看该地点作品', 'View in Gallery', { type: 'filterGallery', filterType: 'location', value: node.short || node.title }],
      metric: {
        label: '关联作品数',
        en: 'Associated Works',
        value: node.deg || 0,
        decimals: 0,
        suffix: ' 件',
        bars: C.slice(0, 10).map(x => ({ v: x.deg || 0, on: x.id === node.id, label: x.short }))
      },
      tiles: [
        ['location', node.short || node.title, '地理地点', 'Location'],
        ['link', node.deg || 0, '作品数', 'Works'],
        ['spark', '真实 GPS', '数据来源', 'Source'],
        ['concept', node.in || 0, '索引度', 'Index']
      ],
      insights: [
        ['空间视角', 'Spatial View', `该地点共有 ${node.deg || 0} 件作品。点击上方按钮可直接在展厅中鉴赏。`, 'gold']
      ]
    };
  }

  if (node.kind === 'timeline_item') {
    return {
      badge: ['时间章节', 'Chronicle'],
      status: `拍摄于 ${node.short || node.title} 的时间叙事小节`,
      action: ['在长卷中阅读该时间段', 'View Chronicle', { type: 'page', page: 'scroll' }],
      metric: {
        label: '时段作品数',
        en: 'Timeline Works',
        value: node.deg || 0,
        decimals: 0,
        suffix: ' 件',
        bars: C.slice(0, 10).map(x => ({ v: x.deg || 0, on: x.id === node.id, label: x.short }))
      },
      tiles: [
        ['draft', node.short || node.title, '年月分期', 'Month'],
        ['link', node.deg || 0, '收录作品', 'Works'],
        ['spark', '连续流', '叙事模式', 'Narrative'],
        ['methods', '时序章节', '结构', 'Chapter']
      ],
      insights: [
        ['时间视角', 'Chronicle View', `收录 ${node.deg || 0} 件作品，在长卷中按节奏排版连贯阅读。`, 'info']
      ]
    };
  }

  if (node.kind === 'tag') {
    return {
      badge: ['相机机型', 'Camera'],
      status: `相机器材型号「${node.short || node.title}」`,
      action: ['在展厅中查看该机型作品', 'View Camera Works', { type: 'filterGallery', filterType: 'camera', value: node.short || node.title }],
      metric: {
        label: '拍摄作品数',
        en: 'Captured Works',
        value: node.deg || 0,
        decimals: 0,
        suffix: ' 件',
        bars: C.slice(0, 10).map(x => ({ v: x.deg || 0, on: x.id === node.id, label: x.short }))
      },
      tiles: [
        ['camera', node.short || node.title, '相机型号', 'Model'],
        ['link', node.deg || 0, '机型作品', 'Works'],
        ['spark', '真实 EXIF', '来源', 'EXIF'],
        ['concept', '器材节点', '类型', 'Type']
      ],
      insights: [
        ['器材视角', 'Hardware View', `真实元数据提取的机型标记，共记录 ${node.deg || 0} 件作品。`, 'gold']
      ]
    };
  }

  // Fallback
  return {
    badge: [KINDS[node.kind]?.label || '节点', 'Node'],
    status: `与 ${node.deg || 0} 个相册节点直接关联`,
    metric: {
      label: '连接活跃度',
      en: 'Connectivity',
      value: node.deg || 0,
      decimals: 0,
      suffix: ' 条',
      bars: C.slice(0, 10).map(x => ({ v: x.deg || 0, on: x.id === node.id, label: x.short }))
    },
    tiles: [
      ['link', node.deg || 0, '总连接数', 'Connections'],
      ['spark', '稳定', '状态', 'Status'],
      ['concept', node.in || 0, '引用度', 'Inbound'],
      ['methods', node.out || 0, '引申度', 'Outbound']
    ],
    insights: [
      ['图谱节点状态', 'Topology', `当前节点属于「${KINDS[node.kind]?.label}」，在图谱中承担汇聚枢纽作用。`, 'info']
    ]
  };
}

export function Analysis({
  graph,
  node,
  module,
  onGo,
  onAction,
  onClose
}: {
  graph: GraphData;
  node: GraphNode;
  module?: any;
  onGo: (id: string) => void;
  onAction: (action: any) => void;
  onClose: () => void;
}) {
  const a = useMemo(() => analyze(graph, node), [graph, node]);
  const color = KINDS[node.kind]?.color || '#ecd9a6';

  return (
    <div className="analysis glass" style={{ '--kc': color } as any} role="region" aria-label={`${node.title} 的分析`}>
      <p className="an-float">相册深度遥测 <em>Telemetry overview</em> · {module?.title} {module?.en}</p>
      <div className="an-scroll">
        <header className="an-head">
          <span className="an-cat">
            <span className="an-cat-icon"><Icon name={module?.icon || 'camera'} size={15} /></span>
            {module?.title}<em>{module?.en}</em>
          </span>
          <button className="icon-btn" onClick={onClose} aria-label="关闭分析"><Icon name="close" size={15} /></button>
        </header>
        <div className="an-title-row">
          <div>
            <h2>{node.short || node.title}</h2>
            {node.short && node.short !== node.title && <p className="an-full">{node.title}</p>}
          </div>
          {node.cover && (
            <img
              className="an-cover"
              src={node.cover}
              alt=""
              onError={e => {
                (e.currentTarget as any).style.display = 'none';
              }}
            />
          )}
        </div>
        <div className="an-status">
          <span className="badge">{a.badge[0]} <em>{a.badge[1]}</em></span>
          <p>{a.status}</p>
          <div className="an-actions">
            {a.action && (
              <button className="an-explore" onClick={() => onAction(a.action[2])}>
                {String(a.action[0])} <em>{String(a.action[1])}</em><Icon name="chevron" size={13} />
              </button>
            )}
            {(a as any).deleteAction && (
              <button
                className="an-remove-btn"
                onClick={() => {
                  const act = (a as any).deleteAction;
                  if (typeof window !== 'undefined' && window.confirm(act.confirmText)) {
                    onAction(act);
                  }
                }}
                title="从图库中移除"
              >
                <Icon name="trash" size={13} />
                {(a as any).deleteAction.label} <em>{(a as any).deleteAction.labelEn}</em>
              </button>
            )}
          </div>
        </div>
        <Metric {...a.metric} />
        <Tiles tiles={a.tiles as any} />
        {a.all && (
          <section className="an-section">
            <h3>相机与技术参数 <em>Technical EXIF</em></h3>
            <div className="an-all">
              {a.all.map(([zh, en, v]: any) => (
                <div key={zh}>
                  <span>{zh}<em>{en}</em></span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </section>
        )}
        <Insights items={a.insights as any} />
        {node.tags && node.tags.length > 0 && (
          <section className="an-section">
            <h3>参数与足迹标签 <em>Tags & Footprints</em></h3>
            <div className="chip-row">
              {node.tags.map(t => (
                <span key={t} className="chip static" style={{ '--kc': KINDS.tag?.color || '#999' } as any}>
                  #{t}
                </span>
              ))}
            </div>
          </section>
        )}
        <Links graph={graph} node={node} onGo={onGo} />
      </div>
      <AskBox graph={graph} node={node} onGo={onGo} />
    </div>
  );
}
