// ===== SUPABASE =====
const SUPABASE_URL = 'https://uhxgesfiramvubpemytj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wU30K91wj7Rsa4QqD0NUOg_ky7N_tGw';
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== STATE =====
let menuData    = [];
let cart        = [];
let activeCat   = null;
let curProduct  = null;

// ===== LOAD DATA =====
async function loadMenu() {
  try {
    const { data, error } = await _sb.from('products').select('*');
    if (error) throw error;
    menuData = data || [];
  } catch (e) {
    console.error('Supabase error:', e.message);
    menuData = [];
  }
  renderProducts();
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const grid   = document.getElementById('products');
  const search = document.getElementById('searchInput').value.trim().toLowerCase();

  let list = menuData.filter(p => !p.is_hidden);
  if (activeCat)  list = list.filter(p => p.category === activeCat);
  if (search)     list = list.filter(p => p.name.toLowerCase().includes(search));

  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:rgba(255,255,255,0.28);">
        <div style="font-size:56px;margin-bottom:14px;opacity:.35;">☕</div>
        <p style="font-size:15px;font-weight:700;">${search ? 'لا توجد نتائج' : 'قريباً في Bonjour..'}</p>
      </div>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick   = () => openProduct(p);

    const imgHTML = p.image_url
      ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';

    card.innerHTML = `
      <div class="card-img-wrap">
        ${imgHTML}
        <div class="card-img-emoji" style="${p.image_url ? 'display:none' : ''}">☕</div>
        <div class="card-img-gradient"></div>
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-footer">
          <span class="card-price">${p.price} EGP</span>
          <button class="add-btn" onclick="event.stopPropagation();openProduct(window.__products[${p.id}])">+</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  // Store by id for quick access from inline onclick
  window.__products = {};
  list.forEach(p => window.__products[p.id] = p);
}

// ===== CATEGORY =====
function setCat(cat) {
  activeCat = cat;
  document.getElementById('searchInput').value = '';
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  const key = cat === null ? 'all' : cat;
  document.querySelector(`.cat-btn[data-cat="${key}"]`)?.classList.add('active');
  renderProducts();
}

// ===== PRODUCT SHEET =====
function openProduct(p) {
  curProduct = p;
  open_bd('prod-back'); show_sheet('product-sheet');
  document.body.style.overflow = 'hidden';

  // image
  const imgWrap = document.getElementById('p-img');
  imgWrap.innerHTML = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}"
            onerror="this.style.display='none';this.parentElement.innerHTML+='<span style=font-size:52px>☕</span>'">`
    : '☕';

  document.getElementById('p-name').textContent  = p.name;
  document.getElementById('p-price').textContent = `السعر الأساسي: ${p.price} EGP`;
  document.getElementById('p-note').value        = '';

  // options
  const optsDiv = document.getElementById('p-opts');
  optsDiv.innerHTML = '';
  if (p.options) {
    try {
      const opts = typeof p.options === 'string' ? JSON.parse(p.options) : p.options;
      for (const [key, vals] of Object.entries(opts)) {
        let html = `<label class="opt-label">${key}:</label><select class="opt-select" data-key="${key}">`;
        const arr = Array.isArray(vals) ? vals : String(vals).split(',').map(v => v.trim());
        arr.forEach(v => {
          const name  = typeof v === 'object' ? v.name  : v;
          const price = typeof v === 'object' ? v.price : 0;
          html += `<option value="${name}" data-price="${price}">${name}${price > 0 ? ` (+${price} ج.م)` : ''}</option>`;
        });
        html += '</select>';
        const d = document.createElement('div');
        d.style.marginBottom = '4px';
        d.innerHTML = html;
        optsDiv.appendChild(d);
      }
    } catch(e) { console.error(e); }
  }
}

function closeProduct() {
  close_bd('prod-back'); hide_sheet('product-sheet');
  document.body.style.overflow = '';
  curProduct = null;
}

// ===== ADD TO CART =====
function addToCart() {
  if (!curProduct) return;
  let extra = 0;
  const choices = {};
  document.querySelectorAll('#p-opts .opt-select').forEach(sel => {
    choices[sel.dataset.key] = sel.value;
    extra += parseFloat(sel.options[sel.selectedIndex].dataset.price || 0);
  });
  cart.push({
    name: curProduct.name,
    price: parseFloat(curProduct.price) + extra,
    userChoices: choices,
    itemNote: document.getElementById('p-note').value.trim()
  });
  closeProduct();
  updateBadge();
  toast(`تمت إضافة ${curProduct.name} للسلة`);
}

