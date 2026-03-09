/* =====================================================
   game.js — Point Rush (port fiel do original em C)
   Wilson Klein Cecchi

   Mecânicas originais preservadas:
   - 4 níveis com dificuldade crescente
   - Corrupção (X) se espalha a cada movimento
   - noMoreMoves() verifica se jogador ficou preso
   - Pontuação = tempo total (menor = melhor)
   - Ranking top 10 salvo em localStorage
   ===================================================== */

const PointRush = (() => {

  /* ─── CONFIG DOS NÍVEIS (idêntico ao C) ───────────── */
  const LEVELS = [
    null,
    { w: 10, h: 10, total: 2,  required: 2,  time: 100, corruption: 1 },
    { w: 20, h: 16, total: 5,  required: 5,  time: 90,  corruption: 2 },
    { w: 28, h: 20, total: 7,  required: 7,  time: 60,  corruption: 3 },
    { w: 36, h: 20, total: 10, required: 10, time: 45,  corruption: 5 },
  ];

  const MAX_LEVEL = 4;
  const RANK_KEY  = 'pointrush_ranking';
  const MAX_NAME  = 30;

  /* ─── ESTADO ───────────────────────────────────────── */
  let grid = [];
  let WIDTH, HEIGHT, REQUIRED_FRAGMENTS, TIME_LIMIT, CORRUPTION_COUNT;
  let playerX, playerY;
  let collectedFragments;
  let timeLeft;
  let level;
  let totalElapsedTime;
  let phase; // 'tutorial' | 'playing' | 'won' | 'lost' | 'trapped' | 'quit'
  let playerName;
  let timerInterval = null;

  /* ─── RANKING ──────────────────────────────────────── */
  function loadRanking() {
    try { return JSON.parse(localStorage.getItem(RANK_KEY)) || []; }
    catch { return []; }
  }

  function saveRanking(name, time) {
    let list = loadRanking();
    list.push({ name, time });
    list.sort((a, b) => a.time - b.time);
    list = list.slice(0, 10);
    localStorage.setItem(RANK_KEY, JSON.stringify(list));
    return list;
  }

  /* ─── INICIALIZA MAPA ───────────────────────────────── */
  function initMap() {
    const cfg    = LEVELS[level];
    WIDTH        = cfg.w;
    HEIGHT       = cfg.h;
    REQUIRED_FRAGMENTS = cfg.required;
    TIME_LIMIT   = cfg.time;
    CORRUPTION_COUNT   = cfg.corruption;
    timeLeft           = TIME_LIMIT;
    collectedFragments = 0;
    playerX = 0;
    playerY = 0;

    grid = [];
    for (let y = 0; y < HEIGHT; y++)
      grid.push(new Array(WIDTH).fill('.'));

    grid[playerY][playerX] = 'B';

    let placed = 0, attempts = 0;
    while (placed < cfg.total && attempts < cfg.total * 200) {
      const x = Math.floor(Math.random() * WIDTH);
      const y = Math.floor(Math.random() * HEIGHT);
      if (grid[y][x] === '.') { grid[y][x] = 'C'; placed++; }
      attempts++;
    }
  }

  /* ─── MOVIMENTO ─────────────────────────────────────── */
  function movePlayer(dir) {
    if (phase !== 'playing') return;

    let nx = playerX, ny = playerY;
    if      (dir === 'w') ny--;
    else if (dir === 's') ny++;
    else if (dir === 'a') nx--;
    else if (dir === 'd') nx++;
    else return;

    if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) return;

    if (grid[ny][nx] === 'X') {
      endPhase('lost');
      return;
    }

    if (grid[ny][nx] === 'C') collectedFragments++;

    grid[playerY][playerX] = '.';
    playerX = nx;
    playerY = ny;
    grid[playerY][playerX] = 'B';

    spreadCorruption();

    if (noMoreMoves()) { endPhase('trapped'); return; }

    if (collectedFragments >= REQUIRED_FRAGMENTS) {
      totalElapsedTime += TIME_LIMIT - timeLeft;
      if (level === MAX_LEVEL) {
        endPhase('won');
      } else {
        level++;
        stopTimer();
        initMap();
        renderBoard();
        render();
        startTimer();
      }
      return;
    }

    render();
  }

  /* ─── CORRUPÇÃO ─────────────────────────────────────── */
  function spreadCorruption() {
    let spread = 0, tries = 0;
    while (spread < CORRUPTION_COUNT && tries < CORRUPTION_COUNT * 100) {
      const x = Math.floor(Math.random() * WIDTH);
      const y = Math.floor(Math.random() * HEIGHT);
      if (grid[y][x] === '.' && Math.random() * 100 < 15) {
        grid[y][x] = 'X';
        spread++;
      }
      tries++;
    }
  }

  /* ─── SEM MOVIMENTOS ────────────────────────────────── */
  function noMoreMoves() {
    for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nx = playerX + dx, ny = playerY + dy;
      if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT && grid[ny][nx] !== 'X')
        return false;
    }
    return true;
  }

  /* ─── ENCERRA FASE ──────────────────────────────────── */
  function endPhase(result) {
    phase = result;
    stopTimer();
    if (result === 'won') {
      const ranking = saveRanking(playerName, totalElapsedTime);
      render();
      renderEndScreen(true, ranking);
    } else {
      render();
      renderEndScreen(false, loadRanking());
    }
  }

  /* ─── TIMER ─────────────────────────────────────────── */
  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      if (phase !== 'playing') { stopTimer(); return; }
      timeLeft--;
      renderHud();
      if (timeLeft <= 0) { timeLeft = 0; endPhase('lost'); }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  /* ─── RENDERIZA MAPA ────────────────────────────────── */
  function render() {
    const board = document.getElementById('pr-board');
    if (!board) return;
    let html = '';
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        const c = grid[y][x];
        if      (c === 'B') html += `<span class="pr-player">B </span>`;
        else if (c === 'C') html += `<span class="pr-item">C </span>`;
        else if (c === 'X') html += `<span class="pr-corrupt">X </span>`;
        else                html += `<span class="pr-empty">. </span>`;
      }
      html += '\n';
    }
    board.innerHTML = html;
    renderHud();
  }

  function renderHud() {
    const $ = id => document.getElementById(id);
    if ($('pr-time')) {
      $('pr-time').textContent = timeLeft;
      $('pr-time').style.color = timeLeft <= 10 ? '#c8a84b' : '#4a9bb5';
    }
    if ($('pr-frags'))  $('pr-frags').textContent  = `${collectedFragments}/${REQUIRED_FRAGMENTS}`;
    if ($('pr-level'))  $('pr-level').textContent  = `${level}/${MAX_LEVEL}`;
    if ($('pr-total'))  $('pr-total').textContent  = `${totalElapsedTime}s`;
  }

  /* ─── TELA FINAL ────────────────────────────────────── */
  function renderEndScreen(won, ranking) {
    const wrap = document.getElementById('pr-game-wrap');
    if (!wrap) return;

    const medals = ['🥇','🥈','🥉','4º','5º','6º','7º','8º','9º','10º'];
    const rows = ranking.length
      ? ranking.map((e, i) => `
          <tr>
            <td class="pr-rank-pos">${medals[i]}</td>
            <td class="pr-rank-name">${esc(e.name)}</td>
            <td class="pr-rank-time">${e.time}s</td>
          </tr>`).join('')
      : `<tr><td colspan="3" style="color:var(--grey-dim);text-align:center;padding:16px 0">Nenhum recorde ainda</td></tr>`;

    const endLabel = won
      ? `<p class="pr-end-label pr-win">[ PARABÉNS — VOCÊ VENCEU O JOGO! ]</p>`
      : phase === 'trapped'
        ? `<p class="pr-end-label pr-lose">[ VOCÊ FICOU PRESO! ]</p>`
        : phase === 'quit'
          ? `<p class="pr-end-label pr-lose">[ VOCÊ DESISTIU ]</p>`
          : `<p class="pr-end-label pr-lose">[ TEMPO ESGOTADO! ]</p>`;

    wrap.innerHTML = `
      <div class="pr-endscreen">
        ${endLabel}
        ${won
          ? `<p class="pr-end-time">${totalElapsedTime}<span>s</span></p>
             <p class="pr-end-sub">tempo total — salvo no ranking</p>`
          : `<p class="pr-end-sub" style="margin-bottom:24px">Tempo não salvo no ranking</p>`
        }
        <table class="pr-ranking">
          <thead><tr><th></th><th>Nome</th><th>Tempo</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="pr-end-btns">
          <button class="btn-primary" id="pr-restart">↺ Jogar novamente</button>
          <button class="btn-primary pr-btn-ghost" id="pr-close-end">✕ Fechar</button>
        </div>
      </div>`;

    document.getElementById('pr-restart')
      ?.addEventListener('click', startGame);
    document.getElementById('pr-close-end')
      ?.addEventListener('click', close);
  }

  /* ─── TUTORIAL + INPUT DE NOME ─────────────────────── */
  function renderTutorial() {
    const wrap = document.getElementById('pr-game-wrap');
    if (!wrap) return;

    wrap.innerHTML = `
      <div class="pr-tutorial">
        <p class="pr-tut-title">[ POINT RUSH ]</p>
        <div class="pr-tut-cols">
          <div class="pr-tut-block">
            <p class="pr-tut-label">Objetivo</p>
            <p>Colete todos os <span class="pr-item">C</span> antes que o tempo acabe.</p>
            <p>Evite <span class="pr-corrupt">X</span> — tocar encerra o jogo.</p>
            <p>Complete os 4 níveis para salvar seu tempo.</p>
          </div>
          <div class="pr-tut-block">
            <p class="pr-tut-label">Controles</p>
            <p><kbd>W A S D</kbd> ou <kbd>↑ ← ↓ →</kbd></p>
            <p><kbd>Q</kbd> para desistir</p>
          </div>
          <div class="pr-tut-block">
            <p class="pr-tut-label">Símbolos</p>
            <p><span class="pr-player">B</span> Você &nbsp; <span class="pr-item">C</span> Fragmento &nbsp; <span class="pr-corrupt">X</span> Corrupção &nbsp; <span class="pr-empty">.</span> Vazio</p>
          </div>
          <div class="pr-tut-block">
            <p class="pr-tut-label">Níveis</p>
            <p>Nível 1 → 10×10 · 2 frags · 100s</p>
            <p>Nível 2 → 20×16 · 5 frags · 90s</p>
            <p>Nível 3 → 28×20 · 7 frags · 60s</p>
            <p>Nível 4 → 36×20 · 10 frags · 45s</p>
          </div>
        </div>
        <div class="pr-tut-name">
          <p class="pr-tut-label">Seu nickname</p>
          <div class="pr-name-row">
            <input id="pr-name-input" class="pr-name-input"
                   type="text" maxlength="${MAX_NAME}"
                   placeholder="Digite seu nome...">
            <button class="btn-primary" id="pr-start-btn">Jogar →</button>
          </div>
        </div>
      </div>`;

    const input    = document.getElementById('pr-name-input');
    const startBtn = document.getElementById('pr-start-btn');
    input?.focus();
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') tryStart(); });
    startBtn?.addEventListener('click', tryStart);

    function tryStart() {
      const name = input?.value.trim();
      if (!name) { input?.focus(); return; }
      playerName = name.slice(0, MAX_NAME);
      phase = 'playing';
      initMap();
      renderBoard();
      render();
      startTimer();
    }
  }

  /* ─── MONTA O BOARD HTML ────────────────────────────── */
  function renderBoard() {
    const wrap = document.getElementById('pr-game-wrap');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="pr-hud">
        <span class="pr-hud-item"><span class="pr-hud-label">NÍVEL</span><span class="pr-hud-val" id="pr-level"></span></span>
        <span class="pr-hud-item"><span class="pr-hud-label">TEMPO</span><span class="pr-hud-val" id="pr-time"></span></span>
        <span class="pr-hud-item"><span class="pr-hud-label">FRAGS</span><span class="pr-hud-val" id="pr-frags"></span></span>
        <span class="pr-hud-item"><span class="pr-hud-label">TOTAL</span><span class="pr-hud-val" id="pr-total"></span></span>
      </div>
      <div class="pr-board-scroll">
        <pre id="pr-board" class="pr-board"></pre>
      </div>
      <p class="pr-controls-hint">WASD / ↑←↓→ mover &nbsp;·&nbsp; Q desistir</p>`;
  }

  /* ─── INÍCIO ────────────────────────────────────────── */
  function startGame() {
    level            = 1;
    totalElapsedTime = 0;
    phase            = 'tutorial';
    stopTimer();
    renderTutorial();
  }

  /* ─── TECLADO ────────────────────────────────────────── */
  function onKeyDown(e) {
    const keyMap = {
      ArrowUp:'w', ArrowDown:'s', ArrowLeft:'a', ArrowRight:'d',
      w:'w', W:'w', s:'s', S:'s', a:'a', A:'a', d:'d', D:'d'
    };
    if (phase === 'playing' && keyMap[e.key]) {
      e.preventDefault();
      movePlayer(keyMap[e.key]);
    }
    if (phase === 'playing' && (e.key === 'q' || e.key === 'Q')) {
      phase = 'quit';
      stopTimer();
      renderEndScreen(false, loadRanking());
    }
  }

  /* ─── SWIPE MOBILE ───────────────────────────────────── */
  let touchStart = null;
  function onTouchStart(e) { touchStart = e.touches[0]; }
  function onTouchEnd(e) {
    if (!touchStart || phase !== 'playing') return;
    const dx = e.changedTouches[0].clientX - touchStart.clientX;
    const dy = e.changedTouches[0].clientY - touchStart.clientY;
    movePlayer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : (dy > 0 ? 's' : 'w'));
    touchStart = null;
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ─── API ────────────────────────────────────────────── */
  function open() {
    const modal = document.getElementById('pr-modal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    modal.addEventListener('touchstart', onTouchStart, { passive: true });
    modal.addEventListener('touchend',   onTouchEnd);
    startGame();
  }

  function close() {
    stopTimer();
    document.removeEventListener('keydown', onKeyDown);
    const modal = document.getElementById('pr-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  return { open, close };

})();

/* ─── BIND ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('pr-open-btn')
    ?.addEventListener('click', () => PointRush.open());
  document.getElementById('pr-close-btn')
    ?.addEventListener('click', () => PointRush.close());
  document.getElementById('pr-modal')
    ?.addEventListener('click', e => {
      if (e.target.id === 'pr-modal') PointRush.close();
    });
});