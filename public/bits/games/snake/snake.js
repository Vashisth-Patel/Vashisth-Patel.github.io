/*
 * Snake, 2026 remaster of snake/main.py (Python turtle, 2022).
 * Same look: black board, white square segments, white round food.
 * New: levels (every 5 food, +12% speed), food that never lands on the walls or the snake,
 * buffered turns, swipe + D-pad, pause, best score.
 */
(function () {
  'use strict';

  var N = 30; // grid cells per side
  var START_MS = 110; // first tick
  var SPEEDUP = 1.12; // per level
  var PER_LEVEL = 5; // food per level
  var MIN_MS = 45;

  var A = window.Arcade;
  var $ = function (s) { return document.querySelector(s); };
  var board = $('[data-board]');
  var canvas = $('[data-canvas]');
  var ctx = canvas.getContext('2d');
  var stage = $('[data-stage]');
  var msg = $('[data-msg]');
  var msgTitle = $('[data-msg-title]');
  var msgSub = $('[data-msg-sub]');
  var toast = $('[data-toast]');
  var live = $('[data-live]');
  var hud = { score: $('[data-score]'), level: $('[data-level]'), best: $('[data-best]') };
  var dpad = $('[data-dpad]');

  var DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
  };

  var cell = 16, size = N * 16, dpr = 1;
  var snake, prev, dir, queue, food, foodBorn, score, level, interval, acc, state, deadAt;
  var best = parseInt(A.store.get('bits-snake-best', '0'), 10) || 0;
  var last = performance.now();
  var toastTimer = 0;

  /* ---------- layout ---------- */
  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    var hudH = $('.hud').offsetHeight;
    var footH = $('.foot').offsetHeight;
    var padH = dpad.offsetParent ? dpad.offsetHeight : 0;
    var availW = window.innerWidth - 24;
    var availH = window.innerHeight - hudH - footH - padH - 20;
    var px = Math.max(180, Math.min(availW, availH, 720));
    cell = Math.max(5, Math.floor(px / N));
    size = cell * N;
    canvas.style.width = canvas.style.height = size + 'px';
    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- game state ---------- */
  function reset() {
    var m = Math.floor(N / 2);
    snake = [{ x: m, y: m }, { x: m - 1, y: m }, { x: m - 2, y: m }];
    prev = copy(snake);
    dir = DIRS.right;
    queue = [];
    score = 0;
    level = 1;
    interval = START_MS;
    acc = 0;
    spawnFood();
    paintHud();
  }

  function copy(list) {
    return list.map(function (s) { return { x: s.x, y: s.y }; });
  }

  function spawnFood() {
    // The original picked any pixel in the window, edges included. Here: free cells inside the walls only.
    var taken = {};
    snake.forEach(function (s) { taken[s.x + ',' + s.y] = true; });
    var free = [];
    for (var y = 1; y < N - 1; y++) for (var x = 1; x < N - 1; x++) if (!taken[x + ',' + y]) free.push({ x: x, y: y });
    food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
    foodBorn = performance.now();
  }

  function paintHud() {
    hud.score.textContent = score;
    hud.level.textContent = level;
    hud.best.textContent = best;
  }

  function showMsg(title, sub) {
    msgTitle.textContent = title;
    msgSub.innerHTML = sub;
    msg.hidden = false;
  }

  function flashToast(text) {
    toast.textContent = text;
    toast.classList.remove('is-on');
    void toast.offsetWidth;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 1300);
  }

  function say(text) {
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 30);
  }

  var startHint = A.touch
    ? 'Swipe or use the pad. Every 5 food: level up, +12% speed.'
    : 'Arrow keys or WASD. Every 5 food: level up, +12% speed.<br><span class="msg-key">P</span> pause · <span class="msg-key">M</span> sound';

  function ready() {
    state = 'ready';
    reset();
    showMsg('SNAKE', startHint + '<br><br>' + (A.touch ? 'Tap to start' : 'Press an arrow key to start'));
  }

  function start() {
    state = 'playing';
    msg.hidden = true;
    last = performance.now();
    acc = 0;
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    showMsg('PAUSED', A.touch ? 'Tap to resume' : 'Press <span class="msg-key">P</span> or an arrow key to resume');
  }

  function resume() {
    if (state !== 'paused') return;
    start();
  }

  function gameOver() {
    state = 'over';
    deadAt = performance.now();
    prev = copy(snake);
    A.sfx.over();
    var record = score > best;
    if (record) {
      best = score;
      A.store.set('bits-snake-best', best);
      paintHud();
    }
    if (!A.reducedMotion) {
      board.classList.remove('shake');
      void board.offsetWidth;
      board.classList.add('shake');
    }
    showMsg(
      'GAME OVER',
      'Score ' + score + ' · Level ' + level + (record && score > 0 ? ' · new best' : '') + '<br><br>' +
        (A.touch ? 'Tap to play again' : '<span class="msg-key">Space</span> to play again'),
    );
    say('Game over. Score ' + score + ', level ' + level + '.');
  }

  function levelUp() {
    level++;
    interval = Math.max(MIN_MS, START_MS / Math.pow(SPEEDUP, level - 1));
    paintHud();
    flashToast('LEVEL ' + level + ' · speed +12%');
    A.sfx.level();
    say('Level ' + level + '.');
    if (!A.reducedMotion) {
      board.classList.add('is-level');
      setTimeout(function () { board.classList.remove('is-level'); }, 450);
    }
  }

  function turn(name) {
    var d = DIRS[name];
    if (!d) return;
    if (state === 'over') return;
    if (state === 'ready') start();
    if (state === 'paused') resume();
    var lastDir = queue.length ? queue[queue.length - 1] : dir;
    if ((d.x === -lastDir.x && d.y === -lastDir.y) || (d.x === lastDir.x && d.y === lastDir.y)) return;
    if (queue.length < 3) queue.push(d);
  }

  function tick() {
    prev = copy(snake);
    if (queue.length) dir = queue.shift();
    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N) return gameOver();
    var eating = food && head.x === food.x && head.y === food.y;
    var body = eating ? snake : snake.slice(0, -1);
    for (var i = 0; i < body.length; i++) if (body[i].x === head.x && body[i].y === head.y) return gameOver();
    snake.unshift(head);
    if (eating) {
      prev.push({ x: prev[prev.length - 1].x, y: prev[prev.length - 1].y });
      score++;
      A.sfx.eat();
      if (score % PER_LEVEL === 0) levelUp();
      spawnFood();
      paintHud();
    } else {
      snake.pop();
    }
  }

  /* ---------- drawing ---------- */
  function draw(now) {
    var t = state === 'playing' && !A.reducedMotion ? Math.min(1, acc / interval) : 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);

    // faint grid, so speed and distance are readable
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 1; i < N; i++) {
      var p = i * cell + 0.5;
      ctx.moveTo(p, 0); ctx.lineTo(p, size);
      ctx.moveTo(0, p); ctx.lineTo(size, p);
    }
    ctx.stroke();

    // food: white circle, pops in, breathes gently
    if (food) {
      var age = Math.min(1, (now - foodBorn) / 160);
      var pulse = A.reducedMotion ? 1 : 0.9 + 0.1 * Math.sin(now / 180);
      var r = cell * 0.36 * (A.reducedMotion ? 1 : age) * pulse;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    }

    // snake: white squares, interpolated between ticks
    var gap = Math.max(1, Math.round(cell * 0.08));
    var dead = state === 'over';
    for (var j = snake.length - 1; j >= 0; j--) {
      var a = prev[j] || snake[j];
      var b = snake[j];
      var x = (a.x + (b.x - a.x) * t) * cell;
      var y = (a.y + (b.y - a.y) * t) * cell;
      if (dead) {
        var blink = !A.reducedMotion && now - deadAt < 600 && Math.floor((now - deadAt) / 100) % 2 === 0;
        ctx.fillStyle = blink ? '#fff' : j === 0 ? '#ff5a4f' : '#8a8a8a';
      } else {
        ctx.fillStyle = '#fff';
      }
      ctx.fillRect(x + gap, y + gap, cell - gap * 2, cell - gap * 2);
    }
  }

  function loop(now) {
    var dt = Math.min(250, now - last);
    last = now;
    if (state === 'playing') {
      acc += dt;
      while (acc >= interval && state === 'playing') {
        acc -= interval;
        tick();
      }
    }
    draw(now);
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  window.addEventListener('keydown', function (e) {
    var k = KEYS[e.key];
    if (k) {
      e.preventDefault();
      turn(k);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (state === 'ready') start();
      else if (state === 'over' && performance.now() - deadAt > 350) ready(), start();
      else if (state === 'paused') resume();
    } else if (e.key === 'p' || e.key === 'P') {
      if (state === 'playing') pause();
      else if (state === 'paused') resume();
    }
  });

  // Swipe anywhere on the board area. Several turns per gesture are fine.
  var sx = 0, sy = 0, tracking = false, swiped = false;
  stage.addEventListener('pointerdown', function (e) {
    tracking = true;
    swiped = false;
    sx = e.clientX;
    sy = e.clientY;
  });
  stage.addEventListener('pointermove', function (e) {
    if (!tracking) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    swiped = true;
    sx = e.clientX;
    sy = e.clientY;
  });
  function endPointer() {
    if (!tracking) return;
    tracking = false;
    if (swiped) return;
    if (state === 'ready') start();
    else if (state === 'paused') resume();
    else if (state === 'over' && performance.now() - deadAt > 450) { ready(); start(); }
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', function () { tracking = false; });

  dpad.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    e.preventDefault();
    b.classList.add('is-down');
    setTimeout(function () { b.classList.remove('is-down'); }, 120);
    if (b.dataset.dir) {
      if (state === 'over') return;
      turn(b.dataset.dir);
    } else if (b.hasAttribute('data-pause')) {
      if (state === 'playing') pause();
      else if (state === 'paused' || state === 'ready') state === 'ready' ? start() : resume();
      else if (state === 'over' && performance.now() - deadAt > 450) { ready(); start(); }
    }
  });
  // Keyboard users on the pad (Enter/Space on a focused button)
  dpad.addEventListener('click', function (e) {
    if (e.detail !== 0) return; // real pointer clicks were handled on pointerdown
    var b = e.target.closest('button');
    if (b && b.dataset.dir) turn(b.dataset.dir);
  });

  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  window.addEventListener('resize', fit);

  fit();
  ready();
  requestAnimationFrame(loop);
})();
