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
let mx=0, my=0, ox=0, oy=0;
const trail = Array.from({length:24},()=>({x:0,y:0}));

function resizeTrail(){ trailCanvas.width=window.innerWidth; trailCanvas.height=window.innerHeight; }
resizeTrail(); window.addEventListener('resize', resizeTrail);

document.addEventListener('mousemove', e => {
  mx=e.clientX; my=e.clientY;
  cInner.style.left=mx+'px'; cInner.style.top=my+'px';
});
function animCursor() {
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
animCursor();
document.querySelectorAll('a,button,.album-card,.service-card,.contact-link').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('cur-hover'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('cur-hover'));
});

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

function renderWheel(){
  slotEls.forEach((el,i)=>{
    const imgIdx=(albumIdx+i-2+albumImages.length*10)%albumImages.length;
    el.querySelector('img').src=albumImages[imgIdx];
    el.style.transform=slotTransforms[i];
    el.style.opacity=slotOpacity[i];
    el.style.filter=slotFilter[i];
    el.style.zIndex=i===2?10:5-Math.abs(i-2);
    el.style.transition='transform 0.62s cubic-bezier(.16,1,.3,1), opacity 0.62s ease, filter 0.62s ease';
  });
  albumCount.textContent=`${albumIdx+1} / ${albumImages.length}`;
}
function spinAlbum(dir){
  if(!albumImages.length||wheelLocked)return;
  wheelLocked=true;
  albumIdx=(albumIdx+dir+albumImages.length)%albumImages.length;
  renderWheel();
  setTimeout(()=>{wheelLocked=false;},620);
}

function openAlbum(card){
  albumImages=card.dataset.images.split('|');
  albumTitle.textContent=card.dataset.title;
  albumIdx=0;
  renderWheel();
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
  wheelDelta+=Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX;
  if(Math.abs(wheelDelta)<18||wheelLocked)return;
  spinAlbum(wheelDelta>0?1:-1);
  wheelDelta=0;
},{passive:false});

