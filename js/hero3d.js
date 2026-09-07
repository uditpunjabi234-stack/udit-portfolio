/* Hero: floating reels as 3D video planes + dust. Exposes window.HERO3D. */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas || !window.THREE) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (location.search.includes('nogl')) return;

  const isSmall = matchMedia('(max-width: 820px)').matches;
  const lowPower = isSmall || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.4, 10.5);

  const group = new THREE.Group();
  scene.add(group);

  const items = [
    { video: 'assets/video/spiderman.mp4', poster: 'assets/img/spiderman-poster.jpg' },
    { poster: 'assets/img/ward217.jpg', wide: true },
    { video: 'assets/video/candle.mp4', poster: 'assets/img/candle-poster.jpg' },
    { poster: 'assets/img/autoedit-poster.jpg' },
    { video: 'assets/video/aroma.mp4', poster: 'assets/img/aroma-poster.jpg' },
    { poster: 'assets/img/citizen.jpg', wide: true },
    { video: 'assets/video/jumboking.mp4', poster: 'assets/img/jumboking-poster.jpg' },
    { poster: 'assets/img/candle-cover.jpg' },
  ];

  const loader = new THREE.TextureLoader();
  const videos = [];
  const planes = [];
  const R = isSmall ? 4.6 : 6.4;

  items.forEach((it, i) => {
    let tex;
    if (it.video && !lowPower) {
      const v = document.createElement('video');
      v.src = it.video; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'auto';
      v.crossOrigin = 'anonymous';
      v.play().catch(() => {});
      videos.push(v);
      tex = new THREE.VideoTexture(v);
    } else {
      tex = loader.load(it.poster);
    }
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    const w = it.wide ? 3.2 : 1.55;
    const h = it.wide ? 2.0 : 2.75;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);

    // frame behind
    const frame = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.08, h + 0.08),
      new THREE.MeshBasicMaterial({ color: 0x1a1b26, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    frame.position.z = -0.01;

    const holder = new THREE.Group();
    holder.add(frame); holder.add(mesh);

    const a = (i / items.length) * Math.PI * 2;
    holder.position.set(Math.sin(a) * R, (i % 2 ? 0.55 : -0.45) + Math.sin(i * 1.7) * 0.35, Math.cos(a) * R);
    holder.rotation.y = a + Math.PI; // face outward-ish; DoubleSide keeps back visible
    holder.userData = { a, baseY: holder.position.y, phase: i * 0.9 };
    group.add(holder);
    planes.push(holder);
  });

  // Dust
  const N = lowPower ? 220 : 520;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffb27a, size: 0.035, transparent: true, opacity: 0.55, sizeAttenuation: true }));
  scene.add(dust);

  // State
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0; // 0..1 through hero
  let rot = 0;
  let visible = true;

  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    videos.forEach(v => visible ? v.play().catch(() => {}) : v.pause());
  }, { threshold: 0 });
  io.observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    rot += 0.0016;
    group.rotation.y = rot + mouse.x * 0.35;
    group.rotation.x = mouse.y * 0.08 - scroll * 0.25;
    group.position.y = -scroll * 2.2;

    planes.forEach((p) => {
      p.position.y = p.userData.baseY + Math.sin(t * 0.8 + p.userData.phase) * 0.18;
      p.rotation.z = Math.sin(t * 0.5 + p.userData.phase) * 0.03;
    });

    dust.rotation.y = t * 0.02;
    dust.position.y = Math.sin(t * 0.3) * 0.2 - scroll * 1.5;

    camera.position.z = 10.5 + scroll * 4;
    camera.position.x = mouse.x * 0.5;
    camera.lookAt(0, 0.2 - scroll * 1.5, 0);

    renderer.render(scene, camera);
  }
  tick();

  window.HERO3D = {
    setScroll(p) { scroll = Math.max(0, Math.min(1, p)); },
  };
})();

/* Card: wireframe tower for the 3D real-estate project. */
(function () {
  const canvas = document.getElementById('cardCanvas');
  if (!canvas || !window.THREE) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (location.search.includes('nogl')) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(6, 4.2, 8);
  camera.lookAt(0, 1.6, 0);

  const tower = new THREE.Group();
  const saffron = new THREE.LineBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.9 });
  const ivory = new THREE.LineBasicMaterial({ color: 0xf3efe4, transparent: true, opacity: 0.32 });

  // podium
  tower.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.4, 0.5, 3.2)), ivory).translateY(0.25));
  // floors
  const floors = 14;
  for (let i = 0; i < floors; i++) {
    const w = 2.2 - (i > 9 ? (i - 9) * 0.12 : 0);
    const d = 1.7 - (i > 9 ? (i - 9) * 0.09 : 0);
    const y = 0.5 + i * 0.32 + 0.16;
    const m = i === 8 ? saffron : ivory;
    const seg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.3, d)), m);
    seg.position.set(-0.6, y, 0);
    tower.add(seg);
  }
  // second block
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.3, 0.3, 1.3)), ivory);
    seg.position.set(1.35, 0.5 + i * 0.32 + 0.16, 0.4);
    tower.add(seg);
  }
  // ground grid
  const grid = new THREE.GridHelper(9, 18, 0x2a2c3a, 0x1c1e2a);
  grid.position.y = 0;
  scene.add(grid);
  scene.add(tower);

  // crane-line accent
  const pts = [new THREE.Vector3(-2.6, 0, 1.6), new THREE.Vector3(-2.6, 5.6, 1.6), new THREE.Vector3(0.8, 5.6, 1.6)];
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), saffron));

  let visible = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
  io.observe(canvas);

  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 200;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  (function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    tower.rotation.y = t * 0.35;
    grid.rotation.y = t * 0.35;
    camera.position.y = 4.2 + Math.sin(t * 0.6) * 0.3;
    camera.lookAt(0, 1.8, 0);
    renderer.render(scene, camera);
  })();
})();
