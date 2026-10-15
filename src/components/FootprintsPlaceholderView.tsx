import React from 'react';
import { PhotoItem } from '../types/photo';

interface FootprintsPlaceholderViewProps {
  photos: PhotoItem[];
}

export const FootprintsPlaceholderView: React.FC<FootprintsPlaceholderViewProps> = ({ photos }) => {
  const locatedCount = photos.filter(p => Boolean(p.location?.city || p.location?.placeName || (p.location?.latitude && p.location?.longitude))).length;
  const unlocatedCount = photos.length - locatedCount;

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
      <div
        className="glass"
        style={{
          padding: '60px 32px',
          borderRadius: '24px',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(172, 224, 207, 0.08), transparent 70%), rgba(22, 23, 23, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Radar pulsing ring */}
        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 24px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(172, 224, 207, 0.15)',
            border: '1px solid #c098dbff',
            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
          }} />
          <div style={{
            position: 'absolute',
            inset: '18px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #c0ace0ff, #9975bfff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            boxShadow: '0 0 30px rgba(172, 224, 207, 0.5)'
          }}>
            📍
          </div>
        </div>

        <h1 style={{ margin: '0 0 12px', fontSize: '32px', fontWeight: 600, color: '#f4f4f1' }}>
          足迹空间 · 功能开发中
        </h1>
        <p style={{ margin: '0 auto 32px', maxWidth: '560px', fontSize: '14px', lineHeight: 1.6, color: '#a5a6a1' }}>
          基于真实 GPS 经纬度将作品在离线矢量地图上聚集呈现，城市与微缩地点以光点呼吸联动。没有 GPS 的作品将自动单独归入「未定位」，绝不伪造坐标。
        </p>

        {/* Current status pill band */}
        <div style={{
          display: 'inline-flex',
          gap: '24px',
          padding: '14px 28px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>已定位作品</span>
            <strong style={{ fontSize: '18px', color: '#ace0cf' }}>{locatedCount} 件</strong>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>未定位作品</span>
            <strong style={{ fontSize: '18px', color: '#e6cf98' }}>{unlocatedCount} 件</strong>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>状态</span>
            <strong style={{ fontSize: '14px', color: '#aaa', lineHeight: '24px' }}>建设中 · 敬请期待</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
