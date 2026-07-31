---
name: chamiko-cloud-drive
overview: 基于 Next.js 构建轻量化私人网盘网站，支持文件/图片上传、批量拖拽上传、文件管理、配置化存储路径，采用现代化美观 UI 设计，无需登录。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Glassmorphism
    - Dark Gradient
    - Frosted Glass
    - Modern
    - Premium
    - Smooth Animation
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 28px
      weight: 700
    subheading:
      size: 16px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#6366F1"
      - "#8B5CF6"
      - "#A78BFA"
      - "#06B6D4"
    background:
      - "#0F0B1E"
      - "#1A1530"
      - "#F8FAFC"
      - "#FFFFFF"
    text:
      - "#F1F5F9"
      - "#CBD5E1"
      - "#1E293B"
      - "#475569"
    functional:
      - "#22C55E"
      - "#EF4444"
      - "#F59E0B"
      - "#3B82F6"
todos:
  - id: init-project
    content: 初始化 Next.js 14 项目，安装 Tailwind CSS、shadcn/ui、Framer Motion、formidable、Lucide React 等依赖，配置 tsconfig 和 next.config
    status: completed
  - id: config-module
    content: 实现 config.ini 读写模块、文件工具函数、类型定义和全局样式（Glassmorphism 主题 + 暗色模式 CSS 变量）
    status: completed
    dependencies:
      - init-project
  - id: api-routes
    content: 实现所有 API 路由：文件上传（支持批量）、文件列表（分页+搜索+排序）、文件删除、文件下载、配置读写、存储统计
    status: completed
    dependencies:
      - config-module
  - id: ui-components
    content: 构建 shadcn/ui 基础组件并实现核心业务组件：上传区域、上传进度、文件卡片/行、图片预览灯箱、存储环形指示器、搜索栏、视图切换、导航栏、主题切换、确认弹窗
    status: completed
    dependencies:
      - init-project
  - id: main-page
    content: 构建首页文件浏览器，整合上传、文件展示（网格/列表）、搜索排序、删除下载、存储监控全功能，含 Framer Motion 动画
    status: completed
    dependencies:
      - api-routes
      - ui-components
  - id: settings-page
    content: 构建设置页面，表单编辑存储路径、空间上限、允许文件类型等参数，调用配置 API 持久化到 config.ini
    status: completed
    dependencies:
      - api-routes
      - ui-components
  - id: polish-deploy
    content: 整体打磨：响应式适配、亮暗主题切换、Toast 通知、边缘情况处理、最终测试验证
    status: completed
    dependencies:
      - main-page
      - settings-page
---

## 产品概述

ChamikoFiles 是一款私人轻量化网盘网站，运行在个人电脑或服务器上，无需登录即可通过浏览器直观地管理本地文件夹中的文件。界面采用毛玻璃现代风格，支持拖拽/批量上传、图片预览、文件排序搜索、存储空间监控等核心功能。

## 核心功能

- **文件上传**：支持点击上传、拖拽上传、批量多文件上传，实时显示上传进度条
- **文件浏览**：网格视图与列表视图自由切换，展示文件缩略图（图片）、文件名、大小、修改日期
- **图片预览**：点击图片文件弹出全屏灯箱预览，支持左右切换浏览
- **文件操作**：支持文件下载、删除（带确认弹窗）
- **搜索与排序**：按文件名模糊搜索，按名称/大小/日期排序
- **存储空间监控**：顶部展示存储空间使用情况环形进度条，显示已用/总容量
- **设置页面**：可配置存储路径、空间上限、允许的文件类型等参数，持久化到 config.ini
- **响应式设计**：完美适配桌面端和移动端浏览器
- **暗色模式**：支持明暗主题切换

## 技术选型

