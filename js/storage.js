/* ========================================
   storage.js — 数据层
   负责：localStorage 增删改查、导入导出
   所有数据的读写都通过这里的函数，不直接操作 localStorage
   ======================================== */

/* === 存储键名常量 === */
var STORAGE_KEYS = {
  idioms:      'gka_idioms',       // 成语
  knowledge:   'gka_knowledge',    // 常识
  words:       'gka_words',        // 实词
  quotes:      'gka_quotes',       // 金句
  settings:    'gka_settings',     // 用户设置
  chatHistory: 'gka_chat_history'  // AI 对话历史
};

/* === 模块名称映射 === */
var MODULE_LABELS = {
  idioms:    '成语',
  knowledge: '常识',
  words:     '实词',
  quotes:    '金句'
};

/* === ID 生成 === */
// 格式: <type>_<timestamp>_<random6>
function generateId(type) {
  var ts = Date.now();
  var rand = Math.random().toString(36).slice(2, 8);
  return type + '_' + ts + '_' + rand;
}

/* === 通用字段模板 === */
function createBaseFields() {
  var now = new Date().toISOString();
  return {
    id: '',
    createdAt: now,
    updatedAt: now,
    reviewCount: 0,
    reviewEase: 2.5,
    reviewInterval: 0,
    reviewNext: null,
    reviewHistory: []
  };
}

/* ==============================================
   基础 CRUD
   ============================================== */

// 读取某模块全部数据，返回数组
function getAll(module) {
  var key = STORAGE_KEYS[module];
  if (!key) return [];
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('读取数据失败:', module, e);
    return [];
  }
}

// 根据 ID 读取单条，找不到返回 null
function getById(module, id) {
  var list = getAll(module);
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) return list[i];
  }
  return null;
}

// 添加一条数据
// data 不需要传 id 和通用字段，会自动补全
// 返回添加后的完整对象
function addItem(module, data) {
  var key = STORAGE_KEYS[module];
  if (!key) return null;

  // 查重
  var dupField = getDedupField(module);
  if (dupField && data[dupField]) {
    var dup = findDuplicate(module, dupField, data[dupField]);
    if (dup) return { _duplicate: true, _existing: dup };
  }

  var base = createBaseFields();
  base.id = generateId(module === 'knowledge' ? 'knowledge' :
              module === 'idioms' ? 'idiom' :
              module === 'words' ? 'word' :
              module === 'quotes' ? 'quote' : 'item');
  var item = Object.assign({}, base, data);

  var list = getAll(module);
  list.unshift(item); // 新加的放最前面
  saveList(module, list);
  return item;
}

// 更新一条数据
// newData 只需要传要修改的字段
// 返回更新后的完整对象，找不到返回 null
function updateItem(module, id, newData) {
  var list = getAll(module);
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      newData.updatedAt = new Date().toISOString();
      Object.assign(list[i], newData);
      saveList(module, list);
      return list[i];
    }
  }
  return null;
}

// 删除一条数据
// 返回 true=删除成功，false=没找到
function removeItem(module, id) {
  var list = getAll(module);
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1);
      saveList(module, list);
      return true;
    }
  }
  return false;
}

// 保存列表到 localStorage
function saveList(module, list) {
  var key = STORAGE_KEYS[module];
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.error('保存数据失败（可能空间不足）:', module, e);
    throw new Error('存储空间不足，请清理一些数据');
  }
}

/* ==============================================
   搜索
   ============================================== */

// 模糊搜索
// module: 模块名
// keyword: 搜索关键词
// fields: 要搜索的字段名数组，如 ['text', 'meaning']
// 返回匹配的数组
function searchItems(module, keyword, fields) {
  if (!keyword || !keyword.trim()) {
    return getAll(module);
  }
  var kw = keyword.trim().toLowerCase();
  var list = getAll(module);
  return list.filter(function (item) {
    return fields.some(function (field) {
      var val = item[field];
      return val && String(val).toLowerCase().indexOf(kw) !== -1;
    });
  });
}

/* ==============================================
   数据统计
   ============================================== */

// 获取各模块数据条数
function getStats() {
  return {
    idioms:    getAll('idioms').length,
    knowledge: getAll('knowledge').length,
    words:     getAll('words').length,
    quotes:    getAll('quotes').length
  };
}

// 获取总条数
function getTotalCount() {
  var stats = getStats();
  return stats.idioms + stats.knowledge + stats.words + stats.quotes;
}

// 获取各模块的去重字段
function getDedupField(module) {
  switch (module) {
    case 'idioms':    return 'text';
    case 'knowledge': return 'title';
    case 'words':     return 'word';
    case 'quotes':    return 'text';
    default:          return null;
  }
}

// 查找重复项（按字段值匹配，忽略大小写和前后空格）
function findDuplicate(module, field, value, excludeId) {
  var list = getAll(module);
  var v = value.trim().toLowerCase();
  for (var i = 0; i < list.length; i++) {
    var itemVal = (list[i][field] || '').trim().toLowerCase();
    if (itemVal === v && list[i].id !== excludeId) {
      return list[i];
    }
  }
  return null;
}

// 计算 localStorage 总占用大小（字节）
function getStorageSize() {
  var totalBytes = 0;
  Object.keys(STORAGE_KEYS).forEach(function (mod) {
    var val = localStorage.getItem(STORAGE_KEYS[mod]);
    if (val) {
      // UTF-8 编码的字节数
      totalBytes += new TextEncoder().encode(val).length;
    }
  });
  return totalBytes;
}

// 格式化字节为可读大小
function formatStorageSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ==============================================
   数据导入导出
   ============================================== */

