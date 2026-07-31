---
name: multi-space-system
overview: 为 ChamikoFiles 实现多空间系统：每个用户拥有个人空间 + 最多 3 个共享空间，支持邀请链接加入、空间切换、配额管理。核心关注鉴权安全，确保用户不能访问非授权空间。
design:
  architecture:
    framework: react
  styleKeywords:
    - Dark Theme
    - Glassmorphism
    - Gradient Accents
    - Minimal Layout
    - Smooth Animation
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 20px
      weight: 700
    subheading:
      size: 14px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#6366F1"
      - "#818CF8"
      - "#06B6D4"
    background:
      - "#0F0B1E"
      - "#1A1530"
      - "#FFFFFF08"
    text:
      - "#E2E8F0"
      - "#94A3B8"
      - "#64748B"
    functional:
      - "#22C55E"
      - "#F59E0B"
      - "#EF4444"
      - "#3B82F6"
todos:
  - id: expand-types-and-config
    content: 扩展类型定义和配置层：types/index.ts 新增空间/成员/邀请/配额类型，AppConfig 增加 quota section；config.ini 新增 [quota]；lib/config.ts 支持读写新字段
    status: completed
  - id: build-space-db-layer
    content: 构建空间数据层：lib/db.ts 新增 spaces/members/invites/quotas 的 JSON 读写方法；新建 lib/spaces.ts 空间业务逻辑（CRUD、邀请生成验证、权限校验）
    status: completed
    dependencies:
      - expand-types-and-config
  - id: create-space-api-routes
    content: 创建空间管理 API：/api/spaces（列表+创建）、/api/spaces/[id]（重命名+删除）、/api/spaces/[id]/invite（生成+查询+撤销）、/api/spaces/[id]/members（列表+移除）、/api/spaces/join（通过邀请码加入），全部含鉴权
    status: completed
    dependencies:
      - build-space-db-layer
  - id: refactor-file-apis-with-space
    content: 改造所有文件 API 注入空间上下文：新增 resolveSpacePath 工具函数，改造 files/list、upload、delete、rename、mkdir、move、download、batch-* 共 11 个路由，统一接收 spaceType+spaceId 参数，添加 spaceGuard 鉴权
    status: completed
    dependencies:
      - build-space-db-layer
  - id: refactor-storage-api
    content: 改造存储统计 API：/api/storage 支持 ?spaceType=&spaceId= 按空间查询，无参数时聚合查询当前用户所有空间的用量
    status: completed
    dependencies:
      - refactor-file-apis-with-space
  - id: create-space-provider-and-hooks
    content: 创建空间状态管理层：扩展 auth-provider 为 SpaceProvider，新建 use-spaces hook 管理空间列表、当前空间、切换空间逻辑，记住每个空间最后浏览路径
    status: completed
    dependencies:
      - create-space-api-routes
  - id: build-space-sidebar-and-selector
    content: 构建空间切换 UI 组件：space-sidebar.tsx（桌面端侧边栏）、space-selector.tsx（手机端下拉选择器）、space-creator-dialog.tsx（创建对话框）
    status: completed
    dependencies:
      - create-space-provider-and-hooks
  - id: build-space-management-dialogs
    content: 构建空间管理弹窗：space-invite-dialog.tsx（邀请链接展示/复制/撤销）、space-members-dialog.tsx（成员列表管理）、space-settings-menu.tsx（更多操作菜单，仅owner可见）
    status: completed
    dependencies:
      - build-space-sidebar-and-selector
  - id: refactor-main-page-layout
    content: 重构主页面布局：page.tsx 改造为空间侧边栏+主内容区双栏布局，提取文件操作逻辑到独立 hooks，所有文件操作携带 spaceType+spaceId；breadcrumb.tsx 常驻化并显示空间名
    status: completed
    dependencies:
      - build-space-sidebar-and-selector
      - refactor-file-apis-with-space
  - id: update-navbar-and-mobile-drawer
    content: 更新导航栏和手机端抽屉：nav-bar.tsx 加入响应式空间指示器、StorageRing 显示聚合用量、storage-ring.tsx 支持点击展开空间明细；mobile-drawer.tsx 增加空间切换入口
    status: completed
    dependencies:
      - refactor-main-page-layout
  - id: enhance-admin-and-settings
    content: 增强管理员面板：settings/page.tsx 增加配额默认值配置（个人空间容量、共享空间容量、最多空间数）；admin/page.tsx 增加 Tab 切换（用户管理/配额管理/空间概览），支持单独设置用户配额
    status: completed
    dependencies:
      - build-space-db-layer
      - refactor-storage-api
  - id: edge-cases-and-security
    content: 处理边界情况和安全加固：自动迁移旧数据到个人空间根目录、切换空间时阻止正在进行的上传、共享空间删除时递归清理文件和成员记录、手机端空间切换器条件渲染、所有 API 响应不泄露其他用户的空间信息
    status: completed
    dependencies:
      - enhance-admin-and-settings
      - refactor-main-page-layout
