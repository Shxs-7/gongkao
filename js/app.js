/* ========================================
   app.js — 应用入口
   负责：页面路由、Tab 切换、事件绑定、协调各模块
   ======================================== */

/* === 当前选中的子模块 === */
var currentSubModule = 'idioms';

/* ==============================================
   页面路由
   ============================================== */

function switchPage(pageName) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  // 显示目标页面
  var target = document.getElementById('page-' + pageName);
  if (target) target.classList.add('active');

  // 更新底部导航选中态
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
  var navItem = document.querySelector('.nav-item[data-page="' + pageName + '"]');
  if (navItem) navItem.classList.add('active');

  // 切换页面时刷新对应数据
  if (pageName === 'home') {
    refreshHomeStats();
  } else if (pageName === 'accumulate') {
    renderCardList(currentSubModule);
  } else if (pageName === 'review') {
    initReview();
  } else if (pageName === 'settings') {
    initSettings();
  }
}

/* ==============================================
   底部导航
   ============================================== */

document.querySelectorAll('.nav-item').forEach(function (btn) {
  btn.addEventListener('click', function () {
    switchPage(this.getAttribute('data-page'));
  });
});

/* ==============================================
   首页快捷入口
   ============================================== */

document.querySelectorAll('.stat-item').forEach(function (item) {
  item.addEventListener('click', function () {
    currentSubModule = this.getAttribute('data-module');
    // 同步子模块标签栏选中态
    document.querySelectorAll('.sub-tab').forEach(function (t) { t.classList.remove('active'); });
    var targetTab = document.querySelector('.sub-tab[data-sub="' + currentSubModule + '"]');
    if (targetTab) targetTab.classList.add('active');
    switchPage('accumulate');
  });
});

/* ==============================================
   首页刷新
   ============================================== */

function refreshHomeStats() {
  var stats = getStats();
  document.getElementById('stat-idioms').textContent = stats.idioms;
  document.getElementById('stat-knowledge').textContent = stats.knowledge;
  document.getElementById('stat-words').textContent = stats.words;
  document.getElementById('stat-quotes').textContent = stats.quotes;
  document.getElementById('total-count').textContent = getTotalCount();

  // 今日待复习数
  var todayCount = getTodayReviewCount();
  document.getElementById('today-count').textContent = todayCount;

  // 今日复习列表
  renderTodayReviewList();

  // 每日时评
  refreshDailyArticle();

  // 备份提醒
  checkBackupReminder();
}

// 刷新每日时评显示
function refreshDailyArticle() {
  // 先渲染来源选择器
  renderSourceChips();

  // 再看 localStorage 有没有今天的
  var cached = getDailyArticle();
  if (cached) {
    showDailyArticle(cached);
    return;
  }

  // 没有缓存 → 尝试服务器文件
  fetch('/daily-article.json?' + Date.now())
    .then(function (res) {
      if (!res.ok) throw new Error('no file');
      return res.json();
    })
    .then(function (serverArticle) {
      if (serverArticle.date === getTodayDate()) {
        saveDailyArticle(serverArticle.title, serverArticle.content, serverArticle.sourceUrl, serverArticle.source, serverArticle.sourceId || '');
        showDailyArticle(serverArticle);
      } else {
        showDailyEmpty();
      }
    })
    .catch(function () {
      showDailyEmpty();
    });
}

// 渲染文章来源选择器
function renderSourceChips() {
  var container = document.getElementById('source-chips');
  if (!container) return;

  var sources = getDailySources();
  var html = '';
  sources.forEach(function (src) {
    var activeClass = src.id === currentDailySource ? ' active' : '';
    html += '<span class="source-chip' + activeClass + '" data-source="' + src.id + '" title="' + src.desc + '">' + src.label + '</span>';
  });
  container.innerHTML = html;

  // 绑定点击事件
  container.querySelectorAll('.source-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var sourceId = this.getAttribute('data-source');
      setDailySource(sourceId);
      // 更新选中样式
      container.querySelectorAll('.source-chip').forEach(function (c) {
        c.classList.remove('active', 'fetching', 'failed', 'done');
        if (c.getAttribute('data-source') === sourceId) {
          c.classList.add('active');
        }
      });
      // 更新按钮文字
      updateRefreshButtonText();
      // 自动刷新
      refreshArticleFromSource();
    });
  });
}

