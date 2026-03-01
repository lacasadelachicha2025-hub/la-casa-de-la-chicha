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
  const cv=$('#hc'),P=cv.parentElement;
  const W=()=>P.offsetWidth,H=()=>P.offsetHeight;
  const rend=mkR(cv,false);rend.setSize(W(),H());
  rend.setClearColor(0xFFFBF2, 1); // Fondo Crema base
  const scene=new THREE.Scene(),cam=mkC(75,W(),H(),10);
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
  for(let i=0; i<pCount*3; i++) {
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

  let t=0,raf;
  (function a(){
    t+=0.005;
    uniforms.uTime.value = t;
    particles.rotation.y = t * 0.05;
    particles.position.y = Math.sin(t * 0.5) * 0.5;
    
    // Movimiento suave de camara con mouse
    cam.position.x += ((MX/innerWidth - 0.5) * 1.0 - cam.position.x) * 0.05;
    cam.position.y += ((MY/innerHeight - 0.5) * 0.5 - cam.position.y) * 0.05;
    cam.lookAt(0,0,0);
    
    raf=requestAnimationFrame(a);
    rend.render(scene,cam);
  })();

  const onRz=()=>{rend.setSize(W(),H());cam.aspect=W()/H();cam.updateProjectionMatrix();};
  window.addEventListener('resize',onRz);
  return{kill(){cancelAnimationFrame(raf);window.removeEventListener('resize',onRz);disposeR(rend);}};
});

// ════════════════════════════════════════
// ABOUT — Animated Andean Vessel
// ════════════════════════════════════════
SM.add('about', $('#ac') && $('#ac').parentElement, () => {
  const cv=$('#ac'),P=cv.parentElement;
  const W=()=>P.offsetWidth,H=()=>P.offsetHeight;
  const rend=mkR(cv,false);rend.setSize(W(),H());rend.setClearColor(0x061020,1);
  const scene=new THREE.Scene(),cam=mkC(45,W(),H(),7);lgts(scene);
  const vPts=[[0,-2.8],[.18,-2.7],[.7,-2.1],[1.1,-1.2],[1.3,-.3],[1.35,.5],[1.25,1.3],[1.05,1.9],[.8,2.4],[.55,2.75],[.32,2.95],[.15,3.1]].map(p=>new THREE.Vector2(...p));
  const vG=new THREE.LatheGeometry(vPts,96);
  const vsl=new THREE.Mesh(vG,new THREE.MeshStandardMaterial({color:0x1A3050,roughness:.75,metalness:.05,side:THREE.DoubleSide}));
  vsl.scale.setScalar(.6);scene.add(vsl);
  const vW=new THREE.Mesh(vG,new THREE.MeshBasicMaterial({color:0x4A90D9,wireframe:true,transparent:true,opacity:.12}));
  vW.scale.setScalar(.61);scene.add(vW);
  [-.5,.4,.9,1.4].forEach(y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.84,.016,8,64),new THREE.MeshStandardMaterial({color:0x4A90D9,metalness:.8,roughness:.2}));r.scale.setScalar(.6);r.position.y=y*.6;r.rotation.x=Math.PI/2;scene.add(r);});
  const lG=new THREE.CylinderGeometry(.75,.65,.12,64);
  const liq=new THREE.Mesh(lG,new THREE.MeshStandardMaterial({color:0x3A7BD4,transparent:true,opacity:.9,metalness:.2,roughness:.05,emissive:0x1A3A6B,emissiveIntensity:.4}));
  liq.scale.setScalar(.6);liq.position.y=.3;scene.add(liq);
  const bG=new THREE.BufferGeometry(),bP=[];
  for(let i=0;i<120;i++){const a=Math.random()*Math.PI*2,r=Math.random()*.35;bP.push(r*Math.cos(a),.4+Math.random(),r*Math.sin(a));}
  bG.setAttribute('position',new THREE.Float32BufferAttribute(bP,3));
  const bubs=new THREE.Points(bG,new THREE.PointsMaterial({color:0x6BB3F0,size:.03,transparent:true,opacity:.7,blending:THREE.AdditiveBlending}));
  bubs.scale.setScalar(.6);scene.add(bubs);
  const oR=new THREE.Mesh(new THREE.TorusGeometry(2.4,.02,4,80),new THREE.MeshBasicMaterial({color:0x4A90D9,transparent:true,opacity:.2}));
  oR.rotation.x=.35;scene.add(oR);
  const hG=new THREE.BufferGeometry(),hP=[];
  for(let i=0;i<500;i++){const a=Math.random()*Math.PI*2,r=2.+Math.random()*.5;hP.push(r*Math.cos(a),(Math.random()-.5)*3.5,r*Math.sin(a));}
  hG.setAttribute('position',new THREE.Float32BufferAttribute(hP,3));
  scene.add(new THREE.Points(hG,new THREE.PointsMaterial({color:0x4A90D9,size:.022,transparent:true,opacity:.45,blending:THREE.AdditiveBlending})));
  let t=0,raf;const lOrig=lG.attributes.position.array.slice();
  (function a(){t+=.007;vsl.rotation.y=t*.45;vW.rotation.y=t*.45;liq.rotation.y=t*1.5;oR.rotation.z=t*.2;
    const lv=lG.attributes.position;for(let i=0;i<lv.count;i++){if(lOrig[i*3+1]>.03)lv.setY(i,.06+.022*Math.sin(lOrig[i*3]*5+t*2)*Math.cos(lOrig[i*3+2]*5+t*1.3));}lv.needsUpdate=true;
    const bp=bG.attributes.position;for(let i=0;i<bp.count;i++){let y=bp.getY(i)+.004;if(y>1.2)y=.3;bp.setY(i,y);}bp.needsUpdate=true;
    raf=requestAnimationFrame(a);rend.render(scene,cam);})();
  const onRz=()=>{rend.setSize(W(),H());cam.aspect=W()/H();cam.updateProjectionMatrix();};
  window.addEventListener('resize',onRz);
  return{kill(){cancelAnimationFrame(raf);window.removeEventListener('resize',onRz);disposeR(rend);}};
});

