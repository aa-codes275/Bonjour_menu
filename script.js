
const SUPABASE_URL = 'https://uhxgesfiramvubpemytj.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_wU30K91wj7Rsa4QqD0NUOg_ky7N_tGw'; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let menuData = [];
let cart = [];
let currentProduct = null;


async function loadMenu() {
    try {
        const { data, error } = await _supabase.from('products').select('*');
        if (error) throw error;
        menuData = data;
        console.log("تم تحميل البيانات:", data);
    } catch (err) {
        console.error("خطأ في التحميل:", err.message);
    }
}
function sendToWhatsApp() {
    const tableNum = document.getElementById('table-number').value;
    const peopleCount = parseInt(document.getElementById('people-count')?.value || 0); 
    const orderNote = document.getElementById('order-note')?.value || "لا يوجد";

    if (!tableNum) return alert("من فضلك ادخل رقم الطاولة");
    if (!peopleCount || peopleCount <= 0) return alert("من فضلك ادخل عدد الأفراد");

    let msg = `*طلب جديد من Bonjour* ☕\n`;
    msg += `📍 طاولة: ${tableNum}\n`;
    msg += `👥 عدد الأفراد: ${peopleCount}\n`; 
    msg += `--------------------------\n`;

    cart.forEach((item, index) => {
        msg += `*${index + 1}- ${item.name}* (${item.price} EGP)\n`;
    });

  
    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const waterTotal = peopleCount * 12;
    const totalBeforeTax = subtotal + waterTotal;
    const tax = totalBeforeTax * 0.12; 
    const finalTotal = totalBeforeTax + tax;

    msg += `--------------------------\n`;
    msg += `💧 مياه إجبارية (${peopleCount}): ${waterTotal} EGP\n`;
    msg += `✨ القيمة المضافة (12%): ${tax.toFixed(2)} EGP\n`;
    msg += `💰 *الإجمالي النهائي: ${finalTotal.toFixed(2)} EGP*`;

    window.open(`https://wa.me/201204911333?text=${encodeURIComponent(msg)}`);
}

function showCategory(cat) {
    const container = document.getElementById('products-container');
    const nav = document.querySelector('.category-nav');
    const backBtn = document.getElementById('back-container');

    container.innerHTML = "";
    nav.style.display = 'none';
    backBtn.style.display = 'block'; 

   const filtered = menuData.filter(p => p.category === cat && !p.is_hidden);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:50px;">قريباً في Bonjour..</p>`;
    } else {
        filtered.forEach(p => {
            container.innerHTML += `
                <div class="item-row" onclick='openProductPage(${JSON.stringify(p)})' style="cursor:pointer; display:flex; align-items:center; gap:15px; margin-bottom:15px; border-bottom:1px solid #222; padding-bottom:10px;">
                    <div class="item-img" style="width:70px; height:70px; flex-shrink:0;">
                        <img src="${p.image_url || 'img/default.jpg'}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
                    </div>
                    <div class="item-info" style="flex-grow:1;">
                        <div class="item-name" style="font-weight:bold; color:#fff;">${p.name}</div>
                        <small style="color:#666">اضغط للتفاصيل والطلب</small>
                    </div>
                    <div class="item-price" style="color:#ff0000; font-weight:bold;">${p.price} EGP</div>
                </div>`;
        });
    }
    window.scrollTo(0,0);
}
function handleBackAction() {
    const productPage = document.getElementById('product-page');
    
   
    if (productPage.style.display === "block") {
        closeProductPage();
    } 
   
    else {
        goBack();
    }
}


