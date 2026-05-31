# 数据模型定义

> 项目：公考积累宝  
> 版本：v1.0  
> 日期：2026-05-31  

---

## 一、通用字段

每种数据（成语、常识、实词、金句）都包含以下通用字段：

```js
{
  // === 标识 ===
  id: "string",              // 唯一标识: <type>_<timestamp>_<random6>
                              // 例: "idiom_1717160000000_a3f8k2"

  // === 时间 ===
  createdAt: "string",       // ISO 日期字符串 "2026-05-31T10:30:00.000Z"
  updatedAt: "string",       // ISO 日期字符串，更新时修改

  // === 间隔重复 ===
  reviewCount: 0,            // 已复习次数
  reviewEase: 2.5,           // 容易度因子 (1.3 ~ 2.5)
  reviewInterval: 0,         // 当前复习间隔（天）
  reviewNext: null,          // 下次复习日期 (ISO 或 null 表示待首次复习)
  reviewHistory: []          // [{ date: "ISO", rating: 1-4 }]
}
```

---

## 二、成语 (Idiom)

**localStorage 键**: `gka_idioms`  
**存储格式**: JSON 数组

```js
{
  // 通用字段
  id: "idiom_1717160000000_a3f8k2",
  createdAt: "2026-05-31T10:30:00.000Z",
  updatedAt: "2026-05-31T10:30:00.000Z",
  reviewCount: 0,
  reviewEase: 2.5,
  reviewInterval: 0,
  reviewNext: null,
  reviewHistory: [],

  // 专属字段
  text: "推心置腹",           // 成语（必填）
  meaning: "把赤诚的心交给人家，比喻真心待人。",  // 释义（必填）
  examUsage: "2019年国考行测：与'开诚布公'做近义词辨析，推心置腹更强调以真心待人。"  // 真题考法（选填）
}
```

---

## 三、常识 (Knowledge)

**localStorage 键**: `gka_knowledge`  
**存储格式**: JSON 数组

```js
{
  // 通用字段
  id: "knowledge_1717160000001_b4g9m3",
  createdAt: "2026-05-31T11:00:00.000Z",
  updatedAt: "2026-05-31T11:00:00.000Z",
  reviewCount: 0,
  reviewEase: 2.5,
  reviewInterval: 0,
  reviewNext: null,
  reviewHistory: [],

  // 专属字段
  title: "我国四大盆地",      // 标题（必填）
  content: "塔里木盆地、准噶尔盆地、柴达木盆地、四川盆地。其中塔里木盆地是我国最大的盆地。",  // 内容（必填）
  source: "常识判断真题汇总"   // 来源（选填）
}
```

---

## 四、实词 (Word)

**localStorage 键**: `gka_words`  
**存储格式**: JSON 数组

```js
{
  // 通用字段
  id: "word_1717160000002_c5h0n4",
  createdAt: "2026-05-31T11:30:00.000Z",
  updatedAt: "2026-05-31T11:30:00.000Z",
  reviewCount: 0,
  reviewEase: 2.5,
  reviewInterval: 0,
  reviewNext: null,
  reviewHistory: [],

  // 专属字段
  word: "推脱",              // 实词（必填）
  meaning: "推卸、推辞（多用于责任、义务）",  // 释义（必填）
  usage: "辨析：'推脱'侧重推卸、摆脱；'推托'侧重找借口拒绝。例：推脱责任 / 推托有事不去。"  // 用法/辨析（选填）
}
```

---

## 五、金句 (Quote)

**localStorage 键**: `gka_quotes`  
**存储格式**: JSON 数组

```js
{
  // 通用字段
  id: "quote_1717160000003_d6i1p5",
  createdAt: "2026-05-31T12:00:00.000Z",
  updatedAt: "2026-05-31T12:00:00.000Z",
  reviewCount: 0,
  reviewEase: 2.5,
  reviewInterval: 0,
  reviewNext: null,
  reviewHistory: [],

  // 专属字段
  text: "民为贵，社稷次之，君为轻。",  // 金句原文（必填）
  source: "《孟子·尽心下》",          // 出处（选填）
  usage: "申论大作文：以人民为中心、民生话题；面试：群众路线相关题目。"  // 适用场景（选填）
}
```

---

## 六、用户设置 (Settings)

**localStorage 键**: `gka_settings`  
**存储格式**: JSON 对象

```js
{
  apiKey: "",                  // DeepSeek API Key
  dailyReviewTarget: 10,       // 每日复习目标条数
  peopleSearchUrl: "http://search.people.com.cn/search?query="  // 人民网搜索前缀
}
```

---

## 七、AI 对话历史 (Chat History)

**localStorage 键**: `gka_chat_history`  
**存储格式**: JSON 数组，仅保留最近 100 条

```js
[
  {
    id: "chat_1717160000004_e7j2q6",
    role: "user",                 // "user" | "assistant"
    content: "推心置腹和开诚布公有什么区别？",
    timestamp: "2026-05-31T12:30:00.000Z"
  },
  {
    id: "chat_1717160000005_f8k3r7",
    role: "assistant",
    content: "推心置腹侧重以真心待人...",
    timestamp: "2026-05-31T12:30:05.000Z"
  }
]
```

---

## 八、ID 生成规则

```
格式: <type>_<timestamp>_<random6>

type:     idiom | knowledge | word | quote | chat
timestamp: Date.now() 毫秒时间戳
random6:  6 位随机小写字母数字

生成函数:
function generateId(type) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${type}_${ts}_${rand}`;
}
```
