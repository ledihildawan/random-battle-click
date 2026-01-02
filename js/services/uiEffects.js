// UI Effects Service (global)
window.UIEffects = {
  triggerVisualEffect(targetPlayer) {
    const selector = targetPlayer === 'player1' ? '.player-1-img' : '.player-2-img';
    const el = document.querySelector(selector);
    if (el) {
      el.classList.remove('shake', 'hit-flash');
      void el.offsetWidth;
      el.classList.add('shake', 'hit-flash');
      setTimeout(() => el.classList.remove('hit-flash'), 200);
    }
  },

  triggerGlobalShake(app) {
    app.globalShake = true;
    setTimeout(() => {
      app.globalShake = false;
    }, 500);
  },

  spawnFloatingText(app, targetPlayer, text, type) {
    const id = Date.now() + Math.random();
    app.activeFx[targetPlayer].push({ id, text, type });
    setTimeout(() => {
      app.activeFx[targetPlayer] = app.activeFx[targetPlayer].filter((fx) => fx.id !== id);
    }, 1000);
  },

  spawnConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#f7d51d', '#e76e55', '#209cee', '#92cc41'];

    for (let i = 0; i < 80; i++) {
      const div = document.createElement('div');
      div.className = 'confetti';

      const size = Math.random() * 8 + 4 + 'px';
      div.style.width = size;
      div.style.height = Math.random() * 10 + 5 + 'px';

      div.style.left = Math.random() * 100 + 'vw';
      div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      const fallDuration = Math.random() * 3 + 2 + 's';
      const swayDuration = Math.random() * 2 + 1 + 's';

      div.style.animation = `
        confetti-fall ${fallDuration} linear forwards,
        confetti-sway ${swayDuration} ease-in-out infinite alternate
      `;

      div.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(div);
    }
  },

  clearConfetti() {
    const container = document.getElementById('confetti-container');
    if (container) container.innerHTML = '';
  },

  initSnow() {
    const container = document.getElementById('snow-container');
    if (!container) return;
    const snowCount = 60;
    for (let i = 0; i < snowCount; i++) {
      const snow = document.createElement('div');
      snow.className = 'snow-pixel';

      const sizeType = Math.random();
      let size = 4;
      let opacity = 0.8;
      let duration = Math.random() * 3 + 4;

      if (sizeType < 0.3) {
        size = 2;
        opacity = 0.4;
        duration = Math.random() * 5 + 7;
      } else if (sizeType > 0.8) {
        size = 6;
        opacity = 0.9;
        duration = Math.random() * 2 + 3;
      }

      snow.style.width = `${size}px`;
      snow.style.height = `${size}px`;
      snow.style.opacity = opacity;
      snow.style.left = Math.random() * 100 + 'vw';
      snow.style.animationDuration = `${duration}s, ${Math.random() * 2 + 2}s`;
      snow.style.animationDelay = `${Math.random() * 5}s, ${Math.random() * 2}s`;
      container.appendChild(snow);
    }
  },
};