function openProductPage(product) {
    currentProduct = product; 
    
    const page = document.getElementById('product-page');
    const details = document.getElementById('product-details');
    
    page.style.display = "block";
    document.body.style.overflow = "hidden"; 

    let optionsHTML = "";
    if (product.options) {
        optionsHTML = `<div class="options-container" style="text-align:right; margin:15px 0;">`;
        try {
            let opts = (typeof product.options === 'string') ? JSON.parse(product.options) : product.options;
            
            for (const [key, value] of Object.entries(opts)) {
                optionsHTML += `
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; color:#ffdf00; font-weight:bold;">${key}:</label>
                        <select class="product-option-select" data-option-name="${key}" style="width:100%; padding:12px; background:#1a1a1a; color:white; border:1px solid #333; border-radius:8px; font-family:'Cairo';">`;

               
                if (Array.isArray(value)) {
                    value.forEach(opt => {
                        if (typeof opt === 'object') {
                           
                            optionsHTML += `<option value="${opt.name}" data-price="${opt.price}">${opt.name} ${opt.price > 0 ? '(+' + opt.price + ' ج.م)' : ''}</option>`;
                        } else {
                            
                            optionsHTML += `<option value="${opt}" data-price="0">${opt}</option>`;
                        }
                    });
                } else {
                    const optionsArray = value.toString().split(',').map(opt => opt.trim());
                    optionsArray.forEach(opt => {
                        optionsHTML += `<option value="${opt}" data-price="0">${opt}</option>`;
                    });
                }

                optionsHTML += `</select></div>`;
            }
        } catch (e) { console.error("Error parsing options:", e); }
        optionsHTML += `</div>`;
    }

    details.innerHTML = `
        <img src="${product.image_url || 'img/default.jpg'}" 
             style="width: 150px; height: 150px; object-fit: cover; display: block; margin: 10px auto; border-radius: 15px; border: 2px solid #ffdf00; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
        
        <h2 style="margin: 10px 0; color:#fff; font-size: 22px; text-align:center;">${product.name}</h2>
        <h3 style="color:#ffdf00; margin-bottom: 15px; text-align:center;">السعر: ${product.price} EGP</h3>
        
        ${optionsHTML}

        <div style="margin-top: 15px; text-align: right; width: 100%;">
            <label style="display: block; margin-bottom: 5px; color: #ffdf00; font-weight: bold; font-size: 14px;">ملاحظات :</label>
            <textarea id="custom-item-note" placeholder=" هل تريد اضافة الي الطلب...." 
                style="width: 100%; height: 65px; padding: 10px; border-radius: 8px; border: 1px solid #333; background: #1a1a1a; color: white; font-family: 'Cairo'; resize: none; font-size: 13px; outline: none;"></textarea>
        </div>
    `;
}
function closeProductPage() {
    const page = document.getElementById('product-page');
    page.style.display = "none";
    
    
    document.body.style.overflow = "auto";
}
function openCart() {
    const cartDrawer = document.getElementById('cart-drawer'); // تأكد من الـ ID بتاع حاوية السلة عندك
    if (cartDrawer) {
        cartDrawer.style.display = "block";
        
    }
}

function openRatingModal() {
    const modal = document.getElementById('rating-modal');
    if (modal) {
        modal.style.display = 'flex';
      
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }
}


function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.display = 'flex';
      
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }
}

function closeRatingModal() {
    document.getElementById('rating-modal').style.display = 'none';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
}


window.onclick = function(event) {
    const rateModal = document.getElementById('rating-modal');
    const payModal = document.getElementById('payment-modal');
    if (event.target == rateModal) closeRatingModal();
    if (event.target == payModal) closePaymentModal();
}
function addToCart() {
    if (!currentProduct) return;

    let extraPrice = 0;
    const selectedOptions = {};
    const selects = document.querySelectorAll('.product-option-select');
    
    selects.forEach(select => {
        const optionName = select.getAttribute('data-option-name');
        selectedOptions[optionName] = select.value;

       
        const selectedOptionElement = select.options[select.selectedIndex];
        const priceModifier = parseFloat(selectedOptionElement.getAttribute('data-price')) || 0;
        extraPrice += priceModifier;
    });

    const noteInput = document.getElementById('custom-item-note');
    const specialNote = noteInput ? noteInput.value.trim() : "";

    const orderItem = {
        name: currentProduct.name,
       
        price: parseFloat(currentProduct.price) + extraPrice,
        userChoices: selectedOptions,
        itemNote: specialNote, 
        image_url: currentProduct.image_url
    };

    cart.push(orderItem);
    
   
    updateCartUI();
    
  
    closeProductPage();

   
    openCart(); 

   
    const cartIcon = document.getElementById('cart-icon-container');
    if(cartIcon) {
        cartIcon.classList.add('bounce-animation');
        setTimeout(() => cartIcon.classList.remove('bounce-animation'), 500);
    }
}
function updateCartUI() {
    const list = document.getElementById('cart-items-list');
    const count = document.getElementById('cart-count');
    const totalDisp = document.getElementById('cart-total');
    
    
    const peopleInput = document.getElementById('people-count');
    const peopleCount = peopleInput ? parseInt(peopleInput.value) || 0 : 0;


    if (!list || !totalDisp) return; 

    list.innerHTML = "";
    let subtotal = 0; 

    cart.forEach((item, index) => {
        const itemPrice = parseFloat(item.price) || 0;
        subtotal += itemPrice;
        
        let optionsSummary = "";
        if (item.userChoices) {
            optionsSummary = Object.entries(item.userChoices)
                .map(([key, val]) => `<small style="display:block; color:#aaa; font-size:12px;">${key}: ${val}</small>`)
                .join("");
        }

        let noteSummary = item.itemNote ? `<small style="display:block; color:#ff4500; font-size:12px; font-weight:bold;">ملاحظة: ${item.itemNote}</small>` : "";

        list.innerHTML += `
            <div style="padding:10px; border-bottom:1px solid #333; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                <div style="text-align:right;">
                    <span style="font-weight:bold; display:block;">${item.name}</span>
                    ${optionsSummary} 
                    ${noteSummary}
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:#ff4500;">${itemPrice} EGP</span>
                    <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff4500; cursor:pointer; font-size:18px;">✕</button>
                </div>
            </div>`;
    });
    
   
    const waterPrice = peopleCount * 12; 
    const subtotalWithWater = subtotal + waterPrice;
    const tax = subtotalWithWater * 0.12; 
    const finalTotal = subtotalWithWater + tax;
  
    if (count) count.innerText = cart.length;
    
    totalDisp.innerHTML = `
        <div style="display:flex; justify-content:space-between; font-size:14px; color:#888; margin-bottom:5px;">
            <span>المجموع:</span>
            <span>${subtotal.toFixed(2)} EGP</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:14px; color:#00ff00; margin-bottom:5px;">
            <span>مياه إجبارية (${peopleCount} أفراد):</span>
            <span>${waterPrice.toFixed(2)} EGP</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:14px; color:#888; margin-bottom:5px;">
            <span>قيمة مضافة (12%):</span>
            <span>${tax.toFixed(2)} EGP</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:18px; color:#ff0000; font-weight:bold; border-top:1px solid #444; padding-top:5px;">
            <span>الإجمالي:</span>
            <span>${finalTotal.toFixed(2)} EGP</span>
        </div>
    `;
}


