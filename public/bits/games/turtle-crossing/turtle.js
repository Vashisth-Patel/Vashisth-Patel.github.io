/*
 * Turtle Crossing, 2026 remaster of turtle-crossing/main.py (Python turtle, 2022).
 * Same look: white background, colourful rectangular cars driving left, the turtle-module turtle
 * moving up 30 px per press. New: Up works immediately, real levels (all cars ~1.3× faster per level),
 * nine evenly spaced lanes, a game over screen, tap to move on touch screens.
 */
(function () {
  'use strict';

  var H = 400; // world height, turtle coordinates: y from -200 (bottom) to 200 (top)
  var STEP = 30;
  var START_Y = -190;
  var FINISH_Y = 200;
  var LANES = [-160, -120, -80, -40, 0, 40, 80, 120, 160];
  var COLORS = ['red', 'green', 'yellow', 'pink', 'purple', 'orange'];
  var CAR_W = 60, CAR_H = 18;
  var BASE_SPEED = 130; // px per second at level 1
  var LEVEL_MULT = 1.3;
  // The "turtle" shape from Python's turtle module, head at (0, 16).
  var TURTLE = [[0, 16], [-2, 14], [-1, 10], [-4, 7], [-7, 9], [-9, 8], [-6, 5], [-7, 1], [-5, -3], [-8, -6], [-6, -8], [-4, -5], [0, -7], [4, -5], [6, -8], [8, -6], [5, -3], [7, 1], [6, 5], [9, 8], [7, 9], [4, 7], [1, 10], [2, 14]];
  var SCALE = 0.9;
  var T_HALF_W = 9 * SCALE, T_HALF_H = 12 * SCALE;

  var A = window.Arcade;
  var $ = function (s) { return document.querySelector(s); };
  var board = $('[data-board]');
  var canvas = $('[data-canvas]');
  var ctx = canvas.getContext('2d');
  var msg = $('[data-msg]');
  var msgTitle = $('[data-msg-title]');
  var msgSub = $('[data-msg-sub]');
  var toast = $('[data-toast]');
  var live = $('[data-live]');
  var hud = { level: $('[data-level]'), best: $('[data-best]') };

  var W = 600, s = 1, dpr = 1;
  var lanes = [];
  var turtleY, hopFrom, hopAt, level, speedMult, state, deadAt;
  var best = parseInt(A.store.get('bits-turtle-best', '1'), 10) || 1;
  var last = performance.now();
  var toastTimer = 0;

  /* ---------- layout: world height is fixed, width follows the screen ---------- */
  function fit() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    var hint = $('.tap-hint');
    var used = $('.hud').offsetHeight + $('.foot').offsetHeight + (hint.offsetParent ? hint.offsetHeight + 6 : 0) + 24;
    var availW = window.innerWidth - 24;
    var availH = Math.max(160, window.innerHeight - used);
    W = Math.max(300, Math.min(600, (H * availW) / availH));
    s = Math.min(availW / W, availH / H);
    var cw = Math.floor(W * s), ch = Math.floor(H * s);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }

  /* ---------- state ---------- */
  function rollGap() {
    return 150 + Math.random() * 200; // centre to centre
  }
  function newCar(x) {
    return { x: x, color: COLORS[Math.floor(Math.random() * COLORS.length)] };
  }
  function newLanes() {
    lanes = LANES.map(function (y) {
      var lane = { y: y, base: BASE_SPEED * (0.8 + Math.random() * 0.45), gap: rollGap(), cars: [] };
      var x = -W / 2 - CAR_W + Math.random() * lane.gap;
      while (x < W / 2 + CAR_W) {
        lane.cars.push(newCar(x));
        x += rollGap();
      }
      return lane;
    });
  }

  function reset() {
    level = 1;
    speedMult = 1;
    turtleY = hopFrom = START_Y;
    hopAt = 0;
    newLanes();
    paintHud();
  }

  function paintHud() {
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

  function ready() {
    state = 'ready';
    reset();
    showMsg(
      'TURTLE CROSSING',
      'Get the turtle to the top. Every crossing is a new level, and every level makes all cars ~1.3× faster.<br><br>' +
        (A.touch ? 'Tap to start' : 'Press <span class="msg-key">↑</span> or <span class="msg-key">W</span> to start'),
    );
  }

  function start() {
    state = 'playing';
    msg.hidden = true;
    last = performance.now();
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    showMsg('PAUSED', A.touch ? 'Tap to resume' : 'Press <span class="msg-key">P</span> or <span class="msg-key">↑</span> to resume');
  }

  function up() {
    if (state === 'ready') start();
    else if (state === 'paused') { start(); return; }
    if (state !== 'playing') return;
    hopFrom = drawnY(performance.now());
    hopAt = performance.now();
    turtleY += STEP;
    A.sfx.step();
    if (turtleY >= FINISH_Y) levelUp();
  }

  function levelUp() {
    level++;
    speedMult = Math.pow(LEVEL_MULT, level - 1);
    if (level > best) {
      best = level;
      A.store.set('bits-turtle-best', best);
    }
    turtleY = hopFrom = START_Y;
    hopAt = 0;
    paintHud();
    flashToast('LEVEL ' + level + ' · cars ×1.3');
    A.sfx.level();
    say('Level ' + level + '.');
  }

  function die() {
    state = 'over';
    deadAt = performance.now();
    A.sfx.over();
    if (!A.reducedMotion) {
      board.classList.remove('shake');
      void board.offsetWidth;
      board.classList.add('shake');
    }
    showMsg(
      'GAME OVER',
      'Level ' + level + ' · best ' + best + '<br><br>' + (A.touch ? 'Tap to try again' : '<span class="msg-key">Space</span> to try again'),
    );
    say('Game over at level ' + level + '.');
  }

  function restartIfReady() {
    if (state === 'over' && performance.now() - deadAt > 450) {
      ready();
      start();
    }
  }

  /* ---------- simulation ---------- */
  function update(dt) {
    var spawnX = W / 2 + CAR_W / 2 + 4;
    for (var i = 0; i < lanes.length; i++) {
      var l = lanes[i];
      var v = l.base * speedMult * dt;
      var rightmost = -Infinity;
      for (var j = l.cars.length - 1; j >= 0; j--) {
        var c = l.cars[j];
        c.x -= v;
        if (c.x < -W / 2 - CAR_W) l.cars.splice(j, 1);
        else if (c.x > rightmost) rightmost = c.x;
      }
      if (spawnX - rightmost >= l.gap) {
        l.cars.push(newCar(spawnX));
        l.gap = rollGap();
      }
      // collision: axis-aligned boxes, turtle always at x = 0
      if (Math.abs(l.y - turtleY) < CAR_H / 2 + T_HALF_H) {
        for (var k = 0; k < l.cars.length; k++) {
          if (Math.abs(l.cars[k].x) < CAR_W / 2 + T_HALF_W) return die();
        }
      }
    }
  }

  /* ---------- drawing ---------- */
  function drawnY(now) {
    if (A.reducedMotion || !hopAt) return turtleY;
    var t = Math.min(1, (now - hopAt) / 90);
    return hopFrom + (turtleY - hopFrom) * (1 - Math.pow(1 - t, 3));
  }

  function sy(y) {
    return H / 2 - y; // turtle y (up) -> canvas y (down)
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(now) {
    ctx.setTransform(s * dpr, 0, 0, s * dpr, 0, 0);
    ctx.translate(W / 2, 0); // x = 0 is the middle, like turtle
    ctx.fillStyle = '#fff';
    ctx.fillRect(-W / 2, 0, W, H);

    // lane dividers and the finish line
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 12]);
    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.beginPath();
    for (var d = -180; d <= 180; d += 40) {
      ctx.moveTo(-W / 2, sy(d) + 0.5);
      ctx.lineTo(W / 2, sy(d) + 0.5);
    }
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(-W / 2, sy(186) + 0.5);
    ctx.lineTo(W / 2, sy(186) + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);

    // cars
    for (var i = 0; i < lanes.length; i++) {
      var l = lanes[i];
      for (var j = 0; j < l.cars.length; j++) {
        var c = l.cars[j];
        var x = c.x - CAR_W / 2, y = sy(l.y) - CAR_H / 2;
        ctx.fillStyle = c.color;
        roundRect(x, y, CAR_W, CAR_H, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.28)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; // windscreen, facing left
        ctx.fillRect(x + 8, y + 3, 7, CAR_H - 6);
      }
    }

    // turtle
    var ty = sy(drawnY(now));
    var dead = state === 'over';
    ctx.fillStyle = dead && (A.reducedMotion || Math.floor((now - deadAt) / 120) % 2 === 0) ? '#d22' : '#000';
    ctx.beginPath();
    for (var k = 0; k < TURTLE.length; k++) {
      var px = TURTLE[k][0] * SCALE;
      var py = ty - (TURTLE[k][1] - 4) * SCALE;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === 'playing') update(dt);
    draw(now);
    requestAnimationFrame(loop);
  }

  /* ---------- input ---------- */
  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      if (state === 'over') return;
      up();
    } else if (k === ' ' || k === 'Enter') {
      if (e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      if (state === 'ready' || state === 'paused') start();
      else restartIfReady();
    } else if (k === 'p' || k === 'P') {
      if (state === 'playing') pause();
      else if (state === 'paused') start();
    } else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
    }
  });

  // Tap or click anywhere (except buttons and links) moves the turtle up.
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button, a')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (state === 'over') restartIfReady();
    else up();
  });

  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  window.addEventListener('resize', fit);

  fit();
  ready();
  requestAnimationFrame(loop);
})();
