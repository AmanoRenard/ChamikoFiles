---
name: fix-ui-5-issues
overview: 修复 5 个 UI 问题：1) 添加"加入空间"入口；2) 修复三点菜单弹出位置；3) 修复宽屏端内容未填满及 logo 未贴边；4) 修复加载图标未居中的问题；5) 修复设置页加载状态的位置和滚动条问题。
todos:
  - id: fix-join-space-ui
    content: 新增 SpaceJoinDialog 组件，在 space-sidebar 底部添加「加入空间」按钮，对接 /api/spaces/join
    status: completed
  - id: fix-menu-position
    content: 修复三点菜单定位：space-sidebar 捕捉按钮坐标传参，space-settings-menu 改为动态 top/left 计算
    status: completed
  - id: fix-widescreen-layout
    content: 修复宽屏布局：nav-bar 和 page.tsx 主内容区去掉 max-w-7xl，改为全宽 padding 布局
    status: completed
  - id: fix-loading-center
    content: 修复首页加载图标居中：认证加载改 h-[calc(100vh-4rem)]，文件加载改 flex-1 + min-h-[300px] 垂直居中
    status: completed
  - id: fix-settings-loading
    content: 修复设置页加载态：去掉 pt-24，改为 min-h-[calc(100vh-4rem)] 精确居中
    status: completed
---

## 问题概述

修复当前 UI 中的 5 个体验问题：缺乏加入空间入口、三点菜单定位偏差、宽屏下内容未填满/Logo 未靠边、多处加载图标未垂直居中、设置页加载状态有滚动条。

## 核心修复

**问题 1 — 找不到在哪加入空间**
用户拿到邀请码后无处输入。在左侧空间侧边栏底部「创建共享空间」按钮下方新增「加入空间」按钮，点击弹出对话框输入邀请码，调用已有的 `/api/spaces/join` 接口加入，成功后刷新空间列表并自动切换至新空间。

**问题 2 — 三点菜单弹出位置对不上**
目前菜单使用 `top: "30%"` 硬编码位置，完全不对齐触发按钮。改为通过 `getBoundingClientRect()` 动态获取按钮屏幕坐标，传递给 `SpaceSettingsMenu`，菜单基于按钮实际位置弹出。

**问题 3 — 宽屏端内容填不满且 Logo 不在最边上**
NavBar 和主内容区都用了 `max-w-7xl mx-auto` 容器限制宽度。改为全宽布局：NavBar 内部直接 `px-4 lg:px-6`，主内容区去掉 `max-w-7xl` 只保留 padding，让内容充分利用宽屏空间。

**问题 4 — 加载图标不在中间**
首页认证加载态和文件加载态的图标均未正确垂直居中：认证加载用 `min-h-[calc(100vh-4rem)]` 但父容器是 flex 布局导致不精确；文件加载用 `py-20` 仅加内边距而非真实居中。统一改为 `h-full flex items-center justify-center` 模式。

**问题 5 — 设置页加载图标不在正中且有滚动条**
设置页加载态用了 `max-w-2xl mx-auto px-4 py-8 pt-24`，`pt-24` 导致内容偏下且有固定高度，产生多余滚动条。改为 `min-h-[calc(100vh-4rem)] flex items-center justify-center`，与首页认证加载保持一致。

## 技术方案

### 修复 1：新增加入空间功能

**新建文件**：`src/components/space-join-dialog.tsx`

- 参考 `SpaceInviteDialog` 结构，Modal 内包含邀请码输入框和「加入」按钮
- 调用 `POST /api/spaces/join`，body 为 `{ code }`
- 成功后触发 `onJoined` 回调，由侧边栏刷新空间列表

**修改文件**：`src/components/space-sidebar.tsx`

- 在底部「创建共享空间」按钮下方新增「加入空间」按钮（Always enabled，所有人都能点）
- 新增 `joinDialogOpen` state 控制 `SpaceJoinDialog` 显隐
- 加入成功后调用 `onSpaceUpdated()` 刷新列表

### 修复 2：三点菜单动态定位

**修改文件**：`src/components/space-sidebar.tsx`

- 三点按钮 `onClick` 中通过 `e.currentTarget.getBoundingClientRect()` 获取按钮坐标
- 将 `{ x, y }` 坐标存入 state 传递给 `SpaceSettingsMenu`

**修改文件**：`src/components/space-settings-menu.tsx`

- 新增 `anchorRect?: { x: number; y: number }` prop
- 移除硬编码 `top: "30%", left: "calc(220px + 1rem)"`
- 改用 `top: anchorRect.y + offset`, `left: anchorRect.x + offset` 动态计算
- 加边界检测避免溢出屏幕

### 修复 3：宽屏全宽布局

**修改文件**：`src/components/nav-bar.tsx`

- 第 45 行 `max-w-7xl mx-auto` → 仅保留 `px-4 sm:px-6 lg:px-6`，Logo 自动靠左
- 右侧按钮组保持 `items-center justify-between`，自然靠右

**修改文件**：`src/app/page.tsx`

- 第 616 行 `max-w-7xl mx-auto px-3...` → `px-4 sm:px-6 lg:px-8 py-3 sm:py-5`（去掉 max-w-7xl mx-auto）

### 修复 4：加载图标居中

**修改文件**：`src/app/page.tsx`

- 第 567 行认证加载：`min-h-[calc(100vh-4rem)]` → `h-[calc(100vh-4rem)]`（固定高度确保精确居中）
- 第 691 行文件加载：`py-20` → `flex-1 flex items-center justify-center min-h-[300px]`

### 修复 5：设置页加载居中

**修改文件**：`src/app/settings/page.tsx`

- 第 79 行：`max-w-2xl mx-auto px-4 py-8 pt-24 flex items-center justify-center` → `min-h-[calc(100vh-4rem)] flex items-center justify-center`