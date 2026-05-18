// ── LOADER
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const loaderBar = document.getElementById('loaderBarFill');

function scramble(target, final, cb) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*';
  let iter = 0;
  const iv = setInterval(() => {
    loaderText.textContent = final.split('').map((c, i) => {
      if (i < iter) return final[i];
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    iter += 0.4;
    if (iter >= final.length + 1) { clearInterval(iv); loaderText.textContent = final; if(cb) cb(); }
  }, 40);
}

function runLoader() {
  scramble(loaderText, 'SPARK', () => {
    let p = 0;
    const iv = setInterval(() => {
      p += 2;
      loaderBar.style.width = p + '%';
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          loader.classList.add('hidden');
          document.body.style.overflow = '';
          startSite();
        }, 300);
      }
    }, 18);
  });
}
document.body.style.overflow = 'hidden';
runLoader();

function startSite() {
  initLiquid('liquidCanvas');
  initLiquid('lavaCanvas', true);
  initTriangles();
}

// ── CURSOR TRAIL
const trailCanvas = document.getElementById('trailCanvas');
const tCtx = trailCanvas.getContext('2d');
let tw, th;
function resizeTrail() {
  tw = trailCanvas.width = window.innerWidth;
  th = trailCanvas.height = window.innerHeight;
}
resizeTrail();
window.addEventListener('resize', resizeTrail);

const cursorDot = document.getElementById('cursorDot');
let mx = 0, my = 0;
const trail = [];
const TRAIL_LEN = 28;
for (let i = 0; i < TRAIL_LEN; i++) trail.push({ x: 0, y: 0, a: 0 });

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top = my + 'px';
});

function animTrail() {
  tCtx.clearRect(0, 0, tw, th);
  trail.unshift({ x: mx, y: my, a: 1 });
  if (trail.length > TRAIL_LEN) trail.pop();
  for (let i = 1; i < trail.length; i++) {
    const t = trail[i], pt = trail[i-1];
    const alpha = (1 - i / TRAIL_LEN) * 0.6;
    const size = (1 - i / TRAIL_LEN) * 4;
    tCtx.beginPath();
    tCtx.moveTo(pt.x, pt.y);
    tCtx.lineTo(t.x, t.y);
    tCtx.strokeStyle = `rgba(220,0,0,${alpha})`;
    tCtx.lineWidth = size;
    tCtx.lineCap = 'round';
    tCtx.shadowColor = '#ff0000';
    tCtx.shadowBlur = 8;
    tCtx.stroke();
  }
  requestAnimationFrame(animTrail);
}
animTrail();

// ── NAV
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60));

// ── HAMBURGER
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
  document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
});
document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => {
  hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); document.body.style.overflow = '';
}));

// ── PARALLAX
window.addEventListener('scroll', () => {
  const hero = document.getElementById('hero');
  const content = hero.querySelector('.hero-content');
  const sy = window.scrollY;
  if (content) content.style.transform = `translateY(${sy * 0.25}px)`;
});

// ── SCROLL REVEAL
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

// ── TILT CARDS
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 10}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
    card.style.transition = 'transform 0.5s ease';
  });
  card.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
});

// ── LIGHTBOX / WHEEL VIEWER
// The wheel is a vertical cylinder. Each image sits on the rim at a fixed
// angular step. Spinning rotates every image by one step so the arc motion
// is always true to the wheel — images shrink & dim as they curve away.
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const albumTitle = document.getElementById('albumTitle');
const albumCount = document.getElementById('albumCount');
const albumStage = document.getElementById('albumStage');

let albumImages = [];
let albumIndex = 0;
let albumScrollLocked = false;
let albumTouchY = 0;
let savedScrollY = 0;
const albumPreload = new Map();

// Wheel geometry — how many slots are visible and their angular positions
const WHEEL_SLOTS = 5;                    // far-prev, prev, current, next, far-next
const SLOT_ANGLE  = 38;                   // degrees between adjacent images on the wheel
const WHEEL_RADIUS_PX = 340;             // perspective radius (depth feel)
const SPIN_DURATION   = 520;             // ms per step

