// modules/wishlist.js — Wishlist

import { currentMode, dom, allResults } from './state.js';
import { esc } from './utils.js';

function _wishKey() { return currentMode === 'game' ? 'game_wishlist' : 'movie_wishlist'; }

export function getWishlist() {
  try { return JSON.parse(localStorage.getItem(_wishKey())) || []; } catch (e) { return []; }
}

export function toggleWishlist(item) {
  var list = getWishlist();
  var id = item.appid || item.name;
  var idx = list.findIndex(function(g) { return (g.appid || g.name) === id; });
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    if (currentMode === 'game') {
      list.unshift({
        appid: item.appid, name: item.name, header_image: item.header_image,
        steam_url: item.steam_url, tags: (item.tags || []).slice(0, 4),
        positive_ratio: item.positive_ratio, match_reason: item.match_reason || '',
        short_description: item.short_description || ''
      });
    } else {
      list.unshift({
        name: item.name, poster: item.poster, rating: item.rating,
        year: item.year, tags: (item.tags || []).slice(0, 4),
        type: item.type, match_reason: item.match_reason || '', desc: item.desc || ''
      });
    }
    if (list.length > 30) list = list.slice(0, 30);
  }
  localStorage.setItem(_wishKey(), JSON.stringify(list));
  return idx < 0;
}

export function isInWishlist(item) {
  var id = item.appid || item.name;
  return getWishlist().some(function(g) { return (g.appid || g.name) === id; });
}

export function renderWishlist() {
  var wList = getWishlist();
  if (wList.length === 0) {
    var emptyLabel = currentMode === 'game' ? 'Game Wishlist' : 'Movie Wishlist';
    dom.wishEl.innerHTML = '<div class="panel-label">' + emptyLabel + '</div><div class="panel-empty">No saved items yet</div>';
  } else {
    var label = currentMode === 'game' ? 'Game Wishlist' : 'Movie Wishlist';
    var isMovie = currentMode === 'movie';
    var itemsHtml = wList.map(function(g) {
      var imgSrc = isMovie ? g.poster : g.header_image;
      var id = g.appid || g.name;
      var imgClass = isMovie ? 'wishlist-img movie-poster' : 'wishlist-img';
      var headerRight = '';
      if (isMovie) {
        if (g.rating) headerRight += '<span class="wishlist-rating">' + g.rating + '</span>';
        if (g.type) headerRight += '<span class="wishlist-type">' + (g.type === 'tv' ? 'TV' : 'Movie') + '</span>';
      }
      var tagsHtml = (g.tags || []).slice(0, 4).map(function(t) {
        return '<span>' + esc(t) + '</span>';
      }).join('');
      var initial = esc((g.name || '?').charAt(0));
      var imgTag = imgSrc
        ? '<img class="' + imgClass + '" src="' + esc(imgSrc) + '" onerror="if(!this.dataset.retried){this.dataset.retried=1;this.src=\'/api/proxy-image?url=\'+encodeURIComponent(this.src)}else{var d=document.createElement(\'div\');d.className=\'' + imgClass + ' img-placeholder\';d.innerHTML=\'<span>' + initial + '</span>\';this.replaceWith(d)}">'
        : '<div class="' + imgClass + ' img-placeholder"><span>' + initial + '</span></div>';
      return '<div class="wishlist-item" data-id="' + esc(id) + '">' +
        imgTag +
        '<div class="wishlist-info">' +
        '<div class="wishlist-header"><div class="wishlist-name">' + esc(g.name) + '</div>' + headerRight + '</div>' +
        (tagsHtml ? '<div class="wishlist-tags">' + tagsHtml + '</div>' : '') +
        '</div>' +
        '<button class="wishlist-remove" data-id="' + esc(id) + '" title="Remove">&times;</button>' +
        '</div>';
    }).join('');
    dom.wishEl.innerHTML = '<div class="panel-label">' + label + ' <span class="wishlist-count">' + wList.length + '</span></div>' +
      '<div class="wishlist-scroll">' + itemsHtml + '</div>' +
      '<button class="btn-wishlist-save"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save as Image</button>';
  }
}

export function initWishlist() {
  dom.wishToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = !dom.wishEl.classList.contains('hidden');
    if (isOpen) { dom.wishEl.classList.add('hidden'); dom.wishToggle.classList.remove('active'); }
    else { dom.histEl.classList.add('hidden'); dom.histToggle.classList.remove('active'); renderWishlist(); dom.wishEl.classList.remove('hidden'); dom.wishToggle.classList.add('active'); }
  });

  dom.wishEl.addEventListener('click', function(e) {
    e.stopPropagation();
    if (e.target.closest('.btn-wishlist-save')) {
      import('./share.js').then(function(m) { m.generateWishlistImage(); });
      return;
    }
    var rmBtn = e.target.closest('.wishlist-remove');
    if (rmBtn) {
      var id = rmBtn.dataset.id;
      var numId = parseInt(id);
      var isNum = !isNaN(numId);
      var list = getWishlist().filter(function(g) {
        var gId = g.appid || g.name;
        return isNum ? gId !== numId : gId !== id;
      });
      localStorage.setItem(_wishKey(), JSON.stringify(list));
      renderWishlist();
      if (getWishlist().length > 0) dom.wishEl.classList.remove('hidden');
      document.querySelectorAll('.btn-wishlist').forEach(function(b) {
        var bIdx = parseInt(b.dataset.idx);
        var bItem = allResults[bIdx];
        if (bItem) {
          var bId = bItem.appid || bItem.name;
          if (isNum ? bId === numId : bId === id) {
            b.classList.remove('active');
            var svg = b.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'none');
          }
        }
      });
      return;
    }
    var wItem = e.target.closest('.wishlist-item');
    if (wItem) {
      var wId = wItem.dataset.id;
      var wNumId = parseInt(wId);
      var wGame = getWishlist().find(function(g) { return (g.appid || g.name) === (isNaN(wNumId) ? wId : wNumId); });
      if (wGame) {
        if (wGame.steam_url) window.open(wGame.steam_url, '_blank');
        else if (currentMode === 'movie') window.open('https://www.imdb.com/find?q=' + encodeURIComponent(wGame.name), '_blank');
      }
    }
  });

  document.addEventListener('click', function(e) {
    if (!dom.wishEl.classList.contains('hidden') && !dom.wishEl.contains(e.target) && !dom.wishToggle.contains(e.target)) {
      dom.wishEl.classList.add('hidden'); dom.wishToggle.classList.remove('active');
    }
  });
}
