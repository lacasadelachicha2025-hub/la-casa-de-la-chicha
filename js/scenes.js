/* ═══════════════════════════════════════════════════════════════
   SCENES — All Three.js 3D Scenes (Lazy-loaded via IntersectionObserver)
   Hero · About · Menu Cards · Immersive · Chef · Gallery
   Promo 3D · Showcase Interactive Vessel

   Uses SM (Scene Manager) to init/dispose renderers based on
   viewport visibility, keeping active WebGL contexts ≤ 8.
   ═══════════════════════════════════════════════════════════════ */

/* ── Scene Manager ── */
const SM = (() => {
  const reg = new Map();
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const id = e.target.dataset.sid;
      if (!id) return;
      e.isIntersecting ? init(id) : kill(id);
    });
  }, { rootMargin: '400px 0px' });

  function add(id, el, factory, opts = {}) {
    if (!el) return;
    el.dataset.sid = id;
    reg.set(id, { factory, inst: null, keepAlive: !!opts.keepAlive });
    obs.observe(el);
  }
  function init(id) {
    const s = reg.get(id);
    if (!s || s.inst) return;
    try { s.inst = s.factory(); } catch (e) { console.warn('Scene init:', id, e); }
  }
  function kill(id) {
    const s = reg.get(id);
    if (!s || !s.inst) return;
    if (s.keepAlive) return;
    if (s.inst.kill) s.inst.kill();
    s.inst = null;
  }
  return { add };
})();

/* ── Dispose helper ── */
function disposeR(r) {
  if (!r) return;
  const c = r.domElement;
  r.dispose();
  if (r.forceContextLoss) r.forceContextLoss();
  if (c && c.parentElement) {
    const clone = c.cloneNode();
    c.replaceWith(clone);
  }
}


// ════════════════════════════════════════
// HERO — Liquid Waves Chicha Effect
// ════════════════════════════════════════
SM.add('hero', $('#hc') && $('#hc').parentElement, () => {
  const cv = $('#hc'), P = cv.parentElement;
  const W = () => P.offsetWidth, H = () => P.offsetHeight;
  const rend = mkR(cv, false); rend.setSize(W(), H());
  rend.setClearColor(0xFFFBF2, 1); // Fondo Crema base
  const scene = new THREE.Scene(), cam = mkC(75, W(), H(), 10);
  cam.position.z = 5;

  // Shader para Olas Líquidas Suaves (Cream & Cinnamon)
  const uniforms = {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color(0xFFFBF2) }, // Crema muy claro
    uColor2: { value: new THREE.Color(0xE8DCCA) }, // Arroz con leche (beige)
    uColor3: { value: new THREE.Color(0xD2691E) }, // Canela vibrante
    uColor4: { value: new THREE.Color(0x8B4513) }, // Canela oscura
  };

  const geo = new THREE.PlaneGeometry(30, 20, 128, 128); // Malla densa para las olas
  const mat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      varying vec2 vUv;
      varying float vElev;
      uniform float uTime;
      
      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vUv = uv;
        // Olas suaves lentas
        float noise = snoise(uv * 3.0 + uTime * 0.1); 
        // Olas de detalle rapido
        float noise2 = snoise(uv * 8.0 - uTime * 0.15) * 0.15;
        
        vElev = noise + noise2;
        
        vec3 pos = position;
        pos.z += vElev * 1.5; // Altura de ola
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vElev;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uColor4;

      void main() {
        // Mezclar colores basado en la altura de la ola (vElev va aprox de -1 a 1)
        float mixStr = smoothstep(-0.8, 0.8, vElev);
        
        // Base: Crema -> Beige
        vec3 baseColor = mix(uColor1, uColor2, vUv.y + 0.2); 
        
        // Agregar ondas de Canela en los picos/valles
        vec3 finalColor = mix(baseColor, uColor3, mixStr * 0.4);
        
        // Toques oscuros de especias
        finalColor = mix(finalColor, uColor4, smoothstep(0.6, 1.0, vElev) * 0.3);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
    wireframe: false
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -0.5; // Inclinar un poco para ver profundidad
  scene.add(mesh);

  // Partículas sutiles flotando (Canela en polvo)
  const pGeo = new THREE.BufferGeometry();
  const pCount = 200;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount * 3; i++) {
    pPos[i] = (Math.random() - 0.5) * 15;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x8B4513,
    size: 0.05,
    transparent: true,
    opacity: 0.6
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  let t = 0, raf;
  (function a() {
    t += 0.005;
    uniforms.uTime.value = t;
    particles.rotation.y = t * 0.05;
    particles.position.y = Math.sin(t * 0.5) * 0.5;

    // Movimiento suave de camara con mouse
    cam.position.x += ((MX / innerWidth - 0.5) * 1.0 - cam.position.x) * 0.05;
    cam.position.y += ((MY / innerHeight - 0.5) * 0.5 - cam.position.y) * 0.05;
    cam.lookAt(0, 0, 0);

    raf = requestAnimationFrame(a);
    rend.render(scene, cam);
  })();

  const onRz = () => { rend.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); };
  window.addEventListener('resize', onRz);
  return { kill() { cancelAnimationFrame(raf); window.removeEventListener('resize', onRz); disposeR(rend); } };
});

