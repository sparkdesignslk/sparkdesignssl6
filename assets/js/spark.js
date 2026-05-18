if (!window.gsap) {
  window.gsap = {
    registerPlugin() {},
    set(targets, vars) {
      getTargets(targets).forEach(el => Object.assign(el.style, styleVars(vars)));
    },
    to(targets, vars) {
      getTargets(targets).forEach((el, i) => {
        el.style.transition = `all ${vars.duration || 0.4}s ${vars.ease ? 'ease' : 'ease'}`;
        const delay = (vars.delay || 0) + (vars.stagger ? vars.stagger * i : 0);
        setTimeout(() => Object.assign(el.style, styleVars(vars)), delay * 1000);
      });
    },
    fromTo(targets, fromVars, toVars) {
      getTargets(targets).forEach(el => Object.assign(el.style, styleVars(fromVars)));
      this.to(targets, toVars);
    },
    timeline() {
      const api = { to(targets, vars) { window.gsap.to(targets, vars); return api; } };
      return api;
    }
};
}
function getTargets(targets) {
  if (typeof targets === 'string') return Array.from(document.querySelectorAll(targets));
  if (targets instanceof Element) return [targets];
  return Array.from(targets || []);
}
if (!window.ScrollTrigger) {
  window.ScrollTrigger = {
    create({ trigger, onEnter }) {
      const el = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
      if (!el || !onEnter) return;
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { onEnter(); obs.disconnect(); }
        });
      }, { threshold: 0.08 });
      obs.observe(el);
    }
  };
}
function styleVars(vars) {
  const out = {};
  if ('opacity' in vars) out.opacity = vars.opacity;
  if ('scale' in vars) out.transform = `scale(${vars.scale})`;
  if ('x' in vars || 'y' in vars) out.transform = `translate(${vars.x || 0}px, ${vars.y || 0}px)`;
  if ('rotateX' in vars || 'rotateY' in vars) out.transform = `perspective(${vars.transformPerspective || 800}px) rotateY(${vars.rotateY || 0}deg) rotateX(${vars.rotateX || 0}deg) scale(${vars.scale || 1})`;
  if ('y' in vars && typeof vars.y === 'string') out.transform = `translateY(${vars.y})`;
  if ('y' in vars && typeof vars.y === 'number' && !('x' in vars)) out.transform = `translateY(${vars.y}px)`;
  return out;
}
try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}

// ── LOADER
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const loaderBar = document.getElementById('loaderBarFill');
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@!%&*';
const FINAL = 'SPARK';
document.body.style.overflow = 'hidden';

function scramble(cb) {
  let iter = 0;
  const iv = setInterval(() => {
    loaderText.textContent = FINAL.split('').map((c,i) => i < iter ? FINAL[i] : CHARS[Math.floor(Math.random()*CHARS.length)]).join('');
    iter += 0.35;
    if (iter >= FINAL.length + 1) { clearInterval(iv); loaderText.textContent = FINAL; cb && cb(); }
  }, 38);
}

function fillBar() {
  let p = 0;
  const iv = setInterval(() => {
    p += 1.6;
    loaderBar.style.width = Math.min(p,100) + '%';
    if (p >= 100) { clearInterval(iv); setTimeout(() => { loader.classList.add('hidden'); document.body.style.overflow = ''; boot(); }, 300); }
  }, 16);
}
scramble(fillBar);

function boot() {
  initLava();
  initThree();
  initLightning();
  animHero();
  gsap.to('.pyramid', { opacity: 0.72, duration: 1.2, stagger: 0.15, delay: 0.2, ease: 'power2.out' });
  document.querySelectorAll('.pyramid').forEach(el => el.classList.add('show'));
  initScrollAnim();
}

// ── CURSOR + TRAIL
const trailCanvas = document.getElementById('trailCanvas');
const tCtx = trailCanvas.getContext('2d');
const cOuter = document.getElementById('cursorOuter');
const cInner = document.getElementById('cursorInner');
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
let mx=0, my=0, ox=0, oy=0;
const trail = Array.from({length:24},()=>({x:0,y:0}));

function resizeTrail(){ trailCanvas.width=window.innerWidth; trailCanvas.height=window.innerHeight; }
resizeTrail(); window.addEventListener('resize', resizeTrail);

