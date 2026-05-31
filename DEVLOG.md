# 开发者日志

> 项目：公考积累宝  
> 开始日期：2026-05-31

---

## 2026-05-31 — 项目初始化 + 文档体系搭建

### ✅ 完成
- 明确项目定位和用户需求
- 确定技术方案：纯前端 + localStorage + DeepSeek API + GitHub Pages
- 用户确认 4 项关键选择：DeepSeek / localStorage / 免费托管 / 间隔重复
- 创建 5 份规范文件：
  - docs/requirements.md — 需求规格说明书
  - docs/tech-spec.md — 技术规格说明
  - docs/design-spec.md — UI 设计规范
  - docs/data-model.md — 数据模型定义
  - docs/execution-plan.md — 分步执行计划
- 创建 CLAUDE.md — AI 助手指引文件
- 创建 DEVLOG.md — 开发者日志（本文件）

### 📋 待办
- [ ] 第 1 步：项目骨架搭建（index.html + css/style.css）
- [ ] 第 2 步：数据层实现（js/storage.js）
- [ ] 第 3 步：积累模块 CRUD
- [ ] 第 4 步：AI 问答模块
- [ ] 第 5 步：间隔重复复习
- [ ] 第 6 步：设置页面 + 人民网搜索
- [ ] 第 7 步：联调测试完善
- [ ] 第 8 步：部署上线

### 🔧 下一步
开始第 1 步：搭建项目骨架，创建 index.html 和 css/style.css

---

## 2026-05-31 — 第 1 步完成：项目骨架搭建

### ✅ 完成
- 创建 `index.html` — 完整 SPA 结构
  - 5 个页面容器：首页、积累、AI问答、复习、我的
  - 积累页 4 个子模块标签（成语/常识/实词/金句）
  - AI 问答聊天界面结构
  - 复习页：卡片 + 评分按钮
  - 设置页：API Key、导入导出、清空数据
  - 底部固定导航栏（5 个 Tab）
  - 删除确认弹窗模板 + Toast 提示模板
  - 人民网搜索按钮
  - 无顶部标题栏（用户要求）
- 创建 `css/style.css` — 全局样式
  - CSS 变量定义（颜色、字体、间距、阴影）
  - 移动端布局（max-width: 480px）
  - 底部导航栏样式（固定底部、选中态）
  - 子模块标签栏（圆角胶囊切换）
  - 卡片列表、搜索框、按钮组件
  - AI 对话气泡样式
  - 复习卡片 + 评分按钮
  - 表单、弹窗、Toast 样式
  - 空状态提示
- 创建 JS 文件骨架：
  - `js/app.js` — 页面路由 + Tab 切换（可运行）
  - `js/storage.js` — 占位（第 2 步实现）
  - `js/review.js` — 占位（第 5 步实现）
  - `js/ai.js` — 占位（第 4 步实现）
  - `js/ui.js` — 占位（第 3 步实现）

### 📋 待办
- [ ] 第 2 步：数据层实现（js/storage.js）
- [ ] 第 3 步：积累模块 CRUD
- [ ] 第 4 步：AI 问答模块
- [ ] 第 5 步：间隔重复复习
- [ ] 第 6 步：设置页面 + 人民网搜索
- [ ] 第 7 步：联调测试完善
- [ ] 第 8 步：部署上线

### 🔧 下一步
第 2 步：实现数据层（js/storage.js），封装 localStorage 增删改查

---

## 2026-05-31 — 第 2 步完成：数据层实现

### ✅ 完成
- 实现 `js/storage.js` — 完整数据层，包含：
  - `generateId(type)` — 唯一 ID 生成（type_timestamp_random6）
  - `createBaseFields()` — 通用字段模板（含间隔重复字段）
  - `getAll(module)` / `getById(module, id)` — 查询
  - `addItem(module, data)` — 添加（自动补全 ID 和时间戳）
  - `updateItem(module, id, newData)` — 更新
  - `removeItem(module, id)` — 删除
  - `searchItems(module, keyword, fields)` — 模糊搜索
  - `getStats()` / `getTotalCount()` — 统计
  - `exportAll()` — 导出全部数据为 JSON
  - `importAll(jsonStr, merge)` — 导入（支持合并/覆盖）
  - `clearAll()` — 清空全部数据
  - `getSettings()` / `saveSettings()` — 设置读写
  - `getApiKey()` / `saveApiKey()` — API Key 管理
  - `getChatHistory()` / `saveChatHistory()` — 对话历史
  - `addChatMessage(role, content)` — 添加对话
  - `clearChatHistory()` — 清空对话
- 存储键名前缀 `gka_`，6 个独立键：
  - `gka_idioms` / `gka_knowledge` / `gka_words` / `gka_quotes`
  - `gka_settings` / `gka_chat_history`
- 更新 `js/app.js`：
  - 首页自动读取并显示各模块统计数据
  - 切换页面时自动刷新对应数据
  - 首页快捷入口可跳转到积累页对应子模块
  - 积累列表基础渲染（显示条数）

