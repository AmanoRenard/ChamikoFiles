---
name: user-system
overview: 从零为 ChamikoFiles 搭建用户系统：SQLite 数据库、JWT 认证、登录/注册页面、邀请码机制、管理员用户管理、middleware 路由保护。
design:
  architecture:
    framework: react
  styleKeywords:
    - 暗色主题
    - 毛玻璃卡片
    - 品牌靛蓝渐变
    - 深紫光晕背景
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 24px
      weight: 700
    subheading:
      size: 14px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#6366F1"
      - "#8B5CF6"
      - "#A78BFA"
    background:
      - "#0F0B1E"
      - "#1A1530"
      - rgba(255,255,255,0.05)
    text:
      - "#E2E8F0"
      - "#94A3B8"
      - "#64748B"
    functional:
      - "#22C55E"
      - "#EF4444"
      - "#F59E0B"
      - "#06B6D4"
todos:
  - id: install-deps
    content: 安装核心依赖：better-sqlite3、bcryptjs、jose 及对应类型声明
    status: completed
  - id: create-types
    content: 扩展 src/types/index.ts：新增 User、InvitationCode、Session、LoginRequest、RegisterRequest、InviteGenerateRequest 等类型定义
    status: completed
  - id: create-db-layer
    content: 创建 src/lib/db.ts：SQLite 数据库初始化、WAL 模式开启、users/invitation_codes/sessions 三张表自动建表
    status: completed
    dependencies:
      - create-types
  - id: create-auth-utils
    content: 创建 src/lib/auth.ts：JWT 签发/验证、密码哈希/校验（bcryptjs）、session 管理、邀请码生成/验证/核销
    status: completed
    dependencies:
      - create-db-layer
  - id: create-api-check-setup
    content: 创建 /api/auth/check-setup 路由：检查 users 表是否为空，返回 needsSetup 布尔值
    status: completed
    dependencies:
      - create-auth-utils
  - id: create-api-register
    content: 创建 /api/auth/register 路由：首次注册自动授管理员，后续注册验证邀请码，原子事务创建用户+核销码
    status: completed
    dependencies:
      - create-auth-utils
  - id: create-api-login-logout
    content: 创建 /api/auth/login 和 /api/auth/logout 路由：密码验证签发 JWT 存入 httpOnly cookie，登出清除 cookie+记录失效
    status: completed
    dependencies:
      - create-auth-utils
  - id: create-api-me
    content: 创建 /api/auth/me 路由：从 JWT 解析当前用户信息并返回（用户名、角色、注册时间）
    status: completed
    dependencies:
      - create-auth-utils
  - id: create-api-admin
    content: 创建 /api/admin/invite 和 /api/admin/users 路由：生成/获取邀请码（旧码自动失效）、获取用户列表（仅管理员）
    status: completed
    dependencies:
      - create-auth-utils
  - id: create-middleware
    content: 创建 src/middleware.ts：路由白名单放行，其余校验 JWT，无效重定向 /login
    status: completed
    dependencies:
      - create-auth-utils
  - id: create-auth-provider
    content: 创建 AuthProvider 上下文组件：管理当前用户状态、登录/登出/注册方法、加载态，为所有页面提供 useAuth hook
    status: completed
    dependencies:
      - create-api-me
  - id: create-login-register-pages
    content: 创建 /login 和 /register 页面及对应表单组件：暗色卡片风格，首次检测自动显示/隐藏邀请码字段
    status: completed
    dependencies:
      - create-auth-provider
  - id: create-admin-page
    content: 创建 /admin 页面及 admin-panel 组件：邀请码卡片（生成/复制/倒计时）+ 用户列表表格
    status: completed
    dependencies:
      - create-auth-provider
      - create-api-admin
  - id: modify-layout-nav
    content: 修改 layout.tsx（包裹 AuthProvider）和 nav-bar.tsx（添加用户头像/管理入口/登出按钮）
    status: completed
    dependencies:
      - create-auth-provider
  - id: protect-main-page
    content: 修改 page.tsx：添加认证守卫，未登录展示登录引导而非直接显示文件列表
    status: completed
    dependencies:
      - create-middleware
      - create-auth-provider
  - id: test-full-flow
    content: 端到端测试：首次注册→管理员登录→生成邀请码→新用户注册→登录→访问网盘→管理员查看用户列表
    status: completed
    dependencies:
      - protect-main-page
      - create-login-register-pages
      - create-admin-page
---

## 用户需求

从零为 ChamikoFiles 建成完整的用户权限体系，实现从访客到管理员的访问控制闭环：

1. **首次初始化自动置管**：首个注册用户直接被赋为系统唯一管理员，禁止创建第二个管理员
2. **邀请码准入制**：后继注册必须经由管理员生成的专属邀请码，一码一人、即时核销
3. **邀请码生命周期控制**：管理员每次生成新邀请码时旧码自动核销，设置 24 小时有效期，注册成功即核销
4. **管理员专属控制台**：可生成/查看邀请码，展示当前全部注册用户列表
5. **安全认证机制**：JWT 签发认证、httpOnly cookie 存储、route middleware 全局守护
6. **无感用户体验**：现有网盘业务零侵入，从注册到登录到文件访问形成流畅闭环