document.addEventListener('mousemove', e => {
  if(!hasFinePointer)return;
  mx=e.clientX; my=e.clientY;
  cInner.style.left=mx+'px'; cInner.style.top=my+'px';
});
function animCursor() {
  if(!hasFinePointer)return;
  ox+=(mx-ox)*0.1; oy+=(my-oy)*0.1;
  cOuter.style.left=ox+'px'; cOuter.style.top=oy+'px';
  tCtx.clearRect(0,0,trailCanvas.width,trailCanvas.height);
  trail.unshift({x:mx,y:my}); trail.pop();
  for(let i=1;i<trail.length;i++){
    const a=(1-i/trail.length)*0.5, w=(1-i/trail.length)*3.2;
    tCtx.beginPath(); tCtx.moveTo(trail[i-1].x,trail[i-1].y); tCtx.lineTo(trail[i].x,trail[i].y);
    tCtx.strokeStyle=`rgba(210,0,0,${a})`; tCtx.lineWidth=w; tCtx.lineCap='round';
    tCtx.shadowColor='#ff0000'; tCtx.shadowBlur=6; tCtx.stroke();
  }
  requestAnimationFrame(animCursor);
}
if(hasFinePointer){
  animCursor();
  document.querySelectorAll('a,button,.album-card,.service-card,.contact-link').forEach(el=>{
    el.addEventListener('mouseenter',()=>document.body.classList.add('cur-hover'));
    el.addEventListener('mouseleave',()=>document.body.classList.remove('cur-hover'));
  });
}

// ── MAGNETIC
document.querySelectorAll('.magnetic').forEach(el=>{
  el.addEventListener('mousemove',e=>{
    const r=el.getBoundingClientRect();
    const dx=(e.clientX-r.left-r.width/2)*0.28;
    const dy=(e.clientY-r.top-r.height/2)*0.28;
    gsap.to(el,{x:dx,y:dy,duration:0.4,ease:'power2.out'});
  });
  el.addEventListener('mouseleave',()=>gsap.to(el,{x:0,y:0,duration:0.6,ease:'elastic.out(1,0.4)'}));
});

// ── NAV
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>navbar.classList.toggle('scrolled',window.scrollY>60));

// ── HAMBURGER
const hamburger=document.getElementById('hamburger');
const mobileMenu=document.getElementById('mobileMenu');
hamburger.addEventListener('click',()=>{
  hamburger.classList.toggle('open'); mobileMenu.classList.toggle('open');
  document.body.style.overflow=mobileMenu.classList.contains('open')?'hidden':'';
});
document.querySelectorAll('.mobile-link').forEach(l=>l.addEventListener('click',()=>{
  hamburger.classList.remove('open'); mobileMenu.classList.remove('open'); document.body.style.overflow='';
}));

// ── PARALLAX
window.addEventListener('scroll',()=>{
  const sy=window.scrollY;
  const hero=document.getElementById('hero');
  if(sy<hero.offsetHeight){
    gsap.set('.hero-content',{y:Math.min(sy*0.12, 36)});
    gsap.set('.hero-scattered',{y:sy*0.1});
  }
});

// ── HERO ANIMATION
function animHero(){
  const tl=gsap.timeline({delay:0.1});
  tl.to('#hero .title-line',{y:'0%',opacity:1,duration:1.1,stagger:0.18,ease:'power4.out'})
    .to('.hero-sub',{opacity:1,y:0,duration:0.8,ease:'power3.out'},'-=0.4')
    .to('.hero-btns',{opacity:1,y:0,duration:0.8,ease:'power3.out'},'-=0.5');
  // Start slow neon sweep once title has settled in
  setTimeout(()=>{
    document.querySelectorAll('#hero .title-line').forEach(el=>{
      el.classList.add('neon-active');
    });
  }, 1800);
}

// ── SCROLL ANIMATIONS
function initScrollAnim(){
  document.querySelectorAll('.reveal').forEach(el=>{
    ScrollTrigger.create({
      trigger:el, start:'top 88%',
      onEnter:()=>{ el.style.opacity='1'; el.style.transform='translateY(0)'; }
    });
  });
  gsap.fromTo('.album-card',{opacity:0,y:50},{opacity:1,y:0,duration:0.8,stagger:0.12,ease:'power3.out',
    scrollTrigger:{trigger:'#work',start:'top 78%'}});
}

