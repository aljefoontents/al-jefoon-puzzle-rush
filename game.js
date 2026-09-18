(() => {
  "use strict";

  const KEY = "alJefoonPuzzleRushV1";
  const TOTAL_TIME = 180;
  const PUZZLES = [
    {name:"SET UP THE PARTY", types:["tent","chair","glass","chair","table","light","vip","tent","glass","stage","cooler","chair","barrier","chair","tent"]},
    {name:"THE BIG EVENT", types:["stage","light","chair","tent","vip","glass","table","cooler","tent","chair","barrier","glass","light","chair","tent"]},
    {name:"WEDDING NIGHT", types:["chair","glass","tent","table","vip","light","chair","glass","tent","stage","chair","cooler","table","tent","barrier"]}
  ];
  const achievements = [
    ["first","FIRST MOVE","Make your first puzzle move.","👆"],
    ["solve","PUZZLE SOLVED","Complete your first puzzle.","🏆"],
    ["speed","SPEED DEMON","Finish a puzzle in under 60 seconds.","⚡"],
    ["lightning","LIGHTNING","Finish a puzzle in under 30 seconds.","✦"],
    ["ten","TEN DOWN","Complete 10 puzzles.","🔟"],
    ["master","PUZZLE MASTER","Complete 50 puzzles.","👑"],
    ["coins","COIN COLLECTOR","Earn 1,000 coins in total.","🪙"],
    ["spender","BIG SPENDER","Spend 1,000 coins.","🛍"],
    ["daily","DAILY PLAYER","Play on 7 different days.","📅"]
  ];

  let state = loadState();
  let board = [];
  let empty = 15;
  let moves = 0;
  let seconds = TOTAL_TIME;
  let timerId = null;
  let paused = false;
  let puzzleIndex = 0;
  let gameActive = false;
  let freezeUntil = 0;

  const $ = id => document.getElementById(id);
  const screens = [...document.querySelectorAll(".screen")];

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return {
        coins: Number.isFinite(raw.coins) ? Math.max(0, raw.coins) : 250,
        totalCoinsEarned: Number.isFinite(raw.totalCoinsEarned) ? Math.max(0, raw.totalCoinsEarned) : 250,
        totalSpent: Number.isFinite(raw.totalSpent) ? Math.max(0, raw.totalSpent) : 0,
        solved: Number.isFinite(raw.solved) ? Math.max(0, raw.solved) : 0,
        moves: Number.isFinite(raw.moves) ? Math.max(0, raw.moves) : 0,
        days: Array.isArray(raw.days) ? raw.days.filter(x => typeof x === "string").slice(-30) : [],
        unlocked: Array.isArray(raw.unlocked) ? raw.unlocked : [],
        firstPlayed: Boolean(raw.firstPlayed)
      };
    } catch { return {coins:250,totalCoinsEarned:250,totalSpent:0,solved:0,moves:0,days:[],unlocked:[],firstPlayed:false}; }
  }

  function saveState() {
    localStorage.setItem(KEY, JSON.stringify(state));
    updateCoins();
    renderAchievements();
  }

  function today() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
  }

  function showScreen(id) {
    stopTimer();
    screens.forEach(s => s.classList.toggle("active", s.id === id));
    if (id === "gameScreen" && gameActive && !paused) startTimer();
    updateCoins();
  }

  function updateCoins() {
    $("coinCount").textContent = state.coins.toLocaleString();
    $("storeCoins").textContent = state.coins.toLocaleString();
  }

  function toast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 1900);
  }

  function tileArt(type) {
    const labels = {tent:"TENT",chair:"CHAIR",glass:"GLASS",table:"TABLE",light:"LIGHT",vip:"VIP",stage:"STAGE",cooler:"COOL",barrier:"BARRIER"};
    return `<div class="tile-art art-${type}" title="${labels[type] || type}"></div>`;
  }

  function renderBoard() {
    const root = $("puzzle");
    root.innerHTML = "";
    board.forEach((value, index) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tile" + (value === 15 ? " empty" : "");
      b.dataset.index = index;
      b.setAttribute("aria-label", value === 15 ? "Empty space" : `Puzzle tile ${value + 1}`);
      if (value !== 15) {
        b.innerHTML = `<span class="tile-num">${value + 1}</span>${tileArt(PUZZLES[puzzleIndex].types[value])}`;
        b.addEventListener("click", () => moveTile(index));
      }
      root.appendChild(b);
    });
    $("moves").textContent = `${moves} ${moves === 1 ? "move" : "moves"}`;
  }

  function solvedBoard() { return Array.from({length:16}, (_,i)=>i); }

  function neighbors(i) {
    const r = Math.floor(i/4), c = i%4, out = [];
    if (r>0) out.push(i-4);
    if (r<3) out.push(i+4);
    if (c>0) out.push(i-1);
    if (c<3) out.push(i+1);
    return out;
  }

  function shuffleBoard() {
    board = solvedBoard();
    empty = 15;
    let previous = -1;
    for (let i=0;i<180;i++) {
      const ns = neighbors(empty).filter(n => n !== previous);
      const from = ns[Math.floor(Math.random()*ns.length)];
      board[empty] = board[from];
      board[from] = 15;
      previous = empty;
      empty = from;
    }
    if (board.every((v,i)=>v===i)) shuffleBoard();
  }

  function startGame() {
    puzzleIndex = Math.floor(Math.random()*PUZZLES.length);
    moves = 0; seconds = TOTAL_TIME; paused = false; freezeUntil = 0; gameActive = true;
    $("puzzleTitle").textContent = PUZZLES[puzzleIndex].name;
    shuffleBoard();
    renderBoard();
    $("timeBar").style.width = "100%";
    $("timer").textContent = formatTime(seconds);
    $("pauseBtn").textContent = "Ⅱ";
    showScreen("gameScreen");
  }

  function moveTile(index) {
    if (!gameActive || paused || board[index] === 15) return;
    if (!neighbors(empty).includes(index)) return;
    board[empty] = board[index];
    board[index] = 15;
    empty = index;
    moves++;
    state.moves++;
    if (!state.firstPlayed) state.firstPlayed = true;
    unlock("first");
    saveState();
    renderBoard();
    if (board.every((v,i)=>v===i)) finishGame(true);
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      if (!gameActive || paused) return;
      if (Date.now() < freezeUntil) return;
      seconds--;
      $("timer").textContent = formatTime(seconds);
      $("timeBar").style.width = `${Math.max(0, seconds/TOTAL_TIME*100)}%`;
      if (seconds <= 0) finishGame(false);
    }, 1000);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function formatTime(s) {
    s = Math.max(0, Math.floor(s));
    return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  }

  function finishGame(win) {
    stopTimer();
    gameActive = false;
    if (win) {
      const elapsed = TOTAL_TIME - seconds;
      let reward = 100;
      if (elapsed < 60) { reward += 50; unlock("speed"); }
      if (elapsed < 30) { reward += 100; unlock("lightning"); }
      state.solved++;
      state.coins += reward;
      state.totalCoinsEarned += reward;
      if (!state.days.includes(today())) {
        state.days.push(today());
        if (state.days.length >= 7) unlock("daily");
      }
      unlock("solve");
      if (state.solved >= 10) unlock("ten");
      if (state.solved >= 50) unlock("master");
      if (state.totalCoinsEarned >= 1000) unlock("coins");
      $("resultIcon").textContent = "🏆";
      $("resultTitle").textContent = "PUZZLE SOLVED!";
      $("resultText").textContent = `Completed in ${formatTime(elapsed)} with ${moves} moves.`;
      $("rewardText").textContent = `+${reward} 🪙`;
      saveState();
    } else {
      $("resultIcon").textContent = "⏰";
      $("resultTitle").textContent = "TIME'S UP!";
      $("resultText").textContent = "The setup got away from you. Give it another try!";
      $("rewardText").textContent = "+10 🪙";
      state.coins += 10;
      state.totalCoinsEarned += 10;
      saveState();
    }
    showScreen("resultScreen");
  }

  function unlock(id) {
    if (!state.unlocked.includes(id)) {
      state.unlocked.push(id);
      const found = achievements.find(a=>a[0]===id);
      if (found) toast(`Achievement unlocked: ${found[1]}`);
    }
  }

  function renderAchievements() {
    const root = $("achievementList");
    if (!root) return;
    root.innerHTML = "";
    achievements.forEach(a => {
      const unlocked = state.unlocked.includes(a[0]);
      const item = document.createElement("article");
      item.className = `achievement ${unlocked ? "unlocked" : "locked"}`;
      item.innerHTML = `<div class="badge">${unlocked ? a[3] : "🔒"}</div><div><b>${a[1]}</b><small>${a[2]}</small></div><div class="status">${unlocked ? "UNLOCKED" : "LOCKED"}</div>`;
      root.appendChild(item);
    });
  }

  function buy(type) {
    const prices = {hint:200,time:150,freeze:300,shuffle:100};
    const price = prices[type];
    if (state.coins < price) { toast("Not enough coins."); return; }
    state.coins -= price;
    state.totalSpent += price;
    if (state.totalSpent >= 1000) unlock("spender");
    saveState();
    if (!gameActive) {
      toast("Purchased! Start a game to use it.");
      return;
    }
    applyBoost(type);
  }

  function applyBoost(type) {
    if (type === "time") { seconds += 30; $("timer").textContent = formatTime(seconds); $("timeBar").style.width = `${Math.min(100, seconds/TOTAL_TIME*100)}%`; toast("+30 seconds!"); }
    if (type === "freeze") { freezeUntil = Date.now()+10000; toast("Time frozen for 10 seconds!"); }
    if (type === "hint") { highlightHint(); toast("Hint highlighted!"); }
    if (type === "shuffle") { shuffleBoard(); renderBoard(); toast("Fresh shuffle!"); }
  }

  function highlightHint() {
    document.querySelectorAll(".tile.hint").forEach(x=>x.classList.remove("hint"));
    const candidates = neighbors(empty).filter(i=>board[i]!==15);
    if (!candidates.length) return;
    const target = candidates[Math.floor(Math.random()*candidates.length)];
    const el = document.querySelector(`.tile[data-index="${target}"]`);
    if (el) {
      el.classList.add("hint");
      setTimeout(()=>el.classList.remove("hint"),2500);
    }
  }

  $("playBtn").addEventListener("click", startGame);
  $("againBtn").addEventListener("click", startGame);
  $("pauseBtn").addEventListener("click", () => {
    if (!gameActive) return;
    paused = true; stopTimer(); showScreen("pauseScreen");
  });
  $("resumeBtn").addEventListener("click", () => {
    paused = false; showScreen("gameScreen");
  });
  $("hintBtn").addEventListener("click", () => {
    const price=200;
    if(state.coins<price){toast("Need 200 coins.");return;}
    state.coins-=price;state.totalSpent+=price;if(state.totalSpent>=1000)unlock("spender");saveState();highlightHint();
  });
  $("shuffleBtn").addEventListener("click", () => {
    const price=50;
    if(state.coins<price){toast("Need 50 coins.");return;}
    state.coins-=price;state.totalSpent+=price;if(state.totalSpent>=1000)unlock("spender");saveState();shuffleBoard();renderBoard();
  });
  document.querySelectorAll("[data-screen]").forEach(btn => btn.addEventListener("click", () => {
    const target = btn.dataset.screen;
    if (target === "homeScreen") { gameActive=false; paused=false; stopTimer(); }
    showScreen(target);
  }));
  document.querySelectorAll("[data-buy]").forEach(btn => btn.addEventListener("click", () => buy(btn.dataset.buy)));

  document.addEventListener("keydown", e => {
    if (!gameActive || paused) return;
    if (e.key === "Escape") { paused=true;stopTimer();showScreen("pauseScreen"); }
  });

  renderAchievements();
  updateCoins();
})();
