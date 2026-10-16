import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { PhotoItem, FolderAssetSource } from '../../types/photo';
import { JourneyCluster } from '../../types/journey';
import { buildPhotoGraph, forceLayout, stats, GraphData, GraphNode } from './photoGraph';
import { Home } from './Home';
import { Icon } from './icons';
import { T } from './theme';
import { ExhibitionStageView } from '../ExhibitionStageView';
import { ChronicleScrollView } from '../ChronicleScrollView';
import { FootprintsPlaceholderView } from '../FootprintsPlaceholderView';
import { CatalogManagerView } from '../CatalogManagerView';

// Import neural CSS directly
import './neural.css';

interface NeuralDashboardProps {
  photos: PhotoItem[];
  folders: FolderAssetSource[];
  journeys?: JourneyCluster[];
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onImportFolder: () => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onAppendToFolder: (folderId: string, newPhotos: PhotoItem[]) => void;
  onRemoveFolder: (folderId: string) => void;
  onRemovePhoto: (photoId: string) => void;
  filterScreenshots: boolean;
  onToggleFilterScreenshots: () => void;
  onOpenViewer: (photos: PhotoItem[], index?: number) => void;
}

// Five Core Architectural Perspectives
const navs = [
  ['graph', '图谱', 'Graph'],
  ['gallery', '展厅', 'Gallery'],
  ['locations', '足迹', 'Footprints'],
  ['scroll', '长卷', 'Scroll'],
  ['folders', '目录', 'Catalog']
];

