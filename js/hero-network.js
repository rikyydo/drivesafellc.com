// ========================================
// Animated Network Background + Service Blinkers
// ========================================

(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const hero = canvas.parentElement;

  // ── Settings ─────────────────────────────────────
  const SERVICES = [
    'IRP', 'IFTA', 'Driver Monitoring', 'Hiring',
    'MVR / PSP', 'Mock Audits', 'Annual Inspections',
    'Drug Test Scheduling', 'DataQ Management',
    'Safety Reports', 'Safety Audit', 'Driver Files',
    'IRP Registration', 'Annual Renewals', '2290 Filing',
    'Highway Use Taxes', 'IFTA Registration', 'UCR Filing',
    'BOC-3 Processing', 'MC/DOT Authority',
    'Accounting', 'ELD Solutions', '24/7 Roadside',
    'Insurance', 'Compliance Reviews', 'D&A Consortium',
    'Drug Testing', 'Permit Services',
  ];

  const CFG = {
    desktopPts: 90,
    mobilePts: 40,
    mobileBP: 768,
    speed: 0.25,
    drift: 0.003,
    maxDist: 150,
    lineWidth: 0.7,
    nodeRadius: 2.2,
    nodeGlow: 7,
    // How many service labels are visible at a time
    visibleLabels: 6,
    labelCycle: 3000,    // ms between label swaps
    labelFadeMs: 800,    // fade-in / fade-out duration
  };

  const GRADIENT_STOPS = [
    { pos: 0, color: '#2d0a4e' },
    { pos: 0.55, color: '#531F8A' },
    { pos: 1, color: '#c99a10' },
  ];

  // ── State ────────────────────────────────────────
  let W = 0, H = 0, dpr = 1;
  let points = [];
  let labelSlots = [];   // indices into points[] that carry a label
  let labelData = [];    // { text, alpha, fadingIn, timer }
  let shuffledServices = [];
  let serviceIdx = 0;

  // ── Helpers ──────────────────────────────────────
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickNextService() {
    if (serviceIdx >= shuffledServices.length) {
      shuffledServices = shuffle(SERVICES);
      serviceIdx = 0;
    }
    return shuffledServices[serviceIdx++];
  }

  // ── Init / Resize ────────────────────────────────
  function init() {
    dpr = window.devicePixelRatio || 1;
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const isMobile = W < CFG.mobileBP;
    const count = isMobile ? CFG.mobilePts : CFG.desktopPts;

    points = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      points.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(a) * CFG.speed,
        vy: Math.sin(a) * CFG.speed,
        angle: a,
      });
    }

    // Pick label slots (spread across canvas)
    const numLabels = Math.min(CFG.visibleLabels, count);
    const step = Math.floor(count / numLabels);
    labelSlots = [];
    for (let i = 0; i < numLabels; i++) {
      labelSlots.push(i * step);
    }

    // Init labels
    shuffledServices = shuffle(SERVICES);
    serviceIdx = 0;
    labelData = labelSlots.map(() => ({
      text: pickNextService(),
      alpha: 1,
      fadingIn: false,
      fadingOut: false,
      timer: Math.random() * CFG.labelCycle,
    }));
  }

  // ── Draw gradient ────────────────────────────────
  function drawGradient() {
    const rad = (135 * Math.PI) / 180;
    const cx = W / 2, cy = H / 2;
    const len = Math.sqrt(W * W + H * H) / 2;
    const g = ctx.createLinearGradient(
      cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
      cx + Math.cos(rad) * len, cy + Math.sin(rad) * len
    );
    GRADIENT_STOPS.forEach(s => g.addColorStop(s.pos, s.color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Frame ────────────────────────────────────────
  let lastTime = 0;

  function frame(ts) {
    const dt = Math.min(ts - lastTime, 50); // cap at 50ms
    lastTime = ts;

    drawGradient();

    // Update points
    for (const p of points) {
      p.angle += (Math.random() - 0.5) * CFG.drift;
      p.vx = Math.cos(p.angle) * CFG.speed;
      p.vy = Math.sin(p.angle) * CFG.speed;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = W + 20;
      else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20;
      else if (p.y > H + 20) p.y = -20;
    }

    // Lines
    const maxD2 = CFG.maxDist * CFG.maxDist;
    ctx.lineWidth = CFG.lineWidth;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < maxD2) {
          const a = (1 - Math.sqrt(d2) / CFG.maxDist) * 0.3;
          ctx.strokeStyle = 'rgba(200,180,255,' + a + ')';
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

    // Nodes
    ctx.shadowColor = 'rgba(245,215,66,0.8)';
    ctx.shadowBlur = CFG.nodeGlow;
    ctx.fillStyle = 'rgba(245,215,66,0.8)';
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, CFG.nodeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── Service labels ─────────────────────────────
    updateLabels(dt);
    drawLabels();

    requestAnimationFrame(frame);
  }

  // ── Label logic ──────────────────────────────────
  function updateLabels(dt) {
    for (let i = 0; i < labelData.length; i++) {
      const ld = labelData[i];
      ld.timer += dt;

      if (!ld.fadingOut && ld.timer > CFG.labelCycle) {
        // Start fading out
        ld.fadingOut = true;
        ld.fadingIn = false;
      }

      if (ld.fadingOut) {
        ld.alpha -= dt / CFG.labelFadeMs;
        if (ld.alpha <= 0) {
          ld.alpha = 0;
          ld.text = pickNextService();
          ld.fadingOut = false;
          ld.fadingIn = true;
          ld.timer = 0;
        }
      } else if (ld.fadingIn) {
        ld.alpha += dt / CFG.labelFadeMs;
        if (ld.alpha >= 1) {
          ld.alpha = 1;
          ld.fadingIn = false;
        }
      }
    }
  }

  function drawLabels() {
    const isMobile = W < CFG.mobileBP;
    const fontSize = isMobile ? 11 : 13;
    ctx.font = '600 ' + fontSize + 'px Inter, Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < labelData.length; i++) {
      const ld = labelData[i];
      if (ld.alpha <= 0) continue;
      const pt = points[labelSlots[i]];
      if (!pt) continue;

      const x = pt.x;
      const y = pt.y - 16;

      // Background pill
      const metrics = ctx.measureText(ld.text);
      const pw = metrics.width + 18;
      const ph = fontSize + 10;
      const a = ld.alpha;

      ctx.fillStyle = 'rgba(83,31,138,' + (0.75 * a) + ')';
      ctx.beginPath();
      roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, 6);
      ctx.fill();

      // Border glow
      ctx.strokeStyle = 'rgba(245,166,35,' + (0.5 * a) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      roundRect(ctx, x - pw / 2, y - ph / 2, pw, ph, 6);
      ctx.stroke();

      // Text
      ctx.fillStyle = 'rgba(255,255,255,' + (0.95 * a) + ')';
      ctx.fillText(ld.text, x, y);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
  }

  // ── Bootstrap ────────────────────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });

  init();
  requestAnimationFrame(frame);
})();