function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function toggleCartSidebar() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

function goBack() {
    document.querySelector('.category-nav').style.display = 'grid';
    document.getElementById('back-container').style.display = 'none';
    document.getElementById('products-container').innerHTML = "";
}

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlRoot = document.documentElement;


const savedTheme = localStorage.getItem('Bonjour-theme') || 'coffee';
if (savedTheme === 'gold') {
    htmlRoot.setAttribute('data-theme', 'gold');
    themeIcon.innerText = '⭐';
}

themeToggle.addEventListener('click', () => {
    const isGold = htmlRoot.getAttribute('data-theme') === 'gold';
    
    if (isGold) {
        htmlRoot.removeAttribute('data-theme');
        themeIcon.innerText = '🌙'; 
        localStorage.setItem('Bonjour-theme', 'coffee');
    } else {
        htmlRoot.setAttribute('data-theme', 'gold');
        themeIcon.innerText = '⭐';
        localStorage.setItem('Bonjour-theme', 'gold');
    }
    
    
    themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => themeToggle.style.transform = 'rotate(0deg)', 400);
});


function openRatingModal() {
    const modal = document.getElementById('rating-modal');
    if(modal) modal.style.display = 'flex';
}

function openPaymentModal() {
    const modal = document.getElementById('payment-modal');
    if(modal) modal.style.display = 'flex';
}


function closeRatingModal() { document.getElementById('rating-modal').style.display = 'none'; }
function closePaymentModal() { document.getElementById('payment-modal').style.display = 'none'; }


document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
        const val = e.target.getAttribute('data-value');
        selectedRating = val;
        
        document.querySelectorAll('.star').forEach(s => {
            s.style.filter = s.getAttribute('data-value') <= val ? 'grayscale(0)' : 'grayscale(1)';
            s.style.textShadow = s.getAttribute('data-value') <= val ? '0 0 10px #ffdf00' : 'none';
        });
    });
});
let selectedRatingValue = 0; 


document.querySelectorAll('.star').forEach(star => {
    star.style.cursor = "pointer";
    star.onclick = function() {
        selectedRatingValue = parseInt(this.getAttribute('data-value'));
        
       
        document.querySelectorAll('.star').forEach(s => {
            const val = parseInt(s.getAttribute('data-value'));
            if (val <= selectedRatingValue) {
                s.style.filter = 'grayscale(0)';
                s.style.opacity = '1';
                s.style.textShadow = '0 0 10px #ffdf00';
            } else {
                s.style.filter = 'grayscale(1)';
                s.style.opacity = '0.4';
                s.style.textShadow = 'none';
            }
        });
    };
});