// ===== CART =====
function openCart() {
  open_bd('cart-back'); document.getElementById('cart-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCart();
}

function closeCart() {
  close_bd('cart-back'); document.getElementById('cart-sheet').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCart() {
  const list = document.getElementById('cart-list');
  list.innerHTML = '';

  if (!cart.length) {
    list.innerHTML = `<div class="cart-empty"><div style="font-size:48px;margin-bottom:12px">🛒</div><p style="font-size:14px;font-weight:600">السلة فارغة</p></div>`;
    renderTotal(); return;
  }

  cart.forEach((item, i) => {
    const choices = Object.entries(item.userChoices || {}).map(([k,v]) => `${k}: ${v}`).join(' • ');
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.style.animationDelay = `${i * 0.04}s`;
    div.innerHTML = `
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        ${choices   ? `<div class="ci-choices">${choices}</div>`       : ''}
        ${item.itemNote ? `<div class="ci-note">📝 ${item.itemNote}</div>` : ''}
      </div>
      <div class="ci-right">
        <span class="ci-price">${item.price} EGP</span>
        <button class="rm-btn" onclick="removeItem(${i})">✕</button>
      </div>`;
    list.appendChild(div);
  });
  renderTotal();
}

function removeItem(i) {
  cart.splice(i, 1);
  updateBadge();
  renderCart();
}

function updateBadge() {
  const b = document.getElementById('cart-badge');
  if (cart.length) { b.style.display = 'flex'; b.textContent = cart.length; }
  else b.style.display = 'none';
}

function renderTotal() {
  const box     = document.getElementById('total-box');
  const people  = parseInt(document.getElementById('people-n').value || '0') || 0;
  if (!cart.length || !people) { box.style.display = 'none'; return; }

  const sub     = cart.reduce((s, i) => s + i.price, 0);
  const water   = people * 12;
  const before  = sub + water;
  const tax     = before * 0.12;
  const final   = before + tax;

  box.style.display = 'block';
  box.innerHTML = `
    <div class="t-row"><span>${sub.toFixed(2)} EGP</span><span>المطلوبات</span></div>
    <div class="t-row"><span>${water} EGP</span><span> مياه </span></div>
    <div class="t-row"><span>${tax.toFixed(2)} EGP</span><span> خدمه 12%</span></div>
    <div class="t-final"><span>${final.toFixed(2)} EGP</span><span> الإجمالي </span></div>`;
}

// ===== SEND WHATSAPP =====
function sendWA() {
  const table   = document.getElementById('table-n').value;
  const people  = parseInt(document.getElementById('people-n').value || '0');
  const note    = document.getElementById('order-note').value || 'لا يوجد';

  if (!table)               return alert('من فضلك ادخل رقم الطاولة');
  if (!people || people<=0) return alert('من فضلك ادخل عدد الأفراد');

  let msg = `*طلب جديد من Bonjour* \n طاولة: ${table}\n عدد الأفراد: ${people}\n--------------------------\n`;

  cart.forEach((item, i) => {
    msg += `*${i+1}- ${item.name}* (${item.price} EGP)\n`;
    const ch = Object.entries(item.userChoices||{}).map(([k,v])=>`${k}: ${v}`).join(', ');
    if (ch)          msg += `   الاختيارات: ${ch}\n`;
    if (item.itemNote) msg += `   ملاحظة: ${item.itemNote}\n`;
  });

  const sub    = cart.reduce((s,i)=>s+i.price,0);
  const water  = people*12;
  const before = sub+water;
  const tax    = before*0.12;
  const final  = before+tax;

  msg += `--------------------------\n`;
  if (note !== 'لا يوجد') msg += `📝 ملاحظة: ${note}\n`;
  msg += ` مياه : ${water} EGP\n`;
  msg += ` خدمه  12%: ${tax.toFixed(2)} EGP\n`;
  msg += ` *الإجمالي : ${final.toFixed(2)} EGP*`;

  window.open(`https://wa.me/201204911333?text=${encodeURIComponent(msg)}`);
}

// ===== PAYMENT =====
function openPayment() {
  open_bd('pay-backdrop');
  document.getElementById('pay-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closePayment() {
  close_bd('pay-backdrop');
  document.getElementById('pay-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ===== WAITER =====
function callWaiter() {
  const t = prompt('من فضلك اكتب رقم الطاولة أولاً 😊:');
  if (t === null) return;
  if (!t.trim()) { alert('يجب إدخال رقم الطاولة لطلب الويتر!'); return; }
  const time = new Date().toLocaleTimeString('ar-EG');
  window.open(`https://wa.me/201204911333?text=${encodeURIComponent(`طلب ويتر من Bonjour Coffee 🔔\n📍 رقم الطاولة: ${t}\nالوقت: ${time}`)}`);
}

// ===== BRANCH DROPDOWN =====
function toggleBranch(e) {
  e.stopPropagation();
  document.getElementById('branchDD').classList.toggle('open');
}
document.addEventListener('click', () => document.getElementById('branchDD')?.classList.remove('open'));

// ===== TOAST =====
let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  document.getElementById('toast-txt').textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ===== HELPERS =====
function open_bd(id)   { document.getElementById(id).classList.add('open'); }
function close_bd(id)  { document.getElementById(id).classList.remove('open'); }
function show_sheet(id){ document.getElementById(id).classList.add('open'); }
function hide_sheet(id){ document.getElementById(id).classList.remove('open'); }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();

  document.getElementById('searchInput').addEventListener('input', e => {
    if (e.target.value) { activeCat = null; document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active')); }
    else document.querySelector('.cat-btn[data-cat="all"]')?.classList.add('active');
    renderProducts();
  });

  document.getElementById('people-n').addEventListener('input', renderTotal);
});
