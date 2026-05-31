# 技术规格说明

> 项目：公考积累宝  
> 版本：v1.0  
> 日期：2026-05-31  

---

## 一、运行环境

| 项目 | 要求 |
|------|------|
| 浏览器 | Chrome 80+ / Safari 13+ / Edge 80+（移动版） |
| 服务器 | 不需要，纯静态文件托管 |
| 网络 | AI 问答需联网，其余功能离线可用 |

---

## 二、前端技术

### 核心技术
- **HTML5**: 语义化标签，SPA 单页结构
- **CSS3**: Flexbox + Grid 布局，CSS 变量管理主题色
- **JavaScript (ES6+)**: 模块化设计，class/arrow function/template literal

### 零依赖原则
不引入任何第三方 JS 库或 CSS 框架。原因：
1. 减小加载体积（移动网络友好）
2. 降低维护门槛（懂基础 JS 就能改）
3. 不依赖 CDN（离线也能跑）

### 文件组织
```
js/storage.js   → 数据层（localStorage CRUD）
js/review.js    → 复习算法（SM-2）
js/ai.js        → AI 接口（DeepSeek API）
js/ui.js        → 界面渲染（DOM 操作）
js/app.js       → 应用入口（初始化、路由）
```

---

## 三、DeepSeek API 集成

### 接口信息
| 项目 | 值 |
|------|-----|
| 请求地址 | `https://api.deepseek.com/v1/chat/completions` |
| 认证方式 | `Authorization: Bearer <API_KEY>` |
| 模型 | `deepseek-chat` |
| 请求方法 | POST |

### 系统提示词
```
你是一位专业的公务员考试辅导老师，擅长行测言语理解、常识判断、申论写作和面试辅导。
请用通俗易懂的中文回答用户的问题。

当用户问成语相关问题时，给出成语释义、出处和真题考法。
当用户问常识问题时，给出准确的知识点并标注来源。
当用户问实词辨析时，给出明确的区别和例题。
当用户问金句/申论素材时，给出适用场景。
```

### 错误处理
- 网络错误 → 提示"网络连接失败，请检查网络"
- 401 → 提示"API Key 无效，请去设置页重新配置"
- 429 → 提示"请求太频繁，请稍后再试"
- 其他 → 提示"AI 服务暂时不可用，请稍后再试"

---

## 四、localStorage 存储方案

### 键名规范
所有键名以 `gka_` 为前缀（gka = 公考积累缩写）：

| 键名 | 类型 | 内容 |
|------|------|------|
| `gka_idioms` | Array | 成语列表 |
| `gka_knowledge` | Array | 常识列表 |
| `gka_words` | Array | 实词列表 |
| `gka_quotes` | Array | 金句列表 |
| `gka_settings` | Object | 用户设置 |
| `gka_chat_history` | Array | AI 对话历史 |

### 容量预估
- 单条成语数据约 300 字节
- 1000 条成语 ≈ 300KB
- 4 个模块各 1000 条 ≈ 1.2MB
- 对话历史约 200KB
- **总计约 1.5MB，远低于 5-10MB 浏览器限制**

### 数据安全
- 所有数据仅存本地浏览器
- 不上传任何服务器
- 提供导出备份功能防止数据丢失
- API Key 同样只存本地

---

## 五、间隔重复算法（SM-2 简化）

### 算法描述
基于 SuperMemo SM-2 算法的简化版本：

```
新条目首次复习：interval = 1（天）
之后复习：
  评分 1（忘了）  → interval = 1
  评分 2（模糊）  → interval = max(1, interval * 0.5)
  评分 3（记得）  → interval = interval * ease
  评分 4（很熟）  → interval = interval * ease * 1.3
  
  ease 因子范围：1.3 ~ 2.5
  ease 初始值：2.5
  ease 调整：评分低时降低 0.2，评分高时提高 0.1
```

### 数据结构
```js
reviewState: {
  reviewCount: 0,        // 已复习次数
  reviewEase: 2.5,       // 容易度因子
  reviewInterval: 0,     // 当前间隔（天）
  reviewNext: "2026-06-01", // 下次复习日期
  reviewHistory: []      // 复习历史 [{date, rating}]
}
```

---

## 六、浏览器兼容性

| 特性 | Chrome 80+ | Safari 13+ | Edge 80+ |
|------|-----------|-----------|---------|
| localStorage | ✅ | ✅ | ✅ |
| CSS 变量 | ✅ | ✅ | ✅ |
| Flexbox | ✅ | ✅ | ✅ |
| ES6 箭头函数 | ✅ | ✅ | ✅ |
| Fetch API | ✅ | ✅ | ✅ |
| Blob/FileReader | ✅ | ✅ | ✅ |

**不支持**: IE 全系列
