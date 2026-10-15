import React, { useState, useMemo } from 'react';
import { PhotoItem, FolderAssetSource } from '../types/photo';
import { Icon } from './neural/icons';
import { pickFolderOrFiles } from '../services/folderImporter.web';

interface CatalogManagerViewProps {
  folders: FolderAssetSource[];
  photos: PhotoItem[];
  onImportFolder: () => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onAppendToFolder: (folderId: string, newPhotos: PhotoItem[]) => void;
  onRemoveFolder: (folderId: string) => void;
  onOpenViewer: (photos: PhotoItem[], index: number) => void;
}

export const CatalogManagerView: React.FC<CatalogManagerViewProps> = ({
  folders,
  photos,
  onImportFolder,
  onRenameFolder,
  onAppendToFolder,
  onRemoveFolder,
  onOpenViewer
}) => {
  // Drilldown state
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<{ id: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const activeFolder = useMemo(() => {
    return folders.find(f => f.id === activeFolderId) || null;
  }, [folders, activeFolderId]);

  // Photos belonging to the active folder
  const activeFolderPhotos = useMemo(() => {
    if (!activeFolder) return [];
    return photos.filter(p => p.folderId === activeFolder.id || p.folderName === activeFolder.name);
  }, [photos, activeFolder]);

  // Filtered photos by search inside active folder
  const filteredActiveFolderPhotos = useMemo(() => {
    if (!searchQuery.trim()) return activeFolderPhotos;
    const q = searchQuery.toLowerCase();
    return activeFolderPhotos.filter(p =>
      p.filename.toLowerCase().includes(q) ||
      p.exif?.model?.toLowerCase().includes(q) ||
      p.location?.city?.toLowerCase().includes(q)
    );
  }, [activeFolderPhotos, searchQuery]);

  // Append photos to active or targeted folder
  const handlePickAppend = async (folder: FolderAssetSource) => {
    try {
      const res = await pickFolderOrFiles({
        targetFolderId: folder.id,
        targetFolderName: folder.name,
        directoryMode: false // Allow picking multiple files or directories to append
      });
      if (res && res.photos.length > 0) {
        onAppendToFolder(folder.id, res.photos);
      }
    } catch (err) {
      console.warn('Append to folder failed:', err);
    }
  };

  const handleStartRename = (folder: FolderAssetSource) => {
    setRenamingFolder({ id: folder.id, name: folder.name });
    setRenameInput(folder.name);
  };

  const handleConfirmRename = () => {
    if (renamingFolder && renameInput.trim()) {
      onRenameFolder(renamingFolder.id, renameInput.trim());
      setRenamingFolder(null);
      setRenameInput('');
    }
  };

  // If in Drilldown Detail View
  if (activeFolder) {
    return (
      <div className="catalog-detail-page" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '90px' }}>
        {/* Detail Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#888' }}>
              <button
                onClick={() => { setActiveFolderId(null); setSearchQuery(''); }}
                style={{ background: 'none', border: 0, color: '#e6cf98', cursor: 'pointer', padding: 0, fontSize: '13px' }}
              >
                ‹ 全部逻辑影集
              </button>
              <span>/</span>
              <span style={{ color: '#ccc' }}>{activeFolder.name}</span>
            </div>

            <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 600, color: '#f4f4f1' }}>
              📁 {activeFolder.name}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#a5a6a1' }}>
              共 {activeFolderPhotos.length} 件作品（包含 {activeFolderPhotos.filter(p => p.mediaType === 'video').length} 个视频）· 路径: {activeFolder.path}
            </p>
          </div>

          {/* Action buttons for this folder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="pill primary"
              onClick={() => handlePickAppend(activeFolder)}
              title="向当前影集追加新作品"
            >
              <Icon name="plus" size={14} />
              追加作品 <em>Append</em>
            </button>
            <button
              className="pill"
              onClick={() => handleStartRename(activeFolder)}
            >
              重命名 <em>Rename</em>
            </button>
            <button
              className="pill danger"
              onClick={() => {
                if (window.confirm(`确定要从图库索引中移出影集「${activeFolder.name}」吗？（不会删除硬盘本地原文件）`)) {
                  onRemoveFolder(activeFolder.id);
                  setActiveFolderId(null);
                }
              }}
            >
              <Icon name="trash" size={13} />
              移出图库 <em>Remove</em>
            </button>
          </div>
        </header>

        {/* Search Bar inside folder */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            maxWidth: '380px',
            width: '100%'
          }}>
            <span style={{ position: 'absolute', left: '12px', color: '#777' }}>
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`在「${activeFolder.name}」中搜索文件名、机型或地点...`}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 14px 0 36px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: '#888' }}>
            当前展示：{filteredActiveFolderPhotos.length} / {activeFolderPhotos.length} 件
          </span>
        </div>

        {/* Gallery Grid inside folder */}
        {filteredActiveFolderPhotos.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#888' }}>
            <p>该影集中暂无匹配作品</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '14px'
          }}>
            {filteredActiveFolderPhotos.map((item, idx) => {
              const isVideo = item.mediaType === 'video';
              return (
                <div
                  key={item.id}
                  onClick={() => onOpenViewer(filteredActiveFolderPhotos, idx)}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#161717',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.borderColor = 'rgba(230,207,152,0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <img
                    src={item.uri}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {isVideo && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(230,207,152,0.4)',
                      color: '#e6cf98',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      ▶ {item.duration ? `${item.duration}s` : 'VIDEO'}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '20px 10px 8px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                    fontSize: '11px',
                    color: '#ccc',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.filename}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Folders Overview Grid View
  return (
    <div className="catalog-overview-page" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '90px' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <p className="eyebrow">CATALOG · 来源视角 <span>应用管理的逻辑影集</span></p>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 600, color: '#f4f4f1' }}>
            导入目录与集合管理
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#a5a6a1' }}>
            共 {folders.length} 个逻辑影集 · 收录 {photos.length} 件摄影与视频作品 · 移除仅解除图库索引，绝不删除本地文件
          </p>
        </div>

        <button className="pill primary" onClick={onImportFolder}>
          <Icon name="plus" size={14} />
          导入新影集 <em>Import Folder</em>
        </button>
      </header>

      {/* Folders Bento Grid */}
      {folders.length === 0 ? (
        <div style={{
          padding: '80px 24px',
          textAlign: 'center',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '8px' }}>暂未添加任何影集</p>
          <p style={{ fontSize: '13px', color: '#777', marginBottom: '20px' }}>
            点击上方「导入新影集」，选择电脑或 SD 卡中的图片与视频文件夹开始建立图库。
          </p>
          <button className="pill primary" onClick={onImportFolder}>
            <Icon name="plus" size={14} />
            导入首个文件夹
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {folders.map(folder => {
            const folderPhotos = photos.filter(p => p.folderId === folder.id || p.folderName === folder.name);
            const coverPhoto = folderPhotos[0] || null;
            const videoCount = folderPhotos.filter(p => p.mediaType === 'video').length;

            return (
              <div
                key={folder.id}
                className="glass"
                style={{
                  borderRadius: '16px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'linear-gradient(160deg, rgba(38,39,39,0.5), rgba(15,16,16,0.7))',
                  transition: 'border-color 0.2s, transform 0.2s'
                }}
              >
                <div>
                  {/* Top Row: Folder Icon & Count */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px' }}>📁</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f4f4f1' }}>
                          {folder.name}
                        </h3>
                        <span style={{ fontSize: '11px', color: '#777', fontFamily: 'monospace' }}>
                          {folder.path}
                        </span>
                      </div>
                    </div>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: 'rgba(230,207,152,0.1)',
                      border: '1px solid rgba(230,207,152,0.25)',
                      color: '#e6cf98',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {folderPhotos.length} 件
                    </span>
                  </div>

                  {/* Thumbnail Preview Strip */}
                  <div
                    onClick={() => setActiveFolderId(folder.id)}
                    style={{
                      height: '110px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#121313',
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {coverPhoto ? (
                      <img
                        src={coverPhoto.uri}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '12px', color: '#555' }}>空影集</span>
                    )}

                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
                    >
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '999px',
                        background: '#e6cf98',
                        color: '#111',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        进入查看影集
                      </span>
                    </div>
                  </div>

                  {/* Meta note */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11.5px', color: '#888' }}>
                    <span>
                      {videoCount > 0 ? `含 ${videoCount} 部视频 · ` : ''}
                      扫描时间: {new Date(folder.lastScannedTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    className="an-explore"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setActiveFolderId(folder.id)}
                  >
                    查看 <em>View</em>
                  </button>
                  <button
                    className="an-explore"
                    onClick={() => handlePickAppend(folder)}
                    title="追加更多作品"
                  >
                    <Icon name="plus" size={12} />追加
                  </button>
                  <button
                    className="an-explore"
                    onClick={() => handleStartRename(folder)}
                    title="重命名影集"
                  >
                    重命名
                  </button>
                  <button
                    className="an-remove-btn"
                    onClick={() => {
                      if (window.confirm(`确定要从图库中移出影集「${folder.name}」吗？（不删除原文件）`)) {
                        onRemoveFolder(folder.id);
                      }
                    }}
                    title="从图库中移出此影集"
                    style={{ padding: '0 8px' }}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename Dialog Modal */}
      {renamingFolder && (
        <div className="veil" onClick={() => setRenamingFolder(null)}>
          <div className="modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#fff' }}>重命名影集</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#888' }}>
              重命名仅更新应用内的逻辑影集名称，不会改变硬盘原文件夹路径，照片绑定稳定有效。
            </p>
            <input
              type="text"
              value={renameInput}
              onChange={e => setRenameInput(e.target.value)}
              placeholder="请输入新的影集名称"
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '20px',
                outline: 'none'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="pill ghost" onClick={() => setRenamingFolder(null)}>取消</button>
              <button className="pill primary" onClick={handleConfirmRename}>确定重命名</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