// ════════════════════════════════════════
// MENU CARDS — 6 Product Scenes (grouped)
// ════════════════════════════════════════
SM.add('menu', document.querySelector('#menu'), () => {
  const kills=[];
  [{id:'mc1',bg:0x0a1020,c:0x1A3868,a:0x4A90D9,tp:'vessel'},
   {id:'mc2',bg:0x081222,c:0x1A2868,a:0x88C4FF,tp:'torus'},
   /* mc3 removed for static image */
   {id:'mc4',bg:0x0a1222,c:0x1A2858,a:0x60B0FF,tp:'sphere'},
   {id:'mc5',bg:0x061228,c:0x0C2A5A,a:0x60B8F0,tp:'octa'},
   {id:'mc6',bg:0x0a1520,c:0x1A3058,a:0x5CA0E8,tp:'knot'}
  ].forEach(({id,bg,c,a,tp})=>{
    const cv=$('#'+id);if(!cv)return;
    const W=cv.parentElement.offsetWidth||360,H=cv.parentElement.offsetHeight||200;
    const rend=mkR(cv,false);rend.setSize(W,H);rend.setClearColor(bg,1);
    const scene=new THREE.Scene(),cam=mkC(55,W,H,3.5);
    scene.add(new THREE.AmbientLight(0x0A1525,.4));
    const pl=new THREE.PointLight(a,5,10);pl.position.set(2,2,2);scene.add(pl);
    const pl2=new THREE.PointLight(c,3,8);pl2.position.set(-2,-1,1);scene.add(pl2);
    const mat=new THREE.MeshStandardMaterial({color:c,metalness:.35,roughness:.5});
    const wm=new THREE.MeshBasicMaterial({color:a,wireframe:true,transparent:true,opacity:.18});
    let mesh;
    if(tp==='vessel'){const pts=[[0,.15],[.28,.12],[.52,-.08],[.65,-.52],[.55,-1.1],[.28,-1.3]].map(p=>new THREE.Vector2(...p));mesh=new THREE.Mesh(new THREE.LatheGeometry(pts,32),mat);}
    else if(tp==='torus')mesh=new THREE.Mesh(new THREE.TorusGeometry(.75,.28,16,80),mat);
    else if(tp==='icosa')mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.9,1),mat);
    else if(tp==='sphere'){mesh=new THREE.Mesh(new THREE.SphereGeometry(.88,32,32),mat);scene.add(new THREE.Mesh(new THREE.TorusGeometry(1.25,.015,4,60),new THREE.MeshBasicMaterial({color:a,transparent:true,opacity:.3})));}
    else if(tp==='octa')mesh=new THREE.Mesh(new THREE.OctahedronGeometry(1),mat);
    else mesh=new THREE.Mesh(new THREE.TorusKnotGeometry(.55,.18,120,16,2,3),mat);
    const wire=new THREE.Mesh(mesh.geometry,wm);wire.scale.setScalar(1.04);scene.add(mesh,wire);
    const pG=new THREE.BufferGeometry(),pp=[];for(let i=0;i<180;i++)pp.push((Math.random()-.5)*4,(Math.random()-.5)*3,(Math.random()-.5)*2);
    pG.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));
    scene.add(new THREE.Points(pG,new THREE.PointsMaterial({color:a,size:.025,transparent:true,opacity:.45,blending:THREE.AdditiveBlending})));
    let t=Math.random()*100,raf;
    (function lp(){t+=.012;mesh.rotation.y=t*.55;mesh.rotation.x=Math.sin(t*.3)*.4;wire.rotation.y=t*.55;wire.rotation.x=Math.sin(t*.3)*.4;mesh.position.y=Math.sin(t*.5)*.1;pl.position.set(2*Math.sin(t),2*Math.cos(t*.7),2);raf=requestAnimationFrame(lp);rend.render(scene,cam);})();
    kills.push(()=>{cancelAnimationFrame(raf);disposeR(rend);});
  });
  return{kill(){kills.forEach(fn=>fn());}};
});