// 更新刷新按钮文字
function updateRefreshButtonText() {
  var btn = document.getElementById('btn-generate-daily');
  if (!btn) return;
  var src = getCurrentSource();
  btn.textContent = '🔄 刷新今日时评（' + src.label + '）';
}

// 从当前来源刷新文章
function refreshArticleFromSource() {
  var btn = document.getElementById('btn-generate-daily');
  var source = getCurrentSource();

  btn.textContent = '⏳ 正在获取...';
  btn.disabled = true;

  // 更新来源 chip 状态
  updateSourceChipStatus(source.id, 'fetching');

  fetchDailyArticleFromRSS(
    function (err, article) {
      btn.disabled = false;
      updateRefreshButtonText();

      if (err) {
        updateSourceChipStatus(source.id, 'failed');
        showToast('获取失败，请尝试其他来源');
      } else {
        updateSourceChipStatus(source.id, 'done');
        setTimeout(function () {
          updateSourceChipStatus(source.id, 'active');
        }, 1500);
        showDailyArticle(article);
        showToast('已更新：' + article.title.slice(0, 20) + '...');
      }
    },
    function (sourceId, status) {
      // 进度回调
      if (status === 'fetching') {
        updateSourceChipStatus(sourceId, 'fetching');
      } else if (status === 'failed') {
        updateSourceChipStatus(sourceId, 'failed');
      } else if (status === 'fallback_local') {
        // 所有来源失败，尝试本地缓存
      } else if (status === 'ai_fallback') {
        // 尝试 AI 生成
      }
    }
  );
}

// 更新来源 chip 的显示状态
function updateSourceChipStatus(sourceId, status) {
  var chips = document.querySelectorAll('#source-chips .source-chip');
  chips.forEach(function (chip) {
    if (chip.getAttribute('data-source') === sourceId) {
      chip.classList.remove('active', 'fetching', 'failed', 'done');
      if (status === 'active') {
        chip.classList.add('active');
      } else if (status) {
        chip.classList.add(status);
      }
    }
  });
}