// ════════════════════════════════════════
// ABOUT — Removed (Static Image used now)
// ════════════════════════════════════════

// ════════════════════════════════════════
// ════════════════════════════════════════
// MENU CARDS — Removed (Static Images used now)
// ════════════════════════════════════════

// ════════════════════════════════════════
// IMMERSIVE — Volumetric Plasma Shader
// ════════════════════════════════════════
SM.add('immersive', $('#ic') && $('#ic').parentElement, () => {
  const cv = $('#ic');
  const rend = mkR(cv, false); rend.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene(), cam = mkC(75, innerWidth, innerHeight, 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uM: { value: new THREE.Vector2(.5, .5) } },
    vertexShader: `
      uniform float uT;varying vec2 vUv;varying float vE;
      float sn(vec3 p){return sin(p.x*2.+uT)*sin(p.y*2.5+uT*.8)*cos(p.z*1.8+uT*.6);}
      void main(){vUv=uv;vec3 pos=position;float n=sn(pos*1.1)*.28+sn(pos*2.5+.7)*.12+sn(pos*5.+1.3)*.05;pos.z+=n;vE=n;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);}
    `,
    fragmentShader: `
      uniform float uT;uniform vec2 uM;varying vec2 vUv;varying float vE;
      void main(){
        float e=(vE+.32)/.64;
        vec3 col=mix(vec3(.03,.06,.14),mix(vec3(.10,.25,.50),vec3(.29,.56,.82),e),smoothstep(.05,.95,e));
        col+=sin(vUv.y*80.+uT*2.)*.025*vec3(.1,.25,.5);
        vec2 cm=vUv-uM;col+=vec3(.3,.56,.85)*exp(-length(cm)*4.)*.15;
        gl_FragColor=vec4(col,1.);
      }
    `
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 8, 300, 300), mat);
  plane.rotation.x = -.45; scene.add(plane);
  const orbs = []; for (let i = 0; i < 12; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(.08 + Math.random() * .1, 12, 12), new THREE.MeshBasicMaterial({ color: 0x4A90D9, transparent: true, opacity: .1, blending: THREE.AdditiveBlending })); o.position.set((Math.random() - .5) * 7, (Math.random() - .5) * 2, Math.random() * -1); o.userData = { vx: (Math.random() - .5) * .003, vy: (Math.random() - .5) * .004 }; scene.add(o); orbs.push(o); }
  let t = 0, raf;
  (function a() {
    t += .005; mat.uniforms.uT.value = t; mat.uniforms.uM.value.lerp(new THREE.Vector2(MX / innerWidth, 1 - MY / innerHeight), .04); orbs.forEach(o => { o.position.x += o.userData.vx; o.position.y += o.userData.vy; if (Math.abs(o.position.x) > 3.5) o.userData.vx *= -1; if (Math.abs(o.position.y) > 1.5) o.userData.vy *= -1; });
    cam.position.x += ((MX / innerWidth - .5) * .3 - cam.position.x) * .03; cam.position.y += ((MY / innerHeight - .5) * -.2 - cam.position.y) * .03; cam.lookAt(0, 0, 0); raf = requestAnimationFrame(a); rend.render(scene, cam);
  })();
  const onRz = () => { rend.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  window.addEventListener('resize', onRz);
  return { kill() { cancelAnimationFrame(raf); window.removeEventListener('resize', onRz); disposeR(rend); } };
});