### 📋 待办
- [ ] 第 3 步：积累模块 CRUD（完整卡片渲染 + 添加/编辑表单）
- [ ] 第 4 步：AI 问答模块
- [ ] 第 5 步：间隔重复复习
- [ ] 第 6 步：设置页面 + 人民网搜索
- [ ] 第 7 步：联调测试完善
- [ ] 第 8 步：部署上线

### 🔧 下一步
第 3 步：实现积累模块的完整增删改查界面

---

## 2026-05-31 — 第 3 步完成：积累模块 CRUD

### ✅ 完成
- 实现 `js/ui.js` — 完整 UI 渲染引擎，包含：
  - `renderCardList(module)` — 卡片列表渲染（标题 + 预览 + 时间 + 新标签）
  - `showItemForm(module, item?)` — 添加/编辑表单浮层（自动适配 4 个模块字段）
  - `showDeleteConfirm(module, id, label)` — 删除确认弹窗
  - `showConfirm(msg, onConfirm)` — 通用确认弹窗
  - `showToast(msg)` — Toast 提示（1.8 秒自动消失）
  - `showModuleSelect(onSelect)` — 模块选择弹窗（AI 存入用）
  - `escapeHtml(str)` / `formatTime(isoStr)` — 工具函数
- 重写 `js/app.js` — 事件完全接好：
  - ➕ 按钮 → 弹出对应模块的添加表单
  - 卡片点击 → 弹出编辑表单（预填数据）
  - 编辑页删除按钮 → 确认弹窗 → 删除
  - 搜索框输入 → 250ms 防抖 → 实时过滤卡片
  - 子模块切换 → 自动渲染对应列表
  - 首页统计 → 添加/删除后自动刷新
- 更新 `css/style.css`：
  - 新增 `.badge-new` 新标签样式（绿色小圆标）
  - 修正 FAB 悬浮按钮定位（桌面端贴紧内容区）

### 当前可用的完整流程
1. 在积累页点击 + → 填写表单 → 保存 → 卡片出现在列表
2. 点击卡片 → 编辑/删除
3. 搜索框实时过滤
4. 4 个子模块独立运作，数据互不干扰
5. 首页自动更新统计数据

### 📋 待办
- [ ] 第 4 步：AI 问答模块
- [ ] 第 5 步：间隔重复复习
- [ ] 第 6 步：设置页面 + 人民网搜索
- [ ] 第 7 步：联调测试完善
- [ ] 第 8 步：部署上线

### 🔧 下一步
第 4 步：实现 AI 问答模块（DeepSeek API 接入 + 对话界面 + 存入模块）

---

## 2026-05-31 — 第 4 步完成：AI 问答模块

### ✅ 完成
- 实现 `js/ai.js` — AI 接口层，包含：
  - `callDeepSeek(userMessage, onStart, onDone)` — DeepSeek API 调用
  - `SYSTEM_PROMPT` — 公考辅导专家系统提示词
  - `getAiErrorMessage(err)` — 友好的错误提示映射
    - 无 API Key → "请先去「我的」页面配置"
    - API Key 无效 401 → "请重新配置"
    - 限流 429 → "提问太频繁，请稍后"
    - 网络错误 → "请检查网络"
  - `saveAiAnswerToModule(content)` — 存入模块流程
  - `getPrefillForModule(content, module)` — 按模块格式预填
- 更新 `js/ui.js` — 新增 AI 对话渲染：
  - `renderChatBubble(role, content)` — 对话气泡
  - `renderAssistantBubble(content)` — AI 气泡 + "📥 存入..."按钮
  - `renderChatLoading()` / `removeChatLoading()` — 加载状态
  - `showPrefillForm(module, prefill)` — 预填表单（AI 回答自动填入）
  - `clearChatDisplay()` — 清空聊天
- 更新 `js/app.js` — AI 问答事件：
  - 发送按钮 + 回车键 → 发送消息
  - 无 API Key 时 Toast 提示
- 更新 `css/style.css` — AI 页面高度修正

### 存入模块流程
1. AI 回答下方显示「📥 存入...」按钮
2. 点击 → 弹出模块选择（成语/常识/实词/金句）
3. 选择后 → 弹出预填表单
   - 成语：AI 回答预填到「释义」
   - 常识：AI 回答预填到「内容」
   - 实词：AI 回答预填到「释义」
   - 金句：AI 回答预填到「金句原文」
4. 用户补充必填字段 → 确认存入 → 完成

### 📋 待办
- [ ] 第 6 步：设置页面 + 人民网搜索
- [ ] 第 7 步：联调测试完善
- [ ] 第 8 步：部署上线

### 🔧 下一步
第 5 步：实现间隔重复复习（SM-2 算法 + 首页复习列表 + 复习流程）

---

## 2026-05-31 — 第 5 步完成：间隔重复复习

### ✅ 完成
- 实现 `js/review.js` — SM-2 简化算法，包含：
  - `getTodayReviews()` — 从所有模块获取今日待复习条目
  - `getTodayReviewCount()` — 今日复习总数
  - `calculateNext(item, rating)` — 核心算法
  - `submitReview(module, itemId, rating)` — 提交评分 + 更新复习状态
  - `getReviewContent(item, module)` — 获取复习答案内容
  - 日期工具函数：`getTodayDate()`, `addDays()`, `formatReviewDate()`