// Slot descriptors: angle offset from centre (0° = front)
const SLOT_CONFIGS = [
  { cls: 'wheel-far-prev', angle: -SLOT_ANGLE * 2 },
  { cls: 'wheel-prev',     angle: -SLOT_ANGLE      },
  { cls: 'wheel-current',  angle:  0               },
  { cls: 'wheel-next',     angle:  SLOT_ANGLE      },
  { cls: 'wheel-far-next', angle:  SLOT_ANGLE * 2  },
];

// Cache slot elements
const wheelSlots = SLOT_CONFIGS.map(cfg => ({
  ...cfg,
  el:  albumStage.querySelector('.' + cfg.cls),
  img: albumStage.querySelector('.' + cfg.cls + ' img'),
}));

function angleToWheelStyle(angleDeg) {
  const rad    = angleDeg * Math.PI / 180;
  const z      = Math.cos(rad);           // 1 at front, 0 at 90°, -1 at back
  const yShift = Math.sin(rad);           // vertical displacement on the wheel
  const scale  = 0.38 + 0.62 * Math.max(0, z);   // 1 at front, ~0.38 at far edges
  const opacity = 0.12 + 0.88 * Math.max(0, z);
  const translateY = yShift * WHEEL_RADIUS_PX * 0.52; // px up/down
  const translateZ = (z - 1) * WHEEL_RADIUS_PX * 0.55; // px depth
  const rotateX    = -angleDeg * 0.92;               // tilt matching the arc
  const blur       = Math.max(0, (1 - z) * 1.8);
  const grey       = Math.round(Math.max(0, (1 - z) * 55));
  return { scale, opacity, translateY, translateZ, rotateX, blur, grey };
}

function applyWheelStyles(animated) {
  wheelSlots.forEach(slot => {
    const s = angleToWheelStyle(slot.currentAngle);

    const transform = [
      `translate(-50%, calc(-50% + ${s.translateY.toFixed(1)}px))`,
      `translateZ(${s.translateZ.toFixed(1)}px)`,
      `rotateX(${s.rotateX.toFixed(1)}deg)`,
      `scale(${s.scale.toFixed(3)})`,
    ].join(' ');

    const filter = s.blur > 0.05
      ? `grayscale(${s.grey}%) brightness(${(0.45 + 0.55 * Math.max(0, (angleToWheelStyle(slot.currentAngle).scale - 0.38) / 0.62)).toFixed(2)}) blur(${s.blur.toFixed(2)}px)`
      : 'none';

    slot.el.style.transition = animated
      ? `transform ${SPIN_DURATION}ms cubic-bezier(.2,.9,.18,1), opacity ${SPIN_DURATION}ms ease, filter ${SPIN_DURATION}ms ease`
      : 'none';
    slot.el.style.transform  = transform;
    slot.el.style.opacity    = s.opacity.toFixed(3);
    slot.el.style.filter     = filter;
    // z-index: front slot on top
    slot.el.style.zIndex     = Math.round(s.scale * 10);
  });
}

function preloadAlbumImages(images) {
  images.forEach(src => {
    if (albumPreload.has(src)) return;
    const img = new Image(); img.src = src;
    albumPreload.set(src, img);
  });
}

function loadSlotImages(centreIndex) {
  wheelSlots.forEach((slot, i) => {
    const offset = i - 2; // -2…+2
    const idx = ((centreIndex + offset) % albumImages.length + albumImages.length) % albumImages.length;
    slot.img.src = albumImages[idx];
    if (i === 2) lightboxImg.src = albumImages[idx];
  });
  albumCount.textContent = `${centreIndex + 1} / ${albumImages.length}`;
}

function initWheelAngles() {
  wheelSlots.forEach((slot, i) => {
    slot.currentAngle = SLOT_CONFIGS[i].angle;
  });
}

function showAlbumImage(index) {
  if (!albumImages.length) return;
  albumIndex = ((index % albumImages.length) + albumImages.length) % albumImages.length;
  loadSlotImages(albumIndex);
}