function showDailyArticle(article) {
  document.getElementById('daily-empty').style.display = 'none';
  document.getElementById('daily-article-card').style.display = 'block';
  document.getElementById('btn-generate-daily').style.display = 'none';
  document.getElementById('daily-title').textContent = article.title;

  var srcEl = document.getElementById('daily-source');
  if (article.source) {
    srcEl.style.display = 'block';
    srcEl.textContent = '来源：' + article.source;
  } else {
    srcEl.style.display = 'none';
  }

  document.getElementById('daily-content').textContent = article.content;

  var linkEl = document.getElementById('daily-link');
  if (article.sourceUrl) {
    linkEl.style.display = 'inline-flex';
    linkEl.href = article.sourceUrl;
  } else {
    linkEl.style.display = 'none';
  }

  // 显示来源徽章
  var badge = document.getElementById('daily-source-badge');
  if (badge && article.sourceId) {
    var srcConfig = getSourceById(article.sourceId);
    if (srcConfig) {
      var badgeClass = article.sourceId.indexOf('xinhua') !== -1 ? 'xinhua' : 'people';
      badge.className = 'daily-article-source-badge ' + badgeClass;
      badge.textContent = '📌 ' + srcConfig.label;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  } else if (badge && article.source) {
    badge.className = 'daily-article-source-badge people';
    badge.textContent = '📌 ' + article.source;
    badge.style.display = 'inline-block';
  } else if (badge) {
    badge.style.display = 'none';
  }
}

function showDailyEmpty() {
  document.getElementById('daily-empty').style.display = 'block';
  document.getElementById('daily-article-card').style.display = 'none';
  document.getElementById('btn-generate-daily').style.display = 'block';
  // 确保来源选择器可见
  var selector = document.getElementById('source-selector');
  if (selector) selector.style.display = 'flex';
  updateRefreshButtonText();
}

// 刷新每日时评按钮（使用当前选中的来源）
document.getElementById('btn-generate-daily').addEventListener('click', function () {
  refreshArticleFromSource();
});

// 存入金句按钮
document.getElementById('btn-save-daily').addEventListener('click', function () {
  var article = getDailyArticle();
  if (!article) return;
  var prefill = { text: article.title + '\n\n' + article.content, source: article.source || '每日时评', usage: '申论写作参考' };
  showPrefillForm('quotes', prefill);
});

// 检测备份提醒
function checkBackupReminder() {
  var banner = document.getElementById('backup-reminder');
  if (!banner) return;

  var days = getDaysSinceLastBackup();
  if (days === -1) {
    // 从未备份过
    banner.style.display = 'block';
    banner.innerHTML = '⚠️ 你还没有备份过数据，建议<a id="go-backup" style="color:var(--primary);font-weight:600;">立即备份</a>';
  } else if (days >= 7) {
    // 超过7天
    banner.style.display = 'block';
    banner.innerHTML = '⚠️ 已 ' + days + ' 天未备份，建议<a id="go-backup" style="color:var(--primary);font-weight:600;">立即备份</a>';
  } else {
    banner.style.display = 'none';
  }

  // 点击跳转到设置页
  var link = document.getElementById('go-backup');
  if (link) {
    link.addEventListener('click', function () {
      switchPage('settings');
    });
  }
}

/* ==============================================
   积累页 — 子模块切换
   ============================================== */

document.querySelectorAll('.sub-tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.sub-tab').forEach(function (t) { t.classList.remove('active'); });
    this.classList.add('active');
    currentSubModule = this.getAttribute('data-sub');
    renderCardList(currentSubModule);
  });
});

/* ==============================================
   积累页 — 搜索
   ============================================== */

var searchTimer = null;
document.getElementById('search-input').addEventListener('input', function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function () {
    renderCardList(currentSubModule);
  }, 250); // 250ms 防抖
});

/* ==============================================
   积累页 — 添加按钮（悬浮 +）
   ============================================== */

document.getElementById('btn-add-item').addEventListener('click', function () {
  showItemForm(currentSubModule, null);
});

/* ==============================================
   积累页 — 兼容旧的 refreshAccumulateList 调用
   ============================================== */

function refreshAccumulateList() {
  renderCardList(currentSubModule);
}

/* ==============================================
   AI 问答 — 发送消息
   ============================================== */

function sendAiMessage() {
  var input = document.getElementById('chat-input');
  var msg = input.value.trim();
  if (!msg) return;

  // 检查 API Key
  if (!getApiKey()) {
    showToast('请先去「我的」页面配置 API Key');
    return;
  }

  // 清空输入框
  input.value = '';

  // 移除欢迎语
  removeChatWelcome();

  // 渲染用户气泡
  var chatArea = document.getElementById('chat-area');
  chatArea.appendChild(renderChatBubble('user', msg));
  scrollChatBottom();

  // 显示加载中
  renderChatLoading();

  // 调用 AI
  callDeepSeek(msg,
    function onStart() {
      // 已经开始加载
    },
    function onDone(err, reply) {
      removeChatLoading();
      if (err) {
        chatArea.appendChild(renderChatBubble('assistant', getAiErrorMessage(err)));
      } else {
        chatArea.appendChild(renderAssistantBubble(reply));
      }
      scrollChatBottom();
    }
  );
}

// 发送按钮
document.getElementById('btn-send').addEventListener('click', sendAiMessage);

