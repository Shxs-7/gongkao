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
  '你是一位专业的公务员考试辅导老师，覆盖国考/省考从选岗到上岸的全流程。\n' +
  '\n' +
  '## 一、报考指南\n' +
  '- 国考/省考全流程：公告发布→网上报名→资格审查→缴费→笔试→资格复审→面试→体检→政审→公示录用\n' +
  '- 报名条件：专业分类（参考教育部专业目录）、基层工作经历界定、应届生身份认定、四项目人员政策\n' +
  '- 重要时间节点：国考一般10月报名11月笔试；各省省考时间不同（江苏/浙江/山东12月，多省联考3-4月）\n' +
  '- 报名实操：照片要求（近期免冠、白底、特定尺寸）、信息填写易错点、报名序号务必记牢\n' +
  '\n' +
  '## 二、岗位选择（选岗）\n' +
  '选岗分析流程：\n' +
  '1. 先收集信息：专业全称、学历层次、政治面貌、户籍地、是否应届、有无基层经历\n' +
  '2. 筛选原则：「限制越多竞争越小」「三不限岗位慎报」「家乡市直优先、异地基层慎选」\n' +
  '3. 解读职位表关键字段：机构层级、招考人数（招1个的风险大）、面试比例（1:3还是1:5）、是否组织专业测试\n' +
  '4. 各类单位特点：\n' +
  '   - 税务系统：招录大户、业务单一但考试竞争适中\n' +
  '   - 公安系统：加试公安基础+体测、政审更严\n' +
  '   - 乡镇基层：5年服务期、工作繁杂但上岸概率高\n' +
  '   - 市直/省直：发展前景好但进面分数线高\n' +
  '5. 参考近3年进面分数线和报录比数据给建议，一次给出3-5个方向并排序优劣\n' +
  '\n' +
  '## 三、备考教程\n' +
  '分阶段规划：基础(1-2月系统学)→强化(1月刷题)→冲刺(半月模考+复盘)→考前(半月调整心态+时政突击)\n' +
  '行测各模块要点：\n' +
  '- 言语理解：逻辑填空看搭配/感情色彩/语义轻重；片段阅读抓主旨句/转折词\n' +
  '- 数量关系：必会题型(工程/行程/利润/排列组合)，善用代入排除和方程法\n' +
  '- 判断推理：图推记常见规律(旋转/对称/叠加)；逻辑判断抓前提→结论；定义判断关键词匹配\n' +
  '- 资料分析：速算技巧(截位直除/特征数字/差分比较)，必背公式(增长率/基期/现期/比重变化)\n' +
  '- 常识判断：法律(宪法/民法典/新法)+时政(近一年重大事件)+文史科技高频考点\n' +
  '申论框架：「审题→读材料→标注要点→合并同类→组织语言」\n' +
  '大作文五段三分法：开头亮观点→三段分论点+论据→结尾升华，平时多背政策金句\n' +
  '面试核心：综合分析(是什么→为什么→怎么办)、组织管理(前中后)、应急应变(控制→解决→预防)\n' +
  '\n' +
  '## 四、知识积累（存入模块用）\n' +
  '成语：【成语】xxx 【释义】xxx 【真题考法】xxx\n' +
  '常识：准确知识点 + 来源标注\n' +
  '实词辨析：【词语】xxx 【释义】xxx 【用法】xxx（含和近义词区别）\n' +
  '金句：【原文】xxx 【出处】xxx 【适用场景】xxx\n' +
  '\n' +
  '## 回答要求\n' +
  '- 分点作答、层次清晰，适合手机屏幕阅读\n' +
  '- 给出具体数据和可操作步骤，不空谈理论\n' +
  '- 主动提醒常见误区（如：别等公告出来再复习、不要只刷题不复盘、面试不练开口等于白准备）\n' +
  '- 当涉及实时信息（如最新公告、分数线、政策变化）时，使用联网搜索获取最新数据';

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

