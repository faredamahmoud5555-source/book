/* ============================================================
   FRIDA — Portfolio interaction engine
   Vanilla JS, no dependencies. Every effect here is built from
   transform/opacity changes driven by requestAnimationFrame or
   IntersectionObserver, so it stays cheap on the main thread.
================================================================ */

const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initActiveNavLink();
  initScrollProgress();
  initScrollReveal();
  initCopyCodeButton();
  initCodeLineStagger();
  initFooterYear();

  if (!prefersReducedMotion) {
    if (isFinePointer) {
      initCustomCursor();
      initMagneticButtons();
      initTiltCards();
      initHeroParallax();
    }
  }
});

/* ------------------------------------------------------------
   Mobile navigation toggle
------------------------------------------------------------ */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ------------------------------------------------------------
   Active nav link — highlights the section in view
------------------------------------------------------------ */
function initActiveNavLink() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ------------------------------------------------------------
   Scroll progress bar — fixed strip at the top of the page
------------------------------------------------------------ */
function initScrollProgress() {
  const bar = document.getElementById('scrollBar');
  if (!bar) return;

  let ticking = false;

  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${pct}%`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  update();
}

/* ------------------------------------------------------------
   Scroll reveal — fades [data-reveal] elements up into place
------------------------------------------------------------ */
function initScrollReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (prefersReducedMotion) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item) => observer.observe(item));
}

/* ------------------------------------------------------------
   Copy code button
------------------------------------------------------------ */
function initCopyCodeButton() {
  const button = document.getElementById('copyCodeBtn');
  const codeBlock = document.getElementById('codeSnippet');
  if (!button || !codeBlock) return;

  button.addEventListener('click', async () => {
    const code = codeBlock.textContent.trim();
    try {
      await navigator.clipboard.writeText(code);
      flashButton(button, 'Copied!');
    } catch {
      flashButton(button, 'Press Ctrl+C');
    }
  });
}

function flashButton(button, message) {
  const original = button.textContent;
  button.textContent = message;
  button.classList.add('is-copied');
  window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove('is-copied');
  }, 1800);
}

/* ------------------------------------------------------------
   Code line stagger — reveals each line of the snippet in
   sequence once the editor scrolls into view
------------------------------------------------------------ */
function initCodeLineStagger() {
  const editor = document.querySelector('.editor');
  const lines = document.querySelectorAll('.code-line');
  if (!editor || !lines.length) return;

  if (prefersReducedMotion) {
    lines.forEach((l) => l.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        lines.forEach((line, i) => {
          window.setTimeout(() => line.classList.add('is-visible'), i * 55);
        });
        obs.disconnect();
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(editor);
}

/* ------------------------------------------------------------
   Footer year
------------------------------------------------------------ */
function initFooterYear() {
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ------------------------------------------------------------
   Custom cursor — a small dot + a lagging ring. The ring eases
   toward the dot every frame for a smooth, premium feel, and
   grows when hovering anything interactive.
------------------------------------------------------------ */
function initCustomCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
  });

  const loop = () => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const hoverTargets = document.querySelectorAll('a, button, .tilt, .skill-card');
  hoverTargets.forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
  });
}

/* ------------------------------------------------------------
   Magnetic buttons — elements with class "magnetic" nudge
   toward the cursor while hovered, and spring back on leave.
------------------------------------------------------------ */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.magnetic');
  const strength = 0.35;
  const maxOffset = 10;

  buttons.forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      const x = Math.max(-maxOffset, Math.min(maxOffset, relX * strength));
      const y = Math.max(-maxOffset, Math.min(maxOffset, relY * strength));
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

/* ------------------------------------------------------------
   3D tilt — elements with class "tilt" rotate slightly toward
   the cursor for a subtle depth effect, then ease back flat.
------------------------------------------------------------ */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt');
  const maxTilt = 7;

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - py) * maxTilt * 2;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

/* ------------------------------------------------------------
   Hero parallax — the glow follows the cursor inside the hero,
   and the floating chips drift in response to cursor position.
------------------------------------------------------------ */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const glow = document.querySelector('.hero-glow');
  const chips = document.querySelectorAll('.float-chip .chip-inner');
  if (!hero) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    if (glow) {
      glow.style.setProperty('--gx', `${px}%`);
      glow.style.setProperty('--gy', `${py}%`);
    }

    chips.forEach((chip, i) => {
      const depth = (i + 1) * 6;
      const x = (px - 50) / 50 * depth;
      const y = (py - 50) / 50 * depth;
      chip.style.transform = `translate(${x}px, ${y}px)`;
    });
  });





  const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  smoothTouch: true,
  touchMultiplier: 1.2
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);




}