// Wheel drag
let dragStart=null;
albumStage.addEventListener('mousedown',e=>{dragStart=e.clientY;});
albumStage.addEventListener('mousemove',e=>{ if(dragStart===null)return; if(Math.abs(e.clientY-dragStart)>40){ spinAlbum(e.clientY<dragStart?1:-1); dragStart=e.clientY; }});
albumStage.addEventListener('mouseup',()=>{dragStart=null;});
albumStage.addEventListener('touchstart',e=>{dragStart=e.touches[0].clientY;},{passive:true});
albumStage.addEventListener('touchmove',e=>{ if(dragStart===null)return; if(Math.abs(e.touches[0].clientY-dragStart)>40){ spinAlbum(e.touches[0].clientY<dragStart?1:-1); dragStart=e.touches[0].clientY; }},{passive:true});
albumStage.addEventListener('touchend',()=>{dragStart=null;});

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
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<7;i++){v+=a*sn(p);p=p*2.1+vec2(1.7,9.2);a*=.5;}return v;}
    void main(){
      vec2 uv=gl_FragCoord.xy/r; uv.y=1.-uv.y;
      float tm=t*.03;
      vec2 q=vec2(fbm(uv+tm),fbm(uv+vec2(1.,tm)));
      vec2 rr=vec2(fbm(uv+3.*q+vec2(1.7,9.2)+.15*tm),fbm(uv+3.*q+vec2(8.3,2.8)+.126*tm));
      float f=fbm(uv+3.5*rr);
      vec3 c=mix(vec3(0),vec3(.25,.0,.0),clamp(f*f*3.,0.,1.));
      c=mix(c,vec3(.42,.0,.0),clamp(length(q)*.55,0.,1.));
      c=mix(c,vec3(.06,.0,.0),clamp(length(rr.x),0.,1.));
      c*=.58;
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
  if(!canvas||typeof THREE==='undefined')return;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);
  renderer.setClearColor(0x000000,0);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(60,canvas.offsetWidth/canvas.offsetHeight,0.1,100);
  camera.position.z=5;
  window.addEventListener('resize',()=>{renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);camera.aspect=canvas.offsetWidth/canvas.offsetHeight;camera.updateProjectionMatrix();});

  const aLight=new THREE.AmbientLight(0x030000,2);scene.add(aLight);
  const rL1=new THREE.PointLight(0xff0000,3,12);rL1.position.set(-4,2,2);scene.add(rL1);
  const rL2=new THREE.PointLight(0xcc0000,2,10);rL2.position.set(4,-2,2);scene.add(rL2);

  function blackMat(){return new THREE.MeshStandardMaterial({color:0x020202,roughness:0.12,metalness:0.95});}

  function triPrism(size,height){
    const shape=new THREE.Shape();
    shape.moveTo(0,-size);shape.lineTo(size*0.866,size*0.5);shape.lineTo(-size*0.866,size*0.5);shape.closePath();
    return new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelThickness:0.04,bevelSize:0.04,bevelSegments:2});
  }

  const leftGroup=new THREE.Group();leftGroup.position.set(-3.8,0,-1);
  const m1=new THREE.Mesh(triPrism(0.55,0.9),blackMat());m1.position.set(0,1.4,0);leftGroup.add(m1);
  const m2=new THREE.Mesh(new THREE.TetrahedronGeometry(0.65,0),blackMat());m2.position.set(0.2,-0.2,0);leftGroup.add(m2);
  const m3=new THREE.Mesh(new THREE.OctahedronGeometry(0.42,0),blackMat());m3.position.set(-0.1,-1.6,0);leftGroup.add(m3);
  scene.add(leftGroup);

  const rightGroup=new THREE.Group();rightGroup.position.set(3.8,0,-1);
  const m4=new THREE.Mesh(triPrism(0.5,0.8),blackMat());m4.position.set(0,-1.4,0);rightGroup.add(m4);
  const m5=new THREE.Mesh(new THREE.TetrahedronGeometry(0.6,0),blackMat());m5.position.set(-0.2,0.2,0);rightGroup.add(m5);
  const m6=new THREE.Mesh(new THREE.OctahedronGeometry(0.38,0),blackMat());m6.position.set(0.1,1.6,0);rightGroup.add(m6);
  scene.add(rightGroup);

  let tx=0,ty=0;
  document.addEventListener('mousemove',e=>{tx=(e.clientX/window.innerWidth-0.5)*0.4;ty=(e.clientY/window.innerHeight-0.5)*0.3;});

  const clock=new THREE.Clock();
  function animate(){
    const t=clock.getElapsedTime();
    m1.rotation.x=t*0.4;m1.rotation.y=t*0.6;
    m2.rotation.x=t*0.5;m2.rotation.z=t*0.7;
    m3.rotation.x=t*0.3;m3.rotation.y=t*0.8;
    m4.rotation.x=-t*0.45;m4.rotation.y=t*0.55;
    m5.rotation.y=-t*0.6;m5.rotation.z=t*0.4;
    m6.rotation.x=-t*0.35;m6.rotation.z=t*0.7;
    leftGroup.position.y=Math.sin(t*0.5)*0.3;
    rightGroup.position.y=Math.sin(t*0.5+Math.PI)*0.3;
    leftGroup.rotation.y+=(tx*0.5-leftGroup.rotation.y)*0.05;
    leftGroup.rotation.x+=(ty*0.3-leftGroup.rotation.x)*0.05;
    rightGroup.rotation.y+=(tx*0.5-rightGroup.rotation.y)*0.05;
    rightGroup.rotation.x+=(ty*0.3-rightGroup.rotation.x)*0.05;
    rL1.intensity=2.5+Math.sin(t*2)*0.8;
    rL2.intensity=1.8+Math.sin(t*2+1)*0.6;
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
  const MAX_BOLTS=8;

  function randomBolt(){
    const x=Math.random()*canvas.width;
    const y=Math.random()*canvas.height*0.8;
    const len=40+Math.random()*120;
    const angle=-Math.PI/2+( Math.random()-0.5)*1.2;
    const branches=[];
    let cx=x,cy=y;
    const segs=4+Math.floor(Math.random()*5);
    for(let i=0;i<segs;i++){
      const nx=cx+(Math.random()-0.5)*30+Math.cos(angle)*len/segs;
      const ny=cy+(Math.random()-0.5)*20+Math.sin(angle)*len/segs;
      branches.push({x1:cx,y1:cy,x2:nx,y2:ny});
      if(Math.random()<0.35){
        const bx=nx+(Math.random()-0.5)*40;
        const by=ny+Math.random()*30;
        branches.push({x1:nx,y1:ny,x2:bx,y2:by,branch:true});
      }
      cx=nx;cy=ny;
    }
    return{branches,life:1,decay:0.04+Math.random()*0.06,flicker:Math.random()<0.4};
  }

  // Spawn bolts randomly
  function maybeSpawn(){
    if(bolts.length<MAX_BOLTS&&Math.random()<0.12){
      bolts.push(randomBolt());
    }
    setTimeout(maybeSpawn,80+Math.random()*200);
  }
  for(let i=0;i<3;i++) bolts.push(randomBolt());
  maybeSpawn();

  function drawFrame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let i=bolts.length-1;i>=0;i--){
      const bolt=bolts[i];
      if(bolt.flicker&&Math.random()<0.3){bolt.life-=0.01;}
      const alpha=bolt.life*(0.6+Math.random()*0.2);
      bolt.branches.forEach(seg=>{
        const w=seg.branch?0.5:1.2;
        ctx.beginPath();
        ctx.moveTo(seg.x1,seg.y1);
        ctx.lineTo(seg.x2,seg.y2);
        ctx.strokeStyle=`rgba(245,0,0,${alpha})`;
        ctx.lineWidth=w;
        ctx.lineCap='round';
        ctx.shadowColor='#ff0000';
        ctx.shadowBlur=seg.branch?4:10;
        ctx.stroke();
        // White hot core
        ctx.beginPath();
        ctx.moveTo(seg.x1,seg.y1);
        ctx.lineTo(seg.x2,seg.y2);
        ctx.strokeStyle=`rgba(255,200,200,${alpha*0.4})`;
        ctx.lineWidth=w*0.4;
        ctx.shadowBlur=2;
        ctx.stroke();
      });
      bolt.life-=bolt.decay;
      if(bolt.life<=0) bolts.splice(i,1);
    }
    requestAnimationFrame(drawFrame);
  }
  drawFrame();
}
