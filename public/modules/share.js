// modules/share.js — Image share generation

import { currentMode } from './state.js';
import { getWishlist } from './wishlist.js';
import { showToast, hexToRgba, roundRect, wrapText, esc } from './utils.js';

// ── Background drawing ──
function drawBackground(ctx, W, H, isLight, glowStr, glowPinkStr) {
  var bgColor = isLight ? '#f5f3ff' : '#0e0c14';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  var orbOpacity = isLight ? 0.15 : 0.35;
  var g1 = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, W * 0.5);
  g1.addColorStop(0, 'rgba(' + glowStr + ',' + orbOpacity + ')');
  g1.addColorStop(0.55, 'rgba(' + glowStr + ',0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
  var g2 = ctx.createRadialGradient(W * 0.75, H * 0.65, 0, W * 0.75, H * 0.65, W * 0.45);
  g2.addColorStop(0, 'rgba(' + glowPinkStr + ',' + (orbOpacity * 0.7) + ')');
  g2.addColorStop(0.5, 'rgba(' + glowPinkStr + ',0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  var g3 = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.35);
  g3.addColorStop(0, 'rgba(' + glowStr + ',' + (orbOpacity * 0.5) + ')');
  g3.addColorStop(0.5, 'rgba(' + glowStr + ',0)');
  ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);
  return bgColor;
}

// ── Top decoration line ──
function drawTopLine(ctx, W, accentColor, accentPinkColor) {
  var topGrad = ctx.createLinearGradient(0, 0, W, 0);
  topGrad.addColorStop(0, accentColor);
  topGrad.addColorStop(0.6, accentPinkColor);
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 4);
}

// ── Header info ──
function drawHeader(ctx, W, PAD, title, items, avgScore, isMovie, textPrimary, textTertiary, textAccent, accentColor, logoImg) {
  if (logoImg && logoImg.naturalWidth > 0) {
    var logoH = 36;
    var logoW = logoH * (logoImg.naturalWidth / logoImg.naturalHeight);
    ctx.drawImage(logoImg, PAD, 48 - logoH, logoW, logoH);
  } else {
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText('JustRight', PAD, 48);
  }
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = textPrimary;
  ctx.textAlign = 'right';
  ctx.fillText(title, W - PAD, 48);
  ctx.textAlign = 'left';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = textTertiary;
  ctx.fillText('github.com/your-repo', PAD, 70);
  if (avgScore > 0) {
    ctx.font = '13px sans-serif';
    ctx.fillStyle = textAccent;
    ctx.fillText(items.length + ' items · Avg match ' + avgScore + '%', PAD, 92);
  } else {
    ctx.font = '13px sans-serif';
    ctx.fillStyle = textAccent;
    ctx.fillText(items.length + (isMovie ? ' movies' : ' games'), PAD, 92);
  }
}

// ── Gradient divider ──
function createGradientLineDrawer(ctx, accentColor, accentPinkColor) {
  return function drawGradientLine(y, PAD, W) {
    var lg = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
    lg.addColorStop(0, accentColor);
    lg.addColorStop(0.5, accentPinkColor);
    lg.addColorStop(1, 'transparent');
    ctx.fillStyle = lg;
    ctx.fillRect(PAD, y, W - PAD * 2, 1);
  };
}

