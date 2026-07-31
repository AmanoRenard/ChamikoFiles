---
name: chamiko-files-enhancement
overview: 为 ChamikoFiles 添加文件夹管理功能（创建/进入/删除/面包屑导航），并增加多项实用增强：多选批量操作、文件/文件夹重命名、上传进度条、视频/音频预览、文本文件预览、文件移动、文件夹大小统计等。
design:
  architecture:
    framework: react
  styleKeywords:
    - Glassmorphism
    - 黑暗优先
    - 紫青渐变
    - 半透明面板
    - 微动画
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#6366F1"
      - "#06B6D4"
      - "#818CF8"
    background:
      - "#0B0B1A"
      - "#111128"
      - rgba(255,255,255,0.03)
    text:
      - "#E2E8F0"
      - "#94A3B8"
      - "#64748B"
    functional:
      - "#F59E0B"
      - "#EF4444"
      - "#10B981"
      - "#6366F1"
todos:
  - id: extend-types-and-utils
    content: 扩展类型系统和服务端工具函数：FileInfo 增加 isFolder 字段，FileListParams 增加 subpath，新增 RenameParams/MkdirParams 类型；file-utils-server.ts 增加 getFolderInfo、safeResolvePath、recursiveDeleteFolder 函数；file-utils.ts 增加 isVideoFile、isTextFile、VIDEO_EXTENSIONS、TEXT_EXTENSIONS
    status: completed
  - id: update-api-routes
    content: 更新全部现有 API 路由支持 subpath 子目录：list 返回文件夹条目、upload/download/delete 支持 subpath 参数、storage 递归统计子目录大小
    status: completed
    dependencies:
      - extend-types-and-utils
  - id: add-new-api-routes
    content: 新增 mkdir 和 rename 两个 API 路由：POST /api/files/mkdir 创建文件夹，PUT /api/files/rename 重命名文件或文件夹，均含路径穿越防护
    status: completed
    dependencies:
      - extend-types-and-utils
  - id: folder-ui-components
    content: 实现文件夹 UI 层：创建 breadcrumb.tsx 面包屑导航组件、新建文件夹内联输入框；修改 file-card.tsx 和 file-row.tsx 支持文件夹条目显示和点击进入；修改 page.tsx 增加 currentPath 状态驱动文件夹导航
    status: completed
    dependencies:
      - update-api-routes
      - add-new-api-routes
  - id: upload-progress
    content: 实现上传进度条：修改 upload-zone.tsx 使用 XMLHttpRequest 替代 fetch 获取 progress 事件，新增 upload-progress.tsx 显示每个文件的上传进度条和取消按钮
    status: completed
    dependencies:
      - folder-ui-components
  - id: video-text-preview
    content: 实现视频预览和文本预览：新增 video-preview.tsx（HTML5 video 播放器灯箱）和 text-preview.tsx（代码/文本阅读器）；修改 page.tsx 根据文件类型路由到对应预览组件
    status: completed
    dependencies:
      - folder-ui-components
  - id: context-menu-and-multiselect
    content: 实现右键菜单和多选批量操作：新增 context-menu.tsx 右键快捷菜单组件；修改 page.tsx 增加多选模式（勾选框 + 底部批量操作栏），支持批量删除
    status: completed
    dependencies:
      - folder-ui-components
---

## 用户需求

在现有 ChamikoFiles 文件传输服务基础上，增加两大方向功能：

### 1. 文件夹管理（核心需求）

- 创建文件夹：在当前目录下新建文件夹
- 文件夹导航：点击文件夹进入子目录，通过面包屑返回上层
- 删除文件夹：递归删除整个文件夹及其内容
- 文件夹内上传：上传文件到当前浏览的文件夹中

### 2. 增强功能（提升实用性）

- **文件/文件夹重命名**：修改文件或文件夹名称
- **多选批量删除**：勾选多个项目后一键批量删除
- **上传进度条**：实时显示上传进度百分比，支持取消上传
- **视频预览**：点击视频文件弹出播放器预览（类似现有图片预览灯箱）
- **文本/代码预览**：点击文本或代码文件弹出阅读器预览
- **右键快捷菜单**：右键文件/文件夹弹出操作菜单

## 技术方案

### 实现策略

采用**渐进式扩展**策略，在现有架构基础上增加功能，不引入新的第三方依赖：

