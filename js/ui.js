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

// ──────────────── CUSTOM CURSOR (REMOVED) ────────────────

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

// ──────────────── TITLE ANIMATIONS ────────────────
// Wrap each word in .sh2 with .t-word spans for staggered reveal
$$('.sh2').forEach(h2 => {
  // Skip if already has .text-anim (About section uses its own anim)
  if (h2.classList.contains('text-anim')) return;

  const walk = node => {
    if (node.nodeType === 3) { // Text node
      const text = node.textContent;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 't-word';
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === 1 && node.tagName !== 'BR') {
      // Element node — recurse into children
      [...node.childNodes].forEach(walk);
    }
  };
  [...h2.childNodes].forEach(walk);

  // Assign stagger index --wi to each .t-word
  h2.querySelectorAll('.t-word').forEach((w, i) => w.style.setProperty('--wi', i));
});

// Observe .sh2 and .sey for scroll-triggered reveal
const titleObs = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('t-vis');
      titleObs.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
$$('.sh2').forEach(el => { if (!el.classList.contains('text-anim')) titleObs.observe(el); });
$$('.sey').forEach(el => titleObs.observe(el));

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

// ═══════════════════════════════════════════════════════════════
//  NUEVAS FUNCIONALIDADES — 15 Features
// ═══════════════════════════════════════════════════════════════

// ──────────────── 1. DARK/LIGHT MODE TOGGLE ────────────────
(function () {
  const btn = $('#themeToggle');
  if (!btn) return;
  const saved = localStorage.getItem('chicha-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('chicha-theme', next);
  });
})();

// ──────────────── 2. HERO COUNTER ANIMATION ────────────────
(function () {
  const el = $('#chichaCounter');
  if (!el) return;
  const target = 12450;
  let animated = false;

  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && !animated) {
        animated = true;
        let current = 0;
        const duration = 2000;
        const step = target / (duration / 16);
        const tick = () => {
          current = Math.min(current + step, target);
          el.textContent = Math.floor(current).toLocaleString('es-VE');
          if (current < target) requestAnimationFrame(tick);
        };
        tick();
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counterObs.observe(el.closest('.hero-counter') || el);
})();

// ──────────────── 3. CHICHA DEL MES COUNTDOWN ────────────────
(function () {
  const dEl = $('#cdmDays'), hEl = $('#cdmHours'), mEl = $('#cdmMins'), sEl = $('#cdmSecs');
  if (!dEl) return;

  // End of current month
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  function update() {
    const diff = Math.max(0, endOfMonth - new Date());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    dEl.textContent = String(d).padStart(2, '0');
    hEl.textContent = String(h).padStart(2, '0');
    mEl.textContent = String(m).padStart(2, '0');
    sEl.textContent = String(s).padStart(2, '0');
  }
  update();
  setInterval(update, 1000);
})();

// ──────────────── 4. MENU FILTERS ────────────────
(function () {
  const btns = $$('.mf-btn');
  const cards = $$('.dc[data-category]');
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const cats = card.dataset.category || '';
        if (filter === 'all' || cats.includes(filter)) {
          card.classList.remove('filtered-out');
          card.style.position = '';
        } else {
          card.classList.add('filtered-out');
        }
      });
    });
  });
})();

// ──────────────── 5. CART SYSTEM ────────────────
(function () {
  const cartDrawer = $('#cartDrawer');
  const cartOverlay = $('#cartOverlay');
  const cartToggle = $('#cartToggle');
  const cartClose = $('#cartClose');
  const cartBadge = $('#cartBadge');
  const cartItems = $('#cartItems');
  const cartFooter = $('#cartFooter');
  const cartTotal = $('#cartTotal');
  const cartWaBtn = $('#cartWaBtn');
  if (!cartDrawer) return;

  let cart = [];

  function openCart() { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); document.body.style.overflow = ''; }

  cartToggle.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  function renderCart() {
    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="cart-empty"><span>🛒</span><p>Tu carrito está vacío</p></div>';
      cartFooter.style.display = 'none';
      cartBadge.classList.remove('show');
      cartBadge.textContent = '0';
      return;
    }

    const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
    cartBadge.textContent = cart.reduce((s, it) => s + it.qty, 0);
    cartBadge.classList.add('show');
    cartFooter.style.display = '';
    cartTotal.textContent = '$' + total;

    cartItems.innerHTML = cart.map((it, i) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${it.name}</div>
          <div class="cart-item-price">$${it.price} c/u</div>
        </div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" data-action="dec" data-idx="${i}">−</button>
          <span class="cart-qty-num">${it.qty}</span>
          <button class="cart-qty-btn" data-action="inc" data-idx="${i}">+</button>
        </div>
      </div>
    `).join('');

    // WhatsApp link
    const phone = '584241379696';
    let msg = '¡Hola! Quiero hacer un pedido:%0A%0A';
    cart.forEach(it => { msg += `• ${it.name} x${it.qty} ($${it.price * it.qty})%0A`; });
    msg += `%0A*Total: $${total}*`;
    cartWaBtn.href = `https://wa.me/${phone}?text=${msg}`;
  }

  // Qty buttons
  cartItems.addEventListener('click', e => {
    const btn = e.target.closest('.cart-qty-btn');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    if (btn.dataset.action === 'inc') cart[idx].qty++;
    else {
      cart[idx].qty--;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
    }
    renderCart();
  });

  // Add to cart from any .cart-add or .combo-btn or .cdm-order
  document.addEventListener('click', e => {
    const btn = e.target.closest('.cart-add, .combo-btn, .cdm-order');
    if (!btn || !btn.dataset.name) return;
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const existing = cart.find(it => it.name === name);
    if (existing) existing.qty++;
    else cart.push({ name, price, qty: 1 });
    renderCart();
    showToast('🛒', `<strong>${name}</strong> agregado al carrito`);
  });

  renderCart();
})();