function spinAlbum(direction) {
  if (!lightbox.classList.contains('open') || albumImages.length < 2 || albumScrollLocked) return;
  albumScrollLocked = true;

  // Animate each slot rotating by one step
  const step = direction * SLOT_ANGLE;
  wheelSlots.forEach(slot => { slot.currentAngle -= step; });
  applyWheelStyles(true);

  setTimeout(() => {
    // After animation: snap back angles & reload images for new centre
    albumIndex = ((albumIndex + direction) % albumImages.length + albumImages.length) % albumImages.length;
    initWheelAngles();
    loadSlotImages(albumIndex);
    applyWheelStyles(false);   // instant reset (no transition)
    albumScrollLocked = false;
  }, SPIN_DURATION);
}

document.querySelectorAll('.album-card[data-images]').forEach(item => {
  item.addEventListener('click', () => {
    albumImages = item.dataset.images.split('|').filter(Boolean);
    preloadAlbumImages(albumImages);
    albumIndex = 0;
    albumTitle.textContent = item.dataset.title || 'Portfolio Album';
    initWheelAngles();
    loadSlotImages(0);
    applyWheelStyles(false);
    savedScrollY = window.scrollY;
    document.body.style.top = `-${savedScrollY}px`;
    document.body.classList.add('modal-open');
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  });
});

albumStage.addEventListener('wheel', e => {
  if (!lightbox.classList.contains('open')) return;
  e.preventDefault();
  spinAlbum(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1);
}, { passive: false });

albumStage.addEventListener('touchstart', e => {
  if (!lightbox.classList.contains('open')) return;
  albumTouchY = e.touches[0].clientY;
}, { passive: false });

albumStage.addEventListener('touchmove', e => {
  if (!lightbox.classList.contains('open')) return;
  e.preventDefault();
}, { passive: false });

albumStage.addEventListener('touchend', e => {
  if (!lightbox.classList.contains('open')) return;
  const diff = albumTouchY - e.changedTouches[0].clientY;
  if (Math.abs(diff) > 28) spinAlbum(diff > 0 ? 1 : -1);
}, { passive: false });

document.getElementById('lightboxClose').addEventListener('click', closeLB);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLB(); });
lightbox.addEventListener('touchmove', e => {
  if (lightbox.classList.contains('open')) e.preventDefault();
}, { passive: false });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLB();
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') spinAlbum(1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   spinAlbum(-1);
});
function closeLB() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, savedScrollY);
}

// ── WORK FILTERS
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.album-card').forEach(item => {
      item.style.display = (f === 'all' || item.dataset.category === f) ? '' : 'none';
    });
  });
});

// ── CONTACT FORM
const cf = document.getElementById('contactForm');
if (cf) cf.addEventListener('submit', function(e) {
  e.preventDefault();
  cf.style.display = 'none';
  document.getElementById('formSuccess').style.display = 'block';
});