// 导出全部数据为 JSON 字符串
function exportAll() {
  var data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    idioms:    getAll('idioms'),
    knowledge: getAll('knowledge'),
    words:     getAll('words'),
    quotes:    getAll('quotes'),
    settings:  getSettings(),
    chatHistory: getChatHistory()
  };
  return JSON.stringify(data, null, 2);
}

// 导入 JSON 数据
// jsonStr: JSON 字符串
// merge: true=合并到现有数据，false=覆盖
// 返回 { success: true/false, message: '...' }
function importAll(jsonStr, merge) {
  try {
    var data = JSON.parse(jsonStr);

    // 基本校验
    if (!data.version) {
      return { success: false, message: '无效的备份文件格式' };
    }

    if (merge) {
      // 合并模式：追加到现有数据
      if (data.idioms && data.idioms.length) {
        var existing = getAll('idioms');
        saveList('idioms', mergeLists(existing, data.idioms));
      }
      if (data.knowledge && data.knowledge.length) {
        var existing = getAll('knowledge');
        saveList('knowledge', mergeLists(existing, data.knowledge));
      }
      if (data.words && data.words.length) {
        var existing = getAll('words');
        saveList('words', mergeLists(existing, data.words));
      }
      if (data.quotes && data.quotes.length) {
        var existing = getAll('quotes');
        saveList('quotes', mergeLists(existing, data.quotes));
      }
      if (data.settings) {
        saveSettings(data.settings);
      }
      if (data.chatHistory) {
        saveChatHistory(data.chatHistory);
      }
    } else {
      // 覆盖模式
      saveList('idioms', data.idioms || []);
      saveList('knowledge', data.knowledge || []);
      saveList('words', data.words || []);
      saveList('quotes', data.quotes || []);
      saveSettings(data.settings || {});
      saveChatHistory(data.chatHistory || []);
    }

    var total = (data.idioms ? data.idioms.length : 0) +
                (data.knowledge ? data.knowledge.length : 0) +
                (data.words ? data.words.length : 0) +
                (data.quotes ? data.quotes.length : 0);

    return { success: true, message: '成功导入 ' + total + ' 条数据' };
  } catch (e) {
    console.error('导入失败:', e);
    return { success: false, message: '文件解析失败，请检查文件格式' };
  }
}

// 合并两个列表，按 ID 去重（已存在的跳过）
function mergeLists(existing, incoming) {
  var idSet = {};
  existing.forEach(function (item) { idSet[item.id] = true; });
  var newItems = incoming.filter(function (item) { return !idSet[item.id]; });
  return existing.concat(newItems);
}

// 清空全部数据
function clearAll() {
  Object.keys(STORAGE_KEYS).forEach(function (mod) {
    localStorage.removeItem(STORAGE_KEYS[mod]);
  });
}

/* ==============================================
   设置管理
   ============================================== */

// 读取设置
function getSettings() {
  try {
    var raw = localStorage.getItem(STORAGE_KEYS.settings);
    var defaults = {
      apiKey: '',
      dailyReviewTarget: 10
    };
    return raw ? Object.assign(defaults, JSON.parse(raw)) : defaults;
  } catch (e) {
    return { apiKey: '', dailyReviewTarget: 10 };
  }
}

// 保存设置
function saveSettings(settings) {
  var current = getSettings();
  var merged = Object.assign(current, settings);
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(merged));
}

// 获取 API Key
function getApiKey() {
  return getSettings().apiKey || '';
}

// 保存 API Key
function saveApiKey(apiKey) {
  saveSettings({ apiKey: apiKey });
}

// 记录备份时间（导出时调用）
function recordBackup() {
  saveSettings({ lastBackupDate: getTodayDate() });
}

// 获取距离上次备份的天数，-1 表示从未备份
function getDaysSinceLastBackup() {
  var settings = getSettings();
  var lastDate = settings.lastBackupDate;
  if (!lastDate) return -1;

  var today = getTodayDate();
  var last = new Date(lastDate);
  var now = new Date(today);
  var diffMs = now - last;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// 检查是否应该自动备份（开启自动备份 + 今天还没备份过）
function shouldAutoBackup() {
  var settings = getSettings();
  // 默认开启自动备份
  if (settings.autoBackupEnabled === false) return false;
  var lastDate = settings.lastBackupDate;
  if (!lastDate) return true; // 从未备份过
  return lastDate !== getTodayDate();
}

// 获取上次备份时间的可读文本
function getLastBackupText() {
  var days = getDaysSinceLastBackup();
  if (days === -1) return '从未备份';
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  return days + '天前';
}

// 切换自动备份开关
function setAutoBackupEnabled(enabled) {
  saveSettings({ autoBackupEnabled: enabled });
}

/* ==============================================
   对话历史管理
   ============================================== */

// 读取对话历史（最近 100 条）
function getChatHistory() {
  try {
    var raw = localStorage.getItem(STORAGE_KEYS.chatHistory);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// 保存对话历史（自动截断到 100 条）
function saveChatHistory(history) {
  var trimmed = history.slice(-100);
  localStorage.setItem(STORAGE_KEYS.chatHistory, JSON.stringify(trimmed));
}

// 添加一条对话
function addChatMessage(role, content) {
  var msg = {
    id: generateId('chat'),
    role: role,
    content: content,
    timestamp: new Date().toISOString()
  };
  var history = getChatHistory();
  history.push(msg);
  saveChatHistory(history);
  return msg;
}

// 清空对话历史
function clearChatHistory() {
  localStorage.removeItem(STORAGE_KEYS.chatHistory);
}