// ════════════════════════════════════════
// CHEF SCENE
// ════════════════════════════════════════
SM.add('chef', $('#cc') && $('#cc').parentElement, () => {
  const cv = $('#cc'), P = cv.parentElement;
  const W = () => P.offsetWidth, H = () => P.offsetHeight;
  const rend = mkR(cv, false); rend.setSize(W(), H()); rend.setClearColor(0x0e2a6b, 1);
  const scene = new THREE.Scene(), cam = mkC(50, W(), H(), 6); lgts(scene, 0xe8b060, 0x8b4513);
  const iG = new THREE.IcosahedronGeometry(1.5, 2);
  const ctr = new THREE.Mesh(iG, new THREE.MeshStandardMaterial({ color: 0x3d2418, roughness: .8, metalness: .05, transparent: true, opacity: .9 })); scene.add(ctr);
  const cW = new THREE.Mesh(iG, new THREE.MeshBasicMaterial({ color: 0xd4943a, wireframe: true, transparent: true, opacity: .15 })); cW.scale.setScalar(1.02); scene.add(cW);
  const orb1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, .04, 4, 80), new THREE.MeshBasicMaterial({ color: 0xd4943a, transparent: true, opacity: .3 })); orb1.rotation.x = .5; scene.add(orb1);
  const orb2 = new THREE.Mesh(new THREE.TorusGeometry(3, .02, 4, 80), new THREE.MeshBasicMaterial({ color: 0x8b4513, transparent: true, opacity: .2 })); orb2.rotation.x = 1.2; orb2.rotation.y = .4; scene.add(orb2);
  const pG = new THREE.BufferGeometry(), pp = [];
  for (let i = 0; i < 600; i++) { const a = i / 600 * Math.PI * 2, r = 2. + Math.sin(a * 8) * .3 + Math.sin(a * 4) * .2; pp.push(r * Math.cos(a), r * Math.sin(a), 0); }
  pG.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  scene.add(new THREE.Points(pG, new THREE.PointsMaterial({ color: 0xd4943a, size: .03, transparent: true, opacity: .5 })));
  const hG = new THREE.BufferGeometry(), hP = []; for (let i = 0; i < 1000; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * .8; hP.push(r * Math.cos(a) * 4, (Math.random() - .5) * 4, r * Math.sin(a) * 4); }
  hG.setAttribute('position', new THREE.Float32BufferAttribute(hP, 3)); scene.add(new THREE.Points(hG, new THREE.PointsMaterial({ color: 0xd4943a, size: .018, transparent: true, opacity: .3, blending: THREE.AdditiveBlending })));
  let t = 0, raf;
  (function a() { t += .006; ctr.rotation.y = t * .3; ctr.rotation.x = Math.sin(t * .2) * .15; cW.rotation.y = t * .3; cW.rotation.x = Math.sin(t * .2) * .15; orb1.rotation.y = t * .25; orb1.rotation.z = t * .1; orb2.rotation.x = t * .15; orb2.rotation.z = -t * .08; cam.position.x += ((MX / innerWidth - .5) * .5 - cam.position.x) * .02; cam.position.y += ((MY / innerHeight - .5) * -.4 - cam.position.y) * .02; cam.lookAt(0, 0, 0); raf = requestAnimationFrame(a); rend.render(scene, cam); })();
  const onRz = () => { rend.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); };
  window.addEventListener('resize', onRz);
  return { kill() { cancelAnimationFrame(raf); window.removeEventListener('resize', onRz); disposeR(rend); } };
});

