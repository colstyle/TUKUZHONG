<h1 align="center"><img src="assets/icon.png" alt="" width="56" style="vertical-align: middle;">  图库中 (TUKUZHONG)</h1>

<p align="center">
  <strong>本地优先的多维度媒体相册与浏览工具</strong><br>
  以关系图谱为索引，以展厅为观赏舞台，统一管理与浏览个人照片与视频。
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Storage-IndexedDB_%2B_Local-green" alt="Storage">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"></a>
</p>

---

## 💡 设计理念

“图库中”以**图谱**作为索引入口，以**展厅**作为观看方式，同时通过**足迹**、**长卷**、**目录**分别提供**空间**、**时间**和**来源**三种整理维度。

入口浏览的是**同一批本地作品**，切换的是组织与查看方式。

---

## 🌟 视角

| 入口                           | 视角维度                   | 功能说明                                                                                             |
| :----------------------------- | :------------------------- | :--------------------------------------------------------------------------------------------------- |
| **🌐 图谱 (Graph)**      | **关系总览与索引**   | 作品作为核心节点，按导入目录、拍摄时间、地理城市与相机机型建立关联关系；支持基于元数据的筛选与检索。 |
| **🏛️ 展厅 (Gallery)**  | **单件观赏舞台**     | 聚焦单件作品，支持无缝前后切换、真实 EXIF 参数、视频流播放与底栏胶片传送带。                         |
| **📍 足迹 (Footprints)** | **空间地理视角**     | 汇聚具备真实 GPS 坐标的作品形成地理分布；无 GPS 作品单独归入“未定位”。                             |
| **📜 长卷 (Scroll)**     | **连续时间流**       | 按年、月时间线连续排版呈现，作品顺序与时间轴严格对齐。                                               |
| **📁 目录 (Catalog)**    | **来源与应用内影集** | 管理导入来源与应用内逻辑影集，支持目录详情、目录内搜索、重命名与作品管理。                           |

---

## ✨ 核心特性

- **100% 本地隐私安全**：纯本地运算，基于浏览器 IndexedDB 与本地存储持久化，无需上传云端。
- **真实元数据原则**：严格基于真实 EXIF 参数与地理信息，缺少信息明确显示“未知”，不伪造数据。
- **动静态媒体兼容**：支持高分辨率静态图片与常见视频格式（`.mp4`, `.mov`, `.webm` 等）本地播放。
- **跨平台支持**：支持现代 Web 浏览器与 Android / iOS 移动设备。

---

## 🚀 快速上手

### 环境要求

- **Node.js** ≥ 18.0
- **npm** 或 **yarn**

### 1. 克隆与安装

```bash
git clone https://github.com/colstyle/TUKUZHONG.git
cd TUKUZHONG
npm install
```

### 2. 启动开发

```bash
# 网页端（推荐体验）
npm run dev
# 或 npx expo start --web

# Android 端
npm run android

# iOS 端
npm run ios
```

启动后在浏览器打开 `http://localhost:8081` 即可使用。

---

## 🛠️ 技术栈

| 领域                 | 技术选型                        | 说明                                        |
| :------------------- | :------------------------------ | :------------------------------------------ |
| **核心框架**   | React Native 0.86 + Expo SDK 57 | 跨平台移动端与 Web 基础框架                 |
| **开发语言**   | TypeScript                      | 全面类型约束（`npx tsc --noEmit` 0 报错） |
| **图形与交互** | Canvas 2D / WebGL               | 关系图谱与动态渲染                          |
| **本地存储**   | IndexedDB + LocalStorage        | 媒体二进制缓存与索引持久化                  |
| **多媒体**     | HTML5 Video API + EXIF Parser   | 视频播放与摄影光学参数解析                  |

---

## 📄 开源协议

本项目遵循 [MIT License](LICENSE) 协议开源。