// ════════════════════════════════════════
// IMMERSIVE — Volumetric Plasma Shader
// ════════════════════════════════════════
SM.add('immersive', $('#ic') && $('#ic').parentElement, () => {
  const cv=$('#ic');
  const rend=mkR(cv,false);rend.setSize(innerWidth,innerHeight);
  const scene=new THREE.Scene(),cam=mkC(75,innerWidth,innerHeight,2);
  const mat=new THREE.ShaderMaterial({
    uniforms:{uT:{value:0},uM:{value:new THREE.Vector2(.5,.5)}},
    vertexShader:`
      uniform float uT;varying vec2 vUv;varying float vE;
      float sn(vec3 p){return sin(p.x*2.+uT)*sin(p.y*2.5+uT*.8)*cos(p.z*1.8+uT*.6);}
      void main(){vUv=uv;vec3 pos=position;float n=sn(pos*1.1)*.28+sn(pos*2.5+.7)*.12+sn(pos*5.+1.3)*.05;pos.z+=n;vE=n;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);}
    `,
    fragmentShader:`
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
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(8,8,300,300),mat);
  plane.rotation.x=-.45;scene.add(plane);
  const orbs=[];for(let i=0;i<12;i++){const o=new THREE.Mesh(new THREE.SphereGeometry(.08+Math.random()*.1,12,12),new THREE.MeshBasicMaterial({color:0x4A90D9,transparent:true,opacity:.1,blending:THREE.AdditiveBlending}));o.position.set((Math.random()-.5)*7,(Math.random()-.5)*2,Math.random()*-1);o.userData={vx:(Math.random()-.5)*.003,vy:(Math.random()-.5)*.004};scene.add(o);orbs.push(o);}
  let t=0,raf;
  (function a(){t+=.005;mat.uniforms.uT.value=t;mat.uniforms.uM.value.lerp(new THREE.Vector2(MX/innerWidth,1-MY/innerHeight),.04);orbs.forEach(o=>{o.position.x+=o.userData.vx;o.position.y+=o.userData.vy;if(Math.abs(o.position.x)>3.5)o.userData.vx*=-1;if(Math.abs(o.position.y)>1.5)o.userData.vy*=-1;});
    cam.position.x+=((MX/innerWidth-.5)*.3-cam.position.x)*.03;cam.position.y+=((MY/innerHeight-.5)*-.2-cam.position.y)*.03;cam.lookAt(0,0,0);raf=requestAnimationFrame(a);rend.render(scene,cam);})();
  const onRz=()=>{rend.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();};
  window.addEventListener('resize',onRz);
  return{kill(){cancelAnimationFrame(raf);window.removeEventListener('resize',onRz);disposeR(rend);}};
});

// ════════════════════════════════════════
// CHEF SCENE
// ════════════════════════════════════════
SM.add('chef', $('#cc') && $('#cc').parentElement, () => {
  const cv=$('#cc'),P=cv.parentElement;
  const W=()=>P.offsetWidth,H=()=>P.offsetHeight;
  const rend=mkR(cv,false);rend.setSize(W(),H());rend.setClearColor(0x081028,1);
  const scene=new THREE.Scene(),cam=mkC(50,W(),H(),6);lgts(scene,0x6BB3F0,0x1A3A6B);
  const iG=new THREE.IcosahedronGeometry(1.5,2);
  const ctr=new THREE.Mesh(iG,new THREE.MeshStandardMaterial({color:0x183060,roughness:.8,metalness:.05,transparent:true,opacity:.9}));scene.add(ctr);
  const cW=new THREE.Mesh(iG,new THREE.MeshBasicMaterial({color:0x4A90D9,wireframe:true,transparent:true,opacity:.15}));cW.scale.setScalar(1.02);scene.add(cW);
  const orb1=new THREE.Mesh(new THREE.TorusGeometry(2.4,.04,4,80),new THREE.MeshBasicMaterial({color:0x4A90D9,transparent:true,opacity:.3}));orb1.rotation.x=.5;scene.add(orb1);
  const orb2=new THREE.Mesh(new THREE.TorusGeometry(3,.02,4,80),new THREE.MeshBasicMaterial({color:0x1A3A6B,transparent:true,opacity:.2}));orb2.rotation.x=1.2;orb2.rotation.y=.4;scene.add(orb2);
  const pG=new THREE.BufferGeometry(),pp=[];
  for(let i=0;i<600;i++){const a=i/600*Math.PI*2,r=2.+Math.sin(a*8)*.3+Math.sin(a*4)*.2;pp.push(r*Math.cos(a),r*Math.sin(a),0);}
  pG.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));
  scene.add(new THREE.Points(pG,new THREE.PointsMaterial({color:0x4A90D9,size:.03,transparent:true,opacity:.5})));
  const hG=new THREE.BufferGeometry(),hP=[];for(let i=0;i<1000;i++){const a=Math.random()*Math.PI*2,r=Math.random()*.8;hP.push(r*Math.cos(a)*4,(Math.random()-.5)*4,r*Math.sin(a)*4);}
  hG.setAttribute('position',new THREE.Float32BufferAttribute(hP,3));scene.add(new THREE.Points(hG,new THREE.PointsMaterial({color:0x4A90D9,size:.018,transparent:true,opacity:.3,blending:THREE.AdditiveBlending})));
  let t=0,raf;
  (function a(){t+=.006;ctr.rotation.y=t*.3;ctr.rotation.x=Math.sin(t*.2)*.15;cW.rotation.y=t*.3;cW.rotation.x=Math.sin(t*.2)*.15;orb1.rotation.y=t*.25;orb1.rotation.z=t*.1;orb2.rotation.x=t*.15;orb2.rotation.z=-t*.08;cam.position.x+=((MX/innerWidth-.5)*.5-cam.position.x)*.02;cam.position.y+=((MY/innerHeight-.5)*-.4-cam.position.y)*.02;cam.lookAt(0,0,0);raf=requestAnimationFrame(a);rend.render(scene,cam);})();
  const onRz=()=>{rend.setSize(W(),H());cam.aspect=W()/H();cam.updateProjectionMatrix();};
  window.addEventListener('resize',onRz);
  return{kill(){cancelAnimationFrame(raf);window.removeEventListener('resize',onRz);disposeR(rend);}};
});

// ════════════════════════════════════════
// GALLERY SCENES — 7 Items (grouped)
// ════════════════════════════════════════
SM.add('gallery', document.querySelector('#gallery'), () => {
  const kills=[];
  [{id:'g1',c:0x1A3565,a:0x4A90D9,s:'vessel',bg:0x061020},{id:'g2',c:0x12254A,a:0x5CA0E8,s:'cube',bg:0x091428},{id:'g3',c:0x1A2555,a:0x5090E0,s:'torus',bg:0x0a1025},{id:'g4',c:0x0E1838,a:0x70A8E8,s:'diamond',bg:0x071028},{id:'g5',c:0x0A1838,a:0x60B8F0,s:'helix',bg:0x061228},{id:'g6',c:0x0E1E40,a:0xf0b030,s:'ring',bg:0x0a1225},{id:'g7',c:0x0E1528,a:0x4A85D0,s:'icosa',bg:0x091420}
  ].forEach(({id,c,a,s,bg})=>{
    const cv=$('#'+id);if(!cv)return;
    const W=cv.parentElement.offsetWidth||200,H=cv.parentElement.offsetHeight||200;
    const rend=mkR(cv,false);rend.setSize(W,H);rend.setClearColor(bg,1);
    const scene=new THREE.Scene(),cam=mkC(50,W,H,4);
    scene.add(new THREE.AmbientLight(0x0A1525,.3));const pl=new THREE.PointLight(a,5,10);pl.position.set(2,2,2);scene.add(pl);const pl2g=new THREE.PointLight(c,3,8);pl2g.position.set(-2,-1,0);scene.add(pl2g);
    const mat=new THREE.MeshStandardMaterial({color:c,metalness:.4,roughness:.4});const wm=new THREE.MeshBasicMaterial({color:a,wireframe:true,transparent:true,opacity:.14});
    let mesh;
    if(s==='vessel'){const pts=[[0,-1.8],[.45,-1.3],[.75,-.4],[.88,.5],[.7,1.2],[.4,1.6],[.18,1.9]].map(p=>new THREE.Vector2(...p));mesh=new THREE.Mesh(new THREE.LatheGeometry(pts,48),mat);}
    else if(s==='cube')mesh=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4,4,4,4),mat);
    else if(s==='torus')mesh=new THREE.Mesh(new THREE.TorusGeometry(.9,.3,16,80),mat);
    else if(s==='diamond')mesh=new THREE.Mesh(new THREE.OctahedronGeometry(1.1),mat);
    else if(s==='helix'){const hg=new THREE.BufferGeometry(),hp=[];for(let i=0;i<300;i++){const ang=i*.16;hp.push(.9*Math.cos(ang),i*.013-2,.9*Math.sin(ang));}hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));mesh=new THREE.Line(hg,new THREE.LineBasicMaterial({color:a,transparent:true,opacity:.8}));}
    else if(s==='ring')mesh=new THREE.Mesh(new THREE.TorusKnotGeometry(.65,.2,120,16,3,5),mat);
    else mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),mat);
    const wire=new THREE.Mesh(mesh.geometry||new THREE.SphereGeometry(.01),wm);wire.scale.setScalar(1.05);scene.add(mesh,wire);
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(3,16,16),new THREE.MeshBasicMaterial({color:a,transparent:true,opacity:.03,side:THREE.BackSide})));
    let t=Math.random()*100,raf;
    (function lp(){t+=.01;if(mesh.rotation){mesh.rotation.y=t*.45;mesh.rotation.x=Math.sin(t*.3)*.3;}if(wire.rotation){wire.rotation.y=t*.45;wire.rotation.x=Math.sin(t*.3)*.3;}pl.position.set(2*Math.sin(t),2*Math.cos(t*.7),2);raf=requestAnimationFrame(lp);rend.render(scene,cam);})();
    kills.push(()=>{cancelAnimationFrame(raf);disposeR(rend);});
  });
  return{kill(){kills.forEach(fn=>fn());}};
});

// ════════════════════════════════════════
// PROMO 3D — Premium Product Card Scene
// ════════════════════════════════════════
SM.add('promo3d', $('#promo-cv') && $('#promo-cv').parentElement, () => {
  const cv=$('#promo-cv');
  if(!cv)return{kill(){}};
  const P=cv.parentElement;
  const W=()=>P.offsetWidth||420,H=()=>P.offsetHeight||340;
  const rend=mkR(cv,false);rend.setSize(W(),H());
  rend.setClearColor(0x081225,1);
  rend.toneMapping=THREE.ACESFilmicToneMapping;
  rend.toneMappingExposure=1.4;
  const scene=new THREE.Scene(),cam=mkC(40,W(),H(),7);
  cam.position.y=0.3;

  // Dramatic lighting
  scene.add(new THREE.AmbientLight(0x0A1530,.6));
  const key=new THREE.DirectionalLight(0x5CA0E8,3.5);key.position.set(3,5,4);scene.add(key);
  const rim=new THREE.PointLight(0x4A90D9,6,15);rim.position.set(-4,2,-2);scene.add(rim);
  const accent=new THREE.PointLight(0x2E5DA8,4,10);accent.position.set(2,-3,3);scene.add(accent);
  const topL=new THREE.PointLight(0xE0ECF8,3,8);topL.position.set(0,6,0);scene.add(topL);

  // Premium Venezuelan vessel
  const vPts=[[0,-2.4],[.2,-2.3],[.65,-1.9],[1.05,-1.15],[1.22,-.35],[1.26,.3],[1.2,.95],[1.08,1.55],[.88,2.05],[.65,2.42],[.45,2.68],[.28,2.88],[.12,3.0]].map(p=>new THREE.Vector2(...p));
  const vG=new THREE.LatheGeometry(vPts,96);
  const vMat=new THREE.MeshStandardMaterial({color:0x0E1E45,roughness:.65,metalness:.15,side:THREE.DoubleSide});
  const vsl=new THREE.Mesh(vG,vMat);vsl.scale.setScalar(.55);scene.add(vsl);

  const vW=new THREE.Mesh(vG,new THREE.MeshBasicMaterial({color:0x5CA0E8,wireframe:true,transparent:true,opacity:.08}));
  vW.scale.setScalar(.56);scene.add(vW);

  // Gold engravings
  [-.4,.2,.7,1.2,1.7].forEach((y,i)=>{
    const r=new THREE.Mesh(
      new THREE.TorusGeometry(.73+Math.sin(i)*.02,.025-i*.002,8,96),
      new THREE.MeshStandardMaterial({color:0x5CA0E8,metalness:.9,roughness:.1,emissive:0x5CA0E8,emissiveIntensity:.15})
    );
    r.rotation.x=Math.PI/2;r.position.y=y*.55;r.scale.setScalar(.55);scene.add(r);
  });

  // Geometric pattern
  for(let i=0;i<24;i++){
    const ang=(i/24)*Math.PI*2;
    const dot=new THREE.Mesh(
      new THREE.OctahedronGeometry(.03,0),
      new THREE.MeshStandardMaterial({color:0x5CA0E8,metalness:.95,roughness:.05,emissive:0x4A90D9,emissiveIntensity:.3})
    );
    const row=i%2===0?.35:.75;
    dot.position.set(Math.cos(ang)*.72,row*.55,Math.sin(ang)*.72);
    dot.scale.setScalar(.55);scene.add(dot);
  }

  // Liquid
  const lG=new THREE.CylinderGeometry(.62,.52,.15,96);
  const liq=new THREE.Mesh(lG,new THREE.MeshStandardMaterial({
    color:0x3A7BD4,transparent:true,opacity:.94,metalness:.2,roughness:.02,
    emissive:0x1A4A8B,emissiveIntensity:.4
  }));
  liq.position.y=.30;liq.scale.setScalar(.55);scene.add(liq);

  // Steam
  const sG=new THREE.BufferGeometry(),sP=[];
  for(let i=0;i<60;i++){const a=Math.random()*Math.PI*2,r=Math.random()*.25;sP.push(r*Math.cos(a),1.8+Math.random()*1.5,r*Math.sin(a));}
  sG.setAttribute('position',new THREE.Float32BufferAttribute(sP,3));
  const steamP=new THREE.Points(sG,new THREE.PointsMaterial({color:0xE0ECF8,size:.04,transparent:true,opacity:.25,blending:THREE.AdditiveBlending,depthWrite:false}));
  steamP.scale.setScalar(.55);scene.add(steamP);

  // Floating particles
  const pG=new THREE.BufferGeometry(),pP=[];
  for(let i=0;i<300;i++){const a=Math.random()*Math.PI*2,r=1.5+Math.random()*1.5;pP.push(r*Math.cos(a),(Math.random()-.5)*4,r*Math.sin(a));}
  pG.setAttribute('position',new THREE.Float32BufferAttribute(pP,3));
  scene.add(new THREE.Points(pG,new THREE.PointsMaterial({color:0x5CA0E8,size:.02,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false})));

  // Orbiting rings
  const oR=new THREE.Mesh(new THREE.TorusGeometry(2,.015,4,80),new THREE.MeshBasicMaterial({color:0x5CA0E8,transparent:true,opacity:.2}));
  oR.rotation.x=.4;scene.add(oR);
  const oR2=new THREE.Mesh(new THREE.TorusGeometry(2.5,.01,4,80),new THREE.MeshBasicMaterial({color:0x4A90D9,transparent:true,opacity:.1}));
  oR2.rotation.x=1;oR2.rotation.y=.5;scene.add(oR2);

  // Bottom glow
  const gCv=document.createElement('canvas');gCv.width=gCv.height=256;
  const gCtx=gCv.getContext('2d');
  const gGr=gCtx.createRadialGradient(128,128,0,128,128,128);
  gGr.addColorStop(0,'rgba(240,184,48,.35)');gGr.addColorStop(1,'rgba(0,0,0,0)');
  gCtx.fillStyle=gGr;gCtx.fillRect(0,0,256,256);
  const gSp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gCv),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  gSp.scale.set(4,4,1);gSp.position.y=-1.5;scene.add(gSp);

  let t=0,raf;
  (function a(){
    t+=.006;
    vsl.rotation.y=t*.5;vW.rotation.y=t*.5;liq.rotation.y=t;
    oR.rotation.z=t*.15;oR2.rotation.z=-t*.1;
    vsl.position.y=Math.sin(t*.8)*.06;
    vW.position.y=vsl.position.y;
    liq.position.y=.30+Math.sin(t*.8)*.06;
    const sv=sG.attributes.position;
    for(let i=0;i<sv.count;i++){
      let y=sv.getY(i)+.008;
      let x=sv.getX(i)+Math.sin(t+i)*.001;
      if(y>3){y=1.8;x=(Math.random()-.5)*.3;}
      sv.setY(i,y);sv.setX(i,x);
    }
    sv.needsUpdate=true;
    rim.position.x=Math.sin(t*.3)*4;
    rim.position.z=Math.cos(t*.3)*3;
    raf=requestAnimationFrame(a);rend.render(scene,cam);
  })();
  const onRz=()=>{rend.setSize(W(),H());cam.aspect=W()/H();cam.updateProjectionMatrix();};
  window.addEventListener('resize',onRz);
  return{kill(){cancelAnimationFrame(raf);window.removeEventListener('resize',onRz);disposeR(rend);}};
});

// PROMO CARD 3D — Mouse Parallax (no WebGL — always active)
(function(){
  const card=$('#promoCard3d');
  if(!card)return;
  const container=card.parentElement;
  container.addEventListener('mousemove',e=>{
    const rect=container.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width-.5;
    const y=(e.clientY-rect.top)/rect.height-.5;
    card.style.transform=`translateY(${Math.sin(Date.now()*.001)*15}px) rotateY(${x*15}deg) rotateX(${-y*10}deg)`;
  });
  container.addEventListener('mouseleave',()=>{
    card.style.transition='transform .6s var(--ease)';
    card.style.transform='';
    setTimeout(()=>card.style.transition='',600);
  });
  container.addEventListener('mouseenter',()=>{
    card.style.transition='none';
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
  renderer.setClearColor(0x040810, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const camera = mkC(45, W(), H(), 6.5);
  camera.position.y = 0.5;

  // ── LIGHTS ──
  const ambLight = new THREE.AmbientLight(0x081428, 0.4);
  scene.add(ambLight);
  const keyLight = new THREE.DirectionalLight(0x4A90D9, 3);
  keyLight.position.set(4, 6, 4);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(0x4A90D9, 5, 15);
  rimLight.position.set(-4, 2, -2);
  scene.add(rimLight);
  const fillLight = new THREE.PointLight(0x1A3A6B, 3, 10);
  fillLight.position.set(2, -3, 3);
  scene.add(fillLight);
  const topLight = new THREE.PointLight(0xE0ECF8, 2, 8);
  topLight.position.set(0, 5, 0);
  scene.add(topLight);

  // ── VESSEL GROUP ──
  const vesselGroup = new THREE.Group();
  scene.add(vesselGroup);

  const vProfile = [
    [0.00, -2.50],[0.22, -2.42],[0.72, -2.00],[1.10, -1.30],[1.28, -0.50],
    [1.32,  0.20],[1.28,  0.90],[1.18,  1.55],[1.00,  2.05],[0.78,  2.40],
    [0.56,  2.68],[0.38,  2.85],[0.22,  2.96],[0.10,  3.04],
  ].map(p => new THREE.Vector2(...p));

  const vGeo = new THREE.LatheGeometry(vProfile, 128);

  const vesselColors = [
    { body: 0x1A3060, engrave: 0x4A90D9, liquid: 0x3A7BD4, liquidEmit: 0x1A3A6B },
    { body: 0x12204A, engrave: 0x88C4FF, liquid: 0x2040A0, liquidEmit: 0x0E1A48 },
    { body: 0x142A55, engrave: 0x6BB3F0, liquid: 0x4A90D9, liquidEmit: 0x1A4A8B },
    { body: 0x1A2555, engrave: 0x60B0FF, liquid: 0x2A60B0, liquidEmit: 0x0E2050 },
    { body: 0x0E1E45, engrave: 0x5CA0E8, liquid: 0x3A7BD4, liquidEmit: 0x1A4A8B },
  ];

  let currentColors = vesselColors[0];

  const vMat = new THREE.MeshStandardMaterial({
    color: currentColors.body, roughness: 0.75, metalness: 0.08, side: THREE.DoubleSide,
  });
  const vessel = new THREE.Mesh(vGeo, vMat);
  vessel.castShadow = true;
  vesselGroup.add(vessel);

  // Engraving rings
  const rings = [];
  [-0.6, 0.3, 1.0, 1.8].forEach(y => {
    const rGeo = new THREE.TorusGeometry(1.35, 0.022, 8, 128);
    const rMat = new THREE.MeshStandardMaterial({
      color: currentColors.engrave, metalness: 0.85, roughness: 0.15,
      emissive: currentColors.engrave, emissiveIntensity: 0.1,
    });
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = y;
    vesselGroup.add(ring); rings.push(ring);
  });

  // Geometric Andean pattern
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshStandardMaterial({ color: currentColors.engrave, metalness: 0.9, roughness: 0.1, emissive: currentColors.engrave, emissiveIntensity: 0.2 })
    );
    dot.position.set(Math.cos(angle) * 1.32, 0.62, Math.sin(angle) * 1.32);
    vesselGroup.add(dot);
  }

  // Liquid inside
  const liqGeo = new THREE.CylinderGeometry(1.12, 0.96, 0.18, 128);
  const liqMat = new THREE.MeshStandardMaterial({
    color: currentColors.liquid, transparent: true, opacity: 0.92,
    metalness: 0.15, roughness: 0.05,
    emissive: currentColors.liquidEmit, emissiveIntensity: 0.35,
  });
  const liquid = new THREE.Mesh(liqGeo, liqMat);
  liquid.position.y = 0.55; vesselGroup.add(liquid);

  // Liquid fill interior
  const fillGeo = new THREE.CylinderGeometry(1.10, 0.94, 2.5, 128, 1, true);
  const fillMat = new THREE.MeshStandardMaterial({
    color: currentColors.liquid, transparent: true, opacity: 0.15,
    metalness: 0.1, roughness: 0.2,
    emissive: currentColors.liquidEmit, emissiveIntensity: 0.2, side: THREE.BackSide,
  });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.position.y = -0.7; vesselGroup.add(fill);

  // Bubble particles
  const bubGeo = new THREE.BufferGeometry();
  const bubPos = new Float32Array(200 * 3);
  const bubSpeeds = new Float32Array(200);
  for (let i = 0; i < 200; i++) {
    const ang = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
    bubPos[i*3] = r*Math.cos(ang); bubPos[i*3+1] = -0.5+Math.random()*2; bubPos[i*3+2] = r*Math.sin(ang);
    bubSpeeds[i] = 0.003 + Math.random() * 0.006;
  }
  bubGeo.setAttribute('position', new THREE.BufferAttribute(bubPos, 3));
  const bubMat = new THREE.PointsMaterial({
    color: currentColors.engrave, size: 0.025, transparent: true, opacity: 0.65,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const bubbles = new THREE.Points(bubGeo, bubMat);
  bubbles.position.y = 0.5; vesselGroup.add(bubbles);

  // Steam particles
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(80 * 3);
  const steamSpeeds = new Float32Array(80);
  for (let i = 0; i < 80; i++) {
    const ang = Math.random() * Math.PI * 2, r = Math.random() * 0.4;
    steamPos[i*3] = r*Math.cos(ang); steamPos[i*3+1] = 3.0+Math.random()*1.5; steamPos[i*3+2] = r*Math.sin(ang);
    steamSpeeds[i] = 0.005 + Math.random() * 0.008;
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steamMat = new THREE.PointsMaterial({
    color: 0xE0ECF8, size: 0.04, transparent: true, opacity: 0.2,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const steam = new THREE.Points(steamGeo, steamMat);
  vesselGroup.add(steam);

  // ── INGREDIENT PARTICLES ──
  const ingDefs = [
    { label: 'Arroz', color: 0x4A90D9 },
    { label: 'Canela', color: 0x6BB3F0 },
    { label: 'Leche', color: 0x2E5DA8 },
    { label: 'Piña', color: 0x5CA0E8 },
    { label: 'Papelón', color: 0x1A3A6B },
  ];
  const ingGroup = new THREE.Group();
  scene.add(ingGroup);
  ingDefs.forEach((ing, i) => {
    const ang = (i / ingDefs.length) * Math.PI * 2;
    const radius = 2.8;
    const g = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1 + Math.random() * 0.06, 1),
      new THREE.MeshStandardMaterial({ color: ing.color, metalness: 0.5, roughness: 0.4, emissive: ing.color, emissiveIntensity: 0.2 })
    );
    g.position.set(Math.cos(ang) * radius, -0.5 + Math.random() * 2, Math.sin(ang) * radius);
    g.userData = { angle: ang, radius, speed: 0.003 + Math.random() * 0.003, yOff: Math.random() * Math.PI * 2 };
    ingGroup.add(g);
    const trailGeo = new THREE.BufferGeometry();
    const tp = [];
    for (let j = 0; j < 20; j++) { const ta = ang - j * 0.1; tp.push(Math.cos(ta) * radius, g.position.y, Math.sin(ta) * radius); }
    trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
    ingGroup.add(new THREE.Points(trailGeo, new THREE.PointsMaterial({ color: ing.color, size: 0.03, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })));
  });

  // ── GROUND & GLOW ──
  const groundGeo = new THREE.CircleGeometry(3, 64);
  const groundMat = new THREE.MeshBasicMaterial({ color: currentColors.liquid, transparent: true, opacity: 0.04 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = -2.6; scene.add(ground);

  const glowCv = document.createElement('canvas'); glowCv.width = glowCv.height = 256;
  const glowCtx = glowCv.getContext('2d');
  const glowGr = glowCtx.createRadialGradient(128,128,0,128,128,128);
  glowGr.addColorStop(0, 'rgba(201,161,74,0.3)'); glowGr.addColorStop(1, 'rgba(0,0,0,0)');
  glowCtx.fillStyle = glowGr; glowCtx.fillRect(0,0,256,256);
  const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCv), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glowSprite.scale.set(5,5,1); glowSprite.position.y = -2.5; scene.add(glowSprite);

  // ── HALO RING ──
  const haloGeo = new THREE.BufferGeometry(); const haloPos = [];
  for (let i = 0; i < 800; i++) { const ang = Math.random()*Math.PI*2, r = 2.2+Math.random()*0.4; haloPos.push(r*Math.cos(ang),(Math.random()-0.5)*6,r*Math.sin(ang)); }
  haloGeo.setAttribute('position', new THREE.Float32BufferAttribute(haloPos, 3));
  scene.add(new THREE.Points(haloGeo, new THREE.PointsMaterial({ color: 0x4A90D9, size: 0.018, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })));

  // ── DRAG TO ROTATE ──
  let isDragging = false, prevX = 0, prevY = 0;
  let rotY = 0, rotX = 0.1, velX = 0, velY = 0, zoom = 6.5;

  canvas.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; }, { signal: sig });
  canvas.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; }, { passive: true, signal: sig });
  window.addEventListener('mouseup', () => isDragging = false, { signal: sig });
  window.addEventListener('touchend', () => isDragging = false, { signal: sig });
  window.addEventListener('mousemove', e => { if (!isDragging) return; velX = (e.clientX - prevX) * 0.012; velY = (e.clientY - prevY) * 0.008; prevX = e.clientX; prevY = e.clientY; }, { signal: sig });
  window.addEventListener('touchmove', e => { if (!isDragging) return; velX = (e.touches[0].clientX - prevX) * 0.012; velY = (e.touches[0].clientY - prevY) * 0.008; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; }, { passive: true, signal: sig });
  canvas.addEventListener('wheel', e => { zoom = Math.max(3.5, Math.min(9, zoom + e.deltaY * 0.01)); e.preventDefault(); }, { passive: false, signal: sig });

  // ── VARIANT DATA ──
  const variantData = [
    { title: 'ARROZ', sub: 'La Tradicional Venezolana', desc: 'Arroz cocido con leche, canela y azúcar. Licuada hasta obtener una textura cremosa y suave. Servida bien fría con canela espolvoreada. El sabor de Venezuela.', time: '3 horas', origin: 'Venezuela', alc: '0%', temp: '4–6°C', price: '$ 3', ings: ['Arroz', 'Leche', 'Canela', 'Azúcar'] },
    { title: 'PASTA', sub: 'Clásica de la Abuela', desc: 'Pasta corta cocida con leche, vainilla y canela. La versión clásica que nos recuerda a la abuela. Cremosa y reconfortante.', time: '2 horas', origin: 'Venezuela', alc: '0%', temp: '4–6°C', price: '$ 3', ings: ['Pasta', 'Leche', 'Vainilla', 'Canela'] },
    { title: 'ANDINA', sub: 'Fermentada en Piña', desc: 'Chicha fermentada naturalmente dentro de una piña fresca durante 5 días. Sabor tropical, ligeramente ácida, única en su estilo.', time: '5 días', origin: 'Mérida', alc: '3–4%', temp: '6–8°C', price: '$ 5', ings: ['Piña Fresca', 'Azúcar', 'Especias', 'Levadura Natural'] },
    { title: 'PAPELÓN', sub: 'Refrescante Natural', desc: 'Papelón de caña disuelto en agua fresca con abundante limón. Refrescante, natural y muy venezolana. Perfecta para el calor.', time: '30 min', origin: 'Venezuela', alc: '0%', temp: '2–4°C', price: '$ 2', ings: ['Papelón', 'Limón', 'Agua', 'Hielo'] },
    { title: 'TIZANA', sub: 'Frutas Tropicales', desc: 'Mezcla de frutas tropicales picadas en jugo natural: patilla, melón, lechosa, piña, cambur y granadina. Frescura pura.', time: '1 hora', origin: 'Venezuela', alc: '0%', temp: '2–4°C', price: '$ 4', ings: ['Patilla', 'Melón', 'Lechosa', 'Piña', 'Granadina'] },
  ];

  // ── CHANGE VARIANT ──
  function changeVariant(idx) {
    const v = variantData[idx];
    const c = vesselColors[idx];
    const el = (sel) => { const e = $(sel); return e; };
    if(el('#siTitle')) el('#siTitle').textContent = v.title;
    if(el('#siSub')) el('#siSub').textContent = v.sub;
    if(el('#siDesc')) el('#siDesc').textContent = v.desc;
    if(el('#siTime')) el('#siTime').textContent = v.time;
    if(el('#siOrigin')) el('#siOrigin').textContent = v.origin;
    if(el('#siAlc')) el('#siAlc').textContent = v.alc;
    if(el('#siTemp')) el('#siTemp').textContent = v.temp;
    if(el('#siPrice')) el('#siPrice').textContent = v.price;
    if(el('#siIngs')) el('#siIngs').innerHTML = v.ings.map(i => `<span class="si-ing">${i}</span>`).join('');
    $$('#shwDots .shw-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    $$('#shwVariants .shw-var').forEach((d, i) => d.classList.toggle('active', i === idx));
    vMat.color.setHex(c.body);
    liqMat.color.setHex(c.liquid); liqMat.emissive.setHex(c.liquidEmit);
    fillMat.color.setHex(c.liquid); fillMat.emissive.setHex(c.liquidEmit);
    bubMat.color.setHex(c.engrave);
    groundMat.color.setHex(c.liquid);
    rings.forEach(r => { r.material.color.setHex(c.engrave); r.material.emissive.setHex(c.engrave); });
    rimLight.color.setHex(c.engrave);
  }

  $$('#shwVariants .shw-var').forEach(el => { el.addEventListener('click', () => changeVariant(parseInt(el.dataset.idx)), { signal: sig }); });
  $$('#shwDots .shw-dot').forEach((el, i) => { el.addEventListener('click', () => changeVariant(i), { signal: sig }); });

  // ── ANIMATE ──
  const lOrigY = Array.from(liqGeo.attributes.position.array);
  let t = 0, autoRotate = true, raf;
  canvas.addEventListener('mousedown', () => autoRotate = false, { signal: sig });
  canvas.addEventListener('touchstart', () => autoRotate = false, { passive: true, signal: sig });

  function animate() {
    t += 0.007;
    rotY += velX; rotX += velY;
    velX *= 0.88; velY *= 0.88;
    rotX = Math.max(-0.5, Math.min(0.7, rotX));
    if (autoRotate) rotY += 0.004;
    vesselGroup.rotation.y = rotY; vesselGroup.rotation.x = rotX;
    camera.position.z += (zoom - camera.position.z) * 0.06;

    // Liquid wave
    const lv = liqGeo.attributes.position;
    for (let i = 0; i < lv.count; i++) {
      const ox = lOrigY[i*3], oz = lOrigY[i*3+2];
      if (lOrigY[i*3+1] > 0.06) { lv.setY(i, 0.09 + 0.03 * Math.sin(ox*4+t*2.5+velX*2) * Math.cos(oz*4+t*1.8)); }
    }
    lv.needsUpdate = true; liquid.rotation.y = t * 0.8;

    // Bubbles
    const bp = bubGeo.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      let y = bp.getY(i) + bubSpeeds[i];
      if (y > 1.8) { y = -0.5; bp.setX(i, (Math.random()-0.5)*1.6); bp.setZ(i, (Math.random()-0.5)*1.6); }
      bp.setY(i, y);
    }
    bp.needsUpdate = true;

    // Steam
    const sp = steamGeo.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      let y = sp.getY(i) + steamSpeeds[i];
      let x = sp.getX(i) + Math.sin(t+i) * 0.002;
      if (y > 5.5) { y = 3.0; x = (Math.random()-0.5) * 0.8; }
      sp.setY(i, y); sp.setX(i, x);
    }
    sp.needsUpdate = true;

    // Ingredient orbits
    ingGroup.children.forEach(obj => {
      if (obj.userData.angle !== undefined) {
        obj.userData.angle += obj.userData.speed;
        const a = obj.userData.angle;
        obj.position.x = Math.cos(a) * obj.userData.radius;
        obj.position.z = Math.sin(a) * obj.userData.radius;
        obj.position.y = Math.sin(t*0.5 + obj.userData.yOff) * 0.4;
        obj.rotation.x = t * 0.5; obj.rotation.y = t * 0.7;
      }
    });

    // Lights animate
    rimLight.position.x = Math.sin(t*0.3)*4; rimLight.position.z = Math.cos(t*0.3)*3;
    fillLight.position.x = Math.cos(t*0.4)*3; fillLight.position.z = Math.sin(t*0.4)*2;

    raf = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => { renderer.setSize(W(), H()); camera.aspect = W()/H(); camera.updateProjectionMatrix(); }, { signal: sig });

  return{kill(){cancelAnimationFrame(raf);ac.abort();disposeR(renderer);}};
});