// ════════════════════════════════════════
// GALLERY SCENES — 7 Items (grouped)
// ════════════════════════════════════════
SM.add('gallery', document.querySelector('#gallery'), () => {
  const kills = [];
  [{ id: 'g1', c: 0x3d2418, a: 0xd4943a, s: 'vessel', bg: 0x0e2a6b }, { id: 'g2', c: 0x2a1810, a: 0xe8b060, s: 'cube', bg: 0x0e2a6b }, { id: 'g3', c: 0x3d2418, a: 0xc47a2a, s: 'torus', bg: 0x0e2a6b }, { id: 'g4', c: 0x2a1810, a: 0xd4943a, s: 'diamond', bg: 0x0e2a6b }, { id: 'g5', c: 0x3d2418, a: 0xe8b060, s: 'helix', bg: 0x0e2a6b }, { id: 'g6', c: 0x2a1810, a: 0xd4943a, s: 'ring', bg: 0x0e2a6b }, { id: 'g7', c: 0x3d2418, a: 0xc47a2a, s: 'icosa', bg: 0x0e2a6b }
  ].forEach(({ id, c, a, s, bg }) => {
    const cv = $('#' + id); if (!cv) return;
    const W = cv.parentElement.offsetWidth || 200, H = cv.parentElement.offsetHeight || 200;
    const rend = mkR(cv, false); rend.setSize(W, H); rend.setClearColor(bg, 1);
    const scene = new THREE.Scene(), cam = mkC(50, W, H, 4);
    scene.add(new THREE.AmbientLight(0x0A1525, .3)); const pl = new THREE.PointLight(a, 5, 10); pl.position.set(2, 2, 2); scene.add(pl); const pl2g = new THREE.PointLight(c, 3, 8); pl2g.position.set(-2, -1, 0); scene.add(pl2g);
    const mat = new THREE.MeshStandardMaterial({ color: c, metalness: .4, roughness: .4 }); const wm = new THREE.MeshBasicMaterial({ color: a, wireframe: true, transparent: true, opacity: .14 });
    let mesh;
    if (s === 'vessel') { const pts = [[0, -1.8], [.45, -1.3], [.75, -.4], [.88, .5], [.7, 1.2], [.4, 1.6], [.18, 1.9]].map(p => new THREE.Vector2(...p)); mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat); }
    else if (s === 'cube') mesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4, 4, 4, 4), mat);
    else if (s === 'torus') mesh = new THREE.Mesh(new THREE.TorusGeometry(.9, .3, 16, 80), mat);
    else if (s === 'diamond') mesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), mat);
    else if (s === 'helix') { const hg = new THREE.BufferGeometry(), hp = []; for (let i = 0; i < 300; i++) { const ang = i * .16; hp.push(.9 * Math.cos(ang), i * .013 - 2, .9 * Math.sin(ang)); } hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); mesh = new THREE.Line(hg, new THREE.LineBasicMaterial({ color: a, transparent: true, opacity: .8 })); }
    else if (s === 'ring') mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(.65, .2, 120, 16, 3, 5), mat);
    else mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat);
    const wire = new THREE.Mesh(mesh.geometry || new THREE.SphereGeometry(.01), wm); wire.scale.setScalar(1.05); scene.add(mesh, wire);
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), new THREE.MeshBasicMaterial({ color: a, transparent: true, opacity: .03, side: THREE.BackSide })));
    let t = Math.random() * 100, raf;
    (function lp() { t += .01; if (mesh.rotation) { mesh.rotation.y = t * .45; mesh.rotation.x = Math.sin(t * .3) * .3; } if (wire.rotation) { wire.rotation.y = t * .45; wire.rotation.x = Math.sin(t * .3) * .3; } pl.position.set(2 * Math.sin(t), 2 * Math.cos(t * .7), 2); raf = requestAnimationFrame(lp); rend.render(scene, cam); })();
    kills.push(() => { cancelAnimationFrame(raf); disposeR(rend); });
  });
  return { kill() { kills.forEach(fn => fn()); } };
});

