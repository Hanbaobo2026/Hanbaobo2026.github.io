/* =========================================================
   pblog · main.js
   零依赖：主题切换 / 特效 / 时钟 / 日历 / 搜索 / 目录 / 灯箱
   ========================================================= */
(function () {
  'use strict';

  var CFG = window.__PBLOG__ || {};
  var root = CFG.root || '/';
  var html = document.documentElement;
  var effects = CFG.effects || {};
  var quality = effects.quality || 'high';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) quality = 'static';

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------------- 提示 ---------------- */
  var toastEl = null;
  var toastTimer = 0;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 1900);
  }

  /* ---------------- 主题 ---------------- */
  var themeBtn = $('#theme-toggle');
  function syncMetaTheme() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', html.classList.contains('dark') ? '#241b17' : '#f7efe7');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = !html.classList.contains('dark');
      html.classList.add('theme-transitioning');
      html.classList.toggle('dark', dark);
      try { localStorage.setItem('pblog-theme', dark ? 'dark' : 'light'); } catch (e) {}
      syncMetaTheme();
      setTimeout(function () { html.classList.remove('theme-transitioning'); }, 660);
    });
  }
  syncMetaTheme();

  /* ---------------- 导航滚动 & 移动菜单 ---------------- */
  var navbar = $('#navbar');
  var lastScroll = 0;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (navbar) navbar.classList.toggle('is-scrolled', y > 12);
    var top = $('#back-to-top');
    if (top) top.classList.toggle('is-visible', y > 560);
    lastScroll = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#nav-burger');
  var mobileNav = $('#nav-mobile');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var open = mobileNav.hasAttribute('hidden');
      if (open) mobileNav.removeAttribute('hidden');
      mobileNav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var backTop = $('#back-to-top');
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- 开屏 ---------------- */
  var splash = $('#splash');
  if (splash) {
    var seen = false;
    try { seen = sessionStorage.getItem('pblog-splash') === '1'; } catch (e) {}
    var skip = /[?&]splash=0/.test(location.search);
    if (seen || skip || quality === 'static') {
      splash.classList.add('is-done');
    } else {
      setTimeout(function () { splash.classList.add('is-done'); }, 760);
      try { sessionStorage.setItem('pblog-splash', '1'); } catch (e) {}
    }
  }

  /* ---------------- 背景特效 ---------------- */
  function buildSakura() {
    var host = $('#effect-sakura');
    if (!host || !effects.sakura || quality === 'static') return;
    var count = quality === 'low' ? 8 : 16;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      p.className = 'sakura-petal';
      p.style.setProperty('--left', rand(0, 100).toFixed(2) + '%');
      p.style.setProperty('--size', rand(6, 13).toFixed(1) + 'px');
      p.style.setProperty('--duration', rand(11, 21).toFixed(1) + 's');
      p.style.setProperty('--delay', rand(-20, 0).toFixed(1) + 's');
      p.style.setProperty('--drift', rand(-90, 90).toFixed(0) + 'px');
      frag.appendChild(p);
    }
    host.appendChild(frag);
  }

  function buildFireflies() {
    var host = $('#effect-fireflies');
    if (!host || !effects.fireflies || quality === 'static') return;
    var count = quality === 'low' ? 8 : 18;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var f = document.createElement('div');
      f.className = 'firefly path-' + (1 + (i % 4));
      f.style.setProperty('--top', rand(6, 92).toFixed(1) + '%');
      f.style.setProperty('--left', rand(2, 96).toFixed(1) + '%');
      f.style.setProperty('--float', rand(13, 26).toFixed(1) + 's');
      f.style.setProperty('--delay', rand(-18, 0).toFixed(1) + 's');
      f.style.setProperty('--glow', rand(5, 10).toFixed(1) + 'px');
      f.style.setProperty('--pulse', rand(2.4, 5.2).toFixed(1) + 's');
      f.appendChild(document.createElement('i'));
      frag.appendChild(f);
    }
    host.appendChild(frag);
  }

  function buildGrass() {
    var host = $('#effect-grass');
    if (!host || !effects.grass || quality === 'static') return;
    var count = quality === 'low' ? 14 : 30;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var g = document.createElement('i');
      g.className = 'grass-blade';
      g.style.setProperty('--left', rand(0, 100).toFixed(2) + '%');
      g.style.setProperty('--width', rand(4, 11).toFixed(1) + 'px');
      g.style.setProperty('--height', rand(26, 84).toFixed(0) + 'px');
      g.style.setProperty('--duration', rand(3.6, 7.4).toFixed(1) + 's');
      g.style.setProperty('--delay', rand(-6, 0).toFixed(1) + 's');
      frag.appendChild(g);
    }
    host.appendChild(frag);
  }

  function buildDanmaku() {
    var host = $('#effect-danmaku');
    var list = CFG.danmaku || [];
    if (!host || !effects.danmaku || quality === 'static' || !list.length) return;
    var count = quality === 'low' ? 3 : Math.min(8, list.length);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var d = document.createElement('div');
      d.className = 'danmaku-track';
      d.textContent = list[i % list.length];
      d.style.top = (8 + i * 10.5) + '%';
      d.style.animationDuration = rand(24, 42).toFixed(1) + 's';
      d.style.animationDelay = (-rand(0, 30)).toFixed(1) + 's';
      d.style.fontSize = rand(0.78, 1.05).toFixed(2) + 'rem';
      frag.appendChild(d);
    }
    host.appendChild(frag);
  }

  buildSakura();
  buildFireflies();
  buildGrass();
  buildDanmaku();

  /* ---------------- 点击粒子 ---------------- */
  (function clickParticles() {
    var canvas = $('#click-particles');
    if (!canvas || !effects.click || quality === 'static') return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var raf = 0;

    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn(x, y) {
      var n = quality === 'low' ? 8 : 14;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var speed = rand(1.2, 4.2);
        particles.push({
          x: x, y: y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 0.8,
          life: 1,
          size: rand(1.5, 3.4),
          hue: rand(24, 40)
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.985;
        p.life -= 0.022;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, p.life) * 0.8;
        ctx.fillStyle = 'hsl(' + p.hue + ', 78%, 62%)';
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (particles.length) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    }

    window.addEventListener('click', function (e) {
      if (e.target.closest('a, button, input, textarea, select')) return;
      spawn(e.clientX, e.clientY);
    }, { passive: true });
  })();

  /* ---------------- 首页波浪 ---------------- */
  (function heroWave() {
    var canvas = $('#hero-wave');
    if (!canvas || quality === 'static') return;
    var ctx = canvas.getContext('2d');
    var H = 126;
    var t = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function palette() {
      var dark = html.classList.contains('dark');
      return dark
        ? { back: 'rgba(67, 53, 45, 0.5)', main: '#241b17', front: 'rgba(58, 45, 38, 0.6)', highlight: 'rgba(255, 214, 176, 0.08)' }
        : { back: 'rgba(255, 250, 244, 0.72)', main: '#f7efe7', front: 'rgba(255, 246, 235, 0.86)', highlight: 'rgba(255, 255, 255, 0.52)' };
    }

    function layer(w, h, offset, amp, color, speed, baseline) {
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, baseline);
      for (var x = 0; x <= w; x += 4) {
        var y = baseline +
          Math.sin(x * 0.0062 + t * speed + offset) * amp +
          Math.sin(x * 0.0125 + t * speed * 0.72 + offset) * (amp * 0.45);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function draw() {
      var w = window.innerWidth;
      var p = palette();
      ctx.clearRect(0, 0, w, H);
      var haze = ctx.createLinearGradient(0, 0, 0, H);
      haze.addColorStop(0, 'rgba(255,255,255,0)');
      haze.addColorStop(0.55, p.highlight);
      haze.addColorStop(1, p.main);
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, H);
      layer(w, H, 0, 10, p.back, 0.62, H * 0.46);
      layer(w, H, 1.7, 8, p.main, 0.82, H * 0.58);
      layer(w, H, 3.1, 5.5, p.front, 0.48, H * 0.69);
    }

    function resize() {
      var h = window.innerWidth < 640 ? 90 : H;
      canvas.style.height = h + 'px';
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    var frame = 0;
    function loop() {
      frame++;
      if (!document.hidden && (quality === 'high' || frame % 2 === 0)) {
        t += quality === 'high' ? 0.022 : 0.044;
        draw();
      }
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) draw();
      });
    }, { threshold: 0 });
    observer.observe(canvas);
    if (!reduceMotion) requestAnimationFrame(loop);
  })();

  /* ---------------- 时钟 / 天数 ---------------- */
  var WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  var GREETINGS = [
    [5, 9, '早上好，今天也要元气满满'],
    [9, 12, '上午好，专注做事吧'],
    [12, 14, '中午啦，记得吃饭'],
    [14, 18, '下午好，泡杯茶？'],
    [18, 22, '晚上好，慢下来一点'],
    [22, 24, '夜深了，早点睡呀'],
    [0, 5, '这么晚还没睡？']
  ];

  function greet(h) {
    for (var i = 0; i < GREETINGS.length; i++) {
      var g = GREETINGS[i];
      if (h >= g[0] && h < g[1]) return g[2];
    }
    return '今天也要开心呀';
  }

  var buildDate = CFG.buildDate ? new Date(CFG.buildDate) : null;
  function daysSince() {
    if (!buildDate || isNaN(buildDate.getTime())) return null;
    return Math.max(1, Math.floor((Date.now() - buildDate.getTime()) / 86400000));
  }

  function tickClock() {
    var now = new Date();
    var h = pad(now.getHours());
    var m = pad(now.getMinutes());
    var s = pad(now.getSeconds());

    var clock = $('#dash-clock');
    if (clock) clock.innerHTML = h + ':' + m + '<span class="dashboard__sec">' + s + '</span>';

    var dateEl = $('#dash-date');
    if (dateEl) {
      dateEl.textContent = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · ' + WEEK[now.getDay()];
    }

    var hint = $('#dash-hint');
    if (hint) hint.textContent = greet(now.getHours());

    var fclock = $('#footer-clock');
    if (fclock) fclock.textContent = h + ':' + m + ':' + s;
  }

  var d = daysSince();
  if (d !== null) {
    var fd = $('#footer-days');
    if (fd) fd.textContent = d;
    var sd = $('#stats-days');
    if (sd) sd.textContent = d;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------------- 日历 ---------------- */
  (function calendar() {
    var grid = $('#cal-grid');
    if (!grid) return;
    var titleEl = $('#cal-title');
    var view = new Date();
    view.setDate(1);
    var postDays = {};

    var indexPromise = null;
    function getIndex() {
      if (!indexPromise) {
        indexPromise = fetch(root.replace(/\/$/, '') + '/search.json')
          .then(function (r) { return r.ok ? r.json() : []; })
          .then(function (list) {
            list.forEach(function (item) {
              var dt = new Date(item.date);
              if (!isNaN(dt.getTime())) {
                postDays[dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate()] = true;
              }
            });
            return list;
          })
          .catch(function () { return []; });
      }
      return indexPromise;
    }

    function render() {
      var year = view.getFullYear();
      var month = view.getMonth();
      if (titleEl) titleEl.textContent = year + ' 年 ' + (month + 1) + ' 月';
      grid.innerHTML = '';

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var prevDays = new Date(year, month, 0).getDate();
      var today = new Date();
      var frag = document.createDocumentFragment();

      for (var i = firstDay - 1; i >= 0; i--) {
        var cellPrev = document.createElement('span');
        cellPrev.className = 'is-dim';
        cellPrev.textContent = prevDays - i;
        frag.appendChild(cellPrev);
      }
      for (var dnum = 1; dnum <= daysInMonth; dnum++) {
        var cell = document.createElement('span');
        cell.textContent = dnum;
        if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === dnum) {
          cell.className = 'is-today';
        }
        if (postDays[year + '-' + (month + 1) + '-' + dnum]) {
          cell.className += ' has-post';
          cell.style.position = 'relative';
        }
        frag.appendChild(cell);
      }
      var total = firstDay + daysInMonth;
      var rest = (7 - (total % 7)) % 7;
      for (var k = 1; k <= rest; k++) {
        var cellNext = document.createElement('span');
        cellNext.className = 'is-dim';
        cellNext.textContent = k;
        frag.appendChild(cellNext);
      }
      grid.appendChild(frag);
    }

    var prev = $('#cal-prev');
    var next = $('#cal-next');
    if (prev) prev.addEventListener('click', function () { view.setMonth(view.getMonth() - 1); render(); });
    if (next) next.addEventListener('click', function () { view.setMonth(view.getMonth() + 1); render(); });

    getIndex().then(render);
    render();
  })();

  /* ---------------- 搜索 ---------------- */
  (function search() {
    var overlay = $('#search-overlay');
    if (!overlay) return;
    var input = $('#search-input');
    var results = $('#search-results');
    var openers = [$('#search-open')].filter(Boolean);
    var dataPromise = null;
    var cache = null;
    var activeIndex = -1;

    function load() {
      if (!dataPromise) {
        dataPromise = fetch(root.replace(/\/$/, '') + '/search.json')
          .then(function (r) { return r.ok ? r.json() : []; })
          .catch(function () { return []; });
      }
      return dataPromise;
    }

    function open() {
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      if (input) { input.value = ''; setTimeout(function () { input.focus(); }, 30); }
      renderHint();
      load();
    }

    function close() {
      overlay.hidden = true;
      document.body.style.overflow = '';
    }

    function renderHint() {
      results.innerHTML = '<p class="search-hint">输入关键词开始搜索，支持标题 / 摘要 / 标签</p>';
      activeIndex = -1;
    }

    function highlight(text, kw) {
      if (!kw) return text;
      var i = text.toLowerCase().indexOf(kw.toLowerCase());
      if (i < 0) return text;
      return text.slice(0, i) + '<mark>' + text.slice(i, i + kw.length) + '</mark>' + text.slice(i + kw.length);
    }

    function search(kw) {
      kw = (kw || '').trim();
      if (!kw) { renderHint(); return; }
      var lower = kw.toLowerCase();
      var list = (cache || []).filter(function (item) {
        var hay = (item.title + ' ' + (item.desc || '') + ' ' + (item.tags || []).join(' ')).toLowerCase();
        return hay.indexOf(lower) > -1;
      }).slice(0, 12);

      activeIndex = -1;
      if (!list.length) {
        results.innerHTML = '<p class="search-empty">没有找到「' + kw.replace(/</g, '&lt;') + '」相关的文章</p>';
        return;
      }
      results.innerHTML = list.map(function (item) {
        var tags = (item.tags || []).slice(0, 3).map(function (t) { return '<span>#' + t + '</span>'; }).join(' ');
        return '<a class="search-item" href="' + item.path + '">' +
          '<div class="search-item__title">' + highlight(item.title, kw) + '</div>' +
          '<div class="search-item__meta"><span>' + (item.date || '').slice(0, 10) + '</span>' + tags + '</div>' +
          '</a>';
      }).join('');
    }

    openers.forEach(function (btn) { btn.addEventListener('click', open); });

    var closeBtn = $('#search-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    if (input) {
      var timer = 0;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        var val = input.value;
        timer = setTimeout(function () {
          load().then(function (list) { cache = list; search(val); });
        }, 120);
      });
      input.addEventListener('keydown', function (e) {
        var items = $$('.search-item', results);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!items.length) return;
          activeIndex += e.key === 'ArrowDown' ? 1 : -1;
          if (activeIndex < 0) activeIndex = items.length - 1;
          if (activeIndex >= items.length) activeIndex = 0;
          items.forEach(function (it) { it.classList.remove('is-active'); });
          items[activeIndex].classList.add('is-active');
          items[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          var target = items[activeIndex] || items[0];
          if (target) window.location.href = target.getAttribute('href');
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (overlay.hidden) open(); else close();
      }
      if (e.key === 'Escape' && !overlay.hidden) close();
    });
  })();

  /* ---------------- 文章页：目录 / 进度 / 灯箱 / 复制 ---------------- */
  var article = $('.article-content');
  if (article) {
    var headings = $$('h2, h3, h4', article).filter(function (h) { return h.textContent.trim(); });
    var used = {};

    headings.forEach(function (h, i) {
      var base = h.textContent.trim().toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '');
      if (!base) base = 'section-' + i;
      var id = base;
      var n = 2;
      while (used[id]) { id = base + '-' + n; n++; }
      used[id] = true;
      h.id = h.id || id;
    });

    var tocHost = $('#toc-list');
    if (tocHost && headings.length) {
      tocHost.innerHTML = headings.map(function (h) {
        var lvl = h.tagName.toLowerCase();
        return '<div class="toc-' + lvl + '"><a href="#' + h.id + '">' + h.textContent.trim() + '</a></div>';
      }).join('');

      var links = $$('a', tocHost);
      var byId = {};
      links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

      function updateToc() {
        var current = null;
        for (var i = 0; i < headings.length; i++) {
          var rect = headings[i].getBoundingClientRect();
          if (rect.top <= 140) current = headings[i].id;
          else break;
        }
        links.forEach(function (a) { a.classList.remove('is-active'); });
        if (current && byId[current]) byId[current].classList.add('is-active');
      }
      window.addEventListener('scroll', updateToc, { passive: true });
      updateToc();
    }

    var progress = $('#reading-progress');
    if (progress) {
      function updateProgress() {
        var rect = article.getBoundingClientRect();
        var total = rect.height - window.innerHeight * 0.6;
        var passed = -rect.top + window.innerHeight * 0.35;
        var pct = total > 0 ? Math.min(100, Math.max(0, (passed / total) * 100)) : 0;
        progress.style.width = pct + '%';
      }
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }

    // 代码块：语言标签 + 复制按钮
    $$('pre', article).forEach(function (pre) {
      var code = pre.querySelector('code');
      if (!code) return;
      var cls = code.className || '';
      var m = cls.match(/language-([\w+-]+)/);
      var lang = m ? m[1] : (pre.getAttribute('data-lang') || 'code');
      pre.setAttribute('data-lang', lang);

      if (!pre.querySelector('.code-copy')) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'code-copy';
        btn.textContent = '复制';
        btn.addEventListener('click', function () {
          var text = code.innerText;
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () {
              btn.textContent = '已复制';
              toast('代码已复制');
              setTimeout(function () { btn.textContent = '复制'; }, 1600);
            });
          }
        });
        pre.appendChild(btn);
      }
    });

    // 图片灯箱
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.hidden = true;
    lightbox.innerHTML = '<img alt="">';
    document.body.appendChild(lightbox);
    var lbImg = lightbox.querySelector('img');

    $$('img', article).forEach(function (img) {
      img.addEventListener('click', function () {
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lightbox.hidden = false;
      });
    });
    lightbox.addEventListener('click', function () {
      lightbox.hidden = true;
      lbImg.src = '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.hidden) lightbox.hidden = true;
    });
  }

  /* ---------------- 首页音乐 ---------------- */
  var musicSidebar = $('.music-sidebar');
  if (musicSidebar) {
    var musicPlayer = $('.music-sidebar__player', musicSidebar);
    $$('.music-sidebar__track', musicSidebar).forEach(function (button) {
      button.addEventListener('click', function () {
        if (!musicPlayer || button.classList.contains('is-active')) return;
        $$('.music-sidebar__track', musicSidebar).forEach(function (track) {
          var active = track === button;
          track.classList.toggle('is-active', active);
          track.setAttribute('aria-pressed', String(active));
        });
        musicPlayer.src = 'https://music.163.com/outchain/player?type=2&id=' + encodeURIComponent(button.dataset.songId) + '&auto=1&height=66';
      });
    });
  }

  /* ---------------- 说说：图片灯箱 ---------------- */
  (function gallery() {
    var imgs = $$('.moment__imgs img');
    if (!imgs.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.innerHTML = '<img alt="">';
    document.body.appendChild(box);
    var boxImg = box.querySelector('img');

    imgs.forEach(function (img) {
      img.addEventListener('click', function () {
        boxImg.src = img.currentSrc || img.src;
        boxImg.alt = img.alt || '';
        box.hidden = false;
      });
    });
    box.addEventListener('click', function () {
      box.hidden = true;
      boxImg.src = '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) box.hidden = true;
    });

  })();

  /* ---------------- 复制按钮 ---------------- */
  function fallbackCopy(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    try {
      return document.execCommand('copy');
    } catch (err) {
      return false;
    } finally {
      field.remove();
    }
  }

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var text = btn.getAttribute('data-copy');
      var label = btn.getAttribute('data-copy-label') || '内容';
      function copied() { toast(label + '已复制：' + text); }
      function copyFailed() {
        if (fallbackCopy(text)) copied();
        else toast('复制失败，请手动复制：' + text);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(copied, copyFailed);
      } else {
        copyFailed();
      }
    });
  });

  /* ---------------- 页面可见性：暂停动画 ---------------- */
  document.addEventListener('visibilitychange', function () {
    html.classList.toggle('effects-paused', document.hidden);
  });

  if (quality === 'low') html.classList.add('effects-low');
  if (quality === 'static') html.classList.add('effects-static');
})();
