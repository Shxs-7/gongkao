# CLAUDE.md — 公考积累宝 项目指引

## 项目简介

**公考积累宝** — 面向公考备考生的手机浏览器端知识积累工具。

- **用户**: 公考备考生（非技术背景）
- **平台**: 手机浏览器（纯静态网页）
- **技术栈**: HTML5 + CSS3 + Vanilla JS（零框架、零依赖）
- **存储**: 浏览器 localStorage
- **AI**: DeepSeek API
- **部署**: GitHub Pages（免费静态托管）

---

## 文档索引导航

### 📋 规范文件（docs/ 文件夹）
开发前先读对应规范，所有实现以 docs/ 文件为唯一标准。

| 文件 | 完整路径 | 何时读 |
|------|----------|--------|
| 需求规格书 | [docs/requirements.md](docs/requirements.md) | 不确定功能怎么做时 |
| 技术规格 | [docs/tech-spec.md](docs/tech-spec.md) | API、存储、算法相关 |
| 设计规范 | [docs/design-spec.md](docs/design-spec.md) | UI、颜色、组件相关 |
| 数据模型 | [docs/data-model.md](docs/data-model.md) | 数据字段、存储键名 |
| 执行计划 | [docs/execution-plan.md](docs/execution-plan.md) | 每步开始前确认当前步骤 |

### 📝 开发者日志
| 文件 | 完整路径 | 何时读/写 |
|------|----------|-----------|
| 开发日志 | [DEVLOG.md](DEVLOG.md) | 每次开发前读进度，每次开发后写记录 |

### 💻 源代码文件
| 文件 | 完整路径 | 职责 |
|------|----------|------|
| 主页面 | [index.html](index.html) | 完整 HTML 结构（SPA 单页） |
| 样式 | [css/style.css](css/style.css) | 全局样式、组件、移动适配 |
| 数据层 | [js/storage.js](js/storage.js) | localStorage CRUD 封装 |
| 复习算法 | [js/review.js](js/review.js) | SM-2 间隔重复算法 |
| AI 接口 | [js/ai.js](js/ai.js) | DeepSeek API 调用 |
| UI 渲染 | [js/ui.js](js/ui.js) | DOM 操作、列表/表单渲染 |
| 应用入口 | [js/app.js](js/app.js) | 初始化、路由、事件协调 |

---

## 工作规范

### 每次开发前（必做）
1. **打开 [DEVLOG.md](DEVLOG.md)**，了解当前进度和待办事项
2. **打开 [docs/execution-plan.md](docs/execution-plan.md)**，确认当前步骤和产出清单
3. **参考对应的 docs/ 规范文件**，确保实现符合标准

### 每次开发后（必做）
1. **更新 [DEVLOG.md](DEVLOG.md)** — 在末尾追加当日记录：
   - `### ✅ 完成` — 列出今天完成的产出
   - `### 📋 待办` — 列出还没做的
   - `### 🔧 下一步` — 下一阶段的计划
2. **更新 [docs/execution-plan.md](docs/execution-plan.md)** — 将完成的步骤标记为 ✅，当前步骤标记为 🔄

### 开发节奏
- 每次只做一个步骤，做完验证通过再做下一步
- 每步结束找用户确认，不要连续推进多步

---

## 代码规范

### 命名
- **函数**: 驼峰式 `addIdiom()`, `renderCard()`, `getTodayReviews()`
- **常量**: 全大写下划线 `STORAGE_KEY_IDIOMS`, `API_BASE_URL`
- **变量**: 驼峰式 `itemList`, `currentModule`
- **ID 属性**: data 属性使用 `data-module`, `data-id`
- **CSS 类名**: 短横线 `nav-bar`, `card-item`, `btn-primary`

### 注释
- 使用中文注释
- 每个 JS 文件顶部用注释说明文件用途
- 复杂逻辑前写一行注释解释

### 文件长度
- 每个 JS 文件不超过 300 行
- 超过则按功能拆分成新文件
- CSS 文件不超过 500 行

### 常量集中管理
- localStorage 键名统一在 storage.js 顶部定义
- CSS 颜色统一用 CSS 变量在 style.css `:root` 中定义
- API 地址统一在 ai.js 顶部定义

---

## 关键约定

1. **数据格式以 docs/data-model.md 为准**，需要改数据结构时先改文档再改代码
2. **所有删除操作必须有确认提示**，防止误删
3. **AI API Key 只存 localStorage**，绝不出现在代码或日志中
4. **移动端优先**，所有 UI 先在 375px 宽度下验证
5. **零依赖**，不引入任何第三方 JS/CSS 库
6. **用户是小白**，错误提示用通俗中文，避免技术术语
