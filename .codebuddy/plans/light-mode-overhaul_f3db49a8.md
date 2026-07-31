---
name: light-mode-overhaul
overview: 全面整改日间模式样式：扩展 globals.css 的 CSS 变量，补全 scrollbar/bg 装饰的亮色适配；逐一修复所有组件的硬编码暗色文本/背景/边框为同时适配亮暗模式。
todos:
  - id: fix-globals-and-nav
    content: 修复 globals.css 亮色滚动条、nav-bar 导航栏背景和文字、breadcrumb 面包屑、theme-toggle、storage-ring、view-toggle
    status: completed
  - id: fix-search-bar
    content: 修复 search-bar.tsx：搜索框、筛选按钮组、排序按钮组、上传/新建文件夹/全选按钮、文件夹名输入框的亮色样式
    status: completed
  - id: fix-file-card-row
    content: 修复 file-card.tsx 和 file-row.tsx：文件名颜色、信息文字、复选框边框、hover 状态
    status: completed
  - id: fix-context-menu
    content: 修复 context-menu.tsx：菜单背景从硬编码暗色改为响应式、菜单项文字/hover、分割线
    status: completed
  - id: fix-page-inline
    content: 修复 page.tsx 内联样式：重命名输入框、空状态提示、分页按钮、批量操作栏、统计数字
    status: completed
  - id: fix-dialogs
    content: 修复 move-dialog、batch-rename-dialog、confirm-dialog：弹窗标题/文字/背景/边框/按钮/输入框/预览表格
    status: completed
  - id: fix-previews
    content: 修复 text-preview、audio-preview、upload-progress：文本内容颜色、标题文字、底部信息、上传进度文件名
    status: completed
---

## 用户需求

全面排查并修复日间模式（亮色模式）的样式问题，使所有界面在亮色主题下清晰可读、美观协调。

## 核心问题

- **文字颜色**：大量组件使用 `text-slate-200/300/400` 等浅色文字，在亮色背景上肉眼难以辨认
- **导航栏**：顶部导航栏使用 `bg-surface-dark/60`（深色半透明），亮色模式仍是灰色
- **右键菜单**：硬编码 `bg-[#0f0f23]/95` 深色背景，亮色模式下完全是暗色风格
- **弹窗背景**：玻璃效果依赖 `bg-white/[0.03]`、`border-white/[0.06]` 等针对暗色背景的半透明色
- **复选框边框**：`border-white/30`、`bg-black/40` 在亮色背景下不可见
- **输入框/按钮**：大量使用 `bg-white/[0.03]` 等半透明白色背景

## 产品概述

在不改动暗色模式任何视觉效果的前提下，为所有组件增加 `dark:` 前缀的 Tailwind 响应式类名，使默认样式适配亮色模式。

## 技术方案

### 核心策略：Tailwind `dark:` 前缀全覆盖

项目已配置 `darkMode: "class"`，`next-themes` 在 `<html>` 上切换 `dark` / `light` class。目前所有组件未使用 `dark:` 前缀，导致样式固定为暗色模式。通过在现有类名基础上增加 `dark:` 响应式变体，即可零破坏地适配亮色模式。

### 颜色映射规则

| 元素 | 现有（暗色默认） | 亮色模式 | 修改后 |
| --- | --- | --- | --- |
| 主文字 | `text-slate-200` | `text-slate-700` | `text-slate-700 dark:text-slate-200` |
| 次要文字 | `text-slate-300` | `text-slate-600` | `text-slate-600 dark:text-slate-300` |
| 辅助文字 | `text-slate-400` | `text-slate-500` | `text-slate-500 dark:text-slate-400` |
| 弱化文字 | `text-slate-500` | `text-slate-400` | `text-slate-400 dark:text-slate-500` |
| 背景层1 | `bg-white/[0.03]` | `bg-black/[0.03]` | `bg-black/[0.03] dark:bg-white/[0.03]` |
| 背景层2 | `bg-white/[0.05]` | `bg-black/[0.05]` | `bg-black/[0.05] dark:bg-white/[0.05]` |
| 背景层hover | `hover:bg-white/[0.04]` | `hover:bg-black/[0.04]` | `hover:bg-black/[0.04] dark:hover:bg-white/[0.04]` |
| 边框 | `border-white/[0.06]` | `border-black/[0.06]` | `border-black/[0.06] dark:border-white/[0.06]` |
| 复选框 | `border-white/30` | `border-black/30` | `border-black/30 dark:border-white/30` |
| 悬浮文字 | `hover:text-slate-200` | `hover:text-slate-700` | `hover:text-slate-700 dark:hover:text-slate-200` |


### 实现细节

1. **body::before 装饰**：亮色模式下降低不透明度（globals.css 已有 `.light body::before` 规则，无需修改）
2. **glass-card**：使用 CSS 变量 `var(--glass-bg)` 和 `var(--glass-border)`，亮色模式下自动切换，无需额外处理
3. **scrollbar**：globals.css 需为亮色模式添加滚动条样式（暗色滚动条在亮色背景上突兀）
4. **nav-bar 背景**：`bg-surface-dark/60` → `bg-white/80 dark:bg-surface-dark/60`（亮色用白色毛玻璃）
5. **右键菜单**：`bg-[#0f0f23]/95` → `bg-white/95 dark:bg-[#0f0f23]/95`

### 涉及文件

共 17 个文件需要修改：

- `globals.css` — 滚动条、装饰元素
- `nav-bar.tsx` — 导航栏背景/文字/按钮
- `search-bar.tsx` — 搜索框/筛选/排序/上传/全选/新建文件夹
- `file-card.tsx` — 文件名/信息文字/复选框
- `file-row.tsx` — 文件名/信息文字/复选框
- `context-menu.tsx` — 菜单背景/文字/分割线（硬编码深色）
- `move-dialog.tsx` — 弹窗标题/面包屑/文件夹列表/底部操作
- `batch-rename-dialog.tsx` — 配置区/预览表/按钮
- `confirm-dialog.tsx` — 标题/信息/按钮
- `text-preview.tsx` — 文本内容/标题/底部
- `page.tsx` — 重命名输入/空状态/分页/批量栏/统计
- `breadcrumb.tsx` — 面包屑文字/hover
- `view-toggle.tsx` — 按钮组背景
- `upload-progress.tsx` — 文件名文字
- `theme-toggle.tsx` — 按钮背景
- `storage-ring.tsx` — 圆环背景/文字
- `audio-preview.tsx` — 少量文字