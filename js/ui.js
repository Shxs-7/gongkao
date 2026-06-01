/* ========================================
   ui.js — UI 渲染工具
   负责：列表渲染、表单生成、Toast 提示、弹窗确认
   ======================================== */

/* === HTML 转义（防 XSS） === */
function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* === 时间格式化 === */
function formatTime(isoStr) {
  if (!isoStr) return '';
  var d = new Date(isoStr);
  var now = new Date();
  var diff = now - d;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';

  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/* === 各模块搜索字段 === */
function getSearchFields(module) {
  switch (module) {
    case 'idioms':    return ['text', 'meaning', 'examUsage'];
    case 'knowledge': return ['title', 'content'];
    case 'words':     return ['word', 'meaning', 'usage'];
    case 'quotes':    return ['text', 'source', 'usage'];
    default:          return [];
  }
}

/* === 获取卡片标题 === */
function getItemTitle(item, module) {
  switch (module) {
    case 'idioms':    return item.text || '（无成语）';
    case 'knowledge': return item.title || '（无标题）';
    case 'words':     return item.word || '（无实词）';
    case 'quotes':    return (item.text || '（无内容）').slice(0, 40);
    default:          return '未知';
  }
}

/* === 获取卡片预览 === */
function getItemPreview(item, module) {
  switch (module) {
    case 'idioms':    return item.meaning || '';
    case 'knowledge': return (item.content || '').slice(0, 80);
    case 'words':     return item.meaning || '';
    case 'quotes':    return item.source || item.usage || '';
    default:          return '';
  }
}

/* ==============================================
   卡片列表渲染
   ============================================== */

function renderCardList(module) {
  var container = document.getElementById('accumulate-list');
  if (!container) return;

  var keyword = document.getElementById('search-input').value;
  var fields = getSearchFields(module);
  var list = searchItems(module, keyword, fields);

  if (list.length === 0) {
    container.innerHTML = '<div class="empty-hint">还没有内容，点击下方 + 添加</div>';
    return;
  }

  var html = '';
  list.forEach(function (item) {
    var title = escapeHtml(getItemTitle(item, module));
    var preview = escapeHtml(getItemPreview(item, module));
    var time = formatTime(item.createdAt);
    var badgeNew = item.reviewCount === 0 ? ' <span class="badge-new">新</span>' : '';

    html +=
      '<div class="card-item" data-id="' + item.id + '" data-module="' + module + '">' +
        '<div class="card-item-title">' + title + badgeNew + '</div>' +
        (preview ? '<div class="card-item-preview">' + preview + '</div>' : '') +
        '<div class="card-item-time">' + time + '</div>' +
      '</div>';
  });
  container.innerHTML = html;

  // 绑定卡片点击 → 打开编辑表单
  var cards = container.querySelectorAll('.card-item');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var id = this.getAttribute('data-id');
      var mod = this.getAttribute('data-module');
      var item = getById(mod, id);
      if (item) showItemForm(mod, item);
    });
  });
}

/* ==============================================
   表单（添加/编辑）
   ============================================== */

// 获取各模块的表单字段定义
function getFormLabels(module) {
  switch (module) {
    case 'idioms':
      return {
        moduleLabel: '成语',
        fields: [
          { key: 'text', label: '成语', placeholder: '如：推心置腹', type: 'text' },
          { key: 'meaning', label: '释义', placeholder: '成语的含义解释...', type: 'textarea' },
          { key: 'examUsage', label: '真题考法', placeholder: '如：2019年国考行测与"开诚布公"做近义词辨析...', type: 'textarea' }
        ]
      };
    case 'knowledge':
      return {
        moduleLabel: '常识',
        fields: [
          { key: 'title', label: '标题', placeholder: '如：我国四大盆地', type: 'text' },
          { key: 'content', label: '内容', placeholder: '常识知识点详细内容...', type: 'textarea' },
          { key: 'source', label: '来源（选填）', placeholder: '如：常识判断真题汇总', type: 'text' }
        ]
      };
    case 'words':
      return {
        moduleLabel: '实词',
        fields: [
          { key: 'word', label: '实词', placeholder: '如：推脱', type: 'text' },
          { key: 'meaning', label: '释义', placeholder: '实词的含义...', type: 'textarea' },
          { key: 'usage', label: '用法 / 辨析', placeholder: '如：推脱侧重推卸摆脱；推托侧重找借口拒绝...', type: 'textarea' }
        ]
      };
    case 'quotes':
      return {
        moduleLabel: '金句',
        fields: [
          { key: 'text', label: '金句原文', placeholder: '如：民为贵，社稷次之，君为轻。', type: 'textarea' },
          { key: 'source', label: '出处', placeholder: '如：《孟子·尽心下》', type: 'text' },
          { key: 'usage', label: '适用场景', placeholder: '如：申论大作文民生话题；面试群众路线题目...', type: 'textarea' }
        ]
      };
    default:
      return { moduleLabel: '', fields: [] };
  }
}

