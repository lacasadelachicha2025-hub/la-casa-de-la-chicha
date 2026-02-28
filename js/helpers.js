/* ═══════════════════════════════════════════════════════════════
   HELPERS — Global Utilities & Three.js Factory Functions
   ═══════════════════════════════════════════════════════════════ */

// DOM helpers
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// Global mouse position
let MX = 0, MY = 0;
document.addEventListener('mousemove', e => { MX = e.clientX; MY = e.clientY; });

// Three.js — Renderer factory
function mkR(c, a = true) {
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: a, antialias: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  return r;
}

// Three.js — Camera factory
function mkC(f, w, h, z = 5) {
  const c = new THREE.PerspectiveCamera(f, w / h, .1, 300);
  c.position.z = z;
  return c;
}

// Three.js — Standard lighting rig
function lgts(s, a = 0x4A90D9, b = 0x1A3A6B) {
  s.add(new THREE.AmbientLight(0x081428, .5));
  const d = new THREE.DirectionalLight(a, 2);
  d.position.set(3, 4, 3);
  s.add(d);
  const p = new THREE.PointLight(b, 4, 12);
  p.position.set(-3, -2, 1);
  s.add(p);
}
