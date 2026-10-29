/* ===== 桌宠运行时（由 scripts/pet-inject.js 注入，主题零改动）===== */
(function () {
  'use strict';

  if (window.__PET_LOADED__) { return; }
  window.__PET_LOADED__ = true;

  var root = document.getElementById('pet-root');
  if (!root) { return; }

  var D = {
    imgDir: '/img/pet/',
    sprite: { file: 'hanbaobo', ext: 'webp', widths: [512, 256, 128], w: 1164, h: 2019,
      cat: [790, 1545, 980, 1775] },
    mobile: false,
    mobileMax: 768,
    paperWidth: 880,
    gap: 12,
    lineMs: 3600,
    sleepAfter: 60000,
    blink: true,
    blinkMin: 2600,
    blinkMax: 6800,
    progress: true,
    progressAt: [25, 50, 75, 100],
    bar: true,
    resume: true,
    resumeAfter: 5200,
    meow: true,
    dates: null,
    copied: true,
    lateNight: true,
    stayReminder: 20,
    firstVisit: true,
    greetByType: true,
    dblclickTop: true,
    edgeSnap: true,
    lines: {
      poke: ['干嘛呀~', '别戳我啦！', '嗯？找我吗？', '戳一下就够了哦'],
      drag: ['喂喂，要带我去哪儿？', '别晃啦，头晕…'],
      drop: ['这里视野不错！', '站稳了。'],
      welcome: ['你好呀，我是汉堡的小跟班~', '欢迎来到汉堡的博客！'],
      leave: ['那我先躲起来咯，想我就访问 /?pet=1', '拜拜~'],
      progress: ['读了 25%，加油~', '过半啦，喝口水？', '75% 了，快看完了！', '看完啦，厉害！'],
      copied: ['代码拿走不谢~', '这段我也看不懂…', '复制好了，去试试吧'],
      lateNight: ['这么晚还不睡？早点休息呀', '夜深了，眼睛也要下班了'],
      longStay: ['都待了 20 分钟啦，起来走两步？', '坐太久啦，站起来伸个懒腰~'],
      top: ['带你回顶部！', '嗖——回顶上去了'],
      first: ['第一次见？我是汉堡的小跟班，双击我能回顶哦'],
      meow: ['喵~', '喵？', '喵喵！', '喵呜——'],
      resume: ['上次读到 {pct}% 了，点这里接着看 →', '接着上次的 {pct}% 继续？点我'],
      resumeGo: ['好嘞，接着看~', '翻回去了，继续~'],
      byType: {
        post: ['来读文章啦？我陪你~'],
        home: ['随便逛逛吧~'],
        archive: ['翻旧账时间到~'],
        page: ['这页也不错~']
      }
    }
  };
  var U = window.__PET_CFG__ || {};

  function merge(a, b) {
    var o = {}, k;
    for (k in a) { if (Object.prototype.hasOwnProperty.call(a, k)) { o[k] = a[k]; } }
    for (k in b) { if (Object.prototype.hasOwnProperty.call(b, k)) { o[k] = b[k]; } }
    return o;
  }

  var cfg = merge(D, U);
  cfg.sprite = merge(D.sprite, U.sprite || {});
  cfg.lines = merge(D.lines, U.lines || {});

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var isNarrow = window.innerWidth <= cfg.mobileMax;

  var body = root.querySelector('.pet__body');
  var img = root.querySelector('.pet__img');
  var bubble = root.querySelector('.pet__bubble');
  var lean = root.querySelector('.pet__lean');
  var closeBtn = root.querySelector('.pet__close');
  /* 关掉后浮在右下角的召回按钮（老缓存页面里可能没有，全部做空判断） */
  var recallBtn = document.getElementById('pet-recall');
  var face = root.querySelector('.pet__face');
  var fx = root.querySelector('.pet__fx');
  var bar = root.querySelector('.pet__bar');
  var barFill = bar ? bar.querySelector('b') : null;
  if (!body || !img || !bubble || !lean || !closeBtn) { return; }

  var K = { pos: 'pet:pos', hide: 'pet:hide', first: 'pet:first', scroll: 'pet:scroll:' };

  function store(key, val) {
    try {
      if (typeof val === 'undefined') { return window.localStorage.getItem(key); }
      window.localStorage.setItem(key, val);
      return val;
    } catch (e) { return null; }
  }

  /* ?pet=1 强制召回 */
  var forced = /[?&]pet=1(?:&|$)/.test(window.location.search);
  if (forced) { store(K.hide, '0'); }
  /* 手机且没开 pet.mobile：桌宠整只不参与（连召回按钮也不出现） */
  if (isNarrow && !cfg.mobile) { return; }
  root.classList.toggle('pet--mobile', isNarrow && !!cfg.mobile);

  /* pet.excludePaths：按路径前缀排除 */
  var exclude = cfg.excludePaths || [];
  for (var ei = 0; ei < exclude.length; ei++) {
    if (exclude[ei] && window.location.pathname.indexOf(exclude[ei]) === 0) { return; }
  }

  /* ---- 选图：按设备像素比挑最合适的一档 ---- */
  function petHeight() {
    var v = window.getComputedStyle(root).getPropertyValue('--pet-h');
    return parseInt(v, 10) || 180;
  }

  function pickWidth() {
    var dpr = Math.max(window.devicePixelRatio || 1, 1.75);
    var need = petHeight() * (cfg.sprite.w / cfg.sprite.h) * dpr;
    var list = (cfg.sprite.widths || [512]).slice().sort(function (a, b) { return a - b; });
    var i;
    for (i = 0; i < list.length; i++) { if (list[i] >= need) { return list[i]; } }
    return list[list.length - 1];
  }

  /* 换档：视口跨断点时体型变了，按新的 --pet-h 重新挑图，避免小图拉大 / 大图空耗 */
  var spriteW = 0;

  function updateSprite() {
    var w = pickWidth();
    if (w === spriteW) { return; }
    spriteW = w;
    img.src = cfg.imgDir + cfg.sprite.file + '-' + w + '.' + cfg.sprite.ext;
  }

  img.alt = cfg.name || '桌宠';
  img.addEventListener('error', function () { root.classList.remove('pet--on'); }, false);
  updateSprite();

  /* ---- 位置 ---- */
  var pos = { x: 0, y: 0 };
  var custom = false;
  var dragging = false;
  var moved = false;
  var startX = 0, startY = 0, baseX = 0, baseY = 0;
  var talkT = 0;

  function size() { return { w: root.offsetWidth, h: root.offsetHeight }; }

  function clamp(x, y) {
    var s = size();
    var maxX = window.innerWidth - s.w - 4;
    var maxY = window.innerHeight - s.h - 4;
    return {
      x: Math.min(Math.max(x, -Math.round(s.w * 0.3)), Math.max(maxX, -s.w)),
      y: Math.min(Math.max(y, 0), Math.max(maxY, 0))
    };
  }

  function setPos(x, y) {
    pos = clamp(x, y);
    root.style.transform = 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)';
    root.classList.toggle('pet--left', pos.x < 220);
  }

  /* 宽屏站在纸外右侧，窄屏贴右下角 */
  function home() {
    var s = size();
    var gutter = (window.innerWidth - cfg.paperWidth) / 2;
    var x = gutter >= s.w + cfg.gap + 4
      ? window.innerWidth - gutter + 6
      : window.innerWidth - s.w - cfg.gap;
    var y = window.innerHeight - s.h - cfg.gap;
    return { x: Math.round(x), y: Math.round(y) };
  }

  function sayRaw(text, ms) {
    if (!text) { return; }
    /* 别的台词盖过来时，续读提示就不再可点了 */
    if (resumeOffer && text !== resumeText) { dropResume(); }
    bubble.textContent = text;
    root.classList.add('is-talking');
    window.clearTimeout(talkT);
    talkT = window.setTimeout(function () { root.classList.remove('is-talking'); }, ms || cfg.lineMs);
  }

  /* 说话顺手把打盹的桌宠叫醒（用于将来页面事件触发台词） */
  function say(text, ms) {
    if (!text) { return; }
    if (sleeping) { wake(false); }
    sayRaw(text, ms);
  }

  function pick(list) {
    if (!list || !list.length) { return ''; }
    return list[Math.floor(Math.random() * list.length)];
  }

  function pulse(cls, ms) {
    root.classList.remove(cls);
    void root.offsetWidth;
    root.classList.add(cls);
    window.setTimeout(function () { root.classList.remove(cls); }, ms);
  }

  /* ================= 表情：眨眼 / 犯困 / 开心粒子 ================= */

  var eyes = [];
  var sleeping = false;
  var wasAsleep = false;
  var sleepT = 0, blinkT = 0, blinkHoldT = 0;

  /* 按母版像素比例铺两张眼睑（% 定位，跟着体型一起缩放） */
  (function buildEyes() {
    if (!face || !cfg.sprite.eyes || !cfg.sprite.eyes.length) { return; }
    var sw = cfg.sprite.w || 1;
    var sh = cfg.sprite.h || 1;
    for (var i = 0; i < cfg.sprite.eyes.length; i++) {
      var b = cfg.sprite.eyes[i];
      if (!b || b.length < 4) { continue; }
      var el = document.createElement('i');
      el.className = 'pet__eye';
      el.style.left = (b[0] / sw * 100).toFixed(3) + '%';
      el.style.top = (b[1] / sh * 100).toFixed(3) + '%';
      el.style.width = ((b[2] - b[0]) / sw * 100).toFixed(3) + '%';
      el.style.height = ((b[3] - b[1]) / sh * 100).toFixed(3) + '%';
      if (cfg.sprite.skin) { el.style.setProperty('--pet-skin', cfg.sprite.skin); }
      face.appendChild(el);
      eyes.push(el);
    }
  })();

  function blinkOnce() {
    if (!eyes.length || sleeping || document.hidden) { return; }
    root.classList.add('is-blink');
    window.clearTimeout(blinkHoldT);
    blinkHoldT = window.setTimeout(function () { root.classList.remove('is-blink'); }, 74);
  }

  function scheduleBlink() {
    if (!cfg.blink || !eyes.length) { return; }
    window.clearTimeout(blinkT);
    var span = Math.max(cfg.blinkMax - cfg.blinkMin, 200);
    blinkT = window.setTimeout(function () {
      if (!sleeping && !document.hidden) {
        blinkOnce();
        /* 偶尔连眨两下，不至于太机械 */
        if (Math.random() < 0.18) { window.setTimeout(blinkOnce, 250); }
      }
      scheduleBlink();
    }, cfg.blinkMin + Math.random() * span);
  }

  function resetIdle() {
    window.clearTimeout(sleepT);
    if (sleeping || !cfg.sleepAfter) { return; }
    sleepT = window.setTimeout(doze, cfg.sleepAfter);
  }

  function doze() {
    if (sleeping || !root.classList.contains('pet--on')) { return; }
    /* 后台标签页不睡，回到前台后重新计时 */
    if (document.hidden) { resetIdle(); return; }
    sleeping = true;
    wasAsleep = false;
    root.classList.add('pet--sleep');
    sayRaw(pick(cfg.lines.sleepy), 2000);
  }

  function wake(byUser) {
    if (!sleeping) { return false; }
    sleeping = false;
    root.classList.remove('pet--sleep');
    if (byUser) {
      pulse('is-wake', 520);
      sayRaw(pick(cfg.lines.wake), 2200);
    }
    resetIdle();
    return true;
  }

  /* 点击时头顶冒的小星星 */
  var GLYPHS = ['\u2726', '\u2665', '\u2727', '\u2661', '\u2736'];
  var COLORS = ['#ff8fb1', '#ffcf5c', '#ffa8c4', '#8fc8ff'];

  function sparkle(glyphs) {
    if (reduce || !fx || fx.childNodes.length > 36) { return; }
    var pool = (glyphs && glyphs.length) ? glyphs : GLYPHS;
    var base = petHeight();
    for (var i = 0; i < 6; i++) {
      var el = document.createElement('i');
      var ang = (-160 + Math.random() * 140) * Math.PI / 180;   /* 向上扇形 */
      var dist = base * (0.14 + Math.random() * 0.22);
      el.className = 'pet__spark';
      el.textContent = pool[i % pool.length];
      el.style.left = (30 + Math.random() * 40).toFixed(1) + '%';
      el.style.top = (12 + Math.random() * 16).toFixed(1) + '%';
      el.style.setProperty('--x', (Math.cos(ang) * dist).toFixed(1) + 'px');
      el.style.setProperty('--y', (Math.sin(ang) * dist).toFixed(1) + 'px');
      el.style.setProperty('--r', (Math.random() * 120 - 60).toFixed(0) + 'deg');
      el.style.setProperty('--t', (0.55 + Math.random() * 0.3).toFixed(2) + 's');
      el.style.setProperty('--d', (i * 45 + Math.random() * 40).toFixed(0) + 'ms');
      el.style.setProperty('--c', COLORS[i % COLORS.length]);
      fx.appendChild(el);
      (function (node) {
        window.setTimeout(function () {
          if (node.parentNode) { node.parentNode.removeChild(node); }
        }, 1600);
      })(el);
    }
  }

  var lastPokeAt = 0;

  function poke() {
    if (wasAsleep) { wasAsleep = false; return; }
    if (wake(true)) { return; }
    /* 320ms 内连点只算一下：既防粒子刷屏，也给双击（回顶）让位 */
    var now = Date.now();
    if (now - lastPokeAt < 320) { return; }
    lastPokeAt = now;
    pulse('is-poke', 560);
    sparkle();
    say(pick(cfg.lines.poke));
    resetIdle();
    try { window.dispatchEvent(new CustomEvent('pet:poke')); } catch (e) {}
  }

  /* ---- 右边那只小灰猫：点到它，喵一声 ---- */
  var catBox = cfg.sprite.cat;

  function onCat(e) {
    if (!cfg.meow || !catBox || catBox.length < 4 || !e) { return false; }
    var r = body.getBoundingClientRect();
    if (!r.width || !r.height) { return false; }
    var x = (e.clientX - r.left) / r.width * (cfg.sprite.w || 1);
    var y = (e.clientY - r.top) / r.height * (cfg.sprite.h || 1);
    return x >= catBox[0] && x <= catBox[2] && y >= catBox[1] && y <= catBox[3];
  }

  function meow() {
    var now = Date.now();
    if (now - lastPokeAt < 320) { return; }
    lastPokeAt = now;
    if (sleeping) { wake(false); }
    pulse('is-hop', 560);
    sparkle(['\u266a', '\u266b', '\u2665']);       /* 音符 + 心心 */
    say(pick(cfg.lines.meow) || '喵~', 1900);
    st.meow++;
    resetIdle();
    try { window.dispatchEvent(new CustomEvent('pet:meow')); } catch (err) {}
  }
  /* ---- 单击 / 双击：单击延迟 240ms 再执行，双击回顶时直接取消，
     不会出现“先戳一下、再回顶”的抢戏 ---- */
  var tapT = 0, lastTap = 0;

  function cancelTap() {
    if (tapT) { window.clearTimeout(tapT); tapT = 0; }
  }

  function scrollTopNow() { return window.pageYOffset || document.documentElement.scrollTop || 0; }

  function canTop() { return scrollTopNow() >= 80; }

  function tap() {
    var now = Date.now();
    /* 自己判定双击：触屏没有 dblclick 事件，某些浏览器 pointerdown 被 preventDefault 后也不补发 */
    if (cfg.dblclickTop && now - lastTap < 300 && canTop()) {
      lastTap = 0;
      cancelTap();
      goTop();
      return;
    }
    lastTap = now;
    cancelTap();
    if (!cfg.dblclickTop || !canTop()) { poke(); return; }
    tapT = window.setTimeout(function () { tapT = 0; poke(); }, 240);
  }

  /* ---- 指针交互：拖拽 + 点击 ---- */
  function onDown(e) {
    if (e.button && e.button > 0) { return; }
    if (e.isPrimary === false) { return; }          /* 多指同时按只认第一根手指 */
    if (closeBtn.contains(e.target)) { return; }
    resetIdle();
    if (sleeping) { wake(true); wasAsleep = true; }
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    baseX = pos.x;
    baseY = pos.y;
    try { body.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) { return; }
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 6) {
      moved = true;
      custom = true;
      wasAsleep = false;
      root.classList.add('is-dragging');
      say(pick(cfg.lines.drag), 1800);
    }
    if (moved) { setPos(baseX + dx, baseY + dy); }
  }

  /* 松手时贴边吸附：中心落在左右 15% 内就贴到边上，中间区域保持原位 */
  function snapEdge() {
    if (!cfg.edgeSnap) { return; }
    var s = size();
    var W = window.innerWidth;
    var cx = pos.x + s.w / 2;
    if (cx < W * 0.15) { setPos(4, pos.y); }
    else if (cx > W * 0.85) { setPos(W - s.w - 4, pos.y); }
  }

  function onUp(e) {
    if (!dragging) { return; }
    dragging = false;
    resetIdle();
    root.classList.remove('is-dragging');
    if (moved) {
      snapEdge();
      say(pick(cfg.lines.drop), 2200);
      store(K.pos, JSON.stringify(pos));
    } else if (onCat(e)) {
      meow();
    } else {
      tap();
    }
  }

  body.addEventListener('pointerdown', onDown);
  body.addEventListener('pointermove', onMove);
  body.addEventListener('pointerup', onUp);
  body.addEventListener('pointercancel', onUp);
  /* 键盘：Enter / 空格 也算戳一下 */
  body.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); }
  });

  /* ---- 朝向鼠标（轻微倾斜）---- */
  var gx = -9999, gy = -9999, raf = 0;
  var lx = 0, ly = 0;

  function follow() {
    raf = 0;
    if (reduce || dragging || !root.classList.contains('pet--on')) { return; }
    var s = size();
    var nx = (gx - (pos.x + s.w / 2)) / (window.innerWidth * 0.55);
    var ny = (gy - (pos.y + s.h * 0.6)) / (window.innerHeight * 0.7);
    nx = Math.max(-1, Math.min(1, nx));
    ny = Math.max(-1, Math.min(1, ny));
    /* 变化小于 0.05px 就不写样式，省得每帧都触发一次样式计算 */
    var tx = Math.round(nx * 240) / 100;
    var ty = Math.round(ny * 140) / 100;
    if (Math.abs(tx - lx) < 0.05 && Math.abs(ty - ly) < 0.05) { return; }
    lx = tx;
    ly = ty;
    lean.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) rotate(' +
      (nx * 3).toFixed(2) + 'deg)';
  }

  document.addEventListener('pointermove', function (e) {
    gx = e.clientX;
    gy = e.clientY;
    if (raf) { return; }
    raf = window.requestAnimationFrame(follow);
  }, { passive: true });

  /* ---- 关闭：说完告别再收起，右下角留召回按钮 ---- */
  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    say(pick(cfg.lines.leave), 2000);
    window.setTimeout(function () { deactivate({ save: true, pill: true }); }, 2000);
  });

  /* ---- 召回按钮：任何页面刷新后都在，点了就回来 ---- */
  if (recallBtn) {
    recallBtn.addEventListener('click', function () {
      store(K.hide, '0');
      recall();
    });
  }

  /* ---- 后台标签页：停掉眨眼/计时，回来再续 ---- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      window.clearTimeout(blinkT);
      window.clearTimeout(blinkHoldT);
      window.clearTimeout(sleepT);
      root.classList.remove('is-blink');
    } else if (root.classList.contains('pet--on')) {
      if (!sleeping) { resetIdle(); }
      scheduleBlink();
    }
  });

  /* ---- 关页面时把当前位置落盘（拖到一半直接关掉也不丢）---- */
  window.addEventListener('pagehide', function () {
    if (custom) { store(K.pos, JSON.stringify(pos)); }
  });

  /* ---- 多标签同步：一个标签里关掉/召回，其它标签跟着变 ---- */
  window.addEventListener('storage', function (e) {
    if (e.key !== K.hide) { return; }
    if (e.newValue === '1') {
      deactivate({ pill: true });
    } else if (e.newValue === '0' && !(isNarrow && !cfg.mobile)) {
      recall();
    }
  });

  /* ---- 视口变化 ---- */
  var resizeT = 0;

  /* 跨断点：窄屏且没开 mobile 就收起来，宽回来再出现；开着 mobile 则切 .pet--mobile */
  function applyNarrow() {
    var narrow = window.innerWidth <= cfg.mobileMax;
    if (narrow === isNarrow) { return; }
    isNarrow = narrow;
    root.classList.toggle('pet--mobile', narrow && !!cfg.mobile);
    if (narrow && !cfg.mobile) {
      /* 手机上本来就不放桌宠，召回按钮也一起收起 */
      deactivate({});
    } else if (!narrow) {
      if (store(K.hide) === '1') { setRecall(true); }
      else { activate(); }
    }
  }

  /* 视口/断点变化后重新摆位：自定义位置放得下就守住，放不下（比如从桌面换到手机）回默认站位 */
  function relayout() {
    if (!root.classList.contains('pet--on')) { return; }
    var s = size();
    if (custom && pos.x <= window.innerWidth - s.w - 4) { setPos(pos.x, pos.y); }
    else {
      custom = false;
      var h = home();
      setPos(h.x, h.y);
    }
  }

  window.addEventListener('resize', function () {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(function () {
      applyNarrow();
      updateSprite();
      relayout();
    }, 160);
  });

  /* 断点判断直接用 matchMedia：比 resize 更准，也不会被 resize 节流吞掉 */
  var narrowMq = window.matchMedia ? window.matchMedia('(max-width: ' + cfg.mobileMax + 'px)') : null;
  if (narrowMq) {
    var onNarrow = function () { applyNarrow(); updateSprite(); relayout(); };
    if (narrowMq.addEventListener) { narrowMq.addEventListener('change', onNarrow); }
    else if (narrowMq.addListener) { narrowMq.addListener(onNarrow); }
  }

  /* ================= 页面事件：阅读进度 / 复制代码 / 深夜 / 久留 / 问候 ================= */

  var st = {
    type: '', greeted: '', pct: 0, fired: [],
    copied: 0, top: 0, lateNight: false, stay: false,
    resume: 0, fest: '', meow: 0
  };

  /* 页面类型：文章 / 首页列表 / 归档列表 / 普通页面（主题 a4-plus 的结构） */
  function pageType() {
    if (document.querySelector('.post-main-title')) { return 'post'; }
    if (document.querySelector('.archive-main') || document.querySelector('.index-header-line')) { return 'home'; }
    if (/^\/(archives|categories|tags)(\/|$)/.test(window.location.pathname)) { return 'archive'; }
    return 'page';
  }

  function visible() { return root.classList.contains('pet--on'); }

  /* 一次会话只提醒一次；无痕模式下 storage 会抛错，那就照常提醒 */
  function sessionOnce(key) {
    try {
      if (window.sessionStorage.getItem(key)) { return false; }
      window.sessionStorage.setItem(key, '1');
      return true;
    } catch (e) { return true; }
  }

  /* QA 钩子：?pet_hour=3 假装现在是 3 点；?pet_stay=0.01 把久留提醒缩短到 0.6 秒 */
  function qp(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  /* 台词既可以是数组也可以是单个字符串 */
  function pickOne(val) {
    if (Object.prototype.toString.call(val) === '[object Array]') { return pick(val); }
    return typeof val === 'string' ? val : '';
  }

  /* ---- 脚下的进度线：只在文章页，长度跟着阅读进度；看完变绿闪两下 ---- */
  var barPct = -1;
  var barDone = false;

  function setBar(pct) {
    if (!cfg.bar || !bar) { return; }
    var p = Math.max(0, Math.min(100, pct || 0));
    if (p === barPct) { return; }
    barPct = p;
    bar.style.setProperty('--pet-p', (p / 100).toFixed(4));
    root.classList.toggle('has-bar', p >= 3);
    /* 滚回上面再往下读，绿色收回去；真的到底才闪 */
    if (p >= 100) {
      if (!barDone) { barDone = true; root.classList.add('is-done'); }
    } else if (barDone && p < 96) {
      barDone = false;
      root.classList.remove('is-done');
    }
  }

  /* ---- 续读位置：文章页把“读到哪”存起来，下次问一句要不要接着看 ---- */
  var resumeOffer = null;         /* { y, pct } */
  var resumeText = '';
  var resumeT = 0, resumeSaveT = 0, resumeAt = 0;

  function resumeKey() { return K.scroll + window.location.pathname; }

  function scrollMax() {
    var doc = document.documentElement;
    var b = document.body;
    return Math.max(doc.scrollHeight, b ? b.scrollHeight : 0) - window.innerHeight;
  }

  function dropResume() {
    if (!resumeOffer) { return; }
    resumeOffer = null;
    resumeText = '';
    window.clearTimeout(resumeT);
    root.classList.remove('is-resume');
  }

  function saveResume() {
    resumeSaveT = 0;
    if (!cfg.resume || pageType() !== 'post') { return; }
    var max = scrollMax();
    if (max < 360) { return; }
    var y = scrollTopNow();
    var pct = Math.round(y / max * 100);
    try {
      if (pct >= 95) { window.localStorage.removeItem(resumeKey()); return; }
      if (pct < 5) { return; }
      window.localStorage.setItem(resumeKey(), JSON.stringify({ y: Math.round(y), pct: pct, t: Date.now() }));
    } catch (e) {}
  }

  function scheduleResumeSave() {
    if (resumeSaveT) { return; }
    resumeSaveT = window.setTimeout(saveResume, 520);
  }

  /* ?pet_resume=42 假装上次读到 42%；?pet_resume=0 关掉 */
  function resumeRecord() {
    var fake = qp('pet_resume');
    if (fake !== '') {
      var n = parseFloat(fake);
      if (!(n > 0)) { return null; }
      n = Math.min(n, 94);
      return { y: Math.round(scrollMax() * n / 100), pct: Math.round(n), t: Date.now() };
    }
    try { return JSON.parse(store(resumeKey()) || 'null'); } catch (e) { return null; }
  }

  function initResume() {
    if (!cfg.resume || pageType() !== 'post') { return; }
    window.addEventListener('scroll', function () {
      if (resumeOffer && Math.abs(scrollTopNow() - resumeAt) > 60) { dropResume(); }
      scheduleResumeSave();
    }, { passive: true });
    window.addEventListener('pagehide', saveResume);

    var rec = resumeRecord();
    if (!rec || typeof rec.y !== 'number' || !(rec.pct >= 5) || rec.pct >= 95) { return; }
    if (rec.t && Date.now() - rec.t > 30 * 24 * 3600 * 1000) { return; }
    if (scrollTopNow() > 160) { return; }
    window.setTimeout(function () {
      if (!visible() || resumeOffer || scrollTopNow() > 160) { return; }
      var text = pickOne(cfg.lines.resume);
      if (!text) { return; }
      resumeOffer = { y: Math.round(rec.y), pct: Math.round(rec.pct) };
      resumeText = text.replace('{pct}', rec.pct);
      resumeAt = scrollTopNow();
      st.resume = resumeOffer.pct;
      root.classList.add('is-resume');
      sayRaw(resumeText, 9000);
      resumeT = window.setTimeout(dropResume, 9000);
    }, Math.max(cfg.resumeAfter || 0, 800));
  }

  /* 点气泡：跳回上次的位置（气泡只有在这个提示里可点） */
  bubble.addEventListener('click', function (e) {
    if (!resumeOffer) { return; }
    e.preventDefault();
    e.stopPropagation();
    var y = resumeOffer.y;
    dropResume();
    say(pick(cfg.lines.resumeGo) || '接着看~', 2200);
    if (reduce) { window.scrollTo(0, y); }
    else {
      try { window.scrollTo({ top: y, behavior: 'smooth' }); }
      catch (err) { window.scrollTo(0, y); }
    }
    resetIdle();
  });

  /* ---- 节日彩蛋：cfg.dates 里配了 MM-DD 的，命中就说一句；?pet_date=12-25 可测 ---- */
  function initFest() {
    var dates = cfg.dates;
    if (!dates || typeof dates !== 'object') { return; }
    var md = qp('pet_date');
    if (!md) {
      var d = new Date();
      md = ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }
    var line = pickOne(dates[md]);
    if (!line) { return; }
    if (!sessionOnce('pet:fest:' + md)) { return; }
    st.fest = md;
    window.setTimeout(function () {
      if (!visible()) { return; }
      say(line, 5200);
      sparkle();
    }, 2600);
  }

  /* ---- 阅读进度：只在文章页，跨过一个刻度说一句；脚下那条线跟着走 ---- */
  function initProgress() {
    if (pageType() !== 'post') { return; }
    var wantSay = !!cfg.progress;
    var marks = wantSay ? (cfg.progressAt || []).slice().sort(function (a, b) { return a - b; }) : [];
    var lines = wantSay ? (cfg.lines.progress || []) : [];
    var wantBar = !!(cfg.bar && bar);
    if (!wantBar && (!marks.length || !lines.length)) { return; }
    var raf = 0, timer = 0;

    function scrollY() { return window.pageYOffset || document.documentElement.scrollTop || 0; }

    function check() {
      raf = 0;
      var doc = document.documentElement;
      var bodyEl = document.body;
      var max = Math.max(doc.scrollHeight, bodyEl ? bodyEl.scrollHeight : 0) - window.innerHeight;
      if (max < 360) { setBar(0); return; }            /* 太短的页面没有“进度”可言 */
      var y = scrollY();
      var pct = Math.min(100, Math.max(0, y / max * 100));
      st.pct = Math.round(pct);
      setBar(pct);

      if (!marks.length || !lines.length) { return; }
      var hit = -1, i;
      for (i = 0; i < marks.length; i++) {
        if (st.fired.indexOf(marks[i]) !== -1 || pct < marks[i]) { continue; }
        /* 100% 必须真的滑到底，差几像素内也算 */
        if (marks[i] >= 100 && max - y > 8) { continue; }
        hit = i;
      }
      if (hit < 0) { return; }
      /* 一次性跳很远时只念最高那档，中间的默默记上，不刷屏 */
      for (i = 0; i < hit; i++) {
        if (st.fired.indexOf(marks[i]) === -1) { st.fired.push(marks[i]); }
      }
      st.fired.push(marks[hit]);
      if (!visible()) { return; }
      say(lines[hit] || lines[lines.length - 1], 3200);
      if (marks[hit] >= 100) { sparkle(); }
    }

    function run() {
      if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
      if (timer) { window.clearTimeout(timer); timer = 0; }
      check();
    }

    function schedule() {
      if (raf || timer) { return; }
      raf = window.requestAnimationFrame(run);
      /* rAF 在离屏 iframe / 后台标签页里可能被挂起，补一个兜底 */
      timer = window.setTimeout(run, 150);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    check();
  }

  /* ---- 复制代码：主题用 execCommand('copy')，会抛 copy 事件 ---- */
  function initCopy() {
    var lines = cfg.lines.copied || [];
    if (!cfg.copied || !lines.length) { return; }
    /* 不检查“页面里现在有没有 pre”：代码块可能是之后渲染进来的，事件里再判断 */
    var lastPre = 0;

    document.addEventListener('pointerdown', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('.post-main pre')) { lastPre = Date.now(); }
    }, true);

    document.addEventListener('copy', function () {
      /* 只有 1.5s 内点过代码块才算“复制代码”，普通选中文字不打扰 */
      if (!lastPre || Date.now() - lastPre > 1500) { return; }
      lastPre = 0;
      st.copied++;
      if (!visible()) { return; }
      say(pick(lines), 2600);
      sparkle();
    }, true);
  }

  /* ---- 深夜（0:00–4:59）提醒一次 ---- */
  function initLateNight() {
    var lines = cfg.lines.lateNight || [];
    if (!cfg.lateNight || !lines.length) { return; }
    var h = qp('pet_hour');
    h = h === '' ? new Date().getHours() : parseInt(h, 10);
    if (isNaN(h) || h < 0 || h > 23 || h >= 5) { return; }
    if (!sessionOnce('pet:late')) { return; }
    /* 等欢迎语说完再提醒，别抢话 */
    window.setTimeout(function () {
      st.lateNight = true;
      if (!visible()) { return; }
      say(pick(lines), 4200);
    }, 6600);
  }

  /* ---- 久留提醒：超过 stayReminder 分钟说一句（后台标签页不算） ---- */
  function initStay() {
    var lines = cfg.lines.longStay || [];
    var min = parseFloat(qp('pet_stay') || cfg.stayReminder);
    if (!(min > 0) || !lines.length) { return; }
    if (!sessionOnce('pet:stay')) { return; }

    function fire() {
      if (document.hidden) { window.setTimeout(fire, 5 * 60000); return; }
      st.stay = true;
      if (!visible()) { return; }
      say(pick(lines), 4200);
    }
    window.setTimeout(fire, Math.max(min, 0.005) * 60000);
  }

  /* ---- 双击回顶 ---- */
  var lastTopAt = 0;

  function goTop() {
    if (!canTop()) { return false; }
    /* 自己的双击判定和浏览器 dblclick 可能各来一次，500ms 内只回顶一次 */
    var now = Date.now();
    if (now - lastTopAt < 500) { return false; }
    lastTopAt = now;
    st.top++;
    pulse('is-hop', 640);
    say(pick(cfg.lines.top) || '回顶部咯', 2200);
    if (reduce) { window.scrollTo(0, 0); }
    else {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
      catch (e) { window.scrollTo(0, 0); }
    }
    return true;
  }

  /* ---- 启动时的问候：首访 > 页面类型 > 通用 ---- */
  function greetLine() {
    var type = pageType();
    st.type = type;
    var line = pick(cfg.lines.welcome);
    if (cfg.greetByType) {
      var typed = pickOne((cfg.lines.byType || {})[type]);
      if (typed) { line = typed; st.greeted = 'type'; }
    }
    var first = false;
    try { first = !window.localStorage.getItem(K.first); } catch (e) {}
    if (cfg.firstVisit && first) {
      try { window.localStorage.setItem(K.first, '1'); } catch (e) {}
      var hello = pickOne(cfg.lines.first);
      if (hello) { line = hello; st.greeted = 'first'; }
    } else if (!st.greeted) {
      st.greeted = 'welcome';
    }
    return line;
  }

  function initPageEvents() {
    initProgress();
    initResume();
    initFest();
    initCopy();
    initLateNight();
    initStay();
  }

  if (cfg.dblclickTop) {
    body.addEventListener('dblclick', function (e) {
      if (closeBtn.contains(e.target)) { return; }
      e.preventDefault();
      cancelTap();                    /* 把单击的那一下撤掉 */
      goTop();
    });
  }

  /* ================= 显隐：关掉后留一个召回按钮，随时叫回来 ================= */
  var active = false;
  var recallLine = 0;

  function setRecall(show) {
    if (!recallBtn) { return; }
    recallBtn.hidden = !show;
  }

  /* 按当前视口落位：存过位置、且当前屏幕放得下就守住，否则回到默认站位 */
  function placeInitial() {
    var saved = null;
    try { saved = JSON.parse(store(K.pos) || 'null'); } catch (e) {}
    var h = home();
    var s = size();
    var useSaved = saved && typeof saved.x === 'number' && typeof saved.y === 'number' &&
      saved.x <= window.innerWidth - s.w - 4;
    custom = !!useSaved;
    root.style.transition = 'none';
    setPos(useSaved ? saved.x : h.x, useSaved ? saved.y : h.y);
    void root.offsetWidth;
    root.style.transition = '';
  }

  function activate(line, delay) {
    if (active) { return; }
    active = true;
    setRecall(false);
    root.classList.add('pet--on');
    placeInitial();
    resetIdle();
    scheduleBlink();
    if (line) {
      window.clearTimeout(recallLine);
      recallLine = window.setTimeout(function () { say(line); }, delay || 900);
    }
  }

  /* save: 写入 pet:hide；pill: 是否留下召回按钮 */
  function deactivate(opt) {
    opt = opt || {};
    active = false;
    dragging = false;
    sleeping = false;
    wasAsleep = false;
    dropResume();
    window.clearTimeout(talkT);
    window.clearTimeout(tapT);
    window.clearTimeout(recallLine);
    window.clearTimeout(sleepT);
    window.clearTimeout(blinkT);
    window.clearTimeout(blinkHoldT);
    root.classList.remove('pet--on', 'pet--sleep', 'is-blink', 'is-talking', 'is-dragging');
    if (opt.save) { store(K.hide, '1'); }
    setRecall(!!opt.pill);
  }

  /* 召回：还没问候过就走首访 / 页面类型问候，否则用 back 台词 */
  function recall() {
    if (active) { return; }
    activate(st.greeted ? pick(cfg.lines.back) : greetLine(), 260);
    try { window.dispatchEvent(new CustomEvent('pet:show')); } catch (e) {}
  }

  /* ---- 启动 ---- */
  function boot() {
    initPageEvents();
    /* 之前点过关闭：不出现，但右下角留一个召回按钮，刷新 / 换页也还在 */
    if (store(K.hide) === '1') {
      deactivate({ pill: true });
      return;
    }
    activate(greetLine(), 1100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ---- 对外接口：window.pet.say('…') / poke() / sleep() … ---- */
  window.pet = {
    say: say,
    poke: poke,
    meow: meow,
    sleep: doze,
    wake: function () { return wake(true); },
    blink: blinkOnce,
    sparkle: sparkle,
    isSleeping: function () { return sleeping; },
    show: function () { store(K.hide, '0'); recall(); },
    hide: function () { deactivate({ save: true, pill: true }); },
    top: goTop,
    refresh: function () { applyNarrow(); updateSprite(); relayout(); },
    pageType: pageType,
    progress: function () { return { pct: st.pct, fired: st.fired.slice() }; },
    bar: function () { return { pct: barPct, done: barDone }; },
    resume: function () { return resumeOffer ? { y: resumeOffer.y, pct: resumeOffer.pct } : null; },
    state: function () {
      return {
        type: st.type, greeted: st.greeted, pct: st.pct, fired: st.fired.slice(),
        copied: st.copied, top: st.top, lateNight: st.lateNight, stay: st.stay,
        resume: st.resume, fest: st.fest, meow: st.meow,
        bar: barPct, barDone: barDone,
        offered: !!resumeOffer,
        text: bubble.textContent, talking: root.classList.contains('is-talking'),
        pos: { x: pos.x, y: pos.y }, sprite: spriteW, dragging: dragging,
        active: active, recall: !!(recallBtn && !recallBtn.hidden),
        mobile: root.classList.contains('pet--mobile'), narrow: isNarrow
      };
    },
    cfg: cfg
  };

})();