- **框架**：Next.js 14 (App Router) + TypeScript
- **样式**：Tailwind CSS + shadcn/ui 组件库
- **动画**：Framer Motion
- **文件上传**：formidable（服务端解析 multipart/form-data）
- **图标**：Lucide React
- **配置存储**：自定义 INI 文件解析器，读写项目根目录 config.ini
- **缩略图**：图片文件使用 `<img>` 直接展示，其他文件根据扩展名显示对应图标
- **部署**：支持 `npm run dev` 本地开发或 `npm run build && npm start` 生产运行

## 实现方案

### 整体策略

采用 Next.js 全栈架构 —— API Routes 处理所有文件服务端操作（上传、列表、删除、下载），React Server Component 作为页面骨架，Client Component 处理交互逻辑。配置文件在服务端读写，通过 API 暴露给前端。

### 关键设计决策

1. **为什么用 formidable 而非 multer**：Next.js App Router 的 Route Handler 基于 Web API Request，formidable 可通过自定义解析适配，且对 Windows 路径兼容性更好
2. **配置热更新**：设置页修改配置后，服务端立即重读 `config.ini`，无需重启服务
3. **上传分块策略**：文件小于 50MB 直接上传；大于 50MB 不做分片（私人网盘场景极少大文件），但前端用 `fetch` + `ReadableStream` 显示真实进度
4. **缩略图策略**：图片文件直接用 `<img>` 标签加载原始图片作为缩略图，通过 CSS 控制尺寸，避免生成额外缩略图文件占用空间

### 性能考量

- 文件列表 API 每次扫描目录获取文件元数据，文件数量 < 10000 时性能无瓶颈
- 大目录读取做分页处理，每页 50 条
- 图片预览使用原生 `<img>` 懒加载，不预生成缩略图
- API 响应启用 gzip 压缩（Next.js 默认）

### 目录结构

```
ChamikoFiles/
├── config.ini                    # [NEW] 配置文件，用户可编辑
├── next.config.js                # [NEW] Next.js 配置
├── tailwind.config.ts            # [NEW] Tailwind 配置
├── tsconfig.json                 # [NEW] TypeScript 配置
├── package.json                  # [NEW] 项目依赖
├── postcss.config.mjs            # [NEW] PostCSS 配置
├── src/
│   ├── app/
│   │   ├── layout.tsx            # [NEW] 根布局，Providers 包裹，暗色模式支持
│   │   ├── page.tsx              # [NEW] 首页 - 文件浏览器主页面
│   │   ├── globals.css           # [NEW] 全局样式 + Tailwind 指令
│   │   ├── settings/
│   │   │   └── page.tsx          # [NEW] 设置页面 - 配置编辑表单
│   │   └── api/
│   │       ├── files/
│   │       │   ├── upload/
│   │       │   │   └── route.ts  # [NEW] POST 上传文件 API
│   │       │   ├── list/
│   │       │   │   └── route.ts  # [NEW] GET 文件列表 API
│   │       │   ├── delete/
│   │       │   │   └── route.ts  # [NEW] DELETE 删除文件 API
│   │       │   └── download/
│   │       │       └── route.ts  # [NEW] GET 下载文件 API
│   │       ├── config/
│   │       │   └── route.ts      # [NEW] GET/PUT 配置读写 API
│   │       └── storage/
│   │           └── route.ts      # [NEW] GET 存储空间统计 API
│   ├── components/
│   │   ├── ui/                   # [NEW] shadcn/ui 基础组件（button, dialog, input, progress, select, toast, toggle, tooltip）
│   │   ├── upload-zone.tsx       # [NEW] 拖拽上传区域组件
│   │   ├── upload-progress.tsx   # [NEW] 上传进度条组件
│   │   ├── file-grid.tsx         # [NEW] 文件网格视图组件
│   │   ├── file-list.tsx         # [NEW] 文件列表视图组件
│   │   ├── file-card.tsx         # [NEW] 单个文件卡片（网格模式用）
│   │   ├── file-row.tsx          # [NEW] 单个文件行（列表模式用）
│   │   ├── image-preview.tsx     # [NEW] 图片全屏灯箱预览
│   │   ├── storage-ring.tsx      # [NEW] 存储空间环形进度指示器
│   │   ├── search-bar.tsx        # [NEW] 搜索与排序工具栏
│   │   ├── view-toggle.tsx       # [NEW] 网格/列表视图切换按钮
│   │   ├── nav-bar.tsx           # [NEW] 顶部导航栏
│   │   ├── theme-toggle.tsx      # [NEW] 暗色模式切换按钮
│   │   └── confirm-dialog.tsx    # [NEW] 删除确认弹窗
│   ├── lib/
│   │   ├── config.ts             # [NEW] config.ini 读写工具
│   │   ├── file-utils.ts         # [NEW] 文件工具函数（格式化大小、获取图标、类型判断）
│   │   └── utils.ts              # [NEW] 通用工具（cn 函数等）
│   └── types/
│       └── index.ts              # [NEW] 类型定义（FileInfo, Config, StorageStats 等）
```