- 所有现有 API 路由追加 `subpath` 查询参数支持子目录
- 新增 `mkdir` 和 `rename` 两个轻量 API 路由
- 前端组件通过 `currentPath` 状态驱动文件夹导航
- 上传进度使用 `XMLHttpRequest` 替代 `fetch` 以获取 `progress` 事件
- 多选框状态通过 `Set<string>` 管理，复用现有删除 API 批量调用

### 关键设计决策

1. **subpath 设计**：用 URL 查询参数 `subpath` 表示相对于 `config.storage.path` 的子路径，不暴露绝对路径，利用现有路径穿越防护
2. **文件夹排序**：文件夹排在文件前面，各自内部按设定排序规则排列
3. **存储统计**：递归统计所有子目录中的文件大小和数量
4. **重命名策略**：服务端 `fs.renameSync` 原子操作，前后端均做路径穿越校验

### 性能考虑

- 文件夹列表：单层读取（`fs.readdirSync`），不递归，O(n) 列出当前目录
- 存储统计递归：有文件夹后需要对子目录递归遍历，但仅在 NavBar 每 10 秒轮询时触发，不影响主列表性能
- 批量删除：串行调用 API（顺序删除），避免并发文件锁冲突

### 向后兼容

- `subpath` 参数可选，默认空字符串表示根目录
- FileInfo 新增 `isFolder` 字段，默认 `false`，不影响现有序列化
- 所有 API 响应结构不变，仅 `files` 数组增加 `isFolder: true` 的条目

## 设计风格

延续现有 Glassmorphism 暗色优先设计语言，保持紫-青渐变配色和 framer-motion 动画。新增功能组件无缝融入现有风格。

## 新增 UI 元素设计

### 面包屑导航

位于上传区域下方、工具栏上方，采用半透明圆角 pill 样式：

- 根目录显示为 Home 图标
- 各级目录用 `/` 分隔，当前目录高亮
- 点击历史层级快速跳转
- 背景：`bg-white/[0.03]`，边框：`border-white/[0.06]`

### 文件夹卡片（网格视图）

复用 file-card 的 `glass-card` 容器，差异：

- 预览区显示文件夹图标（Folder 图标，琥珀色/黄色调 `text-amber-400 bg-amber-500/10`）
- 悬停时仅显示"打开"按钮
- 底部信息显示文件夹内项目数替代文件大小

### 文件夹行（列表视图）

复用 file-row 结构，差异：

- 图标为文件夹图标，右侧箭头暗示可进入
- 点击整行进入文件夹
- 行尾操作按钮不含预览/下载

### 新建文件夹按钮

位于工具栏搜索栏右侧，`FolderPlus` 图标按钮，点击弹出内联输入框：

- 输入框在工具栏下方展开（framer-motion 高度动画）
- 输入名称后回车或点击确认按钮创建
- 空名称或重名时显示错误提示

### 上传进度条

替换当前旋转 loading 动画，显示多文件上传进度：

- 每个文件一行，显示文件名 + 进度条 + 百分比
- 进度条使用渐变色（紫到青）
- 右侧 X 按钮可取消单个上传
- 全部完成后自动收起

### 视频预览灯箱

模仿 image-preview 灯箱结构：

- 使用原生 HTML5 `<video>` 播放器
- controls 属性提供播放/暂停/进度/音量控制
- 保持相同的关闭按钮、文件名显示、键盘 Esc 关闭
- 无需前后导航（视频通常单独预览）

### 文本预览灯箱

玻璃拟态侧边栏风格弹出：

- 居中显示，最大宽高 80vw x 80vh
- `<pre>` 标签展示文本内容，使用等宽字体
- 深色背景代码高亮配色
- 支持代码文件（`.js`, `.ts`, `.py`, `.json` 等）和纯文本（`.txt`, `.md`）
- 右上角关闭按钮 + 文件名标题

### 右键菜单

点击文件/文件夹时弹出自定义上下文菜单：

- 半透明玻璃面板 `bg-black/80 backdrop-blur-xl`
- 菜单项：预览/下载/重命名/删除，文件夹额外有"打开"
- 带图标的纵向列表，悬停高亮
- 点击菜单外自动关闭
- framer-motion scale+fade 入场动画

### 多选模式

工具栏增加"选择"切换按钮：

- 开启后每个文件/文件夹左上角出现复选框
- 选中项底部浮现批量操作栏：显示已选数量 + 删除按钮
- 点击空白区域或再次点击"选择"退出多选模式