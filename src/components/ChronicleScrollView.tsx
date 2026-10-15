import React, { useMemo } from 'react';
import { PhotoItem } from '../types/photo';

interface ChronicleScrollViewProps {
  photos: PhotoItem[];
  onOpenViewer: (photos: PhotoItem[], index: number) => void;
}

interface Chapter {
  key: string;
  year: number;
  month: number;
  titleZh: string;
  titleEn: string;
  sections: Section[];
}

interface Section {
  key: string;
  timeLabel: string;
  locationLabel?: string;
  folderLabel?: string;
  items: PhotoItem[];
}

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const ChronicleScrollView: React.FC<ChronicleScrollViewProps> = ({
  photos,
  onOpenViewer
}) => {
  // Sort strictly chronological (newest to oldest)
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => b.creationTime - a.creationTime);
  }, [photos]);

  // Build chapters & rhythmic sections
  const chapters = useMemo(() => {
    const chapMap = new Map<string, PhotoItem[]>();

    for (const p of sortedPhotos) {
      const d = new Date(p.creationTime);
      const y = isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
      const m = isNaN(d.getMonth()) ? 9 : d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      if (!chapMap.has(key)) {
        chapMap.set(key, []);
      }
      chapMap.get(key)!.push(p);
    }

    const result: Chapter[] = [];
    for (const [key, items] of chapMap.entries()) {
      const [yStr, mStr] = key.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);

      // Sub-divide chapter items into paragraphs / sections by 4-hour windows or location
      const sections: Section[] = [];
      let currentSection: Section | null = null;

      for (const item of items) {
        const itemDate = new Date(item.creationTime);
        const dayStr = `${itemDate.getDate()}日`;
        const hourStr = itemDate.getHours() < 12 ? '上午' : itemDate.getHours() < 18 ? '下午' : '夜间';
        const loc = item.location?.placeName || item.location?.city;
        const timeLabel = `${dayStr} · ${hourStr}`;

        if (
          !currentSection ||
          currentSection.timeLabel !== timeLabel ||
          currentSection.items.length >= 6
        ) {
          currentSection = {
            key: `sec-${item.id}`,
            timeLabel,
            locationLabel: loc,
            folderLabel: item.folderName,
            items: [item]
          };
          sections.push(currentSection);
        } else {
          currentSection.items.push(item);
        }
      }

      result.push({
        key,
        year: y,
        month: m,
        titleZh: `${y}年 · ${MONTH_NAMES[m - 1] || `${m}月`}`,
        titleEn: `${MONTH_NAMES_EN[m - 1] || ''} ${y}`,
        sections
      });
    }

    return result;
  }, [sortedPhotos]);

  if (photos.length === 0) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', color: '#888' }}>
        <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '8px' }}>暂无时间长卷记录</p>
        <p style={{ fontSize: '13px' }}>导入照片或视频后，将自动编排为可连续阅读的时间叙事画卷。</p>
      </div>
    );
  }

  return (
    <div className="chronicle-scroll" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '90px' }}>
      {chapters.map((chapter) => (
        <section key={chapter.key} style={{ marginBottom: '64px' }}>
          {/* Chapter Header */}
          <div style={{
            position: 'sticky',
            top: '64px',
            zIndex: 10,
            padding: '16px 0',
            backdropFilter: 'blur(16px)',
            background: 'linear-gradient(to bottom, rgba(13,14,14,0.92), rgba(13,14,14,0.7) 80%, transparent)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 600, letterSpacing: '0.04em', color: '#f4f4f1' }}>
                {chapter.titleZh}
              </h2>
              <span style={{ fontSize: '12px', color: '#e6cf98', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {chapter.titleEn}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#777', fontFamily: 'monospace' }}>
              {chapter.sections.reduce((acc, s) => acc + s.items.length, 0)} 帧记忆
            </span>
          </div>

          {/* Sections Timeline Flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', paddingLeft: '8px' }}>
            {chapter.sections.map((section) => (
              <div key={section.key} style={{ position: 'relative', paddingLeft: '24px', borderLeft: '1px solid rgba(230, 207, 152, 0.25)' }}>
                {/* Timeline node dot */}
                <div style={{
                  position: 'absolute',
                  left: '-5px',
                  top: '4px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#e6cf98',
                  boxShadow: '0 0 10px rgba(230, 207, 152, 0.6)'
                }} />

                {/* Section Meta Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e6cf98' }}>
                    {section.timeLabel}
                  </span>
                  {section.locationLabel && (
                    <span style={{ fontSize: '12px', color: '#a5a6a1' }}>
                      📍 {section.locationLabel}
                    </span>
                  )}
                  {section.folderLabel && (
                    <span style={{ fontSize: '11px', color: '#666', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                      📁 {section.folderLabel}
                    </span>
                  )}
                </div>

                {/* Editorial Rhythm Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '14px'
                }}>
                  {section.items.map((item) => {
                    const globalIndex = sortedPhotos.findIndex(p => p.id === item.id);
                    const isVideo = item.mediaType === 'video';

                    return (
                      <div
                        key={item.id}
                        onClick={() => onOpenViewer(sortedPhotos, Math.max(0, globalIndex))}
                        style={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          background: '#161717',
                          border: '1px solid rgba(255,255,255,0.07)',
                          transition: 'transform 0.25s, border-color 0.25s, box-shadow 0.25s',
                          aspectRatio: item.aspectRatio > 1.2 ? '16/10' : item.aspectRatio < 0.85 ? '3/4' : '4/3',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.borderColor = 'rgba(230, 207, 152, 0.5)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {isVideo ? (
                          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <video
                              src={item.uri}
                              muted
                              playsInline
                              preload="metadata"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Video badge */}
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: 'rgba(0,0,0,0.65)',
                              border: '1px solid rgba(230,207,152,0.4)',
                              color: '#e6cf98',
                              fontSize: '10px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              ▶ {item.duration ? `${item.duration}s` : 'VIDEO'}
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.uri}
                            alt=""
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}

                        {/* Subtle bottom info overlay */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '24px 10px 8px',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          fontSize: '11px',
                          color: '#ccc'
                        }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                            {item.filename}
                          </span>
                          {item.exif?.focalLength && (
                            <span style={{ fontSize: '10px', color: '#e6cf98', fontFamily: 'monospace' }}>
                              {item.exif.focalLength}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