- SM-2 算法规则：
  - 评分 1（忘了）→ 明天再复习，降低容易度
  - 评分 2（模糊）→ 间隔减半
  - 评分 3（记得）→ 间隔 × 容易度
  - 评分 4（很熟）→ 间隔 × 容易度 × 1.3
  - 容易度范围 1.3~2.5，根据评分动态调整
- 更新 `js/app.js` — 复习流程控制：
  - 首页：显示今日待复习数量 + 最多 5 条预览
  - 复习页：点击进入后逐个复习
  - 复习流程：看题目 → 点"显示答案" → 评分 1-4 → 下一条
  - 全部完成后显示 🎉 完成提示
- 更新 `css/style.css` — 首页复习列表条目样式
- 切换页面时自动初始化/刷新对应内容

### 复习流程
```
首页 → 看今日复习数 → 点复习页（或点条目）
→ 看到题目 → 点「显示答案」→ 揭晓答案
→ 评分：😰忘了 / 🤔模糊 / 😊记得 / 💪很熟
→ 自动排期 → 下一条 → 全部完成 🎉
```

### 📋 待办
- [ ] 第 7 步：联调测试完善
- [ ] 第 8 步：部署上线

### 🔧 下一步
第 6 步：实现设置页面（API Key 配置、数据导入导出、清空数据）

---

## 2026-05-31 — 第 6 步完成：设置页面

### ✅ 完成
- API Key 配置：
  - 输入框（密码类型，保护隐私）
  - 保存按钮 → 存入 localStorage
  - 打开设置页自动加载已保存的 Key
- 数据导出：
  - 一键导出全部数据为 JSON 文件
  - 文件名格式：`公考积累宝_备份_2026-05-31.json`
  - 包含所有模块数据、设置、对话历史
- 数据导入：
  - 选择 JSON 文件导入
  - 合并模式（不会覆盖已有数据，按 ID 去重）
  - 导入后显示条数统计
- 清空数据：
  - 二次确认弹窗（警告不可恢复）
  - 清空后自动刷新首页统计
- 人民网搜索按钮：
  - 首页按钮已可用，新标签页打开人民网搜索
- 设置页进入时自动加载已保存配置

### 📋 待办
- [ ] 第 7 步：联调测试完善
- [ ] 第 8 步：部署上线

### 🔧 下一步
第 7 步：联调测试完善（全流程走通、修复 bug、边界处理）

---

## 2026-05-31 — Bug 修复：人民网 URL + AI 存入格式解析

### 🐛 修复 1：人民网搜索跳转
- **问题**: 原 URL `http://search.people.com.cn/search` 无法访问
- **修复**: 改为正确的 `http://search.people.cn/`（人民网搜索主入口）

### 🐛 修复 2：AI 回答存入模块格式问题
- **问题**: 存入成语时，整个 AI 回答全跑到「释义」字段，其他字段为空
- **修复**: 新增 `parseAiContent(content, module)` 智能解析函数
  - 支持【成语】xxx【释义】xxx 格式的自动拆解
  - 每个模块定义了标签→字段映射：
    - 成语：【成语】→text,【释义】→meaning,【真题考法】→examUsage
    - 常识：【标题】→title,【内容】→content,【来源】→source
    - 实词：【实词】→word,【释义】→meaning,【辨析】→usage
    - 金句：【金句】→text,【出处】→source,【场景】→usage
  - 同时支持「标签：」格式
  - 解析失败时自动降级：内容填入主字段，去除【】标记
- **效果**: AI 回答中的结构化标签自动对应到表单各字段，无需手动复制

### 🔧 下一步
继续测试其他边界情况

---

## 2026-05-31 — 第 8 步完成：部署上线

### ✅ 完成
- 创建 README.md — 用户使用说明
- 创建 .gitignore
- 初始化 Git 仓库，提交所有代码（16 个文件，4195 行）
- 创建 GitHub 仓库 `Shxs-7/gongkao`
- 推送代码到 GitHub
- 开启 GitHub Pages
- 部署地址：**https://shxs-7.github.io/gongkao/**
- 配置 Git 远程地址（含 Token，后续可直接推送）

### 🌐 线上地址
- 仓库：https://github.com/Shxs-7/gongkao
- 网站：https://shxs-7.github.io/gongkao/
- 部署后等待 1-2 分钟生效

---

## 📊 项目总结

| 指标 | 数据 |
|------|------|
| 总文件数 | 16 个 |
| 代码总行数 | ~4200 行 |
| 开发步骤 | 8 步 |
| 功能模块 | 5 个页面 + 4 个子模块 |
| 零依赖 | 无任何第三方框架 |

### 核心功能
- ✅ 成语/常识/实词/金句 增删改查 + 搜索
- ✅ DeepSeek AI 问答 + 智能存入（自动解析格式）
- ✅ SM-2 间隔重复复习
- ✅ 数据导入/导出备份
- ✅ 人民网搜索跳转
- ✅ 移动端淡蓝色简洁 UI