// ════════════════════════════════════════
// PROMO 3D — Premium Product Card Scene
// ════════════════════════════════════════
SM.add('promo3d', $('#promo-cv') && $('#promo-cv').parentElement, () => {
  const cv = $('#promo-cv');
  if (!cv) return { kill() { } };
  const P = cv.parentElement;
  const W = () => P.offsetWidth || 420, H = () => P.offsetHeight || 340;
  const rend = mkR(cv, false); rend.setSize(W(), H());
  rend.setClearColor(0x0e2a6b, 1);
  rend.toneMapping = THREE.ACESFilmicToneMapping;
  rend.toneMappingExposure = 1.4;
  const scene = new THREE.Scene(), cam = mkC(40, W(), H(), 7);
  cam.position.y = 0.3;

  // Dramatic lighting
  scene.add(new THREE.AmbientLight(0x2a1810, .6));
  const key = new THREE.DirectionalLight(0xe8b060, 3.5); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.PointLight(0xd4943a, 6, 15); rim.position.set(-4, 2, -2); scene.add(rim);
  const accent = new THREE.PointLight(0x8b4513, 4, 10); accent.position.set(2, -3, 3); scene.add(accent);
  const topL = new THREE.PointLight(0xfdf3e7, 3, 8); topL.position.set(0, 6, 0); scene.add(topL);

  // Premium Venezuelan vessel
  const vPts = [[0, -2.4], [.2, -2.3], [.65, -1.9], [1.05, -1.15], [1.22, -.35], [1.26, .3], [1.2, .95], [1.08, 1.55], [.88, 2.05], [.65, 2.42], [.45, 2.68], [.28, 2.88], [.12, 3.0]].map(p => new THREE.Vector2(...p));
  const vG = new THREE.LatheGeometry(vPts, 96);
  const vMat = new THREE.MeshStandardMaterial({ color: 0x3d2418, roughness: .65, metalness: .15, side: THREE.DoubleSide });
  const vsl = new THREE.Mesh(vG, vMat); vsl.scale.setScalar(.55); scene.add(vsl);

  const vW = new THREE.Mesh(vG, new THREE.MeshBasicMaterial({ color: 0xd4943a, wireframe: true, transparent: true, opacity: .08 }));
  vW.scale.setScalar(.56); scene.add(vW);

  // Gold engravings
  [-.4, .2, .7, 1.2, 1.7].forEach((y, i) => {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(.73 + Math.sin(i) * .02, .025 - i * .002, 8, 96),
      new THREE.MeshStandardMaterial({ color: 0xd4943a, metalness: .9, roughness: .1, emissive: 0xd4943a, emissiveIntensity: .15 })
    );
    r.rotation.x = Math.PI / 2; r.position.y = y * .55; r.scale.setScalar(.55); scene.add(r);
  });

  // Geometric pattern
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    const dot = new THREE.Mesh(
      new THREE.OctahedronGeometry(.03, 0),
      new THREE.MeshStandardMaterial({ color: 0xd4943a, metalness: .95, roughness: .05, emissive: 0xe8b060, emissiveIntensity: .3 })
    );
    const row = i % 2 === 0 ? .35 : .75;
    dot.position.set(Math.cos(ang) * .72, row * .55, Math.sin(ang) * .72);
    dot.scale.setScalar(.55); scene.add(dot);
  }

  // Liquid
  const lG = new THREE.CylinderGeometry(.62, .52, .15, 96);
  const liq = new THREE.Mesh(lG, new THREE.MeshStandardMaterial({
    color: 0xd4943a, transparent: true, opacity: .94, metalness: .2, roughness: .02,
    emissive: 0x8b4513, emissiveIntensity: .4
  }));
  liq.position.y = .30; liq.scale.setScalar(.55); scene.add(liq);

  // Steam
  const sG = new THREE.BufferGeometry(), sP = [];
  for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * .25; sP.push(r * Math.cos(a), 1.8 + Math.random() * 1.5, r * Math.sin(a)); }
  sG.setAttribute('position', new THREE.Float32BufferAttribute(sP, 3));
  const steamP = new THREE.Points(sG, new THREE.PointsMaterial({ color: 0xfdf3e7, size: .04, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false }));
  steamP.scale.setScalar(.55); scene.add(steamP);

  // Floating particles
  const pG = new THREE.BufferGeometry(), pP = [];
  for (let i = 0; i < 300; i++) { const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 1.5; pP.push(r * Math.cos(a), (Math.random() - .5) * 4, r * Math.sin(a)); }
  pG.setAttribute('position', new THREE.Float32BufferAttribute(pP, 3));
  scene.add(new THREE.Points(pG, new THREE.PointsMaterial({ color: 0xd4943a, size: .02, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false })));

  // Orbiting rings
  const oR = new THREE.Mesh(new THREE.TorusGeometry(2, .015, 4, 80), new THREE.MeshBasicMaterial({ color: 0xd4943a, transparent: true, opacity: .2 }));
  oR.rotation.x = .4; scene.add(oR);
  const oR2 = new THREE.Mesh(new THREE.TorusGeometry(2.5, .01, 4, 80), new THREE.MeshBasicMaterial({ color: 0x8b4513, transparent: true, opacity: .1 }));
  oR2.rotation.x = 1; oR2.rotation.y = .5; scene.add(oR2);

  // Bottom glow
  const gCv = document.createElement('canvas'); gCv.width = gCv.height = 256;
  const gCtx = gCv.getContext('2d');
  const gGr = gCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gGr.addColorStop(0, 'rgba(240,184,48,.35)'); gGr.addColorStop(1, 'rgba(0,0,0,0)');
  gCtx.fillStyle = gGr; gCtx.fillRect(0, 0, 256, 256);
  const gSp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(gCv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  gSp.scale.set(4, 4, 1); gSp.position.y = -1.5; scene.add(gSp);

  let t = 0, raf;
  (function a() {
    t += .006;
    vsl.rotation.y = t * .5; vW.rotation.y = t * .5; liq.rotation.y = t;
    oR.rotation.z = t * .15; oR2.rotation.z = -t * .1;
    vsl.position.y = Math.sin(t * .8) * .06;
    vW.position.y = vsl.position.y;
    liq.position.y = .30 + Math.sin(t * .8) * .06;
    const sv = sG.attributes.position;
    for (let i = 0; i < sv.count; i++) {
      let y = sv.getY(i) + .008;
      let x = sv.getX(i) + Math.sin(t + i) * .001;
      if (y > 3) { y = 1.8; x = (Math.random() - .5) * .3; }
      sv.setY(i, y); sv.setX(i, x);
    }
    sv.needsUpdate = true;
    rim.position.x = Math.sin(t * .3) * 4;
    rim.position.z = Math.cos(t * .3) * 3;
    raf = requestAnimationFrame(a); rend.render(scene, cam);
  })();
  const onRz = () => { rend.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); };
  window.addEventListener('resize', onRz);
  return { kill() { cancelAnimationFrame(raf); window.removeEventListener('resize', onRz); disposeR(rend); } };
});