// 回车发送
document.getElementById('chat-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAiMessage();
  }
});

/* ==============================================
   间隔重复 — 复习流程
   ============================================== */

var reviewQueue = [];    // 今日待复习列表 [{item, module}]
var reviewIndex = 0;     // 当前复习位置

// 初始化复习：加载今日待复习列表
function initReview() {
  reviewQueue = getTodayReviews();
  reviewIndex = 0;

  var emptyHint = document.getElementById('review-empty');
  var card = document.getElementById('review-card');
  var showBtn = document.getElementById('btn-show-answer');
  var ratingBtns = document.getElementById('rating-buttons');

  if (reviewQueue.length === 0) {
    // 无待复习内容
    emptyHint.style.display = 'block';
    card.style.display = 'none';
    showBtn.style.display = 'none';
    ratingBtns.style.display = 'none';
  } else {
    emptyHint.style.display = 'none';
    card.style.display = 'block';
    showReviewItem();
  }
}

// 显示当前复习条目
function showReviewItem() {
  if (reviewIndex >= reviewQueue.length) {
    // 全部复习完成
    showReviewComplete();
    return;
  }

  var entry = reviewQueue[reviewIndex];
  var item = entry.item;
  var mod = entry.module;

  // 模块标签
  document.getElementById('review-module-tag').textContent = getModuleLabel(mod);

  // 题目（只显示标题，不显示答案）
  var question = getItemTitle(item, mod);
  document.getElementById('review-question').textContent = question;

  // 隐藏答案
  document.getElementById('review-answer').style.display = 'none';
  document.getElementById('review-answer-content').textContent = '';

  // 按钮状态
  document.getElementById('btn-show-answer').style.display = 'block';
  document.getElementById('rating-buttons').style.display = 'none';

  // 显示卡片
  document.getElementById('review-card').style.display = 'block';
  document.getElementById('review-empty').style.display = 'none';
}

// 显示答案
document.getElementById('btn-show-answer').addEventListener('click', function () {
  if (reviewIndex >= reviewQueue.length) return;

  var entry = reviewQueue[reviewIndex];
  var content = getReviewContent(entry.item, entry.module);

  document.getElementById('review-answer-content').textContent = content || '（无详细内容）';
  document.getElementById('review-answer').style.display = 'block';
  document.getElementById('btn-show-answer').style.display = 'none';
  document.getElementById('rating-buttons').style.display = 'block';
});

// 评分按钮
document.querySelectorAll('.rating-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var rating = parseInt(this.getAttribute('data-rating'));
    if (reviewIndex >= reviewQueue.length) return;

    var entry = reviewQueue[reviewIndex];
    submitReview(entry.module, entry.item.id, rating);

    reviewIndex++;
    showReviewItem();
  });
});

// 复习完成
function showReviewComplete() {
  document.getElementById('review-card').style.display = 'none';
  document.getElementById('btn-show-answer').style.display = 'none';
  document.getElementById('rating-buttons').style.display = 'none';
  document.getElementById('review-empty').style.display = 'block';
  document.getElementById('review-empty').innerHTML =
    '<div style="text-align:center;padding:32px;">' +
    '<div style="font-size:48px;margin-bottom:12px;">🎉</div>' +
    '<div style="font-size:16px;color:var(--text-primary);">今日复习完成！</div>' +
    '<div style="font-size:13px;color:var(--text-secondary);margin-top:8px;">已复习 ' + reviewQueue.length + ' 条内容</div>' +
    '</div>';
}

