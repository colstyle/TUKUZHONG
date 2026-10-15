import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PhotoItem } from '../types/photo';
import { Icon } from './neural/icons';

interface ExhibitionStageViewProps {
  photos: PhotoItem[];
  currentIndex?: number;
  onOpenViewer?: (photos: PhotoItem[], index: number) => void;
  onDeletePhoto?: (photoId: string) => void;
  onImportNew?: () => void;
}

export const ExhibitionStageView: React.FC<ExhibitionStageViewProps> = ({
  photos,
  currentIndex: initialIdx = 0,
  onOpenViewer,
  onDeletePhoto,
  onImportNew
}) => {
  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const [showDetails, setShowDetails] = useState(true);

  // Keep activeIdx within range if photos list changes
  useEffect(() => {
    if (activeIdx >= photos.length && photos.length > 0) {
      setActiveIdx(photos.length - 1);
    }
  }, [photos.length, activeIdx]);

  const currentWork = photos[activeIdx] || null;

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    setActiveIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowDetails(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  if (!photos || photos.length === 0) {
    return (
      <div className="page page-library" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div
          className="glass"
          style={{
            maxWidth: '520px',
            padding: '48px 36px',
            borderRadius: '20px',
            textAlign: 'center',
            background: 'rgba(22, 23, 23, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f3f4f4', marginBottom: '8px' }}>
            展厅静候作品布展
          </h2>
          <p style={{ fontSize: '13.5px', color: '#888', lineHeight: 1.6, marginBottom: '24px' }}>
            “图库中”以展厅作为主要观看方式。导入文件夹或外部 SD 卡后，照片与动态视频将以此单件舞台流程沉浸呈现。
          </p>
          {onImportNew && (
            <button className="pill primary" onClick={onImportNew} style={{ margin: '0 auto', padding: '10px 22px' }}>
              <Icon name="plus" size={15} />
              立即导入作品 <em>Import Works</em>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isVideo = currentWork?.mediaType === 'video' || /\.(mp4|mov|webm|m4v|mkv)$/i.test(currentWork?.filename || '');

  // Optical EXIF details (showing "未知" truthfully)
  const cameraMake = currentWork?.exif?.make || '';
  const cameraModel = currentWork?.exif?.model || '';
  const cameraDisplay = [cameraMake, cameraModel].filter(Boolean).join(' ') || '未知相机型号';
  const lensDisplay = currentWork?.exif?.lensModel || currentWork?.exif?.lens || '未知镜头';
  const apertureDisplay = currentWork?.exif?.aperture || '未知光圈';
  const shutterDisplay = currentWork?.exif?.shutterSpeed || '未知快门';
  const isoDisplay = currentWork?.exif?.iso ? `ISO ${currentWork.exif.iso}` : '未知 ISO';
  const focalDisplay = currentWork?.exif?.focalLength || '未知焦距';
  const locationDisplay = currentWork?.location?.city
    ? `${currentWork.location.city}${currentWork.location.placeName ? ' · ' + currentWork.location.placeName : ''}`
    : '未知地点 (无 GPS)';

  const dateDisplay = currentWork?.creationTime
    ? new Date(currentWork.creationTime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未知时间';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 58px)',
        background: '#090a0a',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Stage Top Control Bar */}
      <div
        style={{
          height: '46px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(13, 14, 14, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ace0cf', fontWeight: 600 }}>
            EXHIBITION STAGE 展厅舞台
          </span>
          <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>/</span>
          <span style={{ fontSize: '12px', color: '#888' }}>
            第 <strong style={{ color: '#fff' }}>{activeIdx + 1}</strong> 件 / 共 {photos.length} 件
          </span>
          {isVideo && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                background: 'rgba(172, 224, 207, 0.15)',
                color: '#ace0cf',
                border: '1px solid rgba(172, 224, 207, 0.3)'
              }}
            >
              🎬 动态视频 {currentWork.duration ? `${currentWork.duration}s` : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="an-ghost-btn"
            onClick={() => setShowDetails(!showDetails)}
            title="切换作品说明与 EXIF 侧栏 (快捷键 I)"
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              borderRadius: '6px',
              background: showDetails ? 'rgba(172, 224, 207, 0.12)' : 'transparent',
              color: showDetails ? '#ace0cf' : '#888',
              border: '1px solid ' + (showDetails ? 'rgba(172, 224, 207, 0.3)' : 'rgba(255,255,255,0.08)')
            }}
          >
            <Icon name="info" size={13} />
            {showDetails ? '隐藏说明' : '作品说明'}
          </button>

          {onOpenViewer && (
            <button
              className="an-ghost-btn"
              onClick={() => onOpenViewer(photos, activeIdx)}
              title="进入全屏沉浸纯净模式"
              style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
            >
              <Icon name="spark" size={13} />
              全屏鉴赏
            </button>
          )}

          {onDeletePhoto && (
            <button
              className="an-remove-btn"
              onClick={() => {
                if (window.confirm(`确定要从相册图库中移除作品「${currentWork?.filename}」吗？`)) {
                  onDeletePhoto(currentWork.id);
                }
              }}
              title="从当前图库中移除这件作品"
              style={{ height: '28px', padding: '0 10px', fontSize: '11px' }}
            >
              <Icon name="trash" size={12} />
              移除作品
            </button>
          )}
        </div>
      </div>

      {/* Main Exhibition Stage Area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Central Stage Canvas */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, #121414 0%, #080808 100%)',
            overflow: 'hidden'
          }}
        >
          {/* Work Render (Video or Image) */}
          {isVideo ? (
            <video
              key={currentWork.id}
              src={currentWork.uri}
              controls
              autoPlay
              loop
              playsInline
              style={{
                maxWidth: '92%',
                maxHeight: '86%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.2)'
              }}
            />
          ) : (
            <img
              key={currentWork.id}
              src={currentWork.uri}
              alt={currentWork.filename}
              style={{
                maxWidth: '92%',
                maxHeight: '86%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.2)',
                userSelect: 'none'
              }}
            />
          )}

          {/* Navigation Stage Arrows (Previous / Next) */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="上一件作品"
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(20, 22, 22, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 5
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(172, 224, 207, 0.2)';
                  e.currentTarget.style.borderColor = '#ace0cf';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(20, 22, 22, 0.65)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                onClick={handleNext}
                aria-label="下一件作品"
                style={{
                  position: 'absolute',
                  right: showDetails ? '360px' : '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(20, 22, 22, 0.65)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 5
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(172, 224, 207, 0.2)';
                  e.currentTarget.style.borderColor = '#ace0cf';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(20, 22, 22, 0.65)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Right Stage Work Description & EXIF Panel */}
        {showDetails && (
          <aside
            style={{
              width: '340px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 16, 16, 0.95)',
              backdropFilter: 'blur(16px)',
              padding: '24px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>
                WORK IDENTIFIER 作品档案
              </div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#f3f4f4',
                  margin: '0 0 8px',
                  wordBreak: 'break-all'
                }}
              >
                {currentWork.filename}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: '#bbb' }}>
                  {isVideo ? '🎬 视频作品' : '📷 摄影原片'}
                </span>
                {currentWork.folderName && (
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(172, 224, 207, 0.1)', color: '#ace0cf' }}>
                    📁 {currentWork.folderName}
                  </span>
                )}
              </div>
            </div>

            {/* Time & Location */}
            <div
              style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>拍摄时刻与地理空间</div>
              <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ace0cf' }}>📅</span> {dateDisplay}
              </div>
              <div style={{ fontSize: '13px', color: currentWork.location?.city ? '#e0e0e0' : '#777', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ace0cf' }}>📍</span> {locationDisplay}
              </div>
            </div>

            {/* Authentic EXIF Optical Blueprint */}
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>
                OPTICAL EXIF 光学参数
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#777' }}>光圈 APERTURE</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f0', marginTop: '2px' }}>{apertureDisplay}</div>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#777' }}>快门 SHUTTER</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f0', marginTop: '2px' }}>{shutterDisplay}</div>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#777' }}>感光度 ISO</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f0', marginTop: '2px' }}>{isoDisplay}</div>
                </div>

                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '10px', color: '#777' }}>焦距 FOCAL</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f0f0', marginTop: '2px' }}>{focalDisplay}</div>
                </div>
              </div>

              {/* Hardware Device */}
              <div style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '10px', color: '#777' }}>相机机型 HARDWARE</div>
                <div style={{ fontSize: '12.5px', color: '#e0e0e0', marginTop: '2px' }}>{cameraDisplay}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{lensDisplay}</div>
              </div>
            </div>

            {/* Resolution & Dimensions */}
            <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
              尺寸：{currentWork.width || '1920'} × {currentWork.height || '1080'}
              {currentWork.sizeBytes ? ` · ${(currentWork.sizeBytes / (1024 * 1024)).toFixed(2)} MB` : ''}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnails */}
      <div
        style={{
          height: '76px',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          background: 'rgba(11, 12, 12, 0.95)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '8px',
          overflowX: 'auto',
          zIndex: 10
        }}
      >
        {photos.map((item, idx) => {
          const isSelected = idx === activeIdx;
          const itemIsVideo = item.mediaType === 'video' || /\.(mp4|mov|webm|m4v|mkv)$/i.test(item.filename);

          return (
            <div
              key={item.id}
              onClick={() => setActiveIdx(idx)}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: '58px',
                height: '58px',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected ? '2px solid #ace0cf' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isSelected ? '0 0 12px rgba(172, 224, 207, 0.45)' : 'none',
                opacity: isSelected ? 1 : 0.6,
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s ease'
              }}
            >
              {itemIsVideo ? (
                <div style={{ width: '100%', height: '100%', background: '#1c1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px' }}>🎬</span>
                </div>
              ) : (
                <img
                  src={item.uri}
                  alt={item.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {itemIsVideo && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    fontSize: '9px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#ace0cf',
                    padding: '1px 3px',
                    borderRadius: '2px'
                  }}
                >
                  ▶
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