// ── TILT CARDS
document.querySelectorAll('.tilt-card').forEach(card=>{
  card.addEventListener('mousemove',e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-0.5;
    const y=(e.clientY-r.top)/r.height-0.5;
    gsap.to(card,{rotateY:x*14,rotateX:-y*10,scale:1.02,duration:0.4,ease:'power2.out',transformPerspective:800});
  });
  card.addEventListener('mouseleave',()=>gsap.to(card,{rotateY:0,rotateX:0,scale:1,duration:0.6,ease:'elastic.out(1,0.4)'}));
});

// ── ALBUM VIEWER
const lightbox=document.getElementById('lightbox');
const albumStage=document.getElementById('albumStage');
const albumTitle=document.getElementById('albumTitle');
const albumCount=document.getElementById('albumCount');
let albumImages=[], albumIdx=0;

const slots=['wheel-far-prev','wheel-prev','wheel-current','wheel-next','wheel-far-next'];
const slotEls=slots.map(c=>albumStage.querySelector('.'+c));

const slotTransforms=[
  'translate(-50%,-50%) translateZ(-260px) translateY(-200px) rotateX(24deg) scale(0.6)',
  'translate(-50%,-50%) translateZ(-120px) translateY(-100px) rotateX(14deg) scale(0.78)',
  'translate(-50%,-50%) translateZ(0px) translateY(0px) rotateX(0deg) scale(1)',
  'translate(-50%,-50%) translateZ(-120px) translateY(100px) rotateX(-14deg) scale(0.78)',
  'translate(-50%,-50%) translateZ(-260px) translateY(200px) rotateX(-24deg) scale(0.6)',
];
const slotOpacity=[0.25,0.55,1,0.55,0.25];
const slotFilter=['blur(4px)','blur(2px)','blur(0px)','blur(2px)','blur(4px)'];
let wheelLocked=false;
let wheelDelta=0;
const WHEEL_DURATION=860;

function applySlotStyle(el,i,animated=true){
  el.style.transform=slotTransforms[i];
  el.style.opacity=slotOpacity[i];
  el.style.filter=slotFilter[i];
  el.style.zIndex=i===2?10:5-Math.abs(i-2);
  el.style.transition=animated
    ? `transform ${WHEEL_DURATION}ms cubic-bezier(.18,.86,.16,1), opacity ${WHEEL_DURATION}ms ease, filter ${WHEEL_DURATION}ms ease`
    : 'none';
}

function renderWheel(animated=false){
  slotEls.forEach((el,i)=>{
    const imgIdx=(albumIdx+i-2+albumImages.length*10)%albumImages.length;
    el.querySelector('img').src=albumImages[imgIdx];
    applySlotStyle(el,i,animated);
  });
  albumCount.textContent=`${albumIdx+1} / ${albumImages.length}`;
}
function spinAlbum(dir){
  if(!albumImages.length||wheelLocked)return;
  wheelLocked=true;
  slotEls.forEach((el,i)=>{
    const target=i-dir;
    el.style.transition=`transform ${WHEEL_DURATION}ms cubic-bezier(.18,.86,.16,1), opacity ${WHEEL_DURATION}ms ease, filter ${WHEEL_DURATION}ms ease`;
    if(target>=0&&target<slotTransforms.length){
      el.style.transform=slotTransforms[target];
      el.style.opacity=slotOpacity[target];
      el.style.filter=slotFilter[target];
      el.style.zIndex=target===2?10:5-Math.abs(target-2);
    } else {
      const exitY=dir>0?-310:310;
      el.style.transform=`translate(-50%,-50%) translateZ(-360px) translateY(${exitY}px) rotateX(${dir>0?34:-34}deg) scale(0.48)`;
      el.style.opacity='0';
      el.style.filter='blur(6px)';
      el.style.zIndex='1';
    }
  });
  setTimeout(()=>{
    albumIdx=(albumIdx+dir+albumImages.length)%albumImages.length;
    renderWheel(false);
    requestAnimationFrame(()=>{ wheelLocked=false; });
  },WHEEL_DURATION);
}