// ── LIQUID BACKGROUND (WebGL)
// Slower motion + random faint glows scattered through the liquid
function initLiquid(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width  = Math.max(1, Math.floor(canvas.offsetWidth  * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.offsetHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  const vert = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  // Slower time multipliers (was 0.075 → now 0.028)
  // Random glows: 6 glow seeds that drift slowly and pulse
  const frag = `
    precision mediump float;
    uniform float u_time;
    uniform vec2  u_res;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u2 = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1,0)), u2.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u2.x),
        u2.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 6; i++) {
        v += a * smoothNoise(p);
        p  = p * 2.1 + vec2(1.7, 9.2);
        a *= 0.5;
      }
      return v;
    }

    // A single drifting glow seed
    float glowBlob(vec2 uv, vec2 seed, float speed, float radius) {
      float t = u_time * speed;
      vec2 centre = vec2(
        0.5 + 0.42 * sin(t * 0.7 + seed.x * 6.28),
        0.5 + 0.42 * cos(t * 0.5 + seed.y * 6.28)
      );
      float d = length(uv - centre);
      float pulse = 0.55 + 0.45 * sin(t * 1.3 + seed.x * 4.0);
      return pulse * smoothstep(radius, 0.0, d);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
      vec2 uv = gl_FragCoord.xy / u_res;
      p.x += 0.12;

      // ── Slower liquid motion (was 0.075, now 0.026)
      float t = u_time * 0.026;

      vec2 q = vec2(
        fbm(p * 1.35 + vec2(0.0, t)),
        fbm(p * 1.1  + vec2(3.2, -t * 0.8))
      );
      vec2 r = vec2(
        fbm(p * 2.0 + 4.0 * q + vec2(1.7, 9.2) + t),
        fbm(p * 2.2 + 4.0 * q + vec2(8.3, 2.8) - t)
      );

      vec2 flow  = p + 0.55 * sin(5.4 * vec2(r.x, r.y) + vec2(t * 2.0, -t * 1.6));
      float bands = sin((flow.x + flow.y * 0.85) * 18.0 + fbm(flow * 3.2 + t) * 7.0);
      float marble   = smoothstep(-0.62, 0.82, bands + fbm(flow * 4.8 - t) * 0.95);
      float darkVein = smoothstep(0.36, 0.98, abs(bands));

      vec3 black   = vec3(0.0);
      vec3 deepRed = vec3(0.22, 0.0, 0.0);
      vec3 red     = vec3(0.56, 0.0, 0.0);
      vec3 col = mix(black, deepRed, marble);
      col = mix(col, red, pow(marble, 3.0) * 0.42);
      col = mix(col, black, darkVein * 0.72);
      col *= 0.62;

      float vignette = smoothstep(0.95, 0.2, length(p));
      col *= mix(0.46, 1.0, vignette);

      // ── Random faint glows (6 drifting blobs)
      float glow = 0.0;
      glow += glowBlob(uv, vec2(0.13, 0.71), 0.09, 0.36);
      glow += glowBlob(uv, vec2(0.47, 0.23), 0.07, 0.30);
      glow += glowBlob(uv, vec2(0.82, 0.55), 0.11, 0.32);
      glow += glowBlob(uv, vec2(0.31, 0.89), 0.06, 0.38);
      glow += glowBlob(uv, vec2(0.65, 0.08), 0.10, 0.28);
      glow += glowBlob(uv, vec2(0.92, 0.38), 0.08, 0.34);
      glow = clamp(glow, 0.0, 1.0);

      // Warm crimson glow — visible but not overpowering
      vec3 glowCol = vec3(0.55, 0.02, 0.02) * glow * 0.52;
      col += glowCol;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compileShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s); return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl.VERTEX_SHADER,   vert));
  gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes  = gl.getUniformLocation(prog, 'u_res');
  const start = performance.now();

  function render() {
    const t = (performance.now() - start) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  render();
}

// ── BLACK TRIANGULAR 3D SHAPES
function initTriangles() {
  drawTri('triCanvasLeft',  false);
  drawTri('triCanvasRight', true);
}

function drawTri(id, mirror) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let t = 0;

  function project(x, y, z, cx, cy) {
    const fov = 320, scale = fov / (fov + z + 100);
    return { x: cx + x * scale, y: cy + y * scale, z, s: scale };
  }
  function rotX(y, z, a) { return { y: y*Math.cos(a)-z*Math.sin(a), z: y*Math.sin(a)+z*Math.cos(a) }; }
  function rotY(x, z, a) { return { x: x*Math.cos(a)-z*Math.sin(a), z: x*Math.sin(a)+z*Math.cos(a) }; }
  function rotZ(x, y, a) { return { x: x*Math.cos(a)-y*Math.sin(a), y: x*Math.sin(a)+y*Math.cos(a) }; }

  function transformPt(px, py, pz, rx, ry, rz) {
    let v = { x: px, y: py, z: pz };
    let r1 = rotX(v.y, v.z, rx); v.y = r1.y; v.z = r1.z;
    let r2 = rotY(v.x, v.z, ry); v.x = r2.x; v.z = r2.z;
    let r3 = rotZ(v.x, v.y, rz); v.x = r3.x; v.y = r3.y;
    return v;
  }

  function drawTriPrism(cx, cy, size, rx, ry, rz) {
    const s = size, h = size * 2.2;
    const triPts = [[0,-s,0],[s*0.866,s*0.5,0],[-s*0.866,s*0.5,0]];
    const verts = [
      ...triPts.map(([x,y,z]) => transformPt(x,y,-h/2,rx,ry,rz)),
      ...triPts.map(([x,y,z]) => transformPt(x,y, h/2,rx,ry,rz))
    ].map(v => project(v.x,v.y,v.z,cx,cy));
    const faces = [
      {idx:[0,1,2],norm:1.0},{idx:[3,5,4],norm:0.5},
      {idx:[0,1,4,3],norm:0.75},{idx:[1,2,5,4],norm:0.6},{idx:[2,0,3,5],norm:0.85}
    ];
    faces.sort((a,b)=>{
      const za=a.idx.reduce((s,i)=>s+verts[i].z,0)/a.idx.length;
      const zb=b.idx.reduce((s,i)=>s+verts[i].z,0)/b.idx.length;
      return za-zb;
    });
    faces.forEach(({idx,norm})=>{
      ctx.beginPath();
      ctx.moveTo(verts[idx[0]].x,verts[idx[0]].y);
      for(let i=1;i<idx.length;i++) ctx.lineTo(verts[idx[i]].x,verts[idx[i]].y);
      ctx.closePath();
      const dark=Math.floor(norm*18);
      const g=ctx.createLinearGradient(verts[idx[0]].x,verts[idx[0]].y,verts[idx[Math.floor(idx.length/2)]].x,verts[idx[Math.floor(idx.length/2)]].y);
      g.addColorStop(0,`rgba(${dark+4},${dark},${dark},0.97)`);
      g.addColorStop(0.5,`rgba(${dark},${dark},${dark},0.95)`);
      g.addColorStop(1,`rgba(${dark+8},${dark},${dark+2},0.97)`);
      ctx.fillStyle=g; ctx.fill();
      ctx.strokeStyle=`rgba(180,0,0,${norm*0.35})`; ctx.lineWidth=0.8;
      ctx.shadowColor='#cc0000'; ctx.shadowBlur=norm>0.7?8:4; ctx.stroke(); ctx.shadowBlur=0;
    });
  }

  function drawTetra(cx, cy, size, rx, ry, rz) {
    const s=size;
    const rawVerts=[[0,-s,0],[s*0.816,s*0.333,s*0.471],[-s*0.816,s*0.333,s*0.471],[0,s*0.333,-s*0.943]];
    const verts=rawVerts.map(([x,y,z])=>{const v=transformPt(x,y,z,rx,ry,rz);return project(v.x,v.y,v.z,cx,cy);});
    const faces=[{idx:[0,1,2],n:0.9},{idx:[0,1,3],n:0.65},{idx:[0,2,3],n:0.75},{idx:[1,2,3],n:0.5}];
    faces.sort((a,b)=>{
      const za=a.idx.reduce((s,i)=>s+verts[i].z,0)/3;
      const zb=b.idx.reduce((s,i)=>s+verts[i].z,0)/3;
      return za-zb;
    });
    faces.forEach(({idx,n})=>{
      ctx.beginPath();
      ctx.moveTo(verts[idx[0]].x,verts[idx[0]].y);
      ctx.lineTo(verts[idx[1]].x,verts[idx[1]].y);
      ctx.lineTo(verts[idx[2]].x,verts[idx[2]].y);
      ctx.closePath();
      const d=Math.floor(n*15);
      ctx.fillStyle=`rgba(${d+3},${d},${d},0.97)`; ctx.fill();
      ctx.strokeStyle=`rgba(160,0,0,${n*0.4})`; ctx.lineWidth=0.7;
      ctx.shadowColor='#bb0000'; ctx.shadowBlur=n>0.7?10:5; ctx.stroke(); ctx.shadowBlur=0;
    });
  }

  function frame() {
    ctx.clearRect(0,0,W,H);
    t += 0.006;
    const m = mirror ? -1 : 1;
    drawTriPrism(W/2, H*0.2, 42, t*0.5, t*0.8*m, t*0.3);
    drawTetra(   W/2, H*0.5, 52, t*0.7, t*1.0*m, t*-0.4);
    drawTriPrism(W/2, H*0.8, 30, t*-0.6,t*0.9*m, t*0.5);
    requestAnimationFrame(frame);
  }
  frame();
}
