// modules/history.js — 搜索历史

import { currentMode, dom } from './state.js';
import { esc } from './utils.js';

function _histKey() { return currentMode === 'game' ? 'game_search_history' : 'movie_search_history'; }
var HISTORY_MAX = 8;

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(_histKey())) || []; } catch (e) { return []; }
}

export function saveHistory(query) {
  var list = getHistory().filter(function(q) { return q !== query; });
  list.unshift(query);
  if (list.length > HISTORY_MAX) list = list.slice(0, HISTORY_MAX);
  localStorage.setItem(_histKey(), JSON.stringify(list));
  renderHistory();
}

export function removeHistory(query) {
  var list = getHistory().filter(function(q) { return q !== query; });
  localStorage.setItem(_histKey(), JSON.stringify(list));
  renderHistory();
}

export function renderHistory() {
  var hList = getHistory();
  if (hList.length === 0) {
    dom.histEl.innerHTML = '<div class="panel-label">最近搜索</div><div class="panel-empty">暂无搜索记录</div>';
  } else {
    dom.histEl.innerHTML = '<div class="panel-label">最近搜索</div>' +
      '<div class="history-list">' + hList.map(function(q) {
        return '<div class="history-chip" data-query="' + esc(q) + '">' +
          '<span class="history-text">' + esc(q) + '</span>' +
          '<button class="history-remove" data-query="' + esc(q) + '" title="删除">×</button>' +
          '</div>';
      }).join('') + '</div>';
  }
}

export function initHistory(doSearch) {
  dom.histToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = !dom.histEl.classList.contains('hidden');
    if (isOpen) { dom.histEl.classList.add('hidden'); dom.histToggle.classList.remove('active'); }
    else { dom.wishEl.classList.add('hidden'); dom.wishToggle.classList.remove('active'); renderHistory(); dom.histEl.classList.remove('hidden'); dom.histToggle.classList.add('active'); }
  });

  dom.histEl.addEventListener('click', function(e) {
    e.stopPropagation();
    var rmBtn = e.target.closest('.history-remove');
    if (rmBtn) { e.preventDefault(); removeHistory(rmBtn.dataset.query); return; }
    var chip = e.target.closest('.history-chip');
    if (chip) {
      dom.input.value = chip.dataset.query;
      doSearch(chip.dataset.query);
      dom.histEl.classList.add('hidden');
      dom.histToggle.classList.remove('active');
    }
  });

  document.addEventListener('click', function(e) {
    if (!dom.histEl.classList.contains('hidden') && !dom.histEl.contains(e.target) && !dom.histToggle.contains(e.target)) {
      dom.histEl.classList.add('hidden'); dom.histToggle.classList.remove('active');
    }
  });
}