function openAlbum(card){
  albumImages=card.dataset.images.split('|');
  albumTitle.textContent=card.dataset.title;
  albumIdx=0;
  renderWheel(false);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}
function closeAlbum(){ lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }

document.querySelectorAll('.album-card').forEach(card=>card.addEventListener('click',()=>openAlbum(card)));
document.getElementById('lightboxClose').addEventListener('click',closeAlbum);
lightbox.addEventListener('click',e=>{ if(e.target===lightbox)closeAlbum(); });
document.addEventListener('keydown',e=>{ if(!lightbox.classList.contains('open'))return; if(e.key==='Escape')closeAlbum(); if(e.key==='ArrowDown'||e.key==='ArrowRight')spinAlbum(1); if(e.key==='ArrowUp'||e.key==='ArrowLeft')spinAlbum(-1); });

albumStage.addEventListener('wheel',e=>{
  if(!lightbox.classList.contains('open'))return;
  e.preventDefault();
  const delta=Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX;
  wheelDelta+=delta;
  if(Math.abs(wheelDelta)<3||wheelLocked)return;
  spinAlbum(wheelDelta>0?1:-1);
  wheelDelta=0;
},{passive:false});

// Mouse/touch drag — lower threshold, velocity-aware
let dragStart=null, dragLast=null, dragVelY=0;
albumStage.addEventListener('mousedown',e=>{dragStart=e.clientY; dragLast=e.clientY; dragVelY=0;});
albumStage.addEventListener('mousemove',e=>{
  if(dragStart===null)return;
  dragVelY=e.clientY-dragLast; dragLast=e.clientY;
  if(Math.abs(e.clientY-dragStart)>22){
    spinAlbum(e.clientY<dragStart?1:-1);
    dragStart=e.clientY;
  }
});
albumStage.addEventListener('mouseup',()=>{dragStart=null; dragLast=null;});
albumStage.addEventListener('mouseleave',()=>{dragStart=null; dragLast=null;});

let touchStartY=null, touchLastY=null;
albumStage.addEventListener('touchstart',e=>{
  touchStartY=e.touches[0].clientY;
  touchLastY=e.touches[0].clientY;
},{passive:true});
albumStage.addEventListener('touchmove',e=>{
  if(touchStartY===null)return;
  const diff=touchLastY-e.touches[0].clientY;
  if(Math.abs(diff)>18&&!wheelLocked){
    spinAlbum(diff>0?1:-1);
    touchLastY=e.touches[0].clientY;
    touchStartY=e.touches[0].clientY;
  }
},{passive:true});
albumStage.addEventListener('touchend',e=>{
  // Fast flick — final nudge based on velocity
  if(touchStartY!==null){
    const totalDiff=touchStartY-e.changedTouches[0].clientY;
    if(Math.abs(totalDiff)>8&&!wheelLocked) spinAlbum(totalDiff>0?1:-1);
  }
  touchStartY=null; touchLastY=null;
});

// Tap nav arrows for mobile
const prevArrow=document.createElement('button');
prevArrow.className='album-nav-arrow album-nav-up'; prevArrow.innerHTML='&#8679;'; prevArrow.setAttribute('aria-label','Previous');
const nextArrow=document.createElement('button');
nextArrow.className='album-nav-arrow album-nav-down'; nextArrow.innerHTML='&#8681;'; nextArrow.setAttribute('aria-label','Next');
albumStage.appendChild(prevArrow); albumStage.appendChild(nextArrow);
prevArrow.addEventListener('click',e=>{e.stopPropagation();spinAlbum(-1);});
nextArrow.addEventListener('click',e=>{e.stopPropagation();spinAlbum(1);});

// ── WORK FILTERS
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.filter;
    document.querySelectorAll('.album-card').forEach(card=>{
      const show=f==='all'||card.dataset.category===f;
      gsap.to(card,{opacity:show?1:0.12,scale:show?1:0.95,duration:0.35});
      card.style.pointerEvents=show?'':'none';
    });
  });
});

