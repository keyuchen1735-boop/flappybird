/* Flappy Bird — canvas implementation.
 * Known issue: pipe collisions are not detected (see hitsPipe below).
 */
(function () {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;

  // Tunables
  const GROUND_H = 72;
  const GRAVITY = 0.42;
  const FLAP = -7.2;
  const MAX_FALL = 11;
  const PIPE_W = 58;
  const PIPE_GAP = 150;
  const PIPE_SPACING = 200;
  const SCROLL = 2.1;
  const BIRD_R = 13;

  // Colors — pipes are blue
  const PIPE_BODY = '#2f7bd6';
  const PIPE_BODY_DARK = '#1f5aa6';
  const PIPE_RIM = '#17406f';
  const PIPE_LIGHT = '#6aa9ea';

  const STATE = { READY: 'ready', PLAYING: 'playing', OVER: 'over' };

  let state, bird, pipes, score, best = 0, frame, groundOffset;

  function reset() {
    state = STATE.READY;
    bird = { x: W * 0.3, y: H * 0.42, vy: 0, r: BIRD_R, rot: 0 };
    pipes = [];
    score = 0;
    frame = 0;
    groundOffset = 0;
    for (let i = 0; i < 3; i++) spawnPipe(W + 120 + i * PIPE_SPACING);
  }

  function spawnPipe(x) {
    const margin = 56;
    const playable = H - GROUND_H;
    const minTop = margin;
    const maxTop = playable - PIPE_GAP - margin;
    const top = minTop + Math.random() * (maxTop - minTop);
    pipes.push({ x: x, top: top, passed: false });
  }

  function flap() {
    if (state === STATE.READY) state = STATE.PLAYING;
    if (state === STATE.PLAYING) {
      bird.vy = FLAP;
    } else if (state === STATE.OVER) {
      reset();
    }
  }

  /* ---- collision ---------------------------------------------------- */

  // BUG: this never reports a hit. The horizontal test requires the bird to be
  // past the pipe's right edge AND before its left edge at the same time, which
  // is impossible, so the gap check below is dead code and the bird flies
  // straight through every pipe.
  function hitsPipe(b, p) {
    const overlapsX = b.x + b.r > p.x + PIPE_W && b.x - b.r < p.x;
    if (!overlapsX) return false;

    const gapTop = p.top;
    const gapBottom = p.top + PIPE_GAP;
    return b.y - b.r < gapTop || b.y + b.r > gapBottom;
  }

  function hitsGroundOrCeiling(b) {
    return b.y + b.r >= H - GROUND_H || b.y - b.r <= 0;
  }

  /* ---- update ------------------------------------------------------- */

  function update() {
    frame++;

    if (state === STATE.READY) {
      bird.y = H * 0.42 + Math.sin(frame / 14) * 6;
      groundOffset = (groundOffset + SCROLL) % 24;
      return;
    }

    if (state === STATE.OVER) {
      // let the bird drop to the ground
      bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
      bird.y = Math.min(bird.y + bird.vy, H - GROUND_H - bird.r);
      bird.rot = Math.min(bird.rot + 0.08, Math.PI / 2);
      return;
    }

    groundOffset = (groundOffset + SCROLL * 1.2 ** score) % 24;

    bird.vy = Math.min(bird.vy + GRAVITY, MAX_FALL);
    bird.y += bird.vy;
    bird.rot = Math.max(-0.5, Math.min(bird.vy / 12, Math.PI / 2));

    for (const p of pipes) p.x -= SCROLL * 1.2 ** score;

    const last = pipes[pipes.length - 1];
    if (last && last.x < W - PIPE_SPACING) spawnPipe(last.x + PIPE_SPACING);

    for (const p of pipes) {
      if (!p.passed && p.x + PIPE_W < bird.x - bird.r) {
        p.passed = true;
        score++;
        best = Math.max(best, score);
      }
      if (hitsPipe(bird, p)) die();
    }
    if (pipes.length && pipes[0].x + PIPE_W < -10) pipes.shift();

    if (hitsGroundOrCeiling(bird)) die();
  }

  function die() {
    if (state !== STATE.PLAYING) return;
    state = STATE.OVER;
    best = Math.max(best, score);
  }

  /* ---- draw --------------------------------------------------------- */

  function drawPipe(p) {
    const gapBottom = p.top + PIPE_GAP;
    const bottomH = H - GROUND_H - gapBottom;

    drawPipeBody(p.x, 0, PIPE_W, p.top);
    drawPipeRim(p.x, p.top - 26);

    drawPipeBody(p.x, gapBottom, PIPE_W, bottomH);
    drawPipeRim(p.x, gapBottom);
  }

  function drawPipeBody(x, y, w, h) {
    if (h <= 0) return;
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, PIPE_BODY_DARK);
    grad.addColorStop(0.25, PIPE_LIGHT);
    grad.addColorStop(0.55, PIPE_BODY);
    grad.addColorStop(1, PIPE_BODY_DARK);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PIPE_RIM;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y, w - 2, h);
  }

  function drawPipeRim(x, y) {
    const rw = PIPE_W + 10;
    const rx = x - 5;
    const grad = ctx.createLinearGradient(rx, 0, rx + rw, 0);
    grad.addColorStop(0, PIPE_BODY_DARK);
    grad.addColorStop(0.25, PIPE_LIGHT);
    grad.addColorStop(0.6, PIPE_BODY);
    grad.addColorStop(1, PIPE_BODY_DARK);
    ctx.fillStyle = grad;
    ctx.fillRect(rx, y, rw, 26);
    ctx.strokeStyle = PIPE_RIM;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx + 1, y + 1, rw - 2, 24);
  }

  // 8-bit autumn backdrop: banded sky, sun, blocky tree line, falling leaves
  const SKY = ['#f6c26b', '#f2a65a', '#e8895a', '#c96b5a', '#9c5a63'];
  const TREES = ['#a8431f', '#d1701f', '#e8a02a', '#7a3a1d'];
  const LEAF = ['#d1701f', '#e8a02a', '#a8431f', '#c9501f'];
  function drawAutumn() {
    const px = 4, gy = H - GROUND_H;
    const band = Math.ceil(gy / SKY.length / px) * px;
    SKY.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * band, W, band); });
    ctx.fillStyle = '#fff1b8'; ctx.fillRect(250, 70, 40, 40);
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(258, 62, 24, 8); ctx.fillRect(258, 110, 24, 8);
    for (let x = 0, i = 0; x < W; x += 28, i++) {
      const h = 40 + ((i * 37) % 5) * 12;
      ctx.fillStyle = TREES[i % TREES.length];
      ctx.fillRect(x, gy - h, 28, h);
      ctx.fillRect(x + 4, gy - h - 8, 20, 8);
    }
    for (let i = 0; i < 14; i++) {
      const x = Math.floor(((i * 53 + frame * (0.4 + (i % 3) * 0.2)) % (W + 20)) / px) * px - 10;
      const y = Math.floor(((i * 91 + frame * (0.8 + (i % 4) * 0.3)) % gy) / px) * px;
      ctx.fillStyle = LEAF[i % LEAF.length];
      ctx.fillRect(x, y, px * 2, px);
      ctx.fillRect(x + px, y + px, px, px);
    }
  }

  function drawGround() {
    const y = H - GROUND_H;
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, y, W, GROUND_H);
    ctx.fillStyle = '#5ec75e';
    ctx.fillRect(0, y, W, 14);
    ctx.fillStyle = '#3fa63f';
    for (let x = -groundOffset; x < W; x += 24) {
      ctx.fillRect(x, y + 10, 12, 5);
    }
    ctx.fillStyle = '#c9c07c';
    for (let x = -groundOffset * 0.6; x < W; x += 36) {
      ctx.fillRect(x, y + 32, 16, 4);
    }
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);

    // body
    ctx.fillStyle = '#f7d51d';
    ctx.strokeStyle = '#3a2e06';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // wing
    const wing = Math.sin(frame / 5) * 3;
    ctx.fillStyle = '#fff6c2';
    ctx.beginPath();
    ctx.ellipse(-3, 2 + wing, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(6.5, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // beak
    ctx.fillStyle = '#f06d1b';
    ctx.beginPath();
    ctx.moveTo(bird.r - 2, 0);
    ctx.lineTo(bird.r + 8, 3);
    ctx.lineTo(bird.r - 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function centerText(text, y, size, color) {
    ctx.font = 'bold ' + size + 'px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#15303a';
    ctx.strokeText(text, W / 2, y);
    ctx.fillStyle = color || '#fff';
    ctx.fillText(text, W / 2, y);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawAutumn();
    for (const p of pipes) drawPipe(p);
    drawGround();
    drawBird();

    centerText(String(score), 64, 36);

    if (state === STATE.READY) {
      centerText('TAP TO FLAP', H / 2 + 60, 20);
    } else if (state === STATE.OVER) {
      centerText('GAME OVER', H / 2 - 20, 28, '#ffd34d');
      centerText('score ' + score + '   best ' + best, H / 2 + 12, 16);
      centerText('tap or press R', H / 2 + 42, 14);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  /* ---- input -------------------------------------------------------- */

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      flap();
    } else if (e.key === 'r' || e.key === 'R') {
      reset();
    }
  });

  canvas.addEventListener('mousedown', function (e) {
    e.preventDefault();
    flap();
  });

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    flap();
  }, { passive: false });

  reset();
  loop();
})();
