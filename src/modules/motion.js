// Progressive decoration only: no dependencies, no scroll interception, no hidden content.
const Motion = (() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let view,
    observer,
    hero,
    frame = 0,
    point;

  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!hero) return;
    hero.classList.remove('pointer-active');
    ['--aim-x', '--aim-y', '--drift-x', '--drift-y', '--drift-r'].forEach((name) =>
      hero.style.removeProperty(name)
    );
  }
  function move(event) {
    if (reduced.matches || !fine.matches || event.pointerType !== 'mouse') return;
    point = [event.clientX, event.clientY];
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = hero?.getBoundingClientRect();
      if (!r?.width || !r.height) return;
      const x = Math.min(1, Math.max(0, (point[0] - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (point[1] - r.top) / r.height));
      hero.style.setProperty('--aim-x', `${(x * 100).toFixed(2)}%`);
      hero.style.setProperty('--aim-y', `${(y * 100).toFixed(2)}%`);
      hero.style.setProperty('--drift-x', `${((x - 0.5) * 14).toFixed(2)}px`);
      hero.style.setProperty('--drift-y', `${((y - 0.5) * 14).toFixed(2)}px`);
      hero.style.setProperty('--drift-r', `${((x - 0.5) * 2).toFixed(2)}deg`);
      hero.classList.add('pointer-active');
    });
  }
  function update(next) {
    reset();
    if (hero) {
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', reset);
    }
    observer?.disconnect();
    view = next;
    hero = next?.querySelector('[data-kinetic]');
    if (reduced.matches) {
      next?.querySelectorAll('.revealed').forEach((el) => el.classList.remove('revealed'));
      return;
    }
    if (hero && fine.matches) {
      hero.addEventListener('pointermove', move, { passive: true });
      hero.addEventListener('pointerleave', reset, { passive: true });
    }
    if (typeof IntersectionObserver !== 'function') return;
    observer = new IntersectionObserver(
      (entries, run) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            run.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );
    next?.querySelectorAll('[data-reveal]:not(.revealed)').forEach((el) => {
      // A first-paint section already in view does not need to animate.
      if (el.getBoundingClientRect().top >= innerHeight - 10) observer.observe(el);
    });
  }
  function mount() {
    reduced.addEventListener('change', () => update(view));
    fine.addEventListener('change', () => update(view));
    window.addEventListener('blur', reset);
  }
  return { mount, update };
})();