// ── CONTACT FORM
const cf=document.getElementById('contactForm');
if(cf){
  cf.addEventListener('submit',async function(e){
    e.preventDefault();
    const btn=cf.querySelector('.form-submit');
    btn.textContent='SENDING...';
    try{
      const res=await fetch('https://api.web3forms.com/submit',{method:'POST',body:new FormData(cf)});
      const data=await res.json();
      if(data.success){ cf.style.display='none'; document.getElementById('formSuccess').style.display='block'; }
      else { btn.innerHTML='TRY AGAIN'; }
    }catch(err){ btn.innerHTML='TRY AGAIN'; }
  });
}

// ── LAVA WEBGL BACKGROUND
function initLava(){
  const canvas=document.getElementById('lavaCanvas');
  if(!canvas)return;
  const gl=canvas.getContext('webgl')||canvas.getContext('experimental-webgl');
  if(!gl)return;
  function resize(){ canvas.width=canvas.offsetWidth; canvas.height=canvas.offsetHeight; gl.viewport(0,0,canvas.width,canvas.height); }
  resize(); window.addEventListener('resize',resize);
  const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs=`
    precision mediump float;
    uniform float t; uniform vec2 r;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float sn(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<7;i++){v+=a*sn(p);p=p*2.06+vec2(1.7,9.2);a*=.52;}return v;}
    vec2 swirl(vec2 p,float a,float power){
      float d=length(p);
      float s=sin(a+power/(d+.22));
      float c=cos(a+power/(d+.22));
      return mat2(c,-s,s,c)*p;
    }
    void main(){
      vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);
      p.x*=.82;
      float tm=t*.022;
      vec2 a=swirl(p+vec2(.18*sin(tm*.8),.10*cos(tm*.7)),tm*.28,1.05);
      vec2 b=swirl(p*1.22+vec2(.45,-.18),-tm*.22,.78);
      vec2 q=vec2(fbm(a*1.35+vec2(tm,-tm*.4)),fbm(b*1.12+vec2(-tm*.65,tm*.5)));
      vec2 flow=p+.74*sin(vec2(q.y,q.x)*6.283+vec2(tm*1.8,-tm*1.35));
      flow=swirl(flow+q*.32,tm*.18,.9);

      float river=flow.x*3.2+flow.y*2.35+fbm(flow*2.6+q*2.2)*3.4;
      float bands=sin(river*5.7);
      float fine=sin(river*15.5+fbm(flow*8.0-tm)*4.2);
      float contour=1.0-smoothstep(.035,.18,abs(bands));
      float hairline=1.0-smoothstep(.02,.075,abs(fine));
      float redMass=smoothstep(-.56,.72,bands+fbm(flow*3.1+tm)*.82);
      float blackPool=smoothstep(.18,.88,fbm(flow*1.55-q*1.4)-.08+abs(bands)*.22);

      vec3 deep=vec3(.018,0.,0.);
      vec3 darkRed=vec3(.18,.0,.0);
      vec3 hotRed=vec3(.95,.0,.0);
      vec3 c=mix(deep,darkRed,redMass);
      c=mix(c,hotRed,pow(redMass,4.0)*.55);
      c=mix(c,vec3(0.),blackPool*.82);
      c=mix(c,vec3(.02,0.,0.),contour*.92);
      c+=vec3(.85,.0,.0)*hairline*.18*(1.0-blackPool);

      float shine=smoothstep(.965,1.0,sin((flow.x-flow.y)*10.0+fbm(flow*6.0)*5.0));
      c+=vec3(1.0,.08,.04)*shine*.13;
      float vignette=smoothstep(1.02,.18,length(p));
      c*=mix(.48,1.06,vignette);
      gl_FragColor=vec4(c,1.);
    }`;
  function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  const prog=gl.createProgram();
  gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs));
  gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(prog);gl.useProgram(prog);
  const buf=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'p');
  gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uT=gl.getUniformLocation(prog,'t'),uR=gl.getUniformLocation(prog,'r');
  const start=performance.now();
  function draw(){gl.uniform1f(uT,(performance.now()-start)/1000);gl.uniform2f(uR,canvas.width,canvas.height);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);requestAnimationFrame(draw);}
  draw();
}