// 显示添加/编辑表单（浮层）
function showItemForm(module, item) {
  var isEdit = !!item;
  var labels = getFormLabels(module);
  if (!labels.fields.length) return;

  var html = '<div class="form-page" id="form-overlay">' +
    '<div class="form-header">' +
      '<button class="btn btn-sm btn-outline" id="form-cancel">取消</button>' +
      '<span class="form-header-title">' + (isEdit ? '编辑' : '添加') + labels.moduleLabel + '</span>' +
      (isEdit
        ? '<button class="btn btn-sm btn-danger" id="form-delete">删除</button>'
        : '<span style="width:48px"></span>') +
    '</div>' +
    '<div class="form-body">';

  labels.fields.forEach(function (field) {
    var value = isEdit ? (item[field.key] || '') : '';
    var inputHtml;
    if (field.type === 'textarea') {
      inputHtml = '<textarea id="form-field-' + field.key + '" placeholder="' + field.placeholder + '" rows="4">' + escapeHtml(value) + '</textarea>';
    } else {
      inputHtml = '<input type="text" id="form-field-' + field.key + '" placeholder="' + field.placeholder + '" value="' + escapeHtml(value) + '">';
    }
    html += '<div class="form-group">' +
      '<label>' + field.label + '</label>' +
      inputHtml +
      '</div>';
  });

  html += '<button class="btn btn-primary btn-block" id="form-save">保存</button>' +
    '</div></div>';

  // 插入表单浮层
  var app = document.getElementById('app');
  app.insertAdjacentHTML('beforeend', html);

  // --- 事件绑定 ---

  // 取消
  document.getElementById('form-cancel').addEventListener('click', closeForm);

  // 保存
  document.getElementById('form-save').addEventListener('click', function () {
    var data = {};
    labels.fields.forEach(function (field) {
      var el = document.getElementById('form-field-' + field.key);
      if (el) data[field.key] = el.value.trim();
    });

    // 校验第一个字段（必填）
    var firstField = labels.fields[0];
    if (!data[firstField.key]) {
      showToast('请填写' + firstField.label);
      return;
    }

    if (isEdit) {
      updateItem(module, item.id, data);
      showToast('已更新');
    } else {
      var result = addItem(module, data);
      if (result && result._duplicate) {
        showToast(labels.moduleLabel + '「' + data[getDedupField(module)] + '」已存在，请勿重复添加');
        return; // 不关闭表单，让用户修改
      }
      showToast('已添加');
    }

    closeForm();
    renderCardList(module);
    refreshHomeStats();
  });

  // 删除（仅编辑模式）
  if (isEdit) {
    document.getElementById('form-delete').addEventListener('click', function () {
      showDeleteConfirm(module, item.id, labels.moduleLabel);
    });
  }
}

// 关闭表单浮层
function closeForm() {
  var form = document.getElementById('form-overlay');
  if (form) form.remove();
}

/* ==============================================
   删除确认弹窗
   ============================================== */

function showDeleteConfirm(module, id, moduleLabel) {
  var overlay = document.getElementById('modal-overlay');
  var msg = document.getElementById('modal-msg');
  msg.textContent = '确定要删除这条' + moduleLabel + '吗？\n此操作不可恢复。';
  overlay.style.display = 'flex';

  var confirmBtn = document.getElementById('modal-confirm');
  var cancelBtn = document.getElementById('modal-cancel');

  function onConfirm() {
    removeItem(module, id);
    showToast('已删除');
    overlay.style.display = 'none';
    cleanup();
    closeForm();
    renderCardList(module);
    refreshHomeStats();
  }

  function onCancel() {
    overlay.style.display = 'none';
    cleanup();
  }

  function cleanup() {
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
  }

  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', onCancel);
}

/* ==============================================
   通用确认弹窗（设置页等使用）
   ============================================== */

function showConfirm(msg, onConfirm, confirmText) {
  var overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-msg').textContent = msg;
  var confirmBtn = document.getElementById('modal-confirm');
  confirmBtn.textContent = confirmText || '确认';
  overlay.style.display = 'flex';

  var cancelBtn = document.getElementById('modal-cancel');

  function handleConfirm() {
    overlay.style.display = 'none';
    cleanup();
    if (onConfirm) onConfirm();
  }

  function handleCancel() {
    overlay.style.display = 'none';
    cleanup();
  }

  function cleanup() {
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  }

  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

/* ==============================================
   Toast 提示
   ============================================== */

function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function () {
    toast.style.display = 'none';
  }, 1800);
}

/* ==============================================
   模块选择弹窗（AI 存入时使用）
   ============================================== */

