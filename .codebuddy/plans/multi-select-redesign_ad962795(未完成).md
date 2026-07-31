---
name: multi-select-redesign
overview: 重新设计多选交互逻辑：全选按钮替代多选按钮、悬停显示复选框、自动进入/退出多选模式、批量操作右键菜单（含批量重命名弹窗）、批量下载/移动/删除确认。
todos:
  - id: add-utils-and-types
    content: 新增 file-utils 工具函数 formatDateForFilename，新增 types 批量操作相关类型定义（BatchRenameItem、SequenceType 等）
    status: pending
  - id: refactor-card-row
    content: 改造 file-card.tsx 和 file-row.tsx：selectMode→isSelectMode，复选框始终渲染通过 opacity 控制 hover 显示，多选模式下点击卡片=toggleSelect
    status: pending
    dependencies:
      - add-utils-and-types
  - id: refactor-search-bar
    content: 改造 search-bar.tsx："多选"按钮改为"全选"，onToggleSelectMode 改为 onSelectAll，移除 selectMode prop
    status: pending
  - id: refactor-page-logic
    content: 重构 page.tsx 多选逻辑：移除 selectMode state 改用派生值，实现全选，去掉取消选择按钮，批量删除加 ConfirmDialog，集成批量右键菜单
    status: pending
    dependencies:
      - add-utils-and-types
      - refactor-card-row
      - refactor-search-bar
  - id: add-batch-context-menu
    content: 在 context-menu.tsx 新增 getBatchContextMenuItems 函数，生成批量操作菜单项（下载/移动/重命名/删除）
    status: pending
    dependencies:
      - add-utils-and-types
  - id: create-batch-rename-dialog
    content: 新建 batch-rename-dialog.tsx：命名规则配置、数字序号(自动补零)、时间戳序号(去重)、排序选择、预览表格
    status: pending
    dependencies:
      - add-utils-and-types
  - id: create-batch-move-dialog
    content: 新建 batch-move-dialog.tsx：目标路径输入、确认移动回调
    status: pending
  - id: create-batch-apis
    content: 新建 batch-rename、batch-download(archiver zip)、batch-move 三个 API 路由，安装 archiver 依赖
    status: pending
    dependencies:
      - add-utils-and-types
  - id: integrate-batch-actions
    content: 在 page.tsx 中串联批量操作：点击右键菜单项触发对应弹窗/API，批量下载触发 zip 下载，批量删除加确认弹窗
    status: pending
    dependencies:
      - refactor-page-logic
      - add-batch-context-menu
      - create-batch-rename-dialog
      - create-batch-move-dialog
      - create-batch-apis
---

## 用户需求

全面改造文件管理应用的多选交互逻辑，涉及前端UI交互和后端批量操作API。

## 核心功能

### 1. 全选按钮

搜索栏左侧的"多选"按钮改为"全选"按钮。点击"全选"后选中当前文件夹所有文件，自动进入多选模式。全选选中文件后按钮文字变为"退出选择"，再次点击退出多选模式并清空所有选中。

### 2. 去除取消选择按钮

底部 Batch Action Bar 中移除"取消选择"按钮，仅保留右侧 × 关闭按钮用于退出多选模式并清空选中状态。

### 3. 悬停显示复选框

在非多选模式下（没有任何文件被选中），鼠标悬停到任意文件卡片/行时，左上角出现多选复选框，移开后消失。在多选模式下（已选中至少1个文件），所有文件左上角始终显示复选框。

### 4. selectMode 由选中状态派生

不再使用独立的 `selectMode` state，改用 `selectedItems.size > 0` 自动判定是否处于多选模式。选中≥1个文件即进入多选模式，全部取消选中后自动退出。

### 5. 多选模式交互

多选模式下点击文件卡片/行的任意位置即选中/取消选中该文件。非多选模式下点击卡片正常打开/预览文件。点击复选框始终是选中/取消选中（不受多选模式影响）。

### 6. 批量操作右键菜单

当已选中≥2个文件时，右键点击任意文件卡片/行，弹出批量操作菜单：顶部显示"批量操作"标题（不可点击），下方依次为批量下载、批量移动、批量重命名、批量删除（各带对应图标）。

### 7. 批量重命名弹窗

弹窗界面分为配置区和预览区。配置区包含：基础名输入框、分隔符输入框（默认 `_`）、序号类型选择（数字序号 / 上传时间）、排序方式选择（时间/名称/大小/类型）。预览区以表格形式展示原文件名对应新文件名的映射。

序号类型1（数字）：按选定的排序方式排列文件，从1开始递增编号。根据文件总数自动补零（如：5个文件→1~5，12个文件→01~12，120个文件→001~120）。新文件名格式为 `基础名_分隔符_序号.扩展名`。

