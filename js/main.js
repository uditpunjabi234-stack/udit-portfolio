/* Udit Punjabi — portfolio interactions */
(function () {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const review = location.search.includes('review'); // static full-page capture mode
  if (review) document.documentElement.classList.add('review');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ───────── Clocks (IST) ───────── */
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  function clocks() {
    const now = new Date();
    const parts = fmt.formatToParts(now).reduce((o, p) => (o[p.type] = p.value, o), {});
    const hhmm = `${parts.hour}:${parts.minute}`;
    const hhmmss = `${hhmm}:${parts.second}`;
    const ff = String(Math.floor((now.getMilliseconds() / 1000) * 24)).padStart(2, '0');
    const tc = `${hhmmss}:${ff}`;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('navClock', hhmm); set('footClock', hhmmss); set('heroClock', tc); set('loaderClock', tc);
  }
  setInterval(clocks, 41); clocks();

  const alertTime = $('#alertTime');
  if (alertTime) {
    const d = new Date();
    alertTime.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d).replace(',', '');
  }

  /* ───────── Smooth scroll ───────── */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.__lenis = lenis;
  }
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  /* ───────── Split text ───────── */
  const heroChars = new SplitType('.hero__title .split', { types: 'chars' });
  new SplitType('.contact__title .split', { types: 'chars' });
  // Word/line splits wait for web fonts so line breaks are measured with the real faces.
  let words = null;
  const wordTweens = [];
  function splitWords() {
    wordTweens.forEach(t => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); });
    wordTweens.length = 0;
    if (words) words.revert();
    words = new SplitType('.split-words', { types: 'lines,words' });
    words.lines.forEach(l => { l.style.overflow = 'hidden'; l.style.display = 'block'; });
    if (reduce) return;
    $$('.split-words').forEach(el => {
      const ws = $$('.word', el);
      wordTweens.push(gsap.from(ws, {
        yPercent: 110, opacity: 0, duration: 1, ease: 'power4.out',
        stagger: { each: 0.014 },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }));
    });
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(splitWords); else splitWords();
  let lastW = window.innerWidth, resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; splitWords(); } }, 250);
  });

  /* ───────── Loader ───────── */
  const nav = $('#nav');
  const loader = $('#loader');
  const pct = { v: 0 };
  const introTl = gsap.timeline({ paused: true });

  introTl
    .to('.loader__word', { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power4.out', stagger: 0.12 }, 0)
    .to(pct, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate() { $('#loaderPct').textContent = Math.round(pct.v); $('#loaderBar').style.width = pct.v + '%'; } }, 0)
    .to('.loader__word', { clipPath: 'inset(0 0 0 100%)', duration: 0.7, ease: 'power4.in', stagger: 0.08 }, 1.75)
    .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 2.3)
    .set(loader, { display: 'none' })
    // hero intro
    .from(heroChars.chars, { yPercent: 110, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: { each: 0.018, from: 'start' } }, 2.75)
    .to('.hero__eyebrow', { opacity: 1, duration: 0.8 }, 3.0)
    .to('.hero .reveal-up', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12 }, 3.2)
    .from('.feed', { opacity: 0, duration: 1 }, 3.0)
    .add(() => nav.classList.add('is-in'), 3.1)
    .add(() => { if (lenis) lenis.start(); }, 3.0);

  if (reduce) {
    loader.style.display = 'none';
    nav.classList.add('is-in');
    gsap.set(['.hero__eyebrow', '.hero .reveal-up'], { opacity: 1, y: 0 });
    if (lenis) lenis.start();
  } else {
    window.addEventListener('load', () => introTl.play(), { once: true });
    setTimeout(() => { if (!introTl.isActive() && introTl.progress() === 0) introTl.play(); }, 2500);
  }

  /* ───────── Nav ───────── */
  const menu = $('#menu'), burger = $('#burger');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > 240 && y > lastY && !menu.classList.contains('is-open'));
      lastY = y;
    }
  });
  const closeMenu = () => { menu.classList.remove('is-open'); burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); };
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open); burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    e.preventDefault(); closeMenu(); scrollTo(id);
    history.replaceState(null, '', id);
  }));

  /* ───────── Cursor ───────── */
  const cursor = $('#cursor');
  if (!coarse && !reduce) {
    const dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor), label = $('.cursor__label', cursor);
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }, ringPos = { ...pos };
    window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
    gsap.ticker.add(() => {
      ringPos.x += (pos.x - ringPos.x) * 0.18; ringPos.y += (pos.y - ringPos.y) * 0.18;
      dot.style.transform = `translate(${pos.x}px,${pos.y}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${ringPos.x}px,${ringPos.y}px) translate(-50%,-50%)`;
    });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a,button,[data-cursor],.reel,.svc');
      if (!t) { cursor.classList.remove('is-hover', 'is-label'); return; }
      cursor.classList.add('is-hover');
      const l = t.getAttribute('data-cursor');
      if (l) { label.textContent = l; cursor.classList.add('is-label'); } else cursor.classList.remove('is-label');
    });
  }

  /* ───────── Magnetic buttons ───────── */
  if (!coarse && !reduce) $$('.magnetic').forEach(el => {
    const inner = $('span', el);
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      gsap.to(el, { x: x * 0.28, y: y * 0.28, duration: 0.5, ease: 'power3.out' });
      if (inner) gsap.to(inner, { x: x * 0.12, y: y * 0.12, duration: 0.5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to([el, inner], { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.4)' });
    });
  });

  /* ───────── Hero scroll ───────── */
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true,
    onUpdate(self) {
      if (window.HERO3D) window.HERO3D.setScroll(self.progress);
      gsap.set('.hero__inner', { y: self.progress * 120, opacity: 1 - self.progress * 1.1 });
      gsap.set('.feed', { opacity: 1 - self.progress * 1.6 });
    }
  });

  /* ───────── Scroll reveals ───────── */
  if (!reduce) {
    $$('.section .reveal-up, .card, .svc, .reel').forEach((el, i) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: (i % 5) * 0.06,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    gsap.from('.contact__title .char', {
      yPercent: 110, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: 0.015,
      scrollTrigger: { trigger: '.contact__title', start: 'top 85%', once: true }
    });
    gsap.from('.contact__sub, .contact__actions, .contact__social', {
      y: 30, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.contact__sub', start: 'top 90%', once: true }
    });
    // parallax
    $$('[data-parallax]').forEach(el => {
      const img = $('img', el), amt = parseFloat(el.dataset.parallax) || 0.08;
      gsap.fromTo(img, { yPercent: -amt * 100 }, { yPercent: amt * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // section heads eyebrow line
    $$('.eyebrow').forEach(el => gsap.from(el, { opacity: 0, x: -14, duration: .8, scrollTrigger: { trigger: el, start: 'top 92%', once: true } }));
  }

  /* ───────── Counters ───────── */
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count;
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter() { gsap.fromTo(el, { innerText: 0 }, { innerText: target, duration: 1.6, ease: 'power2.out', snap: { innerText: 1 } }); }
    });
  });

  /* ───────── Service tilt ───────── */
  if (!coarse && !reduce) $$('.tilt').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%'); card.style.setProperty('--my', py * 100 + '%');
      gsap.to(card, { rotateX: (0.5 - py) * 6, rotateY: (px - 0.5) * 8, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.9, ease: 'power3.out' }));
  });

  /* ───────── Work: horizontal pin ───────── */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 821px)', () => {
    if (review) return;
    const track = $('#workTrack'), pin = $('.work__pin'), cards = $$('.card', track), idx = $('#workIdx');
    const total = cards.filter(c => !c.classList.contains('card--cta')).length;
    const totalEl = $('#workTotal'); if (totalEl) totalEl.textContent = String(total);
    const dist = () => track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) * 0;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.work', pin: pin, start: 'top top', end: () => '+=' + dist() * 1.05, scrub: 0.6,
        invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate(self) {
          const n = Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1)));
          idx.textContent = String(Math.min(total, n + 1)).padStart(2, '0');
        }
      }
    });
    // subtle depth
    cards.forEach(c => gsap.fromTo(c, { scale: 0.96 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tween, start: 'left 90%', end: 'left 40%', scrub: true } }));
    return () => tween.scrollTrigger && tween.scrollTrigger.kill();
  });

  /* ───────── Stack marquee (velocity-reactive) ───────── */
  const rows = $$('.stack__row');
  const rowTl = rows.map(row => {
    const inner = $('div', row), dir = +row.dataset.dir || 1;
    gsap.set(inner, { xPercent: dir > 0 ? 0 : -50 });
    return gsap.to(inner, { xPercent: dir > 0 ? -50 : 0, duration: 38, ease: 'none', repeat: -1 });
  });
  if (!reduce) ScrollTrigger.create({
    onUpdate(self) {
      const v = Math.min(4, 1 + Math.abs(self.getVelocity()) / 600);
      rowTl.forEach(t => gsap.to(t, { timeScale: v, duration: 0.4, overwrite: true }));
    }
  });

  /* ───────── Timeline ───────── */
  $$('.tl-item').forEach(li => {
    ScrollTrigger.create({ trigger: li, start: 'top 85%', once: true, onEnter() {
      li.classList.add('is-in');
      gsap.from(li.children, { y: 24, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out' });
    } });
  });

  /* ───────── Typing mock ───────── */
  $$('.typing').forEach(el => {
    const text = el.dataset.type || '';
    ScrollTrigger.create({ trigger: el, start: 'top 95%', once: true, onEnter() {
      let i = 0; const id = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(id); }, 28);
    } });
  });

  /* ───────── Videos: hover / in-view play, lightbox ───────── */
  const lb = $('#lightbox'), lbVid = $('#lightboxVideo'), lbTitle = $('#lightboxTitle');
  function openLightbox(src, title) {
    lbVid.src = src; lbVid.muted = false; lbTitle.textContent = title || '';
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    lbVid.play().catch(() => {});
  }
  function closeLightbox() {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    lbVid.pause(); lbVid.removeAttribute('src'); lbVid.load();
    if (lenis) lenis.start();
  }
  $('#lightboxClose').addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeLightbox(); closeMenu(); } });

  $$('.hovervid').forEach(v => {
    const host = v.closest('.reel, .card__media');
    const wrap = v.closest('.reel, .card');
    if (!coarse) {
      host.addEventListener('pointerenter', () => { v.play().then(() => wrap.classList.add('is-playing')).catch(() => {}); });
      host.addEventListener('pointerleave', () => { v.pause(); wrap.classList.remove('is-playing'); });
    } else {
      new IntersectionObserver(([e]) => {
        if (e.intersectionRatio > 0.6) { v.play().catch(() => {}); wrap.classList.add('is-playing'); }
        else { v.pause(); wrap.classList.remove('is-playing'); }
      }, { threshold: [0, 0.6] }).observe(v);
    }
    host.addEventListener('click', (e) => { e.preventDefault(); openLightbox(v.dataset.full || v.src, v.dataset.title); });
  });

  /* ───────── Copy email ───────── */
  const toast = $('#toast');
  $$('.copy-email').forEach(a => a.addEventListener('click', async (e) => {
    const val = a.dataset.copy; if (!val || !navigator.clipboard) return;
    e.preventDefault();
    try { await navigator.clipboard.writeText(val); toast.textContent = 'Email copied'; }
    catch { toast.textContent = val; }
    toast.classList.add('is-on'); setTimeout(() => toast.classList.remove('is-on'), 1800);
  }));

  /* refresh after fonts/images settle */
  window.addEventListener('load', () => setTimeout(() => ScrollTrigger.refresh(), 300));
})();
