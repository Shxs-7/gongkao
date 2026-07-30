/* ========================================
   ai.js — AI 问答模块
   负责：DeepSeek API 调用、系统提示词、对话管理
   ======================================== */

/* === API 配置 === */
var AI_CONFIG = {
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-v4-flash',
  maxTokens: 2000,
  temperature: 0.7
};

/* === 系统提示词 === */
var SYSTEM_PROMPT =
  '你是一位专业的公务员考试辅导老师，精通公考各方面知识。\n' +
  '\n' +
  '## 你的知识领域\n' +
  '- 行测各模块：言语理解、数量关系、判断推理、资料分析、常识判断\n' +
  '- 申论：归纳概括、综合分析、提出对策、公文写作、大作文\n' +
  '- 面试：结构化面试、无领导小组讨论\n' +
  '- 公考基础知识：法律、政治、经济、管理、文史、科技、地理、时政热点\n' +
  '\n' +
  '## 知识积累格式\n' +
  '当用户请求解释或学习某个知识点时，按以下模块格式输出，方便存入复习：\n' +
  '\n' +
  '【成语】\n' +
  '【成语】xxx\n' +
  '【词性】xxx（如：名词/动词/形容词/褒义词/贬义词/中性词）\n' +
  '【意思】xxx（字面释义+深层含义）\n' +
  '【用法偏向】xxx（在公考真题中该成语的实际用法偏向，如：多用于否定句/多修饰抽象事物/多含贬义/侧重过程而非结果等）\n' +
  '【近义词】xxx, xxx, xxx\n' +
  '【反义词】xxx, xxx, xxx\n' +
  '【真题考法】xxx（历年真题中怎么考的，常见考查角度和陷阱）\n' +
  '【拓展】xxx（成语出处、典故背景、相关文化常识等拓展知识）\n' +
  '\n' +
  '【常识】\n' +
  '【标题】xxx\n' +
  '【内容】xxx\n' +
  '【来源】xxx\n' +
  '\n' +
  '【实词】\n' +
  '【实词】xxx\n' +
  '【释义】xxx\n' +
  '【用法】xxx（含和近义词的辨析区别）\n' +
  '\n' +
  '【金句】\n' +
  '【金句】xxx\n' +
  '【出处】xxx\n' +
  '【适用场景】xxx\n' +
  '\n' +
  '【固定搭配】\n' +
  '【固定搭配】xxx\n' +
  '【释义】xxx\n' +
  '【用法示例】xxx（在句子中的实际用法、常见语境）\n' +
  '【考查要点】xxx（行测逻辑填空中的高频考点、常见命题陷阱、相近搭配辨析）\n' +
  '\n' +
  '## 回答要求\n' +
  '- 分点作答、层次清晰，适合手机屏幕阅读\n' +
  '- 涉及成语时严格按上述成语格式完整输出，8个字段都要覆盖\n' +
  '- 用通俗易懂的语言，避免过于学术化\n' +
  '- 主动提醒常见误区和易错点\n' +
  '- 当涉及实时信息（如最新时政、政策变化）时，使用联网搜索获取最新数据';

/* === 联网搜索开关 === */
var webSearchEnabled = true;

/* ==============================================
   调用 DeepSeek API
   ============================================== */

// 发送消息，返回 AI 回复文本
// onStart: 开始请求时的回调（显示加载状态）
// onDone:  收到回复后的回调 (error, replyText)
function callDeepSeek(userMessage, onStart, onDone) {
  var apiKey = getApiKey();

  if (!apiKey) {
    if (onDone) onDone(new Error('NO_API_KEY'), null);
    return;
  }

  if (onStart) onStart();

  // 构建消息列表：系统提示词 + 最近 10 条对话历史 + 当前问题
  var messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  var history = getChatHistory();
  var recentHistory = history.slice(-10);
  recentHistory.forEach(function (msg) {
    messages.push({ role: msg.role, content: msg.content });
  });

  messages.push({ role: 'user', content: userMessage });

  // 构建请求体
  var body = {
    model: AI_CONFIG.model,
    messages: messages,
    max_tokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
    stream: false
  };

  // 联网搜索（V4模型支持）
  if (webSearchEnabled) {
    body.enable_web_search = true;
  }

  // 发起请求
  fetch(AI_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(body)
  })
  .then(function (response) {
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API_KEY_INVALID');
      } else if (response.status === 429) {
        throw new Error('RATE_LIMIT');
      } else {
        throw new Error('SERVER_ERROR');
      }
    }
    return response.json();
  })
  .then(function (data) {
    var reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '（AI 未返回内容，请重试）';

    // 保存对话历史
    addChatMessage('user', userMessage);
    addChatMessage('assistant', reply);

    if (onDone) onDone(null, reply);
  })
  .catch(function (err) {
    console.error('DeepSeek API 错误:', err);
    if (onDone) onDone(err, null);
  });
}

/* ==============================================
   错误消息映射
   ============================================== */

function getAiErrorMessage(err) {
  if (!err) return '';
  var msg = err.message || String(err);
  switch (msg) {
    case 'NO_API_KEY':
      return '请先去「我的」页面配置 DeepSeek API Key';
    case 'API_KEY_INVALID':
      return 'API Key 无效，请去「我的」页面重新配置';
    case 'RATE_LIMIT':
      return '提问太频繁，请稍后再试';
    case 'SERVER_ERROR':
      return 'AI 服务暂时不可用，请稍后再试';
    default:
      return '网络连接失败，请检查网络后重试';
  }
}

/* ==============================================
   存入模块 — 将 AI 回答按模块格式预填
   ============================================== */

// 从 AI 回答中解析【标签】格式的结构化内容
// 返回 { fieldKey: value, ... }
function parseAiContent(content, module) {
  var result = {};

  // 定义每种模块支持的标签映射
  var tagMap = {};
  switch (module) {
    case 'idioms':
      tagMap = {
        '成语': 'text',
        '词性': 'partOfSpeech',
        '意思': 'meaning',
        '释义': 'meaning',
        '用法偏向': 'usageBias',
        '近义词': 'synonyms',
        '反义词': 'antonyms',
        '真题考法': 'examUsage',
        '考法': 'examUsage',
        '拓展': 'extended'
      };
      break;
    case 'knowledge':
      tagMap = {
        '标题': 'title',
        '内容': 'content',
        '来源': 'source',
        '知识点': 'content'
      };
      break;
    case 'words':
      tagMap = {
        '实词': 'word',
        '词语': 'word',
        '释义': 'meaning',
        '含义': 'meaning',
        '用法': 'usage',
        '辨析': 'usage',
        '区别': 'usage'
      };
      break;
    case 'quotes':
      tagMap = {
        '金句': 'text',
        '原文': 'text',
        '出处': 'source',
        '来源': 'source',
        '场景': 'usage',
        '适用场景': 'usage',
        '用法': 'usage'
      };
      break;
    case 'collocations':
      tagMap = {
        '固定搭配': 'text',
        '搭配': 'text',
        '释义': 'meaning',
        '意思': 'meaning',
        '用法示例': 'usage',
        '用法': 'usage',
        '考查要点': 'examPoint',
        '考点': 'examPoint'
      };
      break;
  }

  // 匹配【xxx】内容 或 【xxx】: 内容 或 xxx：内容
  var tagNames = Object.keys(tagMap).join('|');
  // 先尝试全角【】格式
  var fullWidthRegex = new RegExp('【(' + tagNames + ')】[：:]?\s*([\\s\\S]*?)(?=\n【|\n\n【|$)', 'g');
  // 再尝试 标签：格式
  var colonRegex = new RegExp('^(' + tagNames + ')[：:]\\s*([\\s\\S]*?)(?=\n(?:' + tagNames + ')[：:]|\n\n(?:' + tagNames + ')[：:]|$)', 'gm');

  // 先用全角【】解析
  var match;
  var foundAny = false;
  while ((match = fullWidthRegex.exec(content)) !== null) {
    var tag = match[1];
    var value = match[2].trim();
    var key = tagMap[tag];
    if (key && value && !result[key]) {
      result[key] = value;
      foundAny = true;
    }
  }

  // 如果【】没解析到，尝试 标签：格式
  if (!foundAny) {
    while ((match = colonRegex.exec(content)) !== null) {
      var tag = match[1];
      var value = match[2].trim();
      var key = tagMap[tag];
      if (key && value && !result[key]) {
        result[key] = value;
      }
    }
  }

  return result;
}

// 获取某个模块的第一个字段名（作为兜底内容的填充目标）
function getPrimaryFieldKey(module) {
  switch (module) {
    case 'idioms':       return 'meaning';
    case 'knowledge':    return 'content';
    case 'words':        return 'meaning';
    case 'quotes':       return 'text';
    case 'collocations': return 'meaning';
    default:             return null;
  }
}

// 根据模块类型 + AI 回复内容，智能预填到对应字段
function getPrefillForModule(content, module) {
  // 先尝试解析结构化内容
  var parsed = parseAiContent(content, module);

  // 如果解析到了内容，使用解析结果
  var hasParsed = false;
  var keys = Object.keys(parsed);
  for (var i = 0; i < keys.length; i++) {
    if (parsed[keys[i]]) {
      hasParsed = true;
      break;
    }
  }

  if (hasParsed) {
    // 补全空字段
    var allFields = getFormLabels(module).fields;
    var prefill = {};
    allFields.forEach(function (f) {
      prefill[f.key] = parsed[f.key] || '';
    });
    return prefill;
  }

  // 解析失败 → 整个内容填到主字段
  var prefill = {};
  var primaryKey = getPrimaryFieldKey(module);

  // 清理内容中的【标签】标记，保留纯文本
  var cleanContent = content.replace(/【[^】]+】[：:]?\s*/g, '').trim();

  var allFields = getFormLabels(module).fields;
  allFields.forEach(function (f) {
    if (f.key === primaryKey) {
      prefill[f.key] = cleanContent || content;
    } else {
      prefill[f.key] = '';
    }
  });

  return prefill;
}

// 存入流程：弹出模块选择 → 选中后弹出预填表单
function saveAiAnswerToModule(content) {
  showModuleSelect(function (module) {
    var prefill = getPrefillForModule(content, module);
    showPrefillForm(module, prefill);
  });
}