function showModuleSelect(onSelect) {
  var html = '<div class="module-select-overlay" id="module-select-overlay" style="' +
    'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:160;' +
    'display:flex;align-items:flex-end;justify-content:center;">' +
    '<div class="module-select" style="position:relative;bottom:auto;">' +
      '<div class="module-select-title">存入哪个模块？</div>' +
      '<div class="module-select-list">' +
        '<button class="module-select-item" data-mod="idioms">📝 成语</button>' +
        '<button class="module-select-item" data-mod="knowledge">📚 常识</button>' +
        '<button class="module-select-item" data-mod="words">🔤 实词</button>' +
        '<button class="module-select-item" data-mod="quotes">⭐ 金句</button>' +
      '</div>' +
      '<button class="module-select-cancel" id="module-select-cancel">取消</button>' +
    '</div></div>';

  document.getElementById('app').insertAdjacentHTML('beforeend', html);

  document.querySelectorAll('.module-select-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mod = this.getAttribute('data-mod');
      closeModuleSelect();
      if (onSelect) onSelect(mod);
    });
  });

  document.getElementById('module-select-cancel').addEventListener('click', closeModuleSelect);
  document.getElementById('module-select-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeModuleSelect();
  });
}

function closeModuleSelect() {
  var el = document.getElementById('module-select-overlay');
  if (el) el.remove();
}

/* ==============================================
   预填表单（AI 存入时使用）
   与 showItemForm 类似，但接收预填数据而非完整 item
   ============================================== */

function showPrefillForm(module, prefill) {
  var labels = getFormLabels(module);
  if (!labels.fields.length) return;

  var html = '<div class="form-page" id="form-overlay">' +
    '<div class="form-header">' +
      '<button class="btn btn-sm btn-outline" id="form-cancel">取消</button>' +
      '<span class="form-header-title">存入' + labels.moduleLabel + '</span>' +
      '<span style="width:48px"></span>' +
    '</div>' +
    '<div class="form-body">';

  labels.fields.forEach(function (field) {
    var value = prefill[field.key] || '';
    var inputHtml;
    if (field.type === 'textarea') {
      inputHtml = '<textarea id="form-field-' + field.key + '" placeholder="' + field.placeholder + '" rows="4">' + escapeHtml(value) + '</textarea>';
    } else {
      inputHtml = '<input type="text" id="form-field-' + field.key + '" placeholder="' + field.placeholder + '" value="' + escapeHtml(value) + '">';
    }
    html += '<div class="form-group">' +
      '<label>' + field.label + '</label>' +
      inputHtml +
      '</div>';
  });

  html += '<button class="btn btn-primary btn-block" id="form-save">确认存入</button>' +
    '</div></div>';

  document.getElementById('app').insertAdjacentHTML('beforeend', html);

  // 取消
  document.getElementById('form-cancel').addEventListener('click', closeForm);

  // 保存
  document.getElementById('form-save').addEventListener('click', function () {
    var data = {};
    labels.fields.forEach(function (field) {
      var el = document.getElementById('form-field-' + field.key);
      if (el) data[field.key] = el.value.trim();
    });

    var firstField = labels.fields[0];
    if (!data[firstField.key]) {
      showToast('请填写' + firstField.label);
      return;
    }

    var result = addItem(module, data);
    if (result && result._duplicate) {
      showToast(labels.moduleLabel + '「' + data[getDedupField(module)] + '」已存在，请勿重复添加');
      return;
    }
    showToast('已存入' + labels.moduleLabel);
    closeForm();
    refreshHomeStats();
  });
}

/* ==============================================
   AI 对话渲染
   ============================================== */

// 渲染一条对话气泡
function renderChatBubble(role, content) {
  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + role;
  bubble.textContent = content;
  return bubble;
}

// 渲染 AI 回答（含存入按钮）
function renderAssistantBubble(content) {
  var wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.maxWidth = '100%';

  var bubble = document.createElement('div');
  bubble.className = 'chat-bubble assistant';
  bubble.textContent = content;
  wrapper.appendChild(bubble);

  // 存入按钮
  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn-save-to-module';
  saveBtn.textContent = '📥 存入...';
  saveBtn.addEventListener('click', function () {
    saveAiAnswerToModule(content);
  });
  wrapper.appendChild(saveBtn);

  return wrapper;
}

// 显示加载中
function renderChatLoading() {
  var loading = document.createElement('div');
  loading.className = 'chat-bubble assistant';
  loading.id = 'chat-loading';
  loading.textContent = '思考中...';
  loading.style.opacity = '0.6';
  document.getElementById('chat-area').appendChild(loading);
  scrollChatBottom();
}

// 移除加载中
function removeChatLoading() {
  var el = document.getElementById('chat-loading');
  if (el) el.remove();
}

// 滚动到聊天底部
function scrollChatBottom() {
  var area = document.getElementById('chat-area');
  setTimeout(function () {
    area.scrollTop = area.scrollHeight;
  }, 50);
}

// 清空聊天界面（保留欢迎语）
function clearChatDisplay() {
  var area = document.getElementById('chat-area');
  area.innerHTML = '<div class="chat-welcome">' +
    '<div class="welcome-icon">🤖</div>' +
    '<div class="welcome-text">你好！我是公考辅导助手</div>' +
    '<div class="welcome-sub">可以问我成语辨析、常识知识、实词用法、申论素材等问题</div>' +
    '</div>';
}

// 移除欢迎语（开始对话后）
function removeChatWelcome() {
  var welcome = document.querySelector('.chat-welcome');
  if (welcome) welcome.remove();
}