// PROMO CARD 3D — Mouse Parallax (no WebGL — always active)
(function () {
  const card = $('#promoCard3d');
  if (!card) return;
  const container = card.parentElement;
  container.addEventListener('mousemove', e => {
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - .5;
    const y = (e.clientY - rect.top) / rect.height - .5;
    card.style.transform = `translateY(${Math.sin(Date.now() * .001) * 15}px) rotateY(${x * 15}deg) rotateX(${-y * 10}deg)`;
  });
  container.addEventListener('mouseleave', () => {
    card.style.transition = 'transform .6s var(--ease)';
    card.style.transform = '';
    setTimeout(() => card.style.transition = '', 600);
  });
  container.addEventListener('mouseenter', () => {
    card.style.transition = 'none';
  });
})();

// ════════════════════════════════════════
// SHOWCASE — Interactive 3D Chicha Vessel
// ════════════════════════════════════════
SM.add('showcase', $('#showcase-canvas') && $('#showcase-canvas').parentElement, () => {
  const ac = new AbortController();
  const sig = ac.signal;

  const canvas = $('#showcase-canvas');
  const wrap = canvas.parentElement;
  const W = () => wrap.offsetWidth;
  const H = () => wrap.offsetHeight;

  const renderer = mkR(canvas, false);
  renderer.setSize(W(), H());
  renderer.setClearColor(0x0e2a6b, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const camera = mkC(45, W(), H(), 6.5);
  camera.position.y = 0.3;

  // ── LIGHTS ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(4, 6, 4);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0xd4943a, 3, 15);
  rimLight.position.set(-4, 2, -2);
  scene.add(rimLight);
  const fillLight = new THREE.PointLight(0x2858c0, 2, 10);
  fillLight.position.set(2, -3, 3);
  scene.add(fillLight);

  // ── PRODUCT IMAGES ──
  const imagePaths = [
    'assets/images/chicha_tradicional.png',    // Pasta
    'assets/images/chicha_andina_promo.png',   // Andina
    'assets/images/papelon_limon.png',         // Papelón
    'assets/images/chicha_ligada.png',         // Ligada
  ];

  const loader = new THREE.TextureLoader();
  const textures = [];
  const productGroup = new THREE.Group();
  scene.add(productGroup);

  // Main image plane
  const planeGeo = new THREE.PlaneGeometry(4.2, 4.2, 1, 1);
  const planeMat = new THREE.MeshBasicMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const imagePlane = new THREE.Mesh(planeGeo, planeMat);
  productGroup.add(imagePlane);

  // Glow plane behind image
  const glowGeo = new THREE.PlaneGeometry(4.5, 5.2, 1, 1);
  const glowCv = document.createElement('canvas');
  glowCv.width = glowCv.height = 256;
  const glowCtx = glowCv.getContext('2d');
  const glowGr = glowCtx.createRadialGradient(128, 128, 20, 128, 128, 128);
  glowGr.addColorStop(0, 'rgba(212, 148, 58, 0.25)');
  glowGr.addColorStop(0.5, 'rgba(37, 86, 199, 0.1)');
  glowGr.addColorStop(1, 'rgba(0, 0, 0, 0)');
  glowCtx.fillStyle = glowGr;
  glowCtx.fillRect(0, 0, 256, 256);
  const glowMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(glowCv),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const glowPlane = new THREE.Mesh(glowGeo, glowMat);
  glowPlane.position.z = -0.15;
  productGroup.add(glowPlane);

  // Orbiting ring
  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.015, 4, 80),
    new THREE.MeshBasicMaterial({ color: 0xd4943a, transparent: true, opacity: 0.2 })
  );
  ring1.rotation.x = 0.4;
  scene.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.01, 4, 80),
    new THREE.MeshBasicMaterial({ color: 0x4a8df7, transparent: true, opacity: 0.12 })
  );
  ring2.rotation.x = 1.1;
  ring2.rotation.y = 0.5;
  scene.add(ring2);

  // Floating particles
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(400 * 3);
  for (let i = 0; i < 400; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 1.5 + Math.random() * 2;
    pPos[i * 3] = r * Math.cos(ang);
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 5;
    pPos[i * 3 + 2] = r * Math.sin(ang);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xd4943a, size: 0.02, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  // Bottom glow sprite
  const bGlowCv = document.createElement('canvas');
  bGlowCv.width = bGlowCv.height = 256;
  const bGlowCtx = bGlowCv.getContext('2d');
  const bGlowGr = bGlowCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  bGlowGr.addColorStop(0, 'rgba(212, 148, 58, 0.3)');
  bGlowGr.addColorStop(1, 'rgba(0, 0, 0, 0)');
  bGlowCtx.fillStyle = bGlowGr;
  bGlowCtx.fillRect(0, 0, 256, 256);
  const bGlowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(bGlowCv),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  bGlowSprite.scale.set(5, 2, 1);
  bGlowSprite.position.y = -2.5;
  scene.add(bGlowSprite);

  // Load first texture immediately
  let currentIdx = 0;
  let transitioning = false;

  function loadTexture(idx) {
    if (textures[idx]) {
      planeMat.map = textures[idx];
      planeMat.needsUpdate = true;
      return;
    }
    loader.load(imagePaths[idx], (tex) => {
      tex.encoding = THREE.sRGBEncoding;
      tex.minFilter = THREE.LinearMipMapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      tex.generateMipmaps = true;
      textures[idx] = tex;
      if (idx === currentIdx) {
        planeMat.map = tex;
        planeMat.needsUpdate = true;
      }
    });
  }

  // Preload all textures
  imagePaths.forEach((_, i) => loadTexture(i));

  // ── VARIANT DATA ──
  const variantData = [
    { title: 'PASTA', sub: 'Clásica de la Abuela', desc: 'Pasta corta cocida con leche, vainilla y canela. La versión clásica que nos recuerda a la abuela. Cremosa y reconfortante.', time: '2 horas', origin: 'Venezuela', alc: '0%', temp: '4–6°C', price: '$ 3', ings: ['Pasta', 'Leche', 'Vainilla', 'Canela'] },
    { title: 'ANDINA', sub: 'Fermentada en Piña', desc: 'Chicha fermentada naturalmente dentro de una piña fresca durante 5 días. Sabor tropical, ligeramente ácida, única en su estilo.', time: '5 días', origin: 'Mérida', alc: '3–4%', temp: '6–8°C', price: '$ 5', ings: ['Piña Fresca', 'Azúcar', 'Especias', 'Levadura Natural'] },
    { title: 'PAPELÓN', sub: 'Refrescante Natural', desc: 'Papelón de caña disuelto en agua fresca con abundante limón. Refrescante, natural y muy venezolana. Perfecta para el calor.', time: '30 min', origin: 'Venezuela', alc: '0%', temp: '2–4°C', price: '$ 2', ings: ['Papelón', 'Limón', 'Agua', 'Hielo'] },
    { title: 'LIGADA', sub: 'Tradicional + Andina', desc: 'La mejor combinación: chicha tradicional y andina unidas en un solo vaso. Cremosa, ligeramente fermentada y con todo el sabor venezolano.', time: '3 horas', origin: 'Venezuela', alc: '1–2%', temp: '4–6°C', price: '$ 4', ings: ['Pasta', 'Leche', 'Piña', 'Canela', 'Especias'] },
  ];

  // ── CHANGE VARIANT ──
  function changeVariant(idx) {
    if (transitioning || idx === currentIdx) return;
    transitioning = true;
    currentIdx = idx;

    const v = variantData[idx];
    if ($('#siTitle')) $('#siTitle').textContent = v.title;
    if ($('#siSub')) $('#siSub').textContent = v.sub;
    if ($('#siDesc')) $('#siDesc').textContent = v.desc;
    if ($('#siTime')) $('#siTime').textContent = v.time;
    if ($('#siOrigin')) $('#siOrigin').textContent = v.origin;
    if ($('#siAlc')) $('#siAlc').textContent = v.alc;
    if ($('#siTemp')) $('#siTemp').textContent = v.temp;
    if ($('#siPrice')) $('#siPrice').textContent = v.price;
    if ($('#siIngs')) $('#siIngs').innerHTML = v.ings.map(i => `<span class="si-ing">${i}</span>`).join('');
    $$('#shwDots .shw-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    $$('#shwVariants .shw-var').forEach((d, i) => d.classList.toggle('active', i === idx));

    // Animate out → swap texture → animate in
    let phase = 0; // 0 = shrink, 1 = grow
    const transSpeed = 0.08;

    function transAnim() {
      if (phase === 0) {
        productGroup.scale.x -= transSpeed;
        productGroup.scale.y -= transSpeed;
        imagePlane.material.opacity -= transSpeed;
        if (productGroup.scale.x <= 0.05) {
          productGroup.scale.set(0.05, 0.05, 0.05);
          imagePlane.material.opacity = 0;
          loadTexture(idx);
          phase = 1;
        }
        requestAnimationFrame(transAnim);
      } else {
        productGroup.scale.x += transSpeed;
        productGroup.scale.y += transSpeed;
        imagePlane.material.opacity += transSpeed;
        if (productGroup.scale.x >= 1.0) {
          productGroup.scale.set(1, 1, 1);
          imagePlane.material.opacity = 1;
          transitioning = false;
          return;
        }
        requestAnimationFrame(transAnim);
      }
    }
    requestAnimationFrame(transAnim);
  }

  $$('#shwVariants .shw-var').forEach(el => {
    el.addEventListener('click', () => changeVariant(parseInt(el.dataset.idx)), { signal: sig });
  });
  $$('#shwDots .shw-dot').forEach((el, i) => {
    el.addEventListener('click', () => changeVariant(i), { signal: sig });
  });

  // ── DRAG TO ROTATE ──
  let isDragging = false, prevX = 0;
  let rotY = 0, velX = 0, autoRotate = true;
  let zoom = 6.5;

  canvas.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; autoRotate = false; }, { signal: sig });
  canvas.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; autoRotate = false; }, { passive: true, signal: sig });
  window.addEventListener('mouseup', () => isDragging = false, { signal: sig });
  window.addEventListener('touchend', () => isDragging = false, { signal: sig });
  window.addEventListener('mousemove', e => { if (!isDragging) return; velX = (e.clientX - prevX) * 0.01; prevX = e.clientX; }, { signal: sig });
  window.addEventListener('touchmove', e => { if (!isDragging) return; velX = (e.touches[0].clientX - prevX) * 0.01; prevX = e.touches[0].clientX; }, { passive: true, signal: sig });
  canvas.addEventListener('wheel', e => { zoom = Math.max(4, Math.min(9, zoom + e.deltaY * 0.01)); e.preventDefault(); }, { passive: false, signal: sig });

  // ── ANIMATE ──
  let t = 0, raf;

  function animate() {
    t += 0.007;

    // Rotation
    rotY += velX;
    velX *= 0.92;
    if (autoRotate) rotY += 0.003;
    productGroup.rotation.y = rotY;

    // Gentle float
    productGroup.position.y = Math.sin(t * 0.8) * 0.12;

    // Camera zoom
    camera.position.z += (zoom - camera.position.z) * 0.06;

    // Rings orbit
    ring1.rotation.z = t * 0.12;
    ring2.rotation.z = -t * 0.08;

    // Lights sway
    rimLight.position.x = Math.sin(t * 0.3) * 4;
    rimLight.position.z = Math.cos(t * 0.3) * 3;
    fillLight.position.x = Math.cos(t * 0.4) * 3;

    raf = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    renderer.setSize(W(), H());
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
  }, { signal: sig });

  return { kill() { cancelAnimationFrame(raf); ac.abort(); disposeR(renderer); } };
});