// ── Single card drawing ──
function drawCard(ctx, item, i, images, opts) {
  var y = opts.startY + i * (opts.cardH + opts.gap);
  var PAD = opts.PAD, W = opts.W;
  var textPrimary = opts.textPrimary, textSecondary = opts.textSecondary;
  var textAccent = opts.textAccent, textTertiary = opts.textTertiary;
  var accentColor = opts.accentColor, accentPinkColor = opts.accentPinkColor;
  var tagBg = opts.tagBg, tagText = opts.tagText, bgColor = opts.bgColor;
  var noImgBg = opts.noImgBg, noImgText = opts.noImgText;

  // Card background
  roundRect(ctx, PAD, y, W - PAD * 2, opts.cardH, 12);
  ctx.fillStyle = opts.cardBg;
  ctx.fill();
  ctx.strokeStyle = opts.cardBorder;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Left gradient bar
  var barGrad = ctx.createLinearGradient(PAD, y, PAD, y + opts.cardH);
  barGrad.addColorStop(0, accentColor);
  barGrad.addColorStop(1, accentPinkColor);
  roundRect(ctx, PAD, y, 3, opts.cardH, 1.5);
  ctx.fillStyle = barGrad;
  ctx.fill();

  // Cover image
  var img = images[i];
  var coverX = PAD + opts.imgPad + 3;
  var coverY = y + (opts.cardH - opts.imgH) / 2;
  if (img && img.naturalWidth > 0) {
    ctx.save();
    roundRect(ctx, coverX, coverY, opts.imgW, opts.imgH, 8);
    ctx.clip();
    var ratio = Math.max(opts.imgW / img.naturalWidth, opts.imgH / img.naturalHeight);
    var dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
    ctx.drawImage(img, coverX + (opts.imgW - dw) / 2, coverY + (opts.imgH - dh) / 2, dw, dh);
    ctx.restore();
    var maskGrad = ctx.createLinearGradient(coverX + opts.imgW - 40, 0, coverX + opts.imgW, 0);
    maskGrad.addColorStop(0, 'transparent');
    maskGrad.addColorStop(1, bgColor);
    ctx.fillStyle = maskGrad;
    ctx.fillRect(coverX + opts.imgW - 40, coverY, 40, opts.imgH);
  } else {
    roundRect(ctx, coverX, coverY, opts.imgW, opts.imgH, 8);
    ctx.fillStyle = noImgBg;
    ctx.fill();
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = noImgText;
    ctx.textAlign = 'center';
    var shortName = item.name.length > 8 ? item.name.substring(0, 8) + '…' : item.name;
    ctx.fillText(shortName, coverX + opts.imgW / 2, y + opts.cardH / 2 + 5);
    ctx.textAlign = 'left';
  }

  // Text area
  var textX = coverX + opts.imgW + 16;
  var maxTextW = W - PAD - textX - 80;

  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = textPrimary;
  var nameLines = wrapText(ctx, item.name, textX, y + 30, maxTextW, 20, 3);

  ctx.font = '11px sans-serif';
  ctx.fillStyle = textSecondary;
  var desc = (item.short_description || item.desc || '').replace(/<[^>]+>/g, '');
  var descY = y + 30 + nameLines * 20 + 4;
  var descLines = desc ? wrapText(ctx, desc, textX, descY, maxTextW, 16, 3) : 0;

  ctx.font = '11px sans-serif';
  ctx.fillStyle = textAccent;
  var reason = item.match_reason || '';
  if (reason) {
    var reasonY = descY + descLines * 16 + 4;
    wrapText(ctx, '✦ ' + reason, textX, reasonY, maxTextW, 16, 2);
  }

  // Tags
  var tags = (item.tags || []).slice(0, 3);
  var tagX = textX;
  ctx.font = '10px sans-serif';
  var tagY = y + opts.cardH - 38;
  tags.forEach(function(t) {
    var tw = ctx.measureText(t).width + 14;
    roundRect(ctx, tagX, tagY, tw, 18, 9);
    ctx.fillStyle = tagBg;
    ctx.fill();
    ctx.fillStyle = tagText;
    ctx.fillText(t, tagX + 7, tagY + 13);
    tagX += tw + 5;
  });

  // Score
  ctx.textAlign = 'right';
  var scoreY = y + opts.cardH - 24;
  var scoreColor, scoreLabel;
  if (item.match_score) {
    scoreColor = item.match_score >= 85 ? '#34d399' : item.match_score >= 65 ? '#fbbf24' : '#f87171';
    scoreLabel = item.match_score >= 85 ? 'Top Pick' : item.match_score >= 65 ? 'Recommended' : 'Decent';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = scoreColor;
    ctx.fillText(item.match_score + '%', W - PAD - 14, scoreY);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = hexToRgba(scoreColor, 0.6);
    ctx.fillText(scoreLabel, W - PAD - 14, scoreY + 14);
  } else if (item.positive_ratio) {
    scoreColor = item.positive_ratio >= 85 ? '#34d399' : item.positive_ratio >= 70 ? '#fbbf24' : '#f87171';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = scoreColor;
    ctx.fillText(item.positive_ratio + '%', W - PAD - 14, scoreY);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = hexToRgba(scoreColor, 0.6);
    ctx.fillText('Positive', W - PAD - 14, scoreY + 14);
  } else if (item.rating) {
    scoreColor = item.rating >= 8 ? '#34d399' : item.rating >= 6 ? '#fbbf24' : '#f87171';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = scoreColor;
    ctx.fillText(item.rating, W - PAD - 14, scoreY);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = textTertiary;
    ctx.fillText('Rating', W - PAD - 14, scoreY + 14);
  }
  ctx.textAlign = 'left';
}

// ── Footer drawing ──
function drawFooter(ctx, W, PAD, footerY, accentColor, watermark, isMovie) {
  ctx.font = '14px sans-serif';
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.fillText(isMovie ? 'Nothing to watch? Try JustRight' : 'Nothing to play? Try JustRight', W / 2, footerY + 30);
  ctx.font = '11px sans-serif';
  ctx.fillStyle = watermark;
  ctx.fillText('JustRight — Open Source', W / 2, footerY + 52);
  ctx.textAlign = 'left';
}