// 首页今日复习列表渲染
function renderTodayReviewList() {
  var container = document.getElementById('today-review-list');
  var list = getTodayReviews();
  var maxShow = 5; // 首页最多显示 5 条

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-hint">暂无待复习内容，去积累页添加一些吧 🎉</div>';
    return;
  }

  var html = '';
  var showList = list.slice(0, maxShow);
  showList.forEach(function (entry) {
    var title = escapeHtml(getItemTitle(entry.item, entry.module));
    var modLabel = getModuleLabel(entry.module);
    html +=
      '<div class="review-today-item">' +
        '<span class="review-today-tag">' + modLabel + '</span>' +
        '<span class="review-today-title">' + title + '</span>' +
      '</div>';
  });

  if (list.length > maxShow) {
    html += '<div class="review-today-more">还有 ' + (list.length - maxShow) + ' 条，去复习页查看 →</div>';
  }

  container.innerHTML = html;

  // 点击跳转到复习页
  container.querySelectorAll('.review-today-item').forEach(function (el, i) {
    el.addEventListener('click', function () {
      switchPage('review');
      initReview();
    });
  });
}

/* ==============================================
   设置页
   ============================================== */

// 初始化设置页（加载已保存的 API Key）
function initSettings() {
  var settings = getSettings();
  document.getElementById('setting-apikey').value = settings.apiKey || '';

  // 显示存储占用
  var bytes = getStorageSize();
  document.getElementById('storage-size').textContent = formatStorageSize(bytes);

  // 存储进度条（以 5MB 为上限）
  var limitMB = 5;
  var pct = Math.min(100, (bytes / (limitMB * 1024 * 1024)) * 100);
  var bar = document.getElementById('storage-bar');
  bar.style.width = pct + '%';
  // 颜色：<50% 蓝色，50-80% 黄色，>80% 红色
  if (pct > 80) bar.style.background = '#E74C3C';
  else if (pct > 50) bar.style.background = '#F39C12';
  else bar.style.background = 'var(--primary)';
}

// 保存 API Key
document.getElementById('btn-save-apikey').addEventListener('click', function () {
  var apiKey = document.getElementById('setting-apikey').value.trim();
  saveApiKey(apiKey);
  showToast(apiKey ? 'API Key 已保存' : 'API Key 已清空');
});

// 导出数据
document.getElementById('btn-export').addEventListener('click', function () {
  var jsonStr = exportAll();
  var blob = new Blob([jsonStr], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '公考积累宝_备份_' + getTodayDate() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  recordBackup(); // 记录本次备份时间
  showToast('数据已导出');
});

// 导入数据 — 点击按钮触发文件选择
document.getElementById('btn-import').addEventListener('click', function () {
  document.getElementById('import-file').click();
});

// 导入数据 — 文件选择后处理
document.getElementById('import-file').addEventListener('change', function () {
  var file = this.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function (e) {
    var result = importAll(e.target.result, true); // 合并模式
    showToast(result.message);
    if (result.success) {
      refreshHomeStats();
    }
  };
  reader.onerror = function () {
    showToast('文件读取失败，请重试');
  };
  reader.readAsText(file);
  // 清空 input，允许重复导入同一文件
  this.value = '';
});

// 清空全部数据
// 一键导入预置成语
document.getElementById('btn-preset-idioms').addEventListener('click', function () {
  showConfirm('将导入 25 条近5年高频成语（重复的会自动跳过），确定吗？', function () {
    var count = importPresetIdioms();
    showToast('已导入 ' + count + ' 条成语' + (count === 0 ? '（都已存在）' : ''));
    refreshHomeStats();
  }, '确认导入');
});

// 清空全部数据
document.getElementById('btn-clear').addEventListener('click', function () {
  showConfirm('⚠️ 确定要清空全部数据吗？\n包括所有成语、常识、实词、金句、对话记录。\n此操作不可恢复！', function () {
    clearAll();
    showToast('全部数据已清空');
    refreshHomeStats();
    renderCardList(currentSubModule);
  }, '确认清空');
});

/* ==============================================
   页面加载完成
   ============================================== */

document.addEventListener('DOMContentLoaded', function () {
  console.log('公考积累宝 初始化完成');
  currentSubModule = 'idioms';
  refreshHomeStats();
  switchPage('home');
});
