---
name: remove-light-mode
overview: 彻底移除亮色模式：删除 ThemeProvider、theme-toggle 组件、CSS 中 .light 规则、next-themes 依赖，仅保留暗色模式。
todos:
  - id: delete-theme-toggle
    content: 删除 src/components/theme-toggle.tsx 文件
    status: completed
  - id: clean-globals-css
    content: 清理 globals.css：删除第29-41行 .light 块和第79-81行 .light body::before 规则
    status: completed
  - id: clean-layout
    content: 清理 layout.tsx：移除 ThemeProvider import 和包裹层
    status: completed
  - id: clean-nav-bar
    content: 清理 nav-bar.tsx：移除 ThemeToggle import 和组件使用
    status: completed
  - id: clean-deps-and-config
    content: 清理 package.json 的 next-themes 依赖和 tailwind.config.ts 的 darkMode 配置
    status: completed
---

## 用户需求

彻底移除亮色模式支持，锁死暗色模式，减少后续维护工作量。

## 核心改动

- 删除 ThemeToggle 切换组件
- 移除 next-themes 依赖和 ThemeProvider 包裹
- 清理 globals.css 中 .light 相关 CSS 规则
- 清理 tailwind.config.ts 中 darkMode 配置
- 清理 nav-bar.tsx 中 ThemeToggle 的引用

## 技术方案

本次改动为纯清理工作，不引入新技术或新模式。

### 实施策略

1. **删除组件文件**：`src/components/theme-toggle.tsx` 没有任何其他文件引用它（只有 nav-bar.tsx），可直接删除
2. **layout.tsx**：移除 `import { ThemeProvider } from "next-themes"` 和 `<ThemeProvider>` 包裹层，保留 `<body className="dark">` 不变
3. **nav-bar.tsx**：移除 `import { ThemeToggle }` 和 `<ThemeToggle />` 使用点
4. **globals.css**：删除第29-41行 `.light { ... }` 块和第79-81行 `.light body::before { opacity: 0.4; }` 规则
5. **package.json**：删除 `"next-themes": "^0.3.0"` 依赖
6. **tailwind.config.ts**：移除 `darkMode: "class"` 配置（已无实际作用）

### 改动影响范围

所有改动都是删除/移除操作，不会影响任何运行中功能。`body` 已有的 `className="dark"` 保持不变，所有组件原本就是暗色模式样式，无兼容性风险。

### 后续清理

用户需在项目目录执行 `npm uninstall next-themes` 移除 node_modules 中的包文件。