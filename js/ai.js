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
  '你是一位专业的公务员考试辅导老师，精通行测（言语理解、常识判断）、申论写作和结构化面试。\n' +
  '\n' +
  '回答要求：\n' +
  '1. 当用户问成语相关问题时，请按格式回答：\n' +
  '   【成语】xxx\n' +
  '   【释义】xxx\n' +
  '   【真题考法】xxx（如有）\n' +
  '2. 当用户问常识问题时，给出准确知识点，标注参考来源。\n' +
  '3. 当用户问实词辨析时，明确区别、例句和真题示例。\n' +
  '4. 当用户问金句/申论素材时，给出原文、出处和适用场景。\n' +
  '\n' +
  '请用通俗易懂、条理清晰的中文回答。回答简洁但完整，适合手机阅读。';

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

/* ==============================================
   每日时评 — 多文章来源
   ============================================== */

// 文章来源定义（官方时评 RSS）
var DAILY_SOURCES = [
  {
    id: 'people_opinion',
    label: '人民网·观点',
    rssUrl: 'http://www.people.com.cn/rss/opinion.xml',
    sourceName: '人民网',
    desc: '人民网观点频道时评'
  },
  {
    id: 'people_politics',
    label: '人民网·时政',
    rssUrl: 'http://politics.people.com.cn/rss/politics.xml',
    sourceName: '人民网',
    desc: '人民网时政频道'
  },
  {
    id: 'xinhua_comments',
    label: '新华网·评论',
    rssUrl: 'http://www.xinhuanet.com/comments/rss.xml',
    sourceName: '新华网',
    desc: '新华网评论频道'
  }
];

// 当前选中的来源
var currentDailySource = 'people_opinion';

// rss2json API（代理 CORS）
var RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// 切换当前来源
function setDailySource(sourceId) {
  var found = DAILY_SOURCES.filter(function (s) { return s.id === sourceId; });
  if (found.length > 0) currentDailySource = sourceId;
}

// 获取当前来源配置
function getCurrentSource() {
  var found = DAILY_SOURCES.filter(function (s) { return s.id === currentDailySource; });
  return found.length > 0 ? found[0] : DAILY_SOURCES[0];
}

// 根据 sourceId 获取来源配置
function getSourceById(sourceId) {
  var found = DAILY_SOURCES.filter(function (s) { return s.id === sourceId; });
  return found.length > 0 ? found[0] : null;
}