// ── Main drawing function ──
function drawShareCard(title, items, images, W, H, PAD, headerH, queryH, cardH, gap, imgW, imgH, imgPad, footerH, avgScore, logoImg) {
  var canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  var ctx = canvas.getContext('2d');
  if (!ctx) { showToast('Failed to generate image'); return; }

  var cs = getComputedStyle(document.documentElement);
  var accentColor = cs.getPropertyValue('--accent').trim() || '#a78bfa';
  var accentPinkColor = cs.getPropertyValue('--accent-pink').trim() || '#f472b6';
  var glowStr = cs.getPropertyValue('--glow').trim() || '167,139,250';
  var glowPinkStr = cs.getPropertyValue('--glow-pink').trim() || '244,114,182';
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  var isMovie = currentMode === 'movie';

  var bgColor = drawBackground(ctx, W, H, isLight, glowStr, glowPinkStr);
  drawTopLine(ctx, W, accentColor, accentPinkColor);

  var textPrimary = isLight ? 'rgba(30,25,50,.9)' : 'rgba(230,225,240,.92)';
  var textSecondary = isLight ? 'rgba(30,25,50,.55)' : 'rgba(230,225,240,.5)';
  var textTertiary = isLight ? 'rgba(30,25,50,.4)' : 'rgba(230,225,240,.35)';
  var textAccent = isLight ? 'rgba(124,58,237,.7)' : 'rgba(167,139,250,.6)';
  var dividerColor = isLight ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)';
  var cardBg = isLight ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.04)';
  var cardBorder = isLight ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.08)';
  var noImgBg = isLight ? 'rgba(124,58,237,.08)' : 'rgba(167,139,250,.08)';
  var noImgText = isLight ? 'rgba(124,58,237,.35)' : 'rgba(167,139,250,.3)';
  var tagBg = isLight ? 'rgba(124,58,237,.1)' : 'rgba(167,139,250,.12)';
  var tagText = isLight ? 'rgba(124,58,237,.8)' : 'rgba(167,139,250,.65)';
  var watermark = isLight ? 'rgba(30,25,50,.2)' : 'rgba(230,225,240,.2)';

  drawHeader(ctx, W, PAD, title, items, avgScore, isMovie, textPrimary, textTertiary, textAccent, accentColor, logoImg);
  var drawGradientLine = createGradientLineDrawer(ctx, accentColor, accentPinkColor);
  drawGradientLine(headerH - 8, PAD, W);

  var startY = headerH + queryH;
  var opts = { startY, cardH, gap, PAD, W, imgW, imgH, imgPad, textPrimary, textSecondary, textAccent, textTertiary, accentColor, accentPinkColor, tagBg, tagText, bgColor, noImgBg, noImgText, cardBg, cardBorder };
  items.forEach(function(item, i) { drawCard(ctx, item, i, images, opts); });

  var footerY = H - footerH;
  drawGradientLine(footerY, PAD, W);
  drawFooter(ctx, W, PAD, footerY, accentColor, watermark, isMovie);

  canvas.toBlob(function(blob) {
    if (!blob) { showToast('Failed to generate image'); return; }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var safeName = title.replace(/[<>:"/\\|?*]/g, '').substring(0, 20);
    a.download = 'JustRight-' + safeName + '-' + Date.now() + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Image saved! Share it with friends!');
  }, 'image/png');
}

// ── Entry ──
export function generateWishlistImage() {
  var items = getWishlist();
  if (items.length === 0) { showToast('No saved items'); return; }

  var isMovie = currentMode === 'movie';
  var title = isMovie ? 'Watchlist' : 'Wishlist';

  var scores = items.map(function(it) { return it.match_score || it.positive_ratio || it.rating ? (it.match_score || it.positive_ratio || (it.rating * 10) || 0) : 0; }).filter(function(s) { return s > 0; });
  var avgScore = scores.length > 0 ? Math.round(scores.reduce(function(a, b) { return a + b; }, 0) / scores.length) : 0;

  var W = 750, PAD = 36;
  var headerH = 110, queryH = 40, cardH = 155, gap = 14;
  var imgW = 180, imgH = 120, imgPad = 12;
  var footerH = 90;
  var H = headerH + queryH + items.length * (cardH + gap) + footerH;

  var images = [];
  var loaded = 0;
  var total = items.length;
  var logoImg = new Image();
  logoImg.src = 'logo.png';

  function tryDraw() {
    loaded++;
    if (loaded < total) return;
    try { drawShareCard(title, items, images, W, H, PAD, headerH, queryH, cardH, gap, imgW, imgH, imgPad, footerH, avgScore, logoImg); }
    catch (e) { console.error('Image generation failed:', e); showToast('Failed to generate image'); }
  }

  items.forEach(function(item, i) {
    var imgSrc = isMovie ? item.poster : item.header_image;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    if (!imgSrc) { tryDraw(); return; }
    fetch('/api/proxy-image?url=' + encodeURIComponent(imgSrc))
      .then(function(r) { return r.blob(); })
      .then(function(blob) {
        var objUrl = URL.createObjectURL(blob);
        img.onload = function() { URL.revokeObjectURL(objUrl); tryDraw(); };
        img.onerror = function() { URL.revokeObjectURL(objUrl); tryDraw(); };
        img.src = objUrl;
        images[i] = img;
      })
      .catch(function() {
        img.onload = tryDraw;
        img.onerror = tryDraw;
        img.src = imgSrc;
        images[i] = img;
      });
  });
}