// ── THREE.JS BLACK TRIANGULAR SHAPES
function initThree(){
  const canvas=document.getElementById('threeCanvas');
  if(!canvas)return;
  if(typeof THREE==='undefined'){
    document.body.classList.add('no-three');
    return;
  }
  document.body.classList.remove('no-three');
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(60,canvas.offsetWidth/canvas.offsetHeight,0.1,100);
  camera.position.z=5;
  window.addEventListener('resize',()=>{renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);camera.aspect=canvas.offsetWidth/canvas.offsetHeight;camera.updateProjectionMatrix();});

  const aLight=new THREE.AmbientLight(0x120000,1.2);scene.add(aLight);
  const keyLight=new THREE.PointLight(0xff1a1a,4.5,14);keyLight.position.set(-3.5,2.5,3);scene.add(keyLight);
  const fillLight=new THREE.PointLight(0xcc0000,3.2,12);fillLight.position.set(4,-1.5,2.5);scene.add(fillLight);
  const rimLight=new THREE.PointLight(0xffffff,1.4,8);rimLight.position.set(0,3,3);scene.add(rimLight);

  const blackMat=new THREE.MeshPhysicalMaterial({
    color:0x030303,
    roughness:0.18,
    metalness:0.82,
    clearcoat:0.8,
    clearcoatRoughness:0.18,
    emissive:0x220000,
    emissiveIntensity:0.08
  });
  const redMat=new THREE.MeshPhysicalMaterial({
    color:0x160000,
    roughness:0.16,
    metalness:0.88,
    clearcoat:1,
    clearcoatRoughness:0.12,
    emissive:0x660000,
    emissiveIntensity:0.22
  });
  const geo=new THREE.TetrahedronGeometry(0.72,0);

  const leftGroup=new THREE.Group();leftGroup.position.set(-3.8,0,-1);
  const m1=new THREE.Mesh(geo,blackMat);m1.position.set(0,1.45,0);m1.scale.set(1.05,1.2,1.05);leftGroup.add(m1);
  const m2=new THREE.Mesh(geo,redMat);m2.position.set(0.22,-0.15,0);m2.scale.set(0.95,1.05,0.95);leftGroup.add(m2);
  const m3=new THREE.Mesh(geo,blackMat);m3.position.set(-0.1,-1.62,0);m3.scale.set(0.7,0.82,0.7);leftGroup.add(m3);
  scene.add(leftGroup);

  const rightGroup=new THREE.Group();rightGroup.position.set(3.8,0,-1);
  const m4=new THREE.Mesh(geo,redMat);m4.position.set(0,-1.42,0);m4.scale.set(0.88,1.02,0.88);rightGroup.add(m4);
  const m5=new THREE.Mesh(geo,blackMat);m5.position.set(-0.22,0.2,0);m5.scale.set(0.98,1.12,0.98);rightGroup.add(m5);
  const m6=new THREE.Mesh(geo,blackMat);m6.position.set(0.12,1.62,0);m6.scale.set(0.62,0.75,0.62);rightGroup.add(m6);
  scene.add(rightGroup);

  const allPyramids=[m1,m2,m3,m4,m5,m6];

  function layoutPyramids(){
    const mobile=window.innerWidth<=760;
    if(mobile){
      camera.position.z=6.2;
      leftGroup.position.x=-1.92;
      rightGroup.position.x=1.92;
      leftGroup.scale.setScalar(0.78);
      rightGroup.scale.setScalar(0.78);
    }else{
      camera.position.z=5;
      leftGroup.position.x=-3.8;
      rightGroup.position.x=3.8;
      leftGroup.scale.setScalar(1);
      rightGroup.scale.setScalar(1);
    }
  }
  layoutPyramids();
  window.addEventListener('resize',layoutPyramids);

  let tx=0,ty=0;
  document.addEventListener('mousemove',e=>{tx=(e.clientX/window.innerWidth-0.5)*0.4;ty=(e.clientY/window.innerHeight-0.5)*0.3;});

  const clock=new THREE.Clock();
  function animate(){
    const t=clock.getElapsedTime();
    allPyramids.forEach((mesh,i)=>{
      mesh.rotation.x=t*(0.105+i*0.012)+(i%2?0.6:0);
      mesh.rotation.y=t*(0.16+i*0.016);
      mesh.rotation.z=Math.sin(t*0.16+i)*0.12;
    });
    leftGroup.position.y=Math.sin(t*0.24)*0.22;
    rightGroup.position.y=Math.sin(t*0.24+Math.PI)*0.22;
    leftGroup.rotation.y+=(tx*0.38-leftGroup.rotation.y)*0.035;
    leftGroup.rotation.x+=(ty*0.22-leftGroup.rotation.x)*0.035;
    rightGroup.rotation.y+=(tx*0.38-rightGroup.rotation.y)*0.035;
    rightGroup.rotation.x+=(ty*0.22-rightGroup.rotation.x)*0.035;
    keyLight.position.x=-3.5+Math.sin(t*0.34)*0.8;
    keyLight.position.y=2.2+Math.cos(t*0.3)*0.5;
    fillLight.position.x=4+Math.cos(t*0.28)*0.7;
    keyLight.intensity=3.8+Math.sin(t*0.7)*0.7;
    fillLight.intensity=2.5+Math.sin(t*0.58+1)*0.5;
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }
  animate();
}