// ──────────────── 6. WHATSAPP FLOAT ────────────────
(function () {
  const wa = $('#waFloat');
  if (!wa) return;
  setTimeout(() => wa.classList.add('show'), 5000);
})();

// ──────────────── 7. TOAST NOTIFICATIONS ────────────────
function showToast(icon, text) {
  const container = $('#toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${text}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Fake social proof toasts
(function () {
  const names = ['María', 'Carlos', 'Ana', 'José', 'Luisa', 'Pedro', 'Carmen', 'Diego', 'Sofía', 'Gabriel'];
  const products = ['Chicha Tradicional', 'Chicha Andina', 'Papelón con Limón', 'Chicha Ligada', 'Combo Familiar'];
  const zones = ['La Pastora', 'Catia', 'El Paraíso', 'San Martín', 'Chacao', 'Altamira'];

  function fakeToast() {
    const name = names[Math.floor(Math.random() * names.length)];
    const prod = products[Math.floor(Math.random() * products.length)];
    const zone = zones[Math.floor(Math.random() * zones.length)];
    showToast('🔥', `<strong>${name}</strong> de ${zone} pidió ${prod}`);
  }

  // First toast after 25s, then every 35-55s
  setTimeout(() => {
    fakeToast();
    setInterval(fakeToast, 35000 + Math.random() * 20000);
  }, 25000);
})();

// ──────────────── 8. FAQ ACCORDION ────────────────
(function () {
  $$('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      // Close all
      $$('.faq-item').forEach(fi => fi.classList.remove('open'));
      // Toggle current
      if (!wasOpen) item.classList.add('open');
    });
  });
})();

// ──────────────── 9. RIPPLE EFFECT ────────────────
(function () {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.ca, .combo-btn, .cdm-order, .ncta, .sub, .mf-btn, .cart-wa-btn');
    if (!btn) return;
    btn.classList.add('ripple');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.width = wave.style.height = size + 'px';
    wave.style.left = (e.clientX - rect.left - size / 2) + 'px';
    wave.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(wave);
    setTimeout(() => wave.remove(), 600);
  });
})();

// ──────────────── 10. PARALLAX ON ABOUT SECTION ────────────────
(function () {
  const about = $('#about');
  if (!about) return;
  about.classList.add('parallax-section');
  window.addEventListener('scroll', () => {
    const rect = about.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) {
      const offset = (rect.top / innerHeight) * 30;
      about.style.backgroundPositionY = offset + 'px';
    }
  }, { passive: true });
})();

// ──────────────── 11. IMAGE LOADING OPTIMIZATION ────────────────
(function () {
  const imgs = $$('img');
  imgs.forEach((img, idx) => {
    if (idx > 2) img.loading = 'lazy';
    img.decoding = 'async';
  });
})();

// ──────────────── 12. FAQ ACCESSIBILITY ATTRIBUTES ────────────────
(function () {
  $$('.faq-item').forEach((item, i) => {
    const btn = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');
    if (!btn || !panel) return;
    const panelId = `faq-panel-${i + 1}`;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', panelId);
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-hidden', 'true');
  });

  $$('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const panel = item.querySelector('.faq-a');
      if (panel) panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    });
  });
})();

// ──────────────── 13. NEWSLETTER FORM ────────────────
(function () {
  const form = $('#newsletterForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#newsletterEmail');
    const email = (input?.value || '').trim();
    if (!email) return;
    showToast('📩', `<strong>${email}</strong> suscrito correctamente`);
    form.reset();
  });
})();
