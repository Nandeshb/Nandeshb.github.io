(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation');
      });
    });
  }

  const revealItems = document.querySelectorAll('.section-reveal, .reveal-child');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach(el => revealObserver.observe(el));
  }

  if (finePointer && !reducedMotion) {
    const cursorGlow = document.querySelector('.cursor-glow');
    let gx = 0, gy = 0, px = 0, py = 0, glowFrame = 0;
    if (cursorGlow) {
      const draw = () => {
        gx += (px - gx) * 0.16;
        gy += (py - gy) * 0.16;
        cursorGlow.style.transform = `translate3d(${gx}px,${gy}px,0) translate(-50%,-50%)`;
        if (Math.abs(px - gx) > 0.25 || Math.abs(py - gy) > 0.25) {
          glowFrame = requestAnimationFrame(draw);
        } else {
          glowFrame = 0;
        }
      };
      window.addEventListener('pointermove', event => {
        px = event.clientX;
        py = event.clientY;
        if (!glowFrame) glowFrame = requestAnimationFrame(draw);
      }, { passive: true });
    }

    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--ry', `${(x * 4.8).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${(-y * 4.8).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    });

    document.querySelectorAll('.button').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        button.style.setProperty('--mx', `${x}px`);
        button.style.setProperty('--my', `${y}px`);
        if (button.classList.contains('magnetic')) {
          const dx = (x - rect.width / 2) * 0.06;
          const dy = (y - rect.height / 2) * 0.08;
          button.style.transform = `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0)`;
        }
      }, { passive: true });
      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  const pressable = document.querySelectorAll('.touch-target');
  pressable.forEach(el => {
    let moved = false;
    let ripple = null;
    const clear = () => {
      el.classList.remove('is-pressed');
      if (ripple) {
        ripple.remove();
        ripple = null;
      }
    };
    el.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      moved = false;
      el.classList.add('is-pressed');
      if (!reducedMotion) {
        ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
        el.appendChild(ripple);
      }
    });
    el.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') moved = true;
      if (moved) clear();
    }, { passive: true });
    el.addEventListener('pointerup', clear);
    el.addEventListener('pointercancel', clear);
    el.addEventListener('lostpointercapture', clear);
  });

  const header = document.getElementById('site-header');
  const progress = document.querySelector('.scroll-progress span');
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value))})`;
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  };
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollUI();
      ticking = false;
    });
  }, { passive: true });
  updateScrollUI();

  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-38% 0px -52% 0px', threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
  }
})();
