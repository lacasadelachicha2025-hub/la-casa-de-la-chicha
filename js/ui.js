/* ═══════════════════════════════════════════════════════════════
   UI — Loader, Cursor, Navigation, Scroll, Forms, Interactions
   ═══════════════════════════════════════════════════════════════ */

// ──────────────── LOADER ────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    const L = $('#loader');
    L.style.transition = 'clip-path 1.1s cubic-bezier(.77,0,.18,1)';
    L.style.clipPath = 'polygon(0 0,100% 0,100% 0,0 0)';
    setTimeout(() => L.remove(), 1200);
  }, 2800);
});

// ──────────────── SCROLL PROGRESS + NAV ────────────────
window.addEventListener('scroll', () => {
  $('#prog').style.width = (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
  $('#nav').classList.toggle('stuck', scrollY > 80);
});

// ──────────────── CUSTOM CURSOR ────────────────
const c1 = $('#c1'), c2 = $('#c2');
let rx = 0, ry = 0;
(function ac() {
  rx += (MX - rx) * .13;
  ry += (MY - ry) * .13;
  c1.style.left = MX + 'px'; c1.style.top = MY + 'px';
  c2.style.left = rx + 'px'; c2.style.top = ry + 'px';
  requestAnimationFrame(ac);
})();
$$('a,button,.dc,.mi,.tc,.ec,.il').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cg'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cg'));
});

// ──────────────── HERO REVEAL ────────────────
setTimeout(() => {
  $$('.hey,.hcp,.has').forEach((el, i) => {
    el.style.transition = `opacity .8s cubic-bezier(.16,1,.3,1) ${3 + i * .2}s,transform .8s cubic-bezier(.16,1,.3,1) ${3 + i * .2}s`;
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  $$('.h1i').forEach((el, i) => {
    el.style.transition = `transform .9s cubic-bezier(.16,1,.3,1) ${3.1 + i * .15}s`;
    el.style.transform = 'none';
  });
  const hs = $('.hscrl');
  hs.style.transition = 'opacity .6s ease 4s';
  hs.style.opacity = '1';
}, 100);

// ──────────────── SCROLL REVEAL ────────────────
const obs = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('vis');
      obs.unobserve(e.target);
    }
  });
}, { threshold: .1 });
$$('[data-rv]').forEach(el => obs.observe(el));

// ──────────────── MENU DRAG SCROLL ────────────────
const ms = $('#ms');
let dn = false, sx, sl;
ms.addEventListener('mousedown', e => { dn = true; sx = e.pageX - ms.offsetLeft; sl = ms.scrollLeft; });
ms.addEventListener('mouseleave', () => dn = false);
ms.addEventListener('mouseup', () => dn = false);
ms.addEventListener('mousemove', e => {
  if (!dn) return;
  e.preventDefault();
  ms.scrollLeft = sl - (e.pageX - ms.offsetLeft - sx) * 1.5;
});
$('#mL').addEventListener('click', () => ms.scrollBy({ left: -360, behavior: 'smooth' }));
$('#mR').addEventListener('click', () => ms.scrollBy({ left: 360, behavior: 'smooth' }));

// ──────────────── RESERVATION FORM ────────────────
function sndR(e) {
  e.preventDefault();
  const b = $('#sb');
  b.classList.add('sent');
  b.textContent = '✓ ¡Reserva Confirmada!';
  setTimeout(() => {
    b.classList.remove('sent');
    b.textContent = 'Confirmar Reserva →';
  }, 4000);
}

// ──────────────── BACK TO TOP ────────────────
(function () {
  const btn = $('#backTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', scrollY > 600);
  });
})();