### 关键数据结构

```typescript
// 文件信息
interface FileInfo {
  name: string;
  size: number;
  type: string;          // MIME 类型
  ext: string;           // 文件扩展名
  lastModified: string;  // ISO 日期字符串
  isImage: boolean;
}

// 配置文件结构
interface AppConfig {
  storage: {
    path: string;         // 存储路径
    maxSpace: number;     // 空间上限(字节)，0 表示不限
    allowedTypes: string; // 允许的文件扩展名，逗号分隔，空表示全部允许
  };
  display: {
    viewMode: 'grid' | 'list';
    sortBy: 'name' | 'size' | 'date';
    sortOrder: 'asc' | 'desc';
  };
}

// 存储统计
interface StorageStats {
  usedSpace: number;      // 已用字节
  maxSpace: number;       // 上限
  fileCount: number;      // 文件数量
  usagePercent: number;   // 使用百分比
}
```

### config.ini 格式

```
[storage]
path = C:\Users\Chamiko\Downloads\隔空投送
maxSpace = 10737418240
allowedTypes =

[display]
viewMode = grid
sortBy = date
sortOrder = desc
```

## 设计风格

采用 **Glassmorphism（毛玻璃）** 现代设计风格，以深色渐变背景搭配半透明毛玻璃面板，营造高级、轻盈的视觉感受。

### 主题

- 默认暗色模式，支持切换到亮色模式
- 背景：深蓝紫色渐变带有微妙的动态光晕，亮色模式下为柔和灰白渐变
- 卡片与面板：`backdrop-blur-xl` 毛玻璃效果，半透明白色/黑色背景，细微边框
- 强调色：青蓝色到紫罗兰色的渐变，用于按钮、进度条和交互高亮

### 布局

- **顶部导航栏**：Logo + 存储空间环形指示器 + 暗色模式切换 + 设置齿轮图标
- **工具栏**：搜索框 + 排序下拉 + 视图切换（网格/列表）+ 上传按钮
- **上传区域**：页面顶部的虚线边框拖拽区，带浮动动画，提示"拖拽文件到此处或点击上传"
- **文件区域**：网格模式下为响应式卡片网格（2/3/4/5列自适应），列表模式下为紧凑的表格行
- **底部**：轻量状态栏显示文件总数

### 交互

- 拖拽文件悬停时上传区域高亮发光
- 上传时卡片内显示线性进度条和百分比
- 图片卡片悬停放大 1.05 倍 + 阴影加深
- 删除按钮悬停变红，点击弹出确认对话框
- 所有过渡使用 Framer Motion 弹性动画（spring）
- 设置页面表单控件有焦点发光效果
- Toast 通知从右上角滑入

### 响应式

- 桌面（≥1024px）：4-5 列网格，完整工具栏
- 平板（768-1023px）：3 列网格，搜索栏缩窄
- 手机（< 768px）：2 列网格，工具栏纵向堆叠，底部固定上传按钮