/* =========================================================
   Jogo da Cobrinha no Scratch — Lógica da apresentação
   ========================================================= */
(() => {
  const slidesEl = document.getElementById('slides');
  const slides = [...document.querySelectorAll('.slide')];
  const progress = document.getElementById('progress');
  const count = document.getElementById('count');
  let current = 0;

  /* ---------- Rodapé em cada slide (exceto capa/encerramento) ---------- */
  slides.forEach((s, i) => {
    if (s.classList.contains('cover')) return;
    const foot = document.createElement('div');
    foot.className = 'foot';
    foot.innerHTML = `<span class="brand"><i></i>Jogo da Cobrinha no Scratch</span><span>${String(i + 1).padStart(2, '0')} / ${slides.length}</span>`;
    s.appendChild(foot);
  });

  /* ---------- Blocos do Scratch (pt-BR) ---------- */
  if (window.scratchblocks) {
    scratchblocks.renderMatching('pre.blocks', {
      style: 'scratch3',
      languages: ['pt_br', 'en'],
      scale: 0.82,
    });
  }

  /* ---------- Escala responsiva (1600x900) ---------- */
  function fit() {
    const s = Math.min(window.innerWidth / 1600, window.innerHeight / 900) * 0.96;
    slidesEl.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- Navegação ---------- */
  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      s.classList.toggle('prev', i < n);
    });
    current = n;
    progress.style.width = ((n + 1) / slides.length * 100) + '%';
    count.textContent = `${n + 1} / ${slides.length}`;
    if (location.hash !== '#' + (n + 1)) history.replaceState(null, '', '#' + (n + 1));
  }
  const next = () => go(current + 1);
  const prev = () => go(current - 1);

  document.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key.toLowerCase() === 'f') toggleFull();
  });
  document.getElementById('btnNext').onclick = next;
  document.getElementById('btnPrev').onclick = prev;
  document.getElementById('btnFull').onclick = toggleFull;
  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  // swipe (touch)
  let tx = null;
  document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    tx = null;
  });

  const start = parseInt(location.hash.slice(1), 10);
  go(Number.isFinite(start) ? start - 1 : 0);

  /* ---------- Cobrinha animada (capa / encerramento) ---------- */
  function snakeBackground(canvas, opts = {}) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 1600, H = canvas.height = 900;
    const C = 40, cols = W / C, rows = Math.floor(H / C);
    let snake, dir, food, tick = 0;

    function reset() {
      snake = [];
      for (let i = 0; i < 8; i++) snake.push({ x: cols - 12 - i, y: Math.floor(rows / 2) });
      dir = { x: 1, y: 0 };
      placeFood();
    }
    function placeFood() {
      do {
        food = { x: Math.floor(cols * 0.45 + Math.random() * cols * 0.5), y: 1 + Math.floor(Math.random() * (rows - 2)) };
      } while (snake.some(p => p.x === food.x && p.y === food.y));
    }
    const occupied = (x, y) => snake.some(p => p.x === x && p.y === y);
    function step() {
      const h = snake[0];
      // IA simples: tenta aproximar da comida evitando colisões
      const options = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
        .filter(d => !(d.x === -dir.x && d.y === -dir.y))
        .map(d => ({ d, nx: h.x + d.x, ny: h.y + d.y }))
        .filter(o => o.nx >= 0 && o.ny >= 0 && o.nx < cols && o.ny < rows && !occupied(o.nx, o.ny))
        .sort((a, b) => (Math.abs(a.nx - food.x) + Math.abs(a.ny - food.y)) - (Math.abs(b.nx - food.x) + Math.abs(b.ny - food.y)));
      if (!options.length) return reset();
      dir = options[0].d;
      const nh = { x: options[0].nx, y: options[0].ny };
      snake.unshift(nh);
      if (nh.x === food.x && nh.y === food.y) {
        if (snake.length > 40) snake.length = 10;
        placeFood();
      } else snake.pop();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // comida
      const pulse = 1 + Math.sin(performance.now() / 220) * 0.08;
      ctx.save();
      ctx.translate(food.x * C + C / 2, food.y * C + C / 2);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = 'hsl(352 90% 60%)'; ctx.shadowBlur = 28;
      ctx.fillStyle = 'hsl(352 90% 60%)';
      roundRect(ctx, -C / 2 + 6, -C / 2 + 6, C - 12, C - 12, 8); ctx.fill();
      ctx.restore();
      // cobra
      snake.forEach((p, i) => {
        const t = i / snake.length;
        ctx.fillStyle = `hsla(${142 + t * 30}, 76%, ${52 - t * 18}%, ${1 - t * 0.6})`;
        ctx.shadowColor = 'hsl(142 76% 52%)'; ctx.shadowBlur = i === 0 ? 30 : 10;
        roundRect(ctx, p.x * C + 3, p.y * C + 3, C - 6, C - 6, 9); ctx.fill();
      });
      ctx.shadowBlur = 0;
      // olhos
      const h = snake[0];
      ctx.fillStyle = '#0b1a10';
      const ex = h.x * C + C / 2 + dir.x * 8, ey = h.y * C + C / 2 + dir.y * 8;
      const px = dir.y * 8, py = dir.x * 8;
      ctx.beginPath(); ctx.arc(ex + px, ey + py, 4, 0, 7); ctx.arc(ex - px, ey - py, 4, 0, 7); ctx.fill();
    }
    reset();
    (function loop(ts) {
      if (canvas.closest('.slide').classList.contains('active')) {
        if (!loop.last || ts - loop.last > (opts.speed || 85)) { step(); loop.last = ts; }
        draw();
      }
      requestAnimationFrame(loop);
    })(0);
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  snakeBackground(document.getElementById('coverSnake'));
  snakeBackground(document.getElementById('endSnake'), { speed: 110 });

  /* ---------- Demo: tempo de vida dos clones ---------- */
  (() => {
    const cv = document.getElementById('lifeCanvas');
    const ctx = cv.getContext('2d');
    const range = document.getElementById('lifeRange');
    const label = document.getElementById('lifeVal');
    const S = 28, W = cv.width, H = cv.height;
    const eyesImg = new Image(); eyesImg.src = 'assets/cobra_rosto.svg';
    let pontos = +range.value;
    let clones = []; // {x,y,born}
    let head = { x: 2 * S, y: 4 * S }, dir = 0, path = [], pi = 0;
    const cols = Math.floor(W / S), rows = Math.floor(H / S);
    // percurso retangular em "serpentina"
    for (let x = 1; x < cols - 1; x++) path.push([x, 1]);
    for (let y = 2; y < rows - 1; y++) path.push([cols - 2, y]);
    for (let x = cols - 3; x > 0; x--) path.push([x, rows - 2]);
    for (let y = rows - 3; y > 1; y--) path.push([1, y]);

    range.addEventListener('input', () => { pontos = +range.value; label.textContent = `pontos = ${pontos}`; });
    label.textContent = `pontos = ${pontos}`;

    let last = 0;
    function tick(now) {
      if (cv.closest('.slide').classList.contains('active')) {
        if (now - last >= 180) { // um "0,1 s" desacelerado para visualização
          last = now;
          clones.push({ x: head.x, y: head.y, born: now, life: pontos * 180 });
          pi = (pi + 1) % path.length;
          const [nx, ny] = path[pi];
          const ox = head.x, oy = head.y;
          head = { x: nx * S, y: ny * S };
          dir = Math.atan2(head.y - oy, head.x - ox);
        }
        clones = clones.filter(c => now - c.born < c.life);
        draw(now);
      }
      requestAnimationFrame(tick);
    }
    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = '#eceef3'; ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += S) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += S) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke(); }
      clones.forEach(c => {
        const left = 1 - (now - c.born) / c.life;
        ctx.fillStyle = `rgba(4,4,4,${0.35 + left * 0.65})`;
        ctx.fillRect(c.x + 1, c.y + 1, S - 2, S - 2);
        ctx.fillStyle = '#7CFFA8';
        ctx.font = '600 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(((c.life - (now - c.born)) / 1800).toFixed(1), c.x + S / 2, c.y + S / 2);
      });
      ctx.save();
      ctx.translate(head.x + S / 2, head.y + S / 2);
      ctx.rotate(dir);
      if (eyesImg.complete) ctx.drawImage(eyesImg, -S / 2, -S / 2, S, S);
      ctx.restore();
      ctx.fillStyle = '#111'; ctx.font = '700 14px Outfit, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`clones vivos: ${clones.length}`, 10, H - 10);
    }
    requestAnimationFrame(tick);
  })();

  /* ---------- Demo: setas do teclado ---------- */
  ['keysDemo', 'keysDemo2'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const seq = ['right', 'down', 'left', 'up'];
    let i = 0;
    setInterval(() => {
      el.querySelectorAll('.k').forEach(k => k.classList.toggle('on', k.dataset.k === seq[i]));
      i = (i + 1) % seq.length;
    }, 900);
  });

  /* ---------- Checklist interativo ---------- */
  document.querySelectorAll('#checklist li').forEach(li => li.addEventListener('click', () => li.classList.toggle('done')));
})();