---

## 用户需求

将当前"所有用户共享一个文件夹"架构升级为**多空间隔离系统**。每个用户拥有一个个人空间，并可以创建至多3个共享空间。

## 核心功能

### 空间类型

- **个人空间**：系统自动为每个注册用户创建，仅自己可访问，路径 `data/storage_base/_user_directory/{userId}/`
- **共享空间**：用户手动创建，通过邀请链接分享给他人，路径 `data/storage_base/_shared_directory/{spaceId}/`

### 空间管理

- 创建共享空间（上限3个），指定名称
- 创建者可重命名空间、生成/撤销邀请链接、删除空间
- 普通成员只能访问空间内的文件，无管理权限
- 删除空间需二次确认，同时清理所有文件和成员关系

### 邀请系统

- 邀请链接24小时有效，可被多人加入使用
- 创建者可随时撤销链接，撤销后未使用链接立即失效
- 点击邀请链接 → 已登录直接加入 → 未登录引导登录后自动加入
- 加入后在空间列表中立刻可见该共享空间

### 权限鉴权

- 所有文件API操作必须在请求中携带 spaceType + spaceId
- 后端强制校验：个人空间仅限本人，共享空间校验membership
- 路径穿越防护：safeResolvePath 限制在对应空间根目录内
- 多人协作安全：乐观UI + API返回最新状态覆盖

### UI改造

- 面包屑改为常驻，显示"空间名 > 文件夹A > 文件夹B"
- 桌面端：左侧空间侧边栏 + 主内容区双栏布局
- 手机端：顶部空间选择器下拉 + 底部导航
- 空间切换时记住每个空间的最后浏览路径
- StorageRing显示当前用户在**所有空间**的聚合用量

### 管理员增强

- 设置页面新增配额配置：默认个人空间容量、默认共享空间容量、每人最多共享空间数
- 管理员页面新增用户配额列表：可单独设置每个用户的个人空间容量上限
- 管理员可查看所有共享空间列表和成员信息

## 技术栈

- Next.js 14 App Router + TypeScript（沿用现有）
- JWT Cookie 鉴权：jose + bcryptjs（沿用）
- 数据存储：JSON 文件（新增 spaces.json, space_members.json, space_invites.json, quotas.json）
- 配置：INI 文件扩展 [quota] section
- UI：React 18 + Tailwind CSS + Framer Motion（沿用）
- 深色主题玻璃态风格（沿用现有设计语言）

## 实现方案

### 整体架构

采用**四层渐进式改造**策略，每层独立可交付：

1. **数据层**：扩展类型定义 + 新建 JSON 存储模块 + 扩展 config.ini
2. **API 层**：新建空间管理 API + 新建鉴权中间件 + 改造所有现有文件 API
3. **UI 层**：空间侧边栏/选择器 + 常驻面包屑 + 页面布局重构
4. **管理面板层**：管理员设置增强 + 配额管理

### 鉴权架构（核心安全）

所有文件操作 API 必须经过**三层校验**：

```
请求 → Middleware(token存在检查) → requireAuth(JWT验证) → spaceGuard(空间权限校验) → 文件操作
```

spaceGuard 检查逻辑：

- personal space：`spaceId === String(userId)` 且 `spaceType === "personal"`
- shared space：从 space_members.json 查找 `userId` 是否为该 space 的 member/owner

### 文件API改造策略

所有 `/api/files/*` 路由统一接收新参数 `spaceType` + `spaceId`，新增工具函数 `resolveSpacePath(spaceType, spaceId, subpath)`：