// 清理文章正文（去 HTML 标签 + 实体解码）
function cleanArticleContent(raw) {
  return (raw || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 从单个来源抓取文章列表（返回前 10 篇）
function fetchFromSource(source, onDone) {
  var apiUrl = RSS2JSON_API + encodeURIComponent(source.rssUrl);

  fetch(apiUrl, { signal: AbortSignal.timeout(15000) })
    .then(function (res) {
      if (!res.ok) throw new Error('API_ERROR');
      return res.json();
    })
    .then(function (data) {
      if (data.items && data.items.length > 0) {
        // 取前 10 篇，清理内容
        var articles = data.items.slice(0, 10).map(function (item) {
          return {
            title: item.title || '',
            content: cleanArticleContent(item.content || item.description || ''),
            sourceUrl: item.link || '',
            source: source.sourceName,
            sourceId: source.id
          };
        }).filter(function (a) { return a.title && a.content; }); // 去掉空文章

        if (articles.length > 0) {
          saveDailyArticles(articles, source.sourceName, source.id);
          onDone(null, articles, source);
        } else {
          onDone(new Error('NO_ARTICLE'), null, source);
        }
      } else {
        onDone(new Error('NO_ARTICLE'), null, source);
      }
    })
    .catch(function (err) {
      onDone(err, null, source);
    });
}

// 从当前选中的来源抓取，失败自动降级到其他来源
// onProgress(sourceId, status) — 每个来源的尝试状态
function fetchDailyArticleFromRSS(onDone, onProgress) {
  var sources = DAILY_SOURCES.slice();

  // 把当前选中的来源放到第一位
  var currentSource = getCurrentSource();
  sources.sort(function (a, b) {
    if (a.id === currentSource.id) return -1;
    if (b.id === currentSource.id) return 1;
    return 0;
  });

  var idx = 0;

  function tryNext() {
    if (idx >= sources.length) {
      // 所有来源都失败 → 尝试本地缓存
      if (onProgress) onProgress('', 'fallback_local');
      fetch('/daily-article.json?' + Date.now())
        .then(function (res) {
          if (!res.ok) throw new Error('NOT_FOUND');
          return res.json();
        })
        .then(function (data) {
          if (data.date === getTodayDate()) {
            // 兼容旧格式（单篇文章）
            if (data.title) {
              var articles = [{ title: data.title, content: data.content, sourceUrl: data.sourceUrl || '', source: data.source || '', sourceId: data.sourceId || '' }];
              saveDailyArticles(articles, data.source || '', data.sourceId || '');
            } else if (data.articles) {
              saveDailyArticles(data.articles, '', '');
            }
            onDone(null, getDailyArticles());
          } else {
            onDone(new Error('EXPIRED'), null);
          }
        })
        .catch(function () {
          onDone(new Error('ALL_FAILED'), null);
        });
      return;
    }

    var source = sources[idx];
    if (onProgress) onProgress(source.id, 'fetching');

    fetchFromSource(source, function (err, articles, src) {
      if (!err && articles && articles.length > 0) {
        // 成功！
        if (onProgress) onProgress(source.id, 'done');
        onDone(null, articles);
      } else {
        // 失败，试下一个
        if (onProgress) onProgress(source.id, 'failed');
        idx++;
        tryNext();
      }
    });
  }

  tryNext();
}

// AI 生成每日时评（兜底方案）
var DAILY_ARTICLE_PROMPT =
  '请以"时事评论员"的身份，写一篇简短的评论文章。\n' +
  '要求：围绕当下社会热点（民生、科技、乡村振兴、环保等），400-600字，\n' +
  '结构：标题+引入+分析+观点+总结。标题用【】括在最前面。';

function generateDailyArticle(onStart, onDone) {
  var apiKey = getApiKey();
  if (!apiKey) { onDone(new Error('NO_API_KEY'), null); return; }
  if (onStart) onStart();

  var messages = [
    { role: 'system', content: DAILY_ARTICLE_PROMPT },
    { role: 'user', content: '请随机选一个热点话题，生成一篇申论备考评论文章。' }
  ];

  fetch(AI_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: AI_CONFIG.model, messages: messages,
      max_tokens: 1500, temperature: 0.8, stream: false
    })
  })
  .then(function (r) {
    if (!r.ok) throw new Error(r.status === 401 ? 'API_KEY_INVALID' : 'SERVER_ERROR');
    return r.json();
  })
  .then(function (data) {
    var raw = data.choices[0].message.content;
    var m = raw.match(/【(.+?)】/);
    var articles = [{ title: m ? m[1] : '今日时评', content: raw.replace(/【.+?】\s*/, '').trim(), sourceUrl: '', source: 'AI生成', sourceId: 'ai' }];
    saveDailyArticles(articles, 'AI生成', 'ai');
    onDone(null, articles);
  })
  .catch(function (err) { onDone(err, null); });
}

// 获取每日时评（先试 RSS 多源，失败再用 AI 兜底）
function loadDailyArticle(onDone, onProgress) {
  fetchDailyArticleFromRSS(function (err, articles) {
    if (!err && articles && articles.length > 0) {
      // RSS 抓取成功
      onDone(null, articles);
    } else {
      // 全部来源失败，尝试 AI 生成
      if (onProgress) onProgress('', 'ai_fallback');
      generateDailyArticle(null, function (aiErr, aiArticles) {
        onDone(aiErr, aiArticles);
      });
    }
  }, onProgress);
}

// 返回来源列表（供 UI 渲染用）
function getDailySources() {
  return DAILY_SOURCES;
}
