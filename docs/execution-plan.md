# 分步执行计划

> 项目：公考积累宝  
> 版本：v1.0  
> 日期：2026-05-31  

---

## 执行总览

| 步骤 | 名称 | 状态 | 预计产出 |
|------|------|------|----------|
| 准备 | 文档体系搭建 | ✅ 完成 | docs/*.md, CLAUDE.md, DEVLOG.md |
| 第 1 步 | 项目骨架 | ✅ 完成 | index.html, css/style.css, js/*.js |
| 第 2 步 | 数据层 | ✅ 完成 | js/storage.js |
| 第 3 步 | 积累模块 | ✅ 完成 | js/ui.js, js/app.js, HTML 表单 |
| 第 4 步 | AI 问答 | ✅ 完成 | js/ai.js, 聊天界面 |
| 第 5 步 | 间隔重复 | ✅ 完成 | js/review.js, 复习界面 |
| 第 6 步 | 设置页面 | ✅ 完成 | 设置页、人民网按钮 |
| 第 7 步 | 联调测试 | 🔄 进行中 | Bug 修复、边界处理 |
| 第 8 步 | 部署上线 | ⏳ 待开始 | GitHub Pages 上线 |

---

## 准备阶段：文档体系搭建

### 目标
建立项目规范和参考标准，后续所有开发以 docs/ 文件为准。

### 产出清单
- [ ] docs/requirements.md — 需求规格说明书
- [ ] docs/tech-spec.md — 技术规格说明
- [ ] docs/design-spec.md — UI 设计规范
- [ ] docs/data-model.md — 数据模型定义
- [ ] docs/execution-plan.md — 本文件
- [ ] CLAUDE.md — AI 助手指引
- [ ] DEVLOG.md — 开发者日志

---

## 第 1 步：项目骨架搭建

### 目标
创建所有文件框架，浏览器打开能看到底部导航栏和 5 个页面基本结构。

### 输入
- docs/design-spec.md（颜色、布局规范）
- docs/data-model.md（了解数据结构，但本步不写逻辑）

### 产出
- `index.html` — 完整 HTML 结构
  - 5 个 Tab 的内容容器（首页/积累/AI问答/复习/我的）
  - 底部固定导航栏（5 个按钮）
  - 各模块基础骨架（列表区域、添加按钮）
- `css/style.css` — 全局样式
  - CSS 变量定义（颜色/字号/间距）
  - 移动端布局（max-width: 480px，居中）
  - 底部导航栏样式（固定底部、选中态）
  - 基础组件样式（卡片/按钮/输入框/对话框）

### 验证标准
1. 浏览器打开 index.html，页面居中、淡蓝色背景
2. 底部 5 个 Tab 可见，点击后高亮切换
3. 缩小浏览器窗口到手机宽度，布局不错乱
4. Tab 点击后对应内容区域显示/隐藏

### 不涉及
- ❌ 不写任何数据操作逻辑
- ❌ 不写 AI 相关代码
- ❌ 不写复习算法

---

## 第 2 步：数据层实现

### 目标
实现 localStorage 的完整读写封装，可在浏览器控制台测试。

### 输入
- docs/data-model.md（字段定义、键名规范）

### 产出
- `js/storage.js`
  - `generateId(type)` — 生成唯一 ID
  - `getAll(module)` — 读取某模块全部数据
  - `getById(module, id)` — 读取单条
  - `add(module, data)` — 添加一条
  - `update(module, id, data)` — 更新一条
  - `remove(module, id)` — 删除一条
  - `search(module, keyword, fields)` — 模糊搜索
  - `exportAll()` — 导出全部数据为 JSON 字符串
  - `importAll(jsonStr)` — 导入 JSON 数据
  - `clearAll()` — 清空全部数据

### 验证标准
1. 浏览器控制台调用 `add('idioms', {...})` 能存数据
2. `getAll('idioms')` 能读出刚存的数据
3. `remove('idioms', id)` 能删除
4. `exportAll()` 返回完整 JSON 字符串
5. 刷新页面后数据仍在

### 不涉及
- ❌ 不写界面渲染
- ❌ 不写 AI 逻辑

---

## 第 3 步：积累模块（成语/常识/实词/金句）

### 目标
实现 4 个模块的完整增删改查 + 搜索，用户可正常使用。

### 输入
- docs/data-model.md（字段定义）
- docs/design-spec.md（卡片、表单样式）
- js/storage.js（数据层 API）

### 产出
- `js/ui.js`
  - `renderList(module, container)` — 渲染列表
  - `renderCard(item, module)` — 渲染单张卡片
  - `showForm(module, item?)` — 显示添加/编辑表单
  - `showDeleteConfirm(id, module)` — 删除确认
  - `showToast(msg)` — 提示消息
- `js/app.js`
  - 模块切换逻辑（成语/常识/实词/金句 子 Tab）
  - 页面路由（5 个主 Tab）
  - 事件绑定
- 更新 `index.html`
  - 积累页子模块标签栏
  - 添加/编辑表单模板
  - 搜索框

### 验证标准
1. 在成语模块添加一条，列表立即显示
2. 点击成语卡片可编辑、可删除
3. 搜索框输入关键词，列表实时过滤
4. 切换到常识/实词/金句模块，同样正常
5. 刷新后数据不丢失

### 不涉及
- ❌ 不写 AI 问答
- ❌ 不写复习功能

---

## 第 4 步：AI 问答模块

### 目标
接入 DeepSeek API，实现对话功能，回答可存入模块。

### 输入
- docs/tech-spec.md（API 集成规范）
- docs/data-model.md（对话历史格式）
- js/storage.js

### 产出
- `js/ai.js`
  - `callDeepSeek(messages)` — API 调用封装
  - `buildSystemPrompt()` — 系统提示词
  - `saveToModule(content, module)` — 存入指定模块
- 更新 `index.html` — AI 问答页聊天界面
  - 对话气泡区域
  - 输入框 + 发送按钮
  - "存入..."按钮（每条 AI 回答下方）
  - 模块选择弹窗
- 更新 `js/ui.js` — 对话渲染函数

### 验证标准
1. 在设置页填入有效 API Key
2. 提问公考问题，收到 AI 回答
3. 无 API Key 时有明确提示
4. 点击"存入..."→选模块→内容可编辑→确认保存
5. 去对应模块列表能看到刚存入的内容

### 不涉及
- ❌ 不写复习功能
- ❌ 不写数据导入导出

---

## 第 5 步：间隔重复复习

### 目标
SM-2 算法 + 复习界面，首页显示今日复习提醒。

### 输入
- docs/tech-spec.md（SM-2 算法规格）
- docs/data-model.md（review 字段定义）
- js/storage.js

### 产出
- `js/review.js`
  - `getTodayReviews()` — 获取今日需复习条目
  - `calculateNext(rating, item)` — 计算下次复习日期
  - `submitReview(item, rating)` — 提交复习结果
- 更新 `index.html`
  - 首页：今日复习列表 + 统计
  - 复习页：复习卡片（题目 → 揭晓答案 → 评分）
- 更新 `js/ui.js` — 复习卡片渲染
- 更新 `js/app.js` — 复习流程控制

### 验证标准
1. 新添加的条目出现在首页"待复习"列表
2. 进入复习页，显示题目（不显示答案）
3. 点击"显示答案"后答案出现
4. 点击 1-4 评分后自动跳到下一条
5. 评分为 4 的条目下次复习日期在 15 天后

### 不涉及
- ❌ 不写设置页功能

---

## 第 6 步：设置页面 + 人民网搜索

### 目标
实现设置页全部功能，完善用户体验。

### 输入
- js/storage.js（数据管理 API）

### 产出
- 更新 `index.html` — 设置页内容
  - API Key 输入框
  - 每日复习目标设置
  - 数据导出按钮
  - 数据导入按钮（文件选择）
  - 清空数据按钮 + 确认对话框
  - 人民网搜索按钮
- 更新 `js/ui.js` — 设置相关渲染
- 更新 `js/app.js` — 设置页事件绑定

### 验证标准
1. API Key 输入后保存，AI 问答可用
2. 导出 JSON → 文件正常下载
3. 选择 JSON 文件导入 → 数据恢复
4. 清空数据 → 二次确认 → 全部清空
5. 点击人民网搜索 → 新标签页打开人民网

---

## 第 7 步：联调测试完善

### 目标
全流程走通，修复 Bug，处理边界情况。

### 检查清单
- [ ] 空数据状态：每个模块无数据时有友好提示
- [ ] 大量数据：添加 50+ 条数据列表滚动流畅
- [ ] 网络异常：AI 问答时断网有错误提示
- [ ] 数据一致性：导入导出后数据完整
- [ ] 移动端实测：用手机浏览器完整走一遍
- [ ] 删除确认：所有删除操作有确认提示
- [ ] 输入校验：必填字段为空时提示

---

## 第 8 步：部署上线

### 目标
部署到 GitHub Pages，任何手机可访问。

### 步骤
1. 在 GitHub 创建仓库 `gongkao-accumulate`
2. 初始化 Git，推送到 GitHub
3. 开启 GitHub Pages（Settings → Pages → main 分支）
4. 等待部署完成，获得网址
5. 手机浏览器访问测试
6. 编写 `README.md`（使用说明）

### 验证标准
- 手机用 4G/5G 访问网址，所有功能正常
- README 清晰易懂，小白能按步骤配置