```typescript
function resolveSpacePath(spaceType: string, spaceId: string, subpath: string): string {
  const baseDir = path.join(STORAGE_BASE, spaceType === "personal"
    ? `_user_directory/${spaceId}`
    : `_shared_directory/${spaceId}`);
  return safeResolvePath(baseDir, subpath);
}
```

替代原有各处 `config.storage.path` 的硬编码引用。

### 性能考量

- JSON 文件读写：现有 db.ts 模式已验证可行（小规模用户场景），每次写入整体序列化。新增空间数据文件同理
- 空间列表缓存：前端用 Context 管理，切换空间时不清空已加载数据
- 存储统计：从"扫描整个 storage.path"改为"按用户 scope 扫描对应空间目录"

## 目录结构（新增/修改文件）

```
src/
├── types/
│   └── index.ts                          # [MODIFY] 新增 SharedSpace, SpaceMember, SpaceInvite, UserQuota, SpaceSummary 等类型；扩展 FileListParams 增加 spaceType/spaceId
├── lib/
│   ├── db.ts                             # [MODIFY] 新增空间/成员/邀请/配额相关 JSON 读写方法
│   ├── config.ts                         # [MODIFY] AppConfig 增加 quota section，readConfig/writeConfig 支持新字段
│   ├── auth.ts                           # [MODIFY] requireAuth 不变；新增 requireSpaceAccess 鉴权中间件
│   ├── file-utils-server.ts              # [MODIFY] 新增 resolveSpacePath, getSpaceStorageSize；保留 safeResolvePath
│   └── spaces.ts                         # [NEW] 空间管理业务逻辑（CRUD、邀请生成/验证、权限校验）
├── app/
│   ├── layout.tsx                        # [MODIFY] 注入 SpaceProvider
│   ├── page.tsx                          # [MODIFY] 重构为带空间侧边栏的布局；提取文件操作逻辑到 hooks
│   ├── api/
│   │   ├── files/
│   │   │   └── */route.ts               # [MODIFY] 全部11个文件API路由添加 spaceType+spaceId 参数和鉴权
│   │   ├── storage/
│   │   │   └── route.ts                 # [MODIFY] 支持按空间或聚合查询存储用量
│   │   ├── spaces/
│   │   │   ├── route.ts                  # [NEW] GET 列出空间，POST 创建空间
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts             # [NEW] PUT 重命名，DELETE 删除空间
│   │   │   │   ├── invite/
│   │   │   │   │   └── route.ts         # [NEW] POST 生成邀请链接，GET 查询，DELETE 撤销
│   │   │   │   └── members/
│   │   │   │       └── route.ts         # [NEW] GET 成员列表，DELETE 移除成员
│   │   │   └── join/
│   │   │       └── route.ts             # [NEW] POST 通过邀请码加入空间
│   │   ├── admin/
│   │   │   ├── quotas/
│   │   │   │   └── route.ts             # [NEW] GET/PUT 用户配额管理
│   │   │   └── spaces/
│   │   │       └── route.ts             # [NEW] GET 管理员查看所有空间
│   │   └── config/
│   │       └── route.ts                 # [MODIFY] 支持读写 quota 配置
│   ├── admin/
│   │   └── page.tsx                     # [MODIFY] 增加配额管理Tab和空间概览列表
│   └── settings/
│       └── page.tsx                     # [MODIFY] 增加配额默认值配置表单项
├── components/
│   ├── space-sidebar.tsx                # [NEW] 桌面端空间侧边栏：个人空间+共享空间列表+创建按钮+选中高亮
│   ├── space-selector.tsx               # [NEW] 手机端顶部空间选择器下拉
│   ├── space-creator-dialog.tsx         # [NEW] 创建共享空间对话框
│   ├── space-invite-dialog.tsx          # [NEW] 邀请链接展示/复制/撤销对话框
│   ├── space-members-dialog.tsx         # [NEW] 成员列表查看/移除对话框
│   ├── space-settings-menu.tsx          # [NEW] 空间右键/更多菜单（重命名/邀请/成员/删除，仅owner可见）
│   ├── breadcrumb.tsx                   # [MODIFY] 常驻化，去掉隐藏逻辑，接收 spaceName 显示在最前
│   ├── nav-bar.tsx                      # [MODIFY] 响应式空间指示器，StorageRing 显示聚合用量
│   ├── mobile-drawer.tsx                # [MODIFY] 增加空间切换入口
│   ├── storage-ring.tsx                 # [MODIFY] 支持点击展开各空间用量明细
│   └── auth-provider.tsx               # [MODIFY] 扩展为也提供空间列表和当前空间状态
├── hooks/
│   └── use-spaces.ts                    # [NEW] 空间列表/当前空间/切换空间的 hook
config.ini                                # [MODIFY] 新增 [quota] section
data/
│   ├── spaces.json                      # [NEW] 共享空间元数据
│   ├── space_members.json               # [NEW] 空间成员关系
│   ├── space_invites.json               # [NEW] 空间邀请链接
│   └── quotas.json                      # [NEW] 用户配额配置
```