// ── RED LIGHTNING SPARKS
function initLightning(){
  const canvas=document.getElementById('lightningCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  resize(); window.addEventListener('resize',resize);

  const bolts=[];
  const MAX_BOLTS=4;

  function randomBolt(){
    const x=Math.random()*canvas.width;
    const y=Math.random()*canvas.height*0.72;
    const len=150+Math.random()*220;
    const angle=-Math.PI/2+( Math.random()-0.5)*0.58;
    const branches=[];
    let cx=x,cy=y;
    const segs=6+Math.floor(Math.random()*5);
    for(let i=0;i<segs;i++){
      const nx=cx+(Math.random()-0.5)*42+Math.cos(angle)*len/segs;
      const ny=cy+(Math.random()-0.5)*28+Math.sin(angle)*len/segs;
      branches.push({x1:cx,y1:cy,x2:nx,y2:ny});
      if(Math.random()<0.24){
        const bx=nx+(Math.random()-0.5)*68;
        const by=ny+Math.random()*56;
        branches.push({x1:nx,y1:ny,x2:bx,y2:by,branch:true});
      }
      cx=nx;cy=ny;
    }
    return{branches,life:1,decay:0.007+Math.random()*0.01,flicker:Math.random()<0.35};
  }

  // Spawn bolts randomly
  function maybeSpawn(){
    if(bolts.length<MAX_BOLTS&&Math.random()<0.16){
      bolts.push(randomBolt());
    }
    setTimeout(maybeSpawn,420+Math.random()*620);
  }
  bolts.push(randomBolt());
  maybeSpawn();

  function drawFrame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=bolts.length-1;i>=0;i--){
      const bolt=bolts[i];
      if(bolt.flicker&&Math.random()<0.12){bolt.life-=0.003;}
      const alpha=bolt.life*(0.24+Math.random()*0.08);
      bolt.branches.forEach(seg=>{
        const w=seg.branch?0.7:1.8;
        const mx=(seg.x1+seg.x2)*0.5+(Math.random()-0.5)*18;
        const my=(seg.y1+seg.y2)*0.5+(Math.random()-0.5)*18;
        ctx.beginPath();
        ctx.moveTo(seg.x1,seg.y1);
        ctx.quadraticCurveTo(mx,my,seg.x2,seg.y2);
        ctx.strokeStyle=`rgba(255,18,18,${alpha})`;
        ctx.lineWidth=w;
        ctx.lineCap='round';
        ctx.shadowColor='#ff0000';
        ctx.shadowBlur=seg.branch?8:20;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(seg.x1,seg.y1);
        ctx.quadraticCurveTo(mx,my,seg.x2,seg.y2);
        ctx.strokeStyle=`rgba(255,105,105,${alpha*0.22})`;
        ctx.lineWidth=w*0.26;
        ctx.shadowBlur=3;
        ctx.stroke();
      });
      bolt.life-=bolt.decay;
      if(bolt.life<=0) bolts.splice(i,1);
    }
    requestAnimationFrame(drawFrame);
  }
  drawFrame();
}