async function submitRating() {
    const commentField = document.getElementById('rating-comment');
    const comment = commentField ? commentField.value : "";
    const adminPhone = "201204911333";

    if (selectedRatingValue === 0) {
        alert("يا فنان اختر النجوم أولاً ⭐");
        return;
    }

  
    const starsEmoji = "⭐".repeat(selectedRatingValue);
    const msg = `*تقييم جديد لـ Bonjour* ✨%0A%0A` +
                `*التقييم:* ${starsEmoji} (${selectedRatingValue}/5)%0A` +
                `*الملاحظة:* ${comment || 'بدون ملاحظات'}`;
    
  
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminPhone}&text=${msg}`;

    try {
        // محاولة سريعة للحفظ في Supabase (اختياري)
        if (typeof _supabase !== 'undefined') {
            await _supabase.from('ratings').insert([{ 
                stars: selectedRatingValue, 
                comment: comment,
                created_at: new Date() 
            }]);
        }
    } catch (e) {
        console.log("Supabase error ignored to open WhatsApp");
    }

    alert("شكراً لتقييمك! جاري تحويلك للواتساب..");
    window.location.href = whatsappUrl; 
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const nav = document.querySelector('.category-nav');
            const backBtn = document.getElementById('back-container');

            if (searchTerm === "") {
                goBack();
                return;
            }

            nav.style.display = 'none';
            backBtn.style.display = 'block';

         
            const filtered = menuData.filter(p => 
                (p.name.toLowerCase().includes(searchTerm) || 
                 (p.description && p.description.toLowerCase().includes(searchTerm))) &&
                p.is_visible !== false
            );
            displaySearchResults(filtered);
        });
    }
});

function displaySearchResults(results) {
    const container = document.getElementById('products-container');
    container.innerHTML = "";
    if (results.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:50px; color:#888;">لا توجد نتائج للبحث .. ☕</p>`;
        return;
    }
    results.forEach(p => {
        container.innerHTML += `
            <div class="item-row" onclick='openProductPage(${JSON.stringify(p)})' style="cursor:pointer; display:flex; align-items:center; gap:15px; margin-bottom:15px; border-bottom:1px solid #222; padding-bottom:10px;">
                <div class="item-img" style="width:70px; height:70px; flex-shrink:0;">
                    <img src="${p.image_url || 'img/default.jpg'}" style="width:100%; height:100%; object-fit:cover; border-radius:8px; border:1px solid #ffdf00;">
                </div>
                <div class="item-info" style="flex-grow:1;">
                    <div class="item-name" style="font-weight:bold; color:#fff;">${p.name}</div>
                    <small style="color:#666">${p.category || 'صنف'}</small>
                </div>
                <div class="item-price" style="color:#ffdf00; font-weight:bold;">${p.price} EGP</div>
            </div>`;
    });
}
function callWaiter() {
    const phoneNumber = "201204911333";

   
    const modalHtml = `
        <div id="waiter-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:9999; font-family:'Cairo', sans-serif;">
            <div style="background:#1a1a1a; padding:25px; border-radius:15px; border:2px solid #ffdf00; width:85%; max-width:320px; text-align:center; box-shadow:0 0 20px rgba(255,223,0,0.2);">
                <h3 style="color:#ffdf00; margin-bottom:15px; font-size:18px;">طلب ويتر 🔔</h3>
                <p style="color:#ccc; font-size:14px; margin-bottom:15px;">من فضلك ادخل رقم الطاولة بالأسفل</p>
                
                <input type="number" id="modal-table-num" placeholder="رقم الطاولة" 
                    style="width:100%; padding:12px; border-radius:8px; border:1px solid #333; background:#000; color:#fff; text-align:center; font-size:18px; margin-bottom:20px; outline:none; border:1px solid #ffdf00;">
                
                <div style="display:flex; gap:10px;">
                    <button id="cancel-waiter" style="flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:transparent; color:#888; cursor:pointer;">إلغاء</button>
                    <button id="confirm-waiter" style="flex:2; padding:10px; border-radius:8px; border:none; background:#ffdf00; color:#000; font-weight:bold; cursor:pointer;">إرسال الطلب</button>
                </div>
            </div>
        </div>
    `;

   
    document.body.insertAdjacentHTML('beforeend', modalHtml);

   
    document.getElementById('cancel-waiter').onclick = function() {
        document.getElementById('waiter-modal').remove();
    };

   
    document.getElementById('confirm-waiter').onclick = function() {
        const tableNumber = document.getElementById('modal-table-num').value;

        if (!tableNumber || tableNumber.trim() === "") {
            alert("لازم تكتب رقم الطاولة الأول 😊");
            return;
        }

        const message = `طلب ويتر من Bonjour Coffee 🔔%0A📍 رقم الطاولة: ${tableNumber}%0Aالوقت: ${new Date().toLocaleTimeString('ar-EG')}`;
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

       
        document.getElementById('waiter-modal').remove();
        alert(`ثواني والويتر هيكون عندك عند طاولة ${tableNumber}.. ✨`);
        window.open(whatsappUrl, '_blank');
    };
}



document.addEventListener("DOMContentLoaded", loadMenu);