export const NeuralDashboard: React.FC<NeuralDashboardProps> = ({
  photos,
  folders,
  journeys = [],
  activeTab,
  onSelectTab,
  onImportFolder,
  onRenameFolder,
  onAppendToFolder,
  onRemoveFolder,
  onRemovePhoto,
  filterScreenshots,
  onToggleFilterScreenshots,
  onOpenViewer
}) => {
  const [focus, setFocus] = useState<{ mod: string | null; sel: string | null }>({ mod: null, sel: null });
  const [modal, setModal] = useState<string | null>(null);

  // Gallery view state for drilldown from graph/locations/camera
  const [galleryInitialIdx, setGalleryInitialIdx] = useState(0);
  const [galleryFilteredPhotos, setGalleryFilteredPhotos] = useState<PhotoItem[] | null>(null);

  // Build reactive graph from photos, folders
  const graph: GraphData = useMemo(() => {
    return buildPhotoGraph({ photos, folders, journeys });
  }, [photos, folders, journeys]);

  const layout = useMemo(() => {
    return forceLayout(graph);
  }, [graph]);

  const s = useMemo(() => stats(graph), [graph]);

  // Action dispatcher for graph interactions
  const onAction = useCallback((action: any) => {
    if (!action) return;
    if (action.type === 'viewPhoto' && action.photo) {
      const idx = photos.findIndex(p => p.id === action.photo.id);
      setGalleryInitialIdx(Math.max(0, idx));
      setGalleryFilteredPhotos(null);
      onSelectTab('gallery');
    } else if (action.type === 'viewFolder' && action.folder) {
      onSelectTab('folders');
    } else if (action.type === 'filterGallery') {
      if (action.filterType === 'location') {
        const isUnlocated = action.value === '未定位';
        const matched = photos.filter(p => isUnlocated ? (!p.location?.city && !p.location?.placeName) : (p.location?.city === action.value || p.location?.placeName === action.value));
        setGalleryFilteredPhotos(matched.length > 0 ? matched : null);
      } else if (action.filterType === 'camera') {
        const matched = photos.filter(p => p.exif?.model === action.value);
        setGalleryFilteredPhotos(matched.length > 0 ? matched : null);
      }
      setGalleryInitialIdx(0);
      onSelectTab('gallery');
    } else if (action.type === 'removePhoto' && action.photoId) {
      onRemovePhoto(action.photoId);
      setFocus({ mod: null, sel: null });
    } else if (action.type === 'removeFolder' && action.folderId) {
      onRemoveFolder(action.folderId);
      setFocus({ mod: null, sel: null });
    } else if (action.type === 'page') {
      onSelectTab(action.page);
    }
  }, [photos, onSelectTab, onRemovePhoto, onRemoveFolder]);

  return (
    <div className={`neural page-${activeTab}`}>
      {/* Sleek Dark Topbar */}
      <header className="topbar">
        <a
          className="brand"
          href="#home"
          onClick={e => {
            e.preventDefault();
            onSelectTab('graph');
            setFocus({ mod: null, sel: null });
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 28" width="18" height="21">
              <path fill={T.logo[0]} d="m14 1 8 7-2 12-7 7-10-5L1 12 8 4Z" />
              <path fill={T.logo[1]} d="m14 1-3 10 2 16 7-7 2-12Z" />
              <path fill={T.logo[2]} d="m14 1-3 10 11-3Z" />
              <path fill={T.logo[3]} d="m1 12 10-1 2 16-10-5Z" />
            </svg>
          </span>
          <span className="brand-text">
            图库中 <b>/ TUKUZHONG</b>
          </span>
        </a>

        {/* Central Segmented Navigator: 5 Core Perspectives */}
        <nav aria-label="主导航">
          {navs.map(([id, zh, en]) => (
            <button
              key={id}
              className={activeTab === id ? 'active' : ''}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => {
                onSelectTab(id);
                if (id === 'graph') {
                  setFocus({ mod: null, sel: null });
                }
                if (id === 'gallery') {
                  setGalleryFilteredPhotos(null);
                }
              }}
            >
              {zh}<em>{en}</em>
            </button>
          ))}
        </nav>

        {/* Top Actions */}
        <div className="top-actions">
          <button
            className={`pill ${filterScreenshots ? 'primary' : 'ghost'}`}
            onClick={onToggleFilterScreenshots}
            title={filterScreenshots ? '已过滤截图杂质' : '不过滤截图'}
          >
            <Icon name="spark" size={14} />
            {filterScreenshots ? '已去杂质' : '包含截图'} <em>{filterScreenshots ? 'Clean' : 'Raw'}</em>
          </button>
          <button className="pill primary" onClick={onImportFolder}>
            <Icon name="plus" size={14} />
            导入作品 <em>Import</em>
          </button>
          <button
            className="avatar"
            onClick={() => setModal('about')}
            aria-label="查看图库架构理念"
          >
            <img src="/avatar.svg" alt="" onError={e => { (e.currentTarget as any).style.display = 'none'; }} />
          </button>
        </div>
      </header>

      {/* Main View Area: 5 Core Perspectives */}
      <main style={{ position: 'relative', width: '100%', height: 'calc(100vh - 58px)', overflow: activeTab === 'graph' || activeTab === 'gallery' ? 'hidden' : 'auto' }}>
        {activeTab === 'graph' ? (
          /* 1. 图谱：作品关系总览与索引入口 */
          <Home
            graph={graph}
            layout={layout}
            focus={focus}
            setFocus={setFocus}
            onAction={onAction}
            onAbout={() => setModal('about')}
          />
        ) : activeTab === 'gallery' ? (
          /* 2. 展厅：单件作品舞台，照片与视频完整呈现与播放 */
          <ExhibitionStageView
            photos={galleryFilteredPhotos || photos}
            currentIndex={galleryInitialIdx}
            onOpenViewer={onOpenViewer}
            onDeletePhoto={onRemovePhoto}
            onImportNew={onImportFolder}
          />
        ) : activeTab === 'locations' ? (
          /* 3. 足迹：空间视角（提示功能开发中，区分已定位与未定位） */
          <div className="page" style={{ paddingTop: '20px' }}>
            <FootprintsPlaceholderView photos={photos} />
          </div>
        ) : activeTab === 'scroll' ? (
          /* 4. 长卷：时间叙事视角（年月章节、节奏排版、严格同步浏览顺序） */
          <div className="page" style={{ paddingTop: '20px' }}>
            <ChronicleScrollView photos={photos} onOpenViewer={onOpenViewer} />
          </div>
        ) : (
          /* 5. 目录：来源与逻辑影集管理页（详情、搜索、重命名、追加、安全移除） */
          <div className="page" style={{ paddingTop: '20px' }}>
            <CatalogManagerView
              folders={folders}
              photos={photos}
              onImportFolder={onImportFolder}
              onRenameFolder={onRenameFolder}
              onAppendToFolder={onAppendToFolder}
              onRemoveFolder={onRemoveFolder}
              onOpenViewer={onOpenViewer}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="site-foot">
        <button onClick={() => setModal('about')}>
          <Icon name="info" size={13} />
          图库：导入{folders.length} 个目录 ·{photos.length} 件作品·  {s.locations} 个足迹
        </button>
        <span>
          Deepening by Tianyu<em>·Version1.0</em>
        </span>
      </footer>

      {/* About Modal */}
      {modal === 'about' && (
        <div className="veil" onClick={() => setModal(null)}>
          <section className="modal glass" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <header>
              <h2>“图库中”设计理念</h2>
              <button className="icon-btn" onClick={() => setModal(null)} aria-label="关闭弹窗">
                <Icon name="close" size={16} />
              </button>
            </header>
            <div className="about">
              <p>名称：<strong>图库中 (TUKUZHONG)</strong> · 模式：记忆图谱相册</p>
              <p>核心理念：以图谱作为索引入口，以展厅作为观看方式。足迹、长卷、目录，分别提供空间、时间和来源三种整理照片的视角。五个入口查看的是同一批作品，切换的是组织和浏览方式。</p>
              <hr />
              <h3>五个视角 <em>Five Unified Perspectives</em></h3>
              <ul>
                <li><b>图谱 (Graph)</b>：作品关系总览。照片是核心节点，按导入目录、拍摄时间、城市和相机型号建立关联关系，缺少元数据明确显示“未知”。提供快速检索与筛选入口。</li>
                <li><b>展厅 (Gallery)</b>：主要观赏体验。以单件作品为舞台，提供上一件/下一件、作品说明、拍摄日期与真实 EXIF；照片和视频在同一套流程中播放与观看。</li>
                <li><b>足迹 (Footprints)</b>：空间聚集视角。未定位照片单独归入“未定位”，不混入地图（当前版本显示“功能开发中”）。</li>
                <li><b>长卷 (Scroll)</b>：可连续阅读的时间叙事。以年、月作为章节骨架，节奏排版，点开前后浏览顺序与长卷完全一致。</li>
                <li><b>目录 (Catalog)</b>：导入来源和应用内逻辑影集管理。支持详情查看、作品搜索、重命名、向目录追加作品以及安全移除索引（不删除原文件）。</li>
              </ul>
              <p className="quiet">纯本地运行，不上传云端，保障个人数字资产绝对安全。</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
