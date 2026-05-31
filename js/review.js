/* ========================================
   review.js — 间隔重复算法
   负责：SM-2 简化算法、今日复习获取、复习提交
   ======================================== */

/* === 算法参数 === */
var REVIEW_PARAMS = {
  minEase: 1.3,       // 最低容易度
  maxEase: 2.5,       // 最高容易度
  initialEase: 2.5,   // 初始容易度
  initialInterval: 1  // 首次复习间隔（天）
};

/* ==============================================
   获取今日待复习条目
   从所有模块中筛选 reviewNext <= 今天的条目
   ============================================== */

function getTodayReviews() {
  var modules = ['idioms', 'knowledge', 'words', 'quotes'];
  var today = getTodayDate();
  var allItems = [];

  modules.forEach(function (mod) {
    var list = getAll(mod);
    list.forEach(function (item) {
      // 从未复习过（reviewNext === null）→ 加入
      if (item.reviewNext === null || item.reviewNext === undefined) {
        allItems.push({ item: item, module: mod });
      }
      // 到期了 → 加入
      else if (item.reviewNext <= today) {
        allItems.push({ item: item, module: mod });
      }
    });
  });

  // 按 reviewNext 排序：null 的优先（新内容），然后按日期升序
  allItems.sort(function (a, b) {
    var aNext = a.item.reviewNext;
    var bNext = b.item.reviewNext;
    if (aNext === null && bNext === null) return 0;
    if (aNext === null) return -1;
    if (bNext === null) return 1;
    return aNext.localeCompare(bNext);
  });

  return allItems;
}

// 获取今日需要复习的总数
function getTodayReviewCount() {
  return getTodayReviews().length;
}

/* ==============================================
   SM-2 简化算法 — 计算下次复习日期
   ============================================== */

function calculateNext(item, rating) {
  // rating: 1=忘了, 2=模糊, 3=记得, 4=很熟
  var ease = item.reviewEase || REVIEW_PARAMS.initialEase;
  var interval = item.reviewInterval || 0;
  var count = (item.reviewCount || 0) + 1; // 本次复习后的次数

  var newInterval;
  var newEase = ease;

  switch (rating) {
    case 1: // 忘了 → 明天再复习
      newInterval = 1;
      newEase = Math.max(REVIEW_PARAMS.minEase, ease - 0.2);
      count = 0; // 重置复习次数
      break;

    case 2: // 模糊 → 间隔减半
      newInterval = Math.max(1, Math.round(interval * 0.5));
      newEase = Math.max(REVIEW_PARAMS.minEase, ease - 0.15);
      break;

    case 3: // 记得 → 正常推进
      if (interval === 0) {
        newInterval = REVIEW_PARAMS.initialInterval; // 首次复习
      } else {
        newInterval = Math.round(interval * ease);
      }
      break;

    case 4: // 很熟 → 加速推进
      if (interval === 0) {
        newInterval = REVIEW_PARAMS.initialInterval + 1;
      } else {
        newInterval = Math.round(interval * ease * 1.3);
      }
      newEase = Math.min(REVIEW_PARAMS.maxEase, ease + 0.1);
      break;

    default:
      newInterval = 1;
  }

  // 计算下次复习日期
  var nextDate = addDays(getTodayDate(), newInterval);

  return {
    reviewCount: count,
    reviewEase: newEase,
    reviewInterval: newInterval,
    reviewNext: nextDate
  };
}

/* ==============================================
   提交复习结果
   ============================================== */

function submitReview(module, itemId, rating) {
  var item = getById(module, itemId);
  if (!item) return null;

  var result = calculateNext(item, rating);

  // 记录复习历史
  var history = item.reviewHistory || [];
  history.push({
    date: getTodayDate(),
    rating: rating
  });

  // 更新数据
  var updateData = {
    reviewCount: result.reviewCount,
    reviewEase: result.reviewEase,
    reviewInterval: result.reviewInterval,
    reviewNext: result.reviewNext,
    reviewHistory: history
  };

  return updateItem(module, itemId, updateData);
}

/* ==============================================
   日期工具函数
   ============================================== */

// 获取今天日期字符串 YYYY-MM-DD
function getTodayDate() {
  var d = new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// 给日期加 N 天
function addDays(dateStr, days) {
  var parts = dateStr.split('-');
  var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  d.setDate(d.getDate() + days);
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// 格式化日期为中文
function formatReviewDate(dateStr) {
  if (!dateStr) return '未安排';
  var today = getTodayDate();
  if (dateStr === today) return '今天';
  var tomorrow = addDays(today, 1);
  if (dateStr === tomorrow) return '明天';
  return dateStr;
}

/* ==============================================
   获取模块名称
   ============================================== */

function getModuleLabel(module) {
  var labels = { idioms: '成语', knowledge: '常识', words: '实词', quotes: '金句' };
  return labels[module] || module;
}

/* ==============================================
   获取复习条目的显示内容
   ============================================== */

function getReviewContent(item, module) {
  var content = '';
  switch (module) {
    case 'idioms':
      content = (item.examUsage || '') + '\n\n' + (item.meaning || '');
      break;
    case 'knowledge':
      content = item.content || '';
      if (item.source) content += '\n\n来源：' + item.source;
      break;
    case 'words':
      content = (item.meaning || '') + '\n\n' + (item.usage || '');
      break;
    case 'quotes':
      content = (item.source ? '出处：' + item.source + '\n\n' : '') + (item.usage || '');
      break;
  }
  return content.trim();
}
