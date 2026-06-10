// app.js — 对味了前端入口

import { currentMode, setCurrentMode, dom, initDom, modeState, setLastRenderedMode } from './modules/state.js';
import { initTheme } from './modules/theme.js';
import { initTags, clearSelectedTags, renderTagLabels } from './modules/tags.js';
import { initHistory, renderHistory } from './modules/history.js';
import { initWishlist, renderWishlist } from './modules/wishlist.js';
import { initCardActions } from './modules/render.js';
import { doSearch, startPlaceholderRotation, stopPlaceholderRotation, saveModeState, restoreModeState, initAiUnderstand } from './modules/search.js';

// ── 初始化 ──
initDom();
initTheme();
initTags(dom.input);
initHistory(doSearch);
initWishlist();
initCardActions();
initAiUnderstand();
startPlaceholderRotation();

// ── 模式切换 ──
dom.modeTabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    if (tab.dataset.mode === currentMode) return;

    saveModeState();

    dom.modeTabs.forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    setCurrentMode(tab.dataset.mode);

    document.documentElement.setAttribute('data-mode', currentMode);

    clearSelectedTags();

    dom.histEl.classList.add('hidden');
    dom.histToggle.classList.remove('active');
    dom.wishEl.classList.add('hidden');
    dom.wishToggle.classList.remove('active');

    startPlaceholderRotation();

    var s = modeState[currentMode];
    var canSkip = s.results.length > 0;

    if (canSkip) {
      restoreModeState();
      renderHistory();
      renderWishlist();
    } else {
      document.body.classList.add('mode-switching');
      setTimeout(function() {
        restoreModeState();
        document.body.classList.remove('mode-switching');
        dom.resultsEl.classList.add('fade-in');
        setTimeout(function() { dom.resultsEl.classList.remove('fade-in'); }, 350);
        renderHistory();
        renderWishlist();
      }, 250);
    }
  });
});

// ── 搜索按钮 + 回车 ──
function getSearchQuery() {
  var query = dom.input.value.trim();
  if (!query) {
    // 输入框为空时，用当前 placeholder 示例搜索（去掉"试试："前缀）
    var ph = dom.input.placeholder || '';
    query = ph.replace(/^试试[：:]\s*/, '');
  }
  return query;
}
dom.btn.addEventListener('click', function() {
  var query = getSearchQuery();
  if (query) doSearch(query);
});
dom.input.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    var query = getSearchQuery();
    if (query) doSearch(query);
  }
});
dom.input.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  if (this.value.length > 0) stopPlaceholderRotation();
  else startPlaceholderRotation();
});

// ── 加载更多 ──
dom.loadMoreBtn.addEventListener('click', function() {
  import('./modules/render.js').then(function(m) { m.renderPage(); });
});

// ── 空结果推荐点击 ──
dom.altEl.addEventListener('click', function(e) {
  var chip = e.target.closest('.alt-chip');
  if (chip) { dom.input.value = chip.dataset.query; doSearch(chip.dataset.query); }
});

// ── URL 参数自动搜索 ──
(function checkUrlSearch() {
  var params = new URLSearchParams(window.location.search);
  var q = params.get('q');
  var m = params.get('m');
  if (m === 'movie' || m === 'game') {
    setCurrentMode(m);
    dom.modeTabs.forEach(function(t) {
      t.classList.toggle('active', t.dataset.mode === m);
    });
    stopPlaceholderRotation();
    document.documentElement.setAttribute('data-mode', m);
  }
  if (q) {
    dom.input.value = q;
    setTimeout(function() { doSearch(q); }, 300);
  }
})();

// ── 初始化渲染 ──
document.documentElement.setAttribute('data-mode', currentMode);
renderHistory();
renderWishlist();

// ── Escape 键关闭面板 ──
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    // 关闭历史面板
    if (!dom.histEl.classList.contains('hidden')) {
      dom.histEl.classList.add('hidden');
      dom.histToggle.classList.remove('active');
    }
    // 关闭想玩面板
    if (!dom.wishEl.classList.contains('hidden')) {
      dom.wishEl.classList.add('hidden');
      dom.wishToggle.classList.remove('active');
    }
    // 关闭标签面板
    if (!dom.tagPanel.classList.contains('hidden')) {
      dom.tagPanel.classList.add('hidden');
      dom.tagLabels.forEach(function(l) { l.classList.remove('active'); });
    }
    // 关闭所有卡片详情
    document.querySelectorAll('.card-detail').forEach(function(d) { d.remove(); });
    document.querySelectorAll('.btn-expand.active').forEach(function(b) { b.classList.remove('active'); });
  }
});