## 密钥数据结构

### types/index.ts 新增类型

```typescript
type SpaceType = "personal" | "shared";

interface SharedSpace {
  id: string;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

interface SpaceSummary {
  id: string;
  name: string;
  type: SpaceType;
  role: "owner" | "member" | "personal";
  memberCount: number;
  usedSpace: number;
  maxSpace: number;
}

interface SpaceMember {
  spaceId: string;
  userId: number;
  role: "owner" | "member";
  joinedAt: string;
}

interface SpaceInvite {
  id: string;
  spaceId: string;
  code: string;
  createdBy: number;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
}

interface UserQuota {
  userId: number;
  personalSpaceMaxBytes: number;
}

interface AppConfig {
  storage: { path: string; maxSpace: number; allowedTypes: string; };
  display: { viewMode: "grid" | "list"; sortBy: "name" | "size" | "date"; sortOrder: "asc" | "desc"; };
  quota: {
    defaultPersonalQuota: number;
    defaultSharedQuota: number;
    maxSharedSpaces: number;
  };
}

// FileListParams 扩展
interface FileListParams {
  page?: number; pageSize?: number; search?: string;
  sortBy?: string; sortOrder?: string;
  subpath?: string;
  spaceType?: "personal" | "shared";
  spaceId?: string;
}
```

## 设计风格

沿用现有深色主题玻璃态设计，保持视觉一致性。新增的空间侧边栏和切换器融入现有配色体系。

## 布局改造

### 桌面端（sm+）

```
+--------------------------------------------------+
| NavBar: Logo |[个人空间 v]| StorageRing | 用户菜单 |
+----------+---------------------------------------+
| 空间侧边栏 |  面包屑（常驻）                          |
|          |  [个人空间] > 项目 > 图片                 |
| 📁个人空间 |                                       |
| 👥项目协作 |  [文件列表 Grid/List]                   |
| 👥设计素材 |                                       |
| + 创建空间 |                                       |
+----------+---------------------------------------+
```

空间侧边栏固定宽 220px，可折叠；选中空间高亮渐变背景；每个共享空间右侧显示成员数角标。

### 手机端（<sm）

侧边栏消失，顶部面包屑左侧增加空间选择器下拉按钮 `[当前空间名 ▾]`，下拉菜单显示所有空间列表和创建入口。

## 空间侧边栏设计

- 个人空间项：User 图标 + "个人空间"文字，始终置顶
- 共享空间项：Users 图标 + 空间名称 + 成员数角标 + owner 显示 ⋯ 管理按钮
- 创建按钮：底部固定，"+"加号 + "创建共享空间"文字，已满3个时灰色禁用并显示提示
- 选中态：渐变背景 bg-gradient-to-r from-primary/15 to-primary-cyan/10 + 左边框 primary

## 空间管理弹窗

- 创建空间：Modal 对话框，输入名称 + 确认按钮
- 邀请成员：展示邀请链接 + 复制按钮 + 倒计时 + 撤销按钮 + 已使用人数
- 成员管理：列表，每行显示用户名+角色+加入时间，owner 可点移除按钮
- 删除空间：危险操作二次确认，需输入空间名称

## 管理员设置新增

- 配额默认值：个人空间默认容量(GB)、共享空间默认容量(GB)、每人最多共享空间数
- 用户配额列表：表格显示用户名、个人配额（可编辑）、已用空间、操作按钮

## SubAgent

- **code-explorer**
- 目的：在实施过程中深度搜索所有引用了 `config.storage.path` 和 `subpath` 参数的代码位置，确保没有遗漏的 API 路由需要改造
- 预期结果：完整的受影响文件清单，确保所有文件操作都注入了 space context