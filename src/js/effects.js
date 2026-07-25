// Deux effets, tenus à l'écart du reste pour qu'on puisse les supprimer
// sans rien casser : la révélation au défilement, et la pluie « matrix »
// (un easter egg du shell, rien de plus).

// ─── Révélation au défilement ─────────────────────────────────────────
// Progressive enhancement : sans IntersectionObserver, ou en
// `prefers-reduced-motion`, tout est visible d'emblée — la classe .is-in est
// simplement posée tout de suite.
export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  targets.forEach((el) => io.observe(el));
}

// ─── Pluie de caractères ──────────────────────────────────────────────
// Douze secondes, puis nettoyage complet : canvas retiré, boucle arrêtée,
// écouteur de redimensionnement détaché. Un easter egg qui fuit n'est plus
// drôle.
const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01<>{}/;$_';
let running = false;

export function matrixRain(duration = 12000) {
  if (running) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  running = true;

  const canvas = document.createElement('canvas');
  canvas.id = 'matrix-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6fdba4';
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  let cols = 0, drops = [];
  const size = 15;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / size);
    drops = Array.from({ length: cols }, () => Math.random() * -60);
  }
  resize();
  window.addEventListener('resize', resize);

  let raf = 0;
  const started = performance.now();

  function frame(now) {
    ctx.fillStyle = dark ? 'rgba(13, 16, 19, 0.09)' : 'rgba(245, 244, 240, 0.11)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = accent;
    ctx.font = `${size}px monospace`;
    for (let i = 0; i < cols; i++) {
      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      ctx.fillText(ch, i * size, drops[i] * size);
      if (drops[i] * size > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    if (now - started < duration) raf = requestAnimationFrame(frame);
    else stop();
  }

  function stop() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.style.transition = 'opacity .5s ease';
    canvas.style.opacity = '0';
    setTimeout(() => { canvas.remove(); running = false; }, 520);
  }

  raf = requestAnimationFrame(frame);
}