## 技术选型

- **数据库**：better-sqlite3 — 零配置、免安装、同步操作，无需任何外部服务。数据文件放置在项目根目录 `data/chamiko.db`，与现有文件型存储风格一致
- **密码哈希**：bcryptjs — 纯 JS 实现，无 C++ 编译依赖，Windows 下稳定可靠
- **认证令牌**：jose — JWT 签发/验证，支持 Web Crypto API，兼容 Next.js Edge Runtime，为未来 Edge 部署留有空间
- **Cookie 存储**：httpOnly + secure + sameSite=lax，JWT 存储在 httpOnly cookie 中，防止 XSS 攻击

## 实现方案

### 整体架构

```
请求进入 → Middleware（鉴权/放行） → API Route → db/auth 工具层 → SQLite 文件
```

### 数据流

```mermaid
flowchart TD
    U[用户访问] --> M{middleware.ts}
    M -->|公开路由| P[页面/API 直接返回]
    M -->|受保护路由| T{验证 JWT}
    T -->|有效| P
    T -->|无效| R[重定向 /login]
    
    subgraph 认证流程
        REG[首次注册] --> CK{users 表是否为空?}
        CK -->|是| ADM[创建管理员 is_admin=1]
        CK -->|否| INV[验证邀请码]
        INV -->|有效| USR[创建普通用户]
        INV -->|无效| ERR[返回错误]
        ADM --> JWT[签发 JWT]
        USR --> JWT
        LOGIN[登录] --> VER[验证密码]
        VER -->|正确| JWT
        LOGOUT[登出] --> DEL[删除 session]
    end
```

### 中间件路由策略

`middleware.ts` 按白名单/黑名单模式运行：

- **白名单（放行）**：`/api/auth/*`、`/login`、`/register`、`/_next/*`、`/favicon.ico`
- **黑名单以外的所有路由（拦截）**：`/` 主页、`/api/files/*`、`/api/config`、`/api/storage`、`/api/admin/*`
- 拦截时验证 cookie 中 JWT 有效性，无效则重定向到 `/login`

### 页面路由设计

| 路由 | 功能 | 访问权限 |
| --- | --- | --- |
| `/login` | 登录页 | 公开 |
| `/register` | 注册页（自动检测首次/非首次） | 公开 |
| `/` | 网盘主页（现有功能完整保留） | 需登录 |
| `/admin` | 管理员控制台 | 仅管理员 |


### 数据库事务安全

- 注册时**原子操作**：验证邀请码→创建用户→核销邀请码 三步在同一事务中完成
- 生成新邀请码时：更新旧邀请码为失效 + 插入新邀请码 在同一事务中完成
- SQLite WAL 模式：开启 WAL 日志，提升并发读性能

## 实现注意事项

- **现有 API 零修改**：所有 `/api/files/*` 路由完全不改代码，由 middleware 统一拦截未认证请求
- **NavBar 增强而非重写**：只在现有 NavBar 右侧添加用户头像+管理入口+登出按钮，其余不变
- **数据库文件首次自动创建**：`getDb()` 函数检测 `data/chamiko.db` 不存在时自动创建表结构
- **无状态设计**：JWT 只验证签名与过期时间，不依赖服务端会话查找；登出通过删除 cookie + 记录失效 token hash 实现
- **密码安全**：bcrypt salt rounds 设为 12，平衡安全与性能

## 设计风格

完全延续现有 ChamikoFiles 暗色主题设计语言：深紫色/靛蓝基调配色，毛玻璃卡片效果，底部光晕背景，自定义滚动条。登录/注册页采用居中悬浮卡片布局，与预览弹窗风格一致，圆润边框与半透明效果。

## 登录页面

- 全屏深色背景 + 径向渐变光晕（复用现有 body::before 效果）
- 居中玻璃卡片：品牌色渐变标题 "ChamikoFiles"，下方表单区域
- 输入框：暗色半透明背景，聚焦时靛蓝发光边框
- 登录按钮：brand 渐变色，hover 时亮度提升
- 底部链接："还没有账号？立即注册" → 跳转 /register

## 注册页面

- 相同全屏居中卡片布局
- 首次访问：仅显示 用户名+密码+确认密码 三个字段，提示"首次注册将自动成为管理员"
- 非首次访问：额外显示邀请码输入框，"需要邀请码才能注册"
- 邀请码有效期倒计时提示（如有活跃邀请码）
- 注册成功后自动跳转登录页

## 管理员控制台页面

- 顶部区域：邀请码卡片 — 显示当前有效邀请码、剩余有效期倒计时、一键生成/复制按钮
- 下方表格区域：用户列表 — 用户名、注册时间、最后登录时间、角色（管理员/用户）标签
- 无邀请码时显示引导提示"点击下方按钮生成邀请码"
- 邀请码生成后显示大字代码 + 复制按钮 + 有效期倒计时

## Agent Extensions

### SubAgent

- **code-explorer**
- 目的：在实现过程中跨文件搜索现有认证相关代码、确认所有受影响的 API 路由和组件
- 预期结果：提供完整的受影响文件清单与依赖关系图，确保用户系统不会遗漏任何角落