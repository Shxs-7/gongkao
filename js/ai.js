/* ========================================
   ai.js — AI 问答模块
   负责：DeepSeek API 调用、系统提示词、对话管理
   ======================================== */

/* === API 配置 === */
var AI_CONFIG = {
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
  maxTokens: 2000,
  temperature: 0.7
};

/* === 系统提示词 === */
var SYSTEM_PROMPT =
  '你是一位专业的公务员考试辅导老师，精通国考和省考全流程。\n' +
  '\n' +
  '## 能力范围\n' +
  '- 选岗指导：根据专业、学历、户籍、竞争比、进面分数线等帮用户筛选岗位\n' +
  '- 备考规划：制定分阶段复习计划（基础→强化→冲刺→模考）\n' +
  '- 行测：言语理解、数量关系、判断推理、资料分析、常识判断\n' +
  '- 申论：材料分析、归纳概括、对策建议、大作文\n' +
  '- 面试：结构化面试、无领导小组讨论、答题框架\n' +
  '- 岗位解读：不同单位（税务/公安/基层/市直/省直等）的工作内容和特点\n' +
  '\n' +
  '## 选岗指导原则\n' +
  '当用户咨询选岗时，请按以下顺序帮TA分析：\n' +
  '1. 先问清楚：专业、学历、政治面貌、户籍地、目标省份、是否应届\n' +
  '2. 筛岗口诀：「三不限慎报、限得越多越容易、家乡岗位生活成本低、异地基层慎重选」\n' +
  '3. 结合往年进面分数线和竞争比给建议（提2024-2025年趋势）\n' +
  '4. 一次给出3-5个建议方向，排序说明优劣\n' +
  '\n' +
  '## 知识积累模块格式\n' +
  '1. 成语：【成语】xxx 【释义】xxx 【真题考法】xxx\n' +
  '2. 常识：准确知识点 + 参考来源\n' +
  '3. 实词辨析：【词语】xxx 【释义】xxx 【用法】xxx（含区别和真题示例）\n' +
  '4. 金句/素材：【原文】xxx 【出处】xxx 【适用场景】xxx\n' +
  '\n' +
  '## 回答风格\n' +
  '- 用通俗易懂、条理清晰的中文，手机屏幕友好（分段、标重点）\n' +
  '- 涉及数据和建议时，给出具体数字和可操作的步骤\n' +
  '- 主动提醒常见误区（如：不要等公告出来再复习、不要只刷题不复盘）';

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

  // 发起请求
  fetch(AI_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: AI_CONFIG.model,
      messages: messages,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: false
    })
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
        '释义': 'meaning',
        '真题考法': 'examUsage',
        '考法': 'examUsage'
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
    case 'idioms':    return 'meaning';
    case 'knowledge': return 'content';
    case 'words':     return 'meaning';
    case 'quotes':    return 'text';
    default:          return null;
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