序号类型2（上传时间）：使用文件修改日期格式化为 `yyyyMMdd_HHmmss` 作为序号。若日期完全相同则按类型排序，并在末尾附加下划线+数字序号（补零规则同类型1）。新文件名格式为 `基础名_分隔符_时间戳[.扩展名]`，重复时追加 `_序号`。

### 8. 批量下载

将选中的文件打包为 zip 文件下载。

### 9. 批量移动

将选中的文件移动到指定目标文件夹。

### 10. 批量删除

已有后端 API，需增加确认弹窗（复用现有 ConfirmDialog）。

## 技术栈

- 前端框架：Next.js 14 (App Router) + React 18 + TypeScript
- 样式：Tailwind CSS
- 动画：Framer Motion
- 图标：Lucide React
- 后端 zip：archiver 库

## 实施策略

### 状态管理重构

将 `page.tsx` 中 `selectMode` state 移除，改用派生值 `const isSelectMode = selectedItems.size > 0`。这样多选模式自动由选中数量决定，简化状态管理，避免 selectMode 和 selectedItems 不同步的问题。

### 复选框渲染策略

FileCard 和 FileRow 中的复选框始终渲染 DOM 节点，通过 CSS 控制可见性：

- `isSelectMode || selected`：始终可见（`opacity-100`）
- 否则：hover 时可见（`opacity-0 group-hover:opacity-100`）
这避免因条件渲染导致的布局抖动，且利用 CSS transition 实现平滑过渡。

### 点击行为分流

- `isSelectMode` 为 true：卡片 onClick → toggleSelect（不打开文件）
- `isSelectMode` 为 false：卡片 onClick → 打开/预览文件（原有行为）
- 复选框 onClick：始终 toggleSelect + stopPropagation（不受 isSelectMode 影响）

### Props 接口精简

FileCard/Row 的 `selectMode` prop 改为 `isSelectMode`，语义更清晰。父组件传 `selectedItems.size > 0`。

## 实施细节

### 性能考量

- FileCard/Row 使用 `React.memo`，需确保 callback 稳定（useCallback 已在 page.tsx 中使用）
- 全选操作：选中/取消所有文件时一次性 setSelectedItems，避免多次 state 更新
- 预览重命名表格：使用 useMemo 缓存新文件名计算

### 错误处理

- 批量操作 API 返回 { success, errors[] }，部分失败不中断整体流程
- 批量重命名需验证新文件名不冲突（前端预览 + 后端校验）
- zip 下载使用 stream 流水线，避免内存溢出

### 日志

使用现有项目模式，API 路由中使用 console.error 记录异常。

## 目录结构

```
src/
├── app/
│   ├── page.tsx                              # [MODIFY] 重构多选逻辑
│   └── api/files/
│       ├── batch-rename/route.ts             # [NEW] 批量重命名 API
│       ├── batch-download/route.ts           # [NEW] 批量下载 API (zip)
│       └── batch-move/route.ts               # [NEW] 批量移动 API
├── components/
│   ├── search-bar.tsx                        # [MODIFY] "多选"→"全选"，回调调整
│   ├── file-card.tsx                         # [MODIFY] hover 复选框、isSelectMode
│   ├── file-row.tsx                          # [MODIFY] hover 复选框、isSelectMode
│   ├── context-menu.tsx                      # [MODIFY] 新增批量操作菜单函数
│   ├── batch-rename-dialog.tsx               # [NEW] 批量重命名弹窗
│   └── batch-move-dialog.tsx                 # [NEW] 批量移动弹窗
├── lib/
│   └── file-utils.ts                         # [MODIFY] 新增 formatDateForFilename 函数
└── types/
    └── index.ts                              # [MODIFY] 新增批量操作相关类型
```

## 关键代码结构

### 新增类型定义 (types/index.ts)

```typescript
// 批量重命名请求
export interface BatchRenameItem {
  oldName: string;
  newName: string;
}

export interface BatchRenameRequest {
  items: BatchRenameItem[];
  subpath: string;
}

// 批量移动请求
export interface BatchMoveRequest {
  items: string[];
  subpath: string;
  targetSubpath: string;
}

// 批量下载请求
export interface BatchDownloadRequest {
  items: string[];
  subpath: string;
}

// 序号类型
export type SequenceType = "number" | "timestamp";

// 批量重命名预览项
export interface RenamePreviewItem {
  oldName: string;
  newName: string;
  ext: string;
}
```

### 新增工具函数 (lib/file-utils.ts)

```typescript
// 将日期字符串格式化为文件名时间戳格式
export function formatDateForFilename(dateString: string): string {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}${M}${d}_${h}${m}${s}`;
}
```

### FileCard/FileRow Props 变更

```typescript
interface FileCardProps {
  // selectMode: boolean;  // 移除
  isSelectMode: boolean;   // 新增，由 selectedItems.size > 0 派生
  selected: boolean;
  onToggleSelect: (name: string) => void;
  // ... 其余不变
}
```