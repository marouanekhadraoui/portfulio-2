/**
 * MAROUANE PORTFOLIO — script.js
 * Subtle enhancements:
 *   1. Floating particles canvas
 *   2. Typewriter effect on name header
 *   3. Scroll-reveal for cards
 *   4. Parallax on background glow orbs
 *   5. Timeline progress animation on scroll
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     1. PARTICLES
  ══════════════════════════════════════════ */
  const canvas  = document.getElementById('particles');
  const ctx     = canvas ? canvas.getContext('2d') : null;
  let W, H, particles = [];

  function resizeCanvas() {
    if (!canvas) return;
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    const hueChoice = Math.random();
    const color = hueChoice > 0.8
      ? '#e9fbff'
      : hueChoice > 0.55
        ? '#b3e5ff'
        : hueChoice > 0.3
          ? '#80deff'
          : '#50c7ff';

    return {
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       Math.random() * 2 + 0.45,
      vx:      (Math.random() - 0.5) * 0.18,
      vy:      -Math.random() * 0.22 - 0.06,
      alpha:   Math.random() * 0.55 + 0.25,
      color,
    };
  }

  function initParticles() {
    particles = [];
    const count = Math.min(Math.floor((W * H) / 7000), 180);
    for (let i = 0; i < count; i++) {
      particles.push(createParticle());
    }
  }

  function drawParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    particles.forEach((p, i) => {
      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Wrap
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) { p.x = W + 4; }
      if (p.x > W + 4) { p.x = -4; }

      // Draw
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(drawParticles);
  }

  if (canvas) {
    resizeCanvas();
    initParticles();
    drawParticles();
    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    });
  }


  /* ══════════════════════════════════════════
     2. TYPEWRITER EFFECT
  ══════════════════════════════════════════ */
  const nameEl = document.querySelector('.name-first');

  function typewriterEffect(el, text, delay = 80) {
    if (!el) return;
    el.textContent = '';
    el.style.borderRight = '2px solid var(--accent)';
    el.style.animation = 'none';

    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        // remove cursor after pause
        setTimeout(() => {
          el.style.borderRight = 'none';
        }, 1200);
      }
    }, delay);
  }

  // Run after a short page-load pause
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (nameEl) typewriterEffect(nameEl, 'MAROUANE', 90);
    }, 400);
  });


  /* ══════════════════════════════════════════
     3. SCROLL REVEAL
  ══════════════════════════════════════════ */
  const revealEls = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Slight stagger based on DOM position
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, Number(delay));
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach((el, i) => {
    el.dataset.delay = i * 80;
    revealObserver.observe(el);
  });


  /* ══════════════════════════════════════════
     4. PARALLAX ON GLOW ORBS (mouse)
  ══════════════════════════════════════════ */
  const glowTop    = document.querySelector('.bg-glow--top');
  const glowBottom = document.querySelector('.bg-glow--bottom');

  let mouseX = 0, mouseY = 0;
  let rafParallax;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;  // -1 to 1
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

    cancelAnimationFrame(rafParallax);
    rafParallax = requestAnimationFrame(updateParallax);
  });

  function updateParallax() {
    if (glowTop) {
      glowTop.style.transform = `translateX(calc(-50% + ${mouseX * 28}px)) translateY(${mouseY * 18}px)`;
    }
    if (glowBottom) {
      glowBottom.style.transform = `translateX(${-mouseX * 20}px) translateY(${-mouseY * 14}px)`;
    }
  }


  /* ══════════════════════════════════════════
     5. TIMELINE PROGRESS ANIMATION
  ══════════════════════════════════════════ */
  const tlProgress = document.querySelector('.tl-progress');

  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateTimeline();
          timelineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  if (tlProgress) {
    // Start height at 0
    tlProgress.style.height = '0%';
    tlProgress.style.transition = 'height 1.8s cubic-bezier(0.16, 1, 0.3, 1)';
    timelineObserver.observe(tlProgress);
  }

  function animateTimeline() {
    requestAnimationFrame(() => {
      if (tlProgress) tlProgress.style.height = '100%';
    });
  }


  /* ══════════════════════════════════════════
     6. PHOTO CARD — subtle tilt on hover
  ══════════════════════════════════════════ */
  const photoCard = document.getElementById('photo-card');

  if (photoCard) {
    photoCard.addEventListener('mousemove', (e) => {
      const rect   = photoCard.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const tiltX  = dy * -6;   // degrees
      const tiltY  = dx *  6;

      photoCard.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.015)`;
    });

    photoCard.addEventListener('mouseleave', () => {
      photoCard.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      photoCard.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
    });

    photoCard.addEventListener('mouseenter', () => {
      photoCard.style.transition = 'transform 0.15s ease';
    });
  }


  /* ══════════════════════════════════════════
     7. SKILL ICON GLOW ON HOVER
  ══════════════════════════════════════════ */
  document.querySelectorAll('.skill-item').forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const icon = item.querySelector('.skill-icon-wrap');
      if (icon) {
        icon.style.boxShadow = '0 0 18px rgba(0, 212, 255, 0.35)';
        icon.style.transform = 'scale(1.1)';
        icon.style.transition = 'all 0.25s ease';
      }
    });
    item.addEventListener('mouseleave', () => {
      const icon = item.querySelector('.skill-icon-wrap');
      if (icon) {
        icon.style.boxShadow = '';
        icon.style.transform = 'scale(1)';
      }
    });
  });


  /* ══════════════════════════════════════════
     8. HEADER — floating shimmer lines
  ══════════════════════════════════════════ */
  // Already handled with CSS @keyframes headerSheen — no JS needed.

  console.log('%cMARQUANE Portfolio · Built with precision', 'color:#00d4ff;font-family:monospace;font-size:12px;');

})();


/* ══════════════════════════════════════════
   CONTACT FORM — validation & submission
══════════════════════════════════════════ */
(function contactForm() {

  const form        = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn   = document.getElementById('submitBtn');
  const successBox  = document.getElementById('formSuccess');
  const errorBox    = document.getElementById('formError');
  const errorMsg    = document.getElementById('formErrorMsg');
  const charCounter = document.getElementById('charCounter');
  const textarea    = document.getElementById('message');
  const fhbUnsaved  = document.querySelector('.fhb-unsaved');
  const MAX_CHARS   = 500;

  /* ── Character counter ─────────────────────── */
  if (textarea && charCounter) {
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCounter.textContent = `${len} / ${MAX_CHARS}`;
      charCounter.classList.toggle('near-limit', len >= MAX_CHARS * 0.8 && len < MAX_CHARS);
      charCounter.classList.toggle('at-limit',   len >= MAX_CHARS);
      if (len > MAX_CHARS) textarea.value = textarea.value.slice(0, MAX_CHARS);
    });
  }

  /* ── Field definitions ─────────────────────── */
  const fields = [
    {
      id:      'firstname',
      groupId: 'fg-firstname',
      validate(v) {
        if (!v.trim()) return 'First name is required.';
        if (v.trim().length < 2) return 'At least 2 characters.';
        return null;
      },
    },
    {
      id:      'lastname',
      groupId: 'fg-lastname',
      validate(v) {
        if (!v.trim()) return 'Last name is required.';
        if (v.trim().length < 2) return 'At least 2 characters.';
        return null;
      },
    },
    {
      id:      'email',
      groupId: 'fg-email',
      validate(v) {
        if (!v.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address.';
        return null;
      },
    },
    {
      id:      'message',
      groupId: 'fg-message',
      validate(v) {
        if (!v.trim()) return 'Message is required.';
        if (v.trim().length < 20) return 'Message must be at least 20 characters.';
        return null;
      },
    },
  ];

  /* ── Set field state ───────────────────────── */
  function setFieldState(groupId, state, msg = '') {
    const group     = document.getElementById(groupId);
    if (!group) return;
    const errorEl   = group.querySelector('.form-error');

    group.classList.remove('is-valid', 'is-error');
    if (state === 'valid')  group.classList.add('is-valid');
    if (state === 'error')  group.classList.add('is-error');
    if (errorEl) errorEl.textContent = msg;
  }

  /* ── Live validation on blur ───────────────── */
  fields.forEach(({ id, groupId, validate }) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('blur', () => {
      const err = validate(el.value);
      setFieldState(groupId, err ? 'error' : 'valid', err || '');
    });

    el.addEventListener('input', () => {
      // Clear error eagerly while typing
      const group = document.getElementById(groupId);
      if (group && group.classList.contains('is-error')) {
        const err = validate(el.value);
        if (!err) setFieldState(groupId, 'valid', '');
      }
    });
  });

  /* ── Validate all ──────────────────────────── */
  function validateAll() {
    let valid = true;
    fields.forEach(({ id, groupId, validate }) => {
      const el  = document.getElementById(id);
      const err = el ? validate(el.value) : 'Required.';
      setFieldState(groupId, err ? 'error' : 'valid', err || '');
      if (err) valid = false;
    });
    return valid;
  }

  /* ── Collect data ──────────────────────────── */
  function collectData() {
    const g = (id) => (document.getElementById(id) || {}).value || '';
    return {
      firstname : g('firstname').trim(),
      lastname  : g('lastname').trim(),
      email     : g('email').trim(),
      subject   : g('subject').trim(),
      message   : g('message').trim(),
      timestamp : new Date().toISOString(),
    };
  }

  /* ── Reset helpers ─────────────────────────── */
  function hideFeedback() {
    successBox.classList.remove('is-shown');
    errorBox.classList.remove('is-shown');
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-loading', on);
  }

  /* ── API base URL ──────────────────────────── */
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin;

  /* ── Submit ────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFeedback();

    if (!validateAll()) return;

    setLoading(true);

    const payload = {
      firstName: document.getElementById('firstname').value.trim(),
      lastName: document.getElementById('lastname').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim(),
      website: document.getElementById('website')?.value || '',
    };

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send message');
      }

      setLoading(false);
      successBox.classList.add('is-shown');
      form.reset();
      if (charCounter) charCounter.textContent = `0 / ${MAX_CHARS}`;
      if (fhbUnsaved) {
        fhbUnsaved.textContent = 'saved';
        fhbUnsaved.style.color = '#34d399';
      }

      setTimeout(() => successBox.classList.remove('is-shown'), 6000);
    } catch (err) {
      setLoading(false);
      errorMsg.textContent = err.message || 'Unable to reach the server. Please try again or email directly.';
      errorBox.classList.add('is-shown');
    }
  });

  if (fhbUnsaved) {
    form.addEventListener('input', () => {
      fhbUnsaved.textContent = '● unsaved';
      fhbUnsaved.style.color = '#facc15';
    });
  }

})();


