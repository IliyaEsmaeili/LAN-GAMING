// ==========================================
// تنظیمات پایه API 
// ==========================================
const BASE_API_URL = 'api'; // آدرس پایه بک‌اند

// ==========================================
// توابع کمکی برای درخواست‌های شبکه (Fetch)
// ==========================================


async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    const config = {
        method: method,
        headers: headers,
        credentials: 'include' 
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_API_URL}${endpoint}`, config);
        const data = await response.text();
        let parsedData = {};
        try { parsedData = data ? JSON.parse(data) : {}; } catch(e) {}
        
        return {
            status: response.status,
            ok: response.ok,
            data: parsedData
        };
    } catch (error) {
        console.error('API Error:', error);
        return { status: 500, ok: false, data: null, error };
    }
}

// ==========================================
// 1. بررسی وضعیت احراز هویت در هنگام لود صفحه
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    // اگر دکمه ورود در صفحه بود، چک کن کاربر لاگین هست یا نه
    const authBtn = document.getElementById('nav-login-btn');
    if (authBtn) {
        const checkAuth = await apiCall('/Users/CheckAuth', 'GET');
        if (checkAuth.ok) {
            handleAuthSuccessUI(); // بروزرسانی ظاهر سایت به حالت لاگین شده
        }
    }
    
    // اگر در صفحه بازی‌ها بودیم، بازی‌ها را از سرور بگیر
    if (document.getElementById('gamesList')) {
        await fetchAndRenderGames();
    }
});





// ==========================================
// 2. UI عمومی (هدر، منوی موبایل و زبان)
// ==========================================
const navbar = document.getElementById('navbar');
const mobileMenuBtn = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-links a, #nav-login-btn');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

if(mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if(navMenu) navMenu.classList.remove('active');
    });
});

function toggleLanguage() {
    alert("شبیه‌سازی تغییر زبان به انگلیسی (به زودی)");
}

// ==========================================
// 3. پاپ‌آپ احراز هویت (ورود و ثبت‌نام)
// ==========================================
const authBtn = document.getElementById('nav-login-btn');
const authModal = document.getElementById('auth-modal');
const closeAuthModal = document.getElementById('close-modal');
const dashboardSection = document.getElementById('user-dashboard');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

if(authBtn && authModal) {
    authBtn.addEventListener('click', () => {
        if (authBtn.innerText.includes("ناحیه کاربری")) {
            if(dashboardSection) dashboardSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            authModal.classList.remove('hidden');
        }
    });

    closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));
    authModal.addEventListener('click', (e) => { if(e.target === authModal) authModal.classList.add('hidden'); });

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active'); tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active'); tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden'); loginForm.classList.add('hidden');
    });

    // تابعی برای تغییر ظاهر سایت پس از لاگین موفق
    function handleAuthSuccessUI(message = null) {
        if(authModal) authModal.classList.add('hidden');
        if(authBtn) {
            authBtn.innerText = "ناحیه کاربری 👤";
            authBtn.classList.replace('primary-btn', 'secondary-btn');
        }
        if(dashboardSection) {
            dashboardSection.classList.remove('hidden');
            setTimeout(() => { dashboardSection.scrollIntoView({ behavior: 'smooth' }); }, 300);
        }
        if(message) alert(message);
    }
    
    // تابعی برای کنترل حالت لودینگ دکمه‌ها
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('is-loading');
        button.disabled = true;
    } else {
        button.classList.remove('is-loading');
        button.disabled = false;
    }
}


    // فرم ورود
   loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    // پیدا کردن دکمه سابمیت داخل این فرم
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    const loginData = {
        Username: usernameInput,
        Password: passwordInput
    };

    // 1. فعال کردن حالت لودینگ
    setButtonLoading(submitBtn, true);

    try {
        const response = await fetch(`${BASE_API_URL}/Users/Login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData),
            credentials: 'include'
        });

        if (response.ok) {
            const responseData = await response.json();
            handleAuthSuccessUI(responseData.message || "ورود با موفقیت انجام شد!");
        } else if (response.status === 401) {
            alert("نام کاربری یا رمز عبور اشتباه است.");
        } else {
            alert("خطایی در سرور رخ داده است.");
        }
    } catch (error) {
        console.error("خطا در ارتباط با سرور:", error);
        alert("ارتباط با سرور برقرار نشد. لطفا اینترنت خود را بررسی کنید.");
    } finally {
        // 2. غیرفعال کردن حالت لودینگ در هر صورت (چه موفق چه خطا)
        setButtonLoading(submitBtn, false);
    }
});


    // فرم ثبت‌نام (متصل به API)
    registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('reg-firstName').value;
    const lastName = document.getElementById('reg-lastName').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirmPassword').value;

    // پیدا کردن دکمه سابمیت داخل این فرم
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    if (password !== confirmPassword) {
        return alert("رمز عبور و تکرار آن مطابقت ندارند!");
    }

    const userData = {
        FirstName: firstName,
        LastName: lastName,
        Username: username,
        Password: password
    };

    // 1. فعال کردن حالت لودینگ
    setButtonLoading(submitBtn, true);

    try {
        const requestUrl = `${BASE_API_URL}/Users/Register`;

        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
            credentials: 'include'
        });

        if (response.status === 201) {
            handleAuthSuccessUI("ثبت‌نام با موفقیت انجام شد!");
        } else {
             // (ادامه کدهای خطای شما که در فایل بود)
             alert("خطا در ثبت نام.");
        }
    } catch (error) {
        console.error("خطا در ارتباط با سرور:", error);
        alert("ارتباط با سرور برقرار نشد.");
    } finally {
        // 2. غیرفعال کردن حالت لودینگ
        setButtonLoading(submitBtn, false);
    }
});

}

// ==========================================
// 4. ناحیه کاربری (پروفایل و خروج)
// ==========================================
async function openProfileEdit() {
    try {
        // ۱. درخواست به بک‌اند برای دریافت اطلاعات کاربر
        // توجه: اگر آدرس API شما پیشوندی مثل /api/User دارد، آدرس زیر را اصلاح کنید
        const response = await apiCall(`/Users/GetUser`, 'GET');
        
        // ۲. اگر درخواست موفق بود، اطلاعات را در فرم قرار بده
        if (response.ok && response.data) {
            // در دات‌نت معمولا خروجی JSON با حروف کوچک (camelCase) ارسال می‌شود
            // برای اطمینان هر دو حالت را چک می‌کنیم
            const name = response.data.name || response.data.Name || '';
            const username = response.data.username || response.data.Username || '';

            document.getElementById('fullname-input').value = name;
            document.getElementById('username-input').value = username;
        } else if (response.status === 401) {
            console.error('کاربر لاگین نیست یا توکن نامعتبر است');
            // در صورت نیاز می‌توانید کاربر را به صفحه لاگین هدایت کنید
        } else {
            console.error('خطا در دریافت اطلاعات کاربر');
        }
    } catch (error) {
        console.error('خطای سیستمی در دریافت پروفایل:', error);
    }

    // ۳. در نهایت مودال را نمایش بده
    document.getElementById('profile-modal').classList.remove('hidden');
}

function closeProfileEdit() { document.getElementById('profile-modal').classList.add('hidden'); }

// ذخیره تغییرات پروفایل
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('تغییرات حساب کاربری با خطا مواجه شد(با پشتیبانی در تماس باشید)!');
        closeProfileEdit();
    });
}

function sendOtp() {
    const mobile = document.getElementById('mobile-input').value;
    if(mobile.length < 10) return alert('شماره موبایل معتبر نیست.');
    
    const otpBtn = document.getElementById('otp-btn');
    otpBtn.innerText = 'ارسال مجدد (۶۰s)';
    otpBtn.disabled = true;
    document.getElementById('otp-section').classList.remove('hidden');
    alert('کد تایید پیامک شد!');
}

function verifyOtp() { 
    alert('شماره موبایل شما با موفقیت تایید شد ✔️'); 
    document.getElementById('otp-section').classList.add('hidden');
    const otpBtn = document.getElementById('otp-btn');
    otpBtn.innerText = 'تایید شد';
    otpBtn.classList.replace('secondary-btn', 'primary-btn');
}
document.getElementById('profile-modal')?.addEventListener('click', (e) => { if(e.target.id === 'profile-modal') closeProfileEdit(); });

async function logoutAccount() {
    if (confirm('آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟')) {

        // ۱. ارسال درخواست به سرور برای پاک کردن کوکی HttpOnly
        // (از همان تابع apiCall که قبلاً داشتید استفاده می‌کنیم)
        const response = await apiCall('/Users/Logout', 'POST');

        if (response.ok) {
            // ۲. پاک کردن سایر کوکی‌های معمولی (غیر HttpOnly) در صورت وجود
            clearAllLocalCookies();

            // ۳. رفرش کردن صفحه برای پاک شدن استیت‌ها
            location.reload();
        } else {
            alert('خطایی در هنگام خروج رخ داد.');
        }
    }
}

// تابع کمکی برای پاک کردن کوکی‌هایی که با جاوا اسکریپت ساخته شده‌اند
function clearAllLocalCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;

        // تنظیم تاریخ انقضای کوکی به گذشته باعث پاک شدن آن می‌شود
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
}


// ==========================================
// 5. پاپ‌آپ پلن‌ها (محاسبه کاربران اضافه)
// ==========================================
const prices = {
    standard: { '1week': 59000, '2weeks': 99000, '1month': 170000 },
    vip: { '1week': 79000, '2weeks': 134000, '1month': 214000 }
};

const extraUserPrices = {
    standard: { '1week': 5000, '2weeks': 10000, '1month': 20000 },
    vip: { '1week': 10000, '2weeks': 15000, '1month': 25000 }
};

// --- User Management Logic ---
let currentPlanType = 'vip'; 
let maxCapacity = 5;
let currentUsers = 2; 
let pwdCounter = 2;

async function openUsersModal() {
    try {
        // ۱. دریافت اطلاعات از API
        const response = await apiCall('/Products/GetProductsInfoByCurrentUser', 'GET');

        // بررسی اینکه اگر API ارور 404 داد (هابی پیدا نشد)
        if (response.status === 404) {
            document.getElementById('no-hub-modal').classList.remove('hidden');
            return; // خروج از تابع
        }

        // بررسی سایر خطاها
        if (!response.ok || !response.data) {
            console.error('Failed to fetch user hub data', response);
            alert('خطا در دریافت اطلاعات از سرور');
            return;
        }

        const data = response.data;
        const ownerUserName = data.userName || '';
        const maxCapacity = data.quantity || 0;
        const subUsers = data.users || [];
        const planTypeEnum = data.type; // 1 = STD, 2 = VIP

        // آپدیت متغیر سراسری
        if (typeof currentPlanType !== 'undefined') {
            currentPlanType = planTypeEnum === 2 ? 'VIP' : 'STD';
        }

        // ۲. مدیریت UI بر اساس نوع اشتراک
        const badgeElement = document.getElementById('plan-type-badge');
        const stdMsgElement = document.getElementById('standard-plan-msg');
        const addUserSection = document.getElementById('add-user-section');

        if (planTypeEnum === 1) { // STD
            badgeElement.className = 'plan-badge';
            badgeElement.innerText = 'اشتراک استاندارد';
            stdMsgElement.classList.remove('hidden');
            addUserSection.classList.add('hidden');
        } else if (planTypeEnum === 2) { // VIP
            badgeElement.className = 'plan-badge vip';
            badgeElement.innerText = 'اشتراک VIP';
            stdMsgElement.classList.add('hidden');
            addUserSection.classList.remove('hidden');
        }

        // ۳. تنظیم ظرفیت
        document.getElementById('current-users-count').innerText = subUsers.length + 1;
        document.getElementById('max-users-count').innerText = maxCapacity;

        // ۴. پر کردن اطلاعات کاربر اصلی
        const ownerUsernameInput = document.querySelector('.owner-item input[type="text"]');
        const ownerPasswordInput = document.getElementById('owner-pwd');
        if (ownerUsernameInput) ownerUsernameInput.value = ownerUserName;
        if (ownerPasswordInput) ownerPasswordInput.value = ownerUserName;

        // ۵. ایجاد لیست کاربران ساب از طریق Template
        const listContainer = document.getElementById('sub-users-list');
        const template = document.getElementById('sub-user-template');

        // پاک کردن لیست فعلی برای جلوگیری از تکرار
        listContainer.innerHTML = '';

        if (template) {
            subUsers.forEach((userString, index) => {
                // کپی کردن محتوای قالب
                const clone = template.content.cloneNode(true);

                // پیدا کردن المان‌ها در نسخه کپی شده
                const userNumberSpan = clone.querySelector('.user-number');
                const usernameInput = clone.querySelector('.tpl-username');
                const passwordInput = clone.querySelector('.tpl-password');
                const toggleBtn = clone.querySelector('.tpl-toggle-btn');

                // تنظیم مقادیر
                const pwdId = `sub-pwd-${index + 1}`;
                userNumberSpan.textContent = `کاربر ${index + 2}`;

                usernameInput.value = userString;
                passwordInput.value = userString;
                passwordInput.id = pwdId;

                // تنظیم رویداد کلیک برای دکمه نمایش رمز عبور
                toggleBtn.setAttribute('onclick', `togglePasswordVisibility('${pwdId}', this)`);

                // اضافه کردن به صفحه
                listContainer.appendChild(clone);
            });
        }

        // ۶. نمایش مودال کاربران و بروزرسانی نهایی
        document.getElementById('users-modal').classList.remove('hidden');
        if (typeof updateCapacityUI === 'function') {
            updateCapacityUI();
        }

    } catch (error) {
        console.error('Error opening users modal:', error);
    }
}



function closeUsersModal() {
    document.getElementById('users-modal').classList.add('hidden');
    document.getElementById('buy-capacity-box').classList.remove('show');
    document.getElementById('users-modal-box').classList.remove('expanded-mode');
}

// باز و بسته شدن آکاردئونی کاربران
function toggleUserExpand(headerElement) {
    const parent = headerElement.closest('.sub-user');
    const modalBox = document.getElementById('users-modal-box');
    
    // اگر بسته بود، باز کن و عرض مودال رو زیاد کن
    if (!parent.classList.contains('expanded')) {
        parent.classList.add('expanded');
        modalBox.classList.add('expanded-mode');
    } else {
        parent.classList.remove('expanded');
        // چک کن اگر هیچ کاربری باز نیست، عرض مودال رو برگردون حالت قبل
        if(document.querySelectorAll('.sub-user.expanded').length === 0) {
            modalBox.classList.remove('expanded-mode');
        }
    }
}

// کشویی خرید ظرفیت
function toggleCapacityBuy() {
    const box = document.getElementById('buy-capacity-box');
    box.classList.toggle('show');
}

let extraCapQty = 1;
function updateCapacityQty(val) {
    extraCapQty += val;
    if(extraCapQty < 1) extraCapQty = 1;
    document.getElementById('capacity-extra-qty').value = extraCapQty;
}

// ارسال داده به فاکتور برای افزایش ظرفیت
function goToCapacityCheckout() {
    const extraCapQty = document.getElementById('capacity-extra-qty').value;
    
    const checkoutData = {
        isCapacityUpgrade: true, // این فلگ به صفحه فاکتور میفهمونه قیمت پایه رو 0 کنه
        plan: "capacity_upgrade", 
        duration: "-",
        platform: "-",
        extraUsers: parseInt(extraCapQty) || 1,
        extraUserPrice: 25000 // قیمت هر کاربر اضافه
    };
    
    // ذخیره در استوریج با همون نامی که صفحه فاکتور دنبالشه
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
    
    // انتقال به صفحه فاکتور
    window.location.href = 'checkout.html';
}


// ساخت کاربر جدید در فضای خالی
function addNewUser() {
    if (currentUsers >= maxCapacity) return;
    const userInp = document.getElementById('new-sub-username');
    const passInp = document.getElementById('new-sub-password');
    
    if (!userInp.value || !passInp.value) return alert('مشخصات را وارد کنید.');

    pwdCounter++;
    const pwdId = 'sub-pwd-' + pwdCounter;

    const newUserHTML = `
        <div class="user-item sub-user compact">
            <div class="user-item-header" onclick="toggleUserExpand(this)">
                <span class="user-number">کاربر ${currentUsers + 1}</span>
                <div style="display: flex; gap: 15px; align-items: center;">
                    <button class="remove-user-btn danger-text" onclick="event.stopPropagation(); removeUser(this)">حذف ✖</button>
                    <span class="expand-arrow">▼</span>
                </div>
            </div>
            <div class="user-credentials-body">
                <div class="user-credentials">
                    <div class="cred-group"><label>نام کاربری:</label><input type="text" value="${userInp.value}" readonly></div>
                    <div class="cred-group">
                        <label>رمز عبور:</label>
                        <div class="pwd-input-wrapper">
                            <input type="password" value="${passInp.value}" id="${pwdId}" readonly>
                            <button type="button" class="toggle-pwd-btn" onclick="togglePasswordVisibility('${pwdId}', this)">👁️</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('sub-users-list').insertAdjacentHTML('beforeend', newUserHTML);
    userInp.value = ''; passInp.value = ''; currentUsers++; updateCapacityUI();
}

function removeUser(btnElement) {
    if(confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
        btnElement.closest('.user-item').remove();
        currentUsers--;
        updateCapacityUI();
    }
}


function openPlanModal(planType) {
    currentPlanType = planType;
    const planModal = document.getElementById('plan-modal');
    if (!planModal) return;

    planModal.classList.remove('hidden');
    document.getElementById('plan-modal-desc').innerText = `خرید اشتراک ${planType === 'standard' ? 'استاندارد' : 'ویژه (VIP)'}`;
    
    // Set baseline prices
    document.getElementById('price-1w').innerText = prices[planType]['1week'].toLocaleString('fa-IR') + ' تومان';
    document.getElementById('price-2w').innerText = prices[planType]['2weeks'].toLocaleString('fa-IR') + ' تومان';
    document.getElementById('price-1m').innerText = prices[planType]['1month'].toLocaleString('fa-IR') + ' تومان';

    // Reset Form
    currentDuration = null;
    const extraUsersInput = document.getElementById('extra-users');
    if(extraUsersInput) extraUsersInput.value = 0;
    
    const extraSettings = document.getElementById('extra-settings');
    if(extraSettings) extraSettings.classList.remove('show');
    
    const options = document.querySelectorAll('.plan-option');
    options.forEach(opt => opt.classList.remove('selected'));
}

const closePlanBtn = document.getElementById('close-plan-modal');
if (closePlanBtn) {
    closePlanBtn.addEventListener('click', () => document.getElementById('plan-modal').classList.add('hidden'));
    document.getElementById('plan-modal').addEventListener('click', (e) => { if(e.target.id === 'plan-modal') document.getElementById('plan-modal').classList.add('hidden'); });
}

function selectDuration(duration, element) {
    currentDuration = duration;
    const options = document.querySelectorAll('.plan-option');
    options.forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');

    const extraSettings = document.getElementById('extra-settings');
    if(extraSettings) extraSettings.classList.add('show');
}

function updateExtraUsers(change) {
    const input = document.getElementById('extra-users');
    if(!input) return;
    let currentValue = parseInt(input.value) || 0;
    let newValue = currentValue + change;
    if (newValue >= 0 && newValue <= 10) { 
        input.value = newValue;
    }
}

function goToCheckout() {
    if(!currentDuration) {
        alert("لطفا مدت زمان اشتراک را انتخاب کنید.");
        return;
    }

    const extraUsersInput = document.getElementById('extra-users');
    const extraUsersCount = extraUsersInput ? (parseInt(extraUsersInput.value) || 0) : 0;
    
    const platformSelect = document.getElementById('platform-select');
    const platform = platformSelect ? platformSelect.options[platformSelect.selectedIndex].text : 'PC (Windows)';
    
    // ذخیره در لوکال استوریج برای استفاده در صفحه صورتحساب
    localStorage.setItem('checkoutData', JSON.stringify({
        plan: currentPlanType,
        duration: currentDuration,
        extraUsers: extraUsersCount,
        platform: platform
    }));

    window.location.href = 'checkout.html';
}

// ==========================================
// 6. صفحه صورتحساب (Checkout)
// ==========================================
if (window.location.pathname.includes('checkout.html')) {
    let currentBasePrice = 0, currentExtraUserCost = 0, discountAmount = 0;

    document.addEventListener('DOMContentLoaded', () => {
        // دریافت اطلاعات از LocalStorage
        const data = JSON.parse(localStorage.getItem('checkoutData'));
        if (!data) {
            alert("اطلاعات سبد خرید یافت نشد.");
            return; 
        }

        const planNames = { 'standard': 'استاندارد', 'vip': 'ویژه (VIP)' };
        const durationNames = { '1week': '۱ هفته‌ای', '2weeks': '۲ هفته‌ای', '1month': '۱ ماهه' };

        // ===== لاجیک جدید: تفکیک فاکتور اشتراک از فاکتور کاربر اضافه =====
        
        // اگر فلگ isCapacityUpgrade ارسال شده باشد (یعنی فقط فاکتور کاربر اضافه است)
        if (data.isCapacityUpgrade || data.plan === 'capacity_upgrade') {
            currentBasePrice = 0; // صفر کردن مبلغ پایه
            
            // اگر قیمت کاربر اضافه در دیتا ارسال نشده بود، 25000 تومان فرض کن
            const pricePerExtraUser = data.extraUserPrice || 25000; 
            currentExtraUserCost = data.extraUsers * pricePerExtraUser;
            
            // تغییر متون نمایشی فاکتور
            document.getElementById('inv-plan').innerText = "ارتقا ظرفیت هاب (بدون اشتراک پایه)";
            document.getElementById('inv-duration').innerText = "-";
            
        } else {
            // حالت عادی: خرید اشتراک کامل
            // برای جلوگیری از ارور، چک می‌کنیم که مقادیر در آبجکت‌های قیمت وجود داشته باشند
            currentBasePrice = prices[data.plan] ? prices[data.plan][data.duration] : 0;
            currentExtraUserCost = extraUserPrices[data.plan] ? extraUserPrices[data.plan][data.duration] * data.extraUsers : 0;
            
            document.getElementById('inv-plan').innerText = planNames[data.plan] || "ناشناس";
            document.getElementById('inv-duration').innerText = durationNames[data.duration] || "-";
        }
        // =================================================================

        const platformElem = document.getElementById('inv-platform');
        if(platformElem) platformElem.innerText = data.platform || "-";
        
        document.getElementById('inv-base-price').innerText = currentBasePrice.toLocaleString('fa-IR') + ' تومان';
        
        const extraCountElem = document.getElementById('inv-extra-count');
        const extraPriceElem = document.getElementById('inv-extra-price');
        if(extraCountElem) extraCountElem.innerText = data.extraUsers || 0;
        if(extraPriceElem) extraPriceElem.innerText = currentExtraUserCost.toLocaleString('fa-IR') + ' تومان';
        
        updateInvoice();
    });

    function updateInvoice() {
        const subTotal = currentBasePrice + currentExtraUserCost;
        const tax = subTotal * 0.10; // محاسبه 10 درصد مالیات
        const total = subTotal + tax - discountAmount;
        const finalTotal = total > 0 ? total : 0; // جلوگیری از منفی شدن قیمت
        document.getElementById('inv-tax').innerText = tax.toLocaleString('fa-IR') + ' تومان';
        document.getElementById('inv-total').innerText = (total > 0 ? total : 0).toLocaleString('fa-IR') + ' تومان';



        const savedDataStr = localStorage.getItem('checkoutData');
        if (savedDataStr) {
            let checkoutObj = JSON.parse(savedDataStr); // تبدیل رشته به آبجکت
            checkoutObj.totalPrice = finalTotal;        // اضافه کردن قیمت نهایی به آبجکت
            localStorage.setItem('checkoutData', JSON.stringify(checkoutObj)); // ذخیره مجدد در مرورگر
        }
        
    }

    window.applyDiscount = function() {
        const code = document.getElementById('discount-input').value.trim().toUpperCase();
        const msgBox = document.getElementById('discount-msg');
        
        if(code === 'GAMER' || code === 'LAN10') {
            const subTotal = currentBasePrice + currentExtraUserCost;
            discountAmount = subTotal * 0.20;
            
            const discountElem = document.getElementById('inv-discount');
            const discountRowElem = document.getElementById('discount-row');
            
            if(discountElem) discountElem.innerText = discountAmount.toLocaleString('fa-IR') + ' تومان';
            if(discountRowElem) discountRowElem.classList.remove('hidden');
            
            msgBox.style.display = 'block'; 
            msgBox.innerText = 'کد تخفیف اعمال شد!'; 
            msgBox.style.color = '#00ff88';
            updateInvoice();
        } else {
            msgBox.style.display = 'block'; 
            msgBox.innerText = 'کد نامعتبر است.'; 
            msgBox.style.color = '#ff4444';
        }
    }
}


// ==========================================
// 7. لیست بازی‌ها و فیلتر (با قابلیت بازشو و پلتفرم)
// ==========================================
let gamesDatabase = [
    { 
        name: "Minecraft", 
        genre: "survival", genreName: "Survival", platform: "PC / Mobile", testStatus: "توسط تیم ما تست شده ✔️",
        // این بازی اطلاعات اختصاصی دارد:
        downloadLink: "https://example.com/download-minecraft",
        aparatHash: "12345ab", // هش ویدیوی اختصاصی ماینکرافت
        textTutorial: `
        <ol style="padding-right: 20px; line-height: 2; color: var(--text-muted);">
            <li>ابتدا تی‌لانچر (TLauncher) را باز کنید.</li>
            <li>وارد نرم افزار ما شوید و کانکت بزنید.</li>
            <li>در بازی وارد تب Multiplayer شده و Direct Connect را بزنید.</li>
        </ol>`
    },
    { 
        name: "Rainbow Six Siege", 
        genre: "fps", genreName: "FPS", platform: "PC", testStatus: "تست شده با نرم‌افزار لانچر 🚀",
        // فقط لینک دانلود اختصاصی دارد، ویدیو و متن پیش‌فرض میماند
        downloadLink: "https://example.com/download-r6"
    },
    { 
        name: "Counter-Strike 2", 
        genre: "fps", genreName: "FPS", platform: "PC", testStatus: "سرورهای قدرتمند ایران 🇮🇷",
        // فقط ویدیوی اختصاصی دارد
        aparatHash: "cs2hash98"
    },
    { 
        name: "Counter Strike 1.6", 
        genre: "fps", genreName: "FPS", platform: "PC", testStatus: "گزارش موفقیت‌آمیز کاربران 👤" 
        // هیچکدام را ندارد -> کاملا از دیفالت استفاده میکند
    },
    { 
        name: "Dota 2", 
        genre: "moba", genreName: "MOBA", platform: "PC", testStatus: "گزارش موفق از سایت‌های همکار 🌐" 
    },
    { 
        name: "Warcraft 3", 
        genre: "strategy", genreName: "Strategy", platform: "PC", testStatus: "توسط تیم ما تست شده ✔️" 
    }
];

const defaultData = {
    downloadLink: "https://langaming.ir/download", // لینک دانلود عمومی
    aparatHash: "dlx8dka", // هش ویدیوی آپارات پیش‌فرض
    textTutorial: `
        <ol style="padding-right: 20px; line-height: 2; color: var(--text-muted);">
            <li>ابتدا نرم‌افزار سافت اتر را از پنل کاربری دانلود و نصب کنید.</li>
            <li>با نام کاربری و رمز عبور خود وارد شوید.</li>
            <li>بازی را اجرا کرده و از طریق بخش LAN یا Local Network وارد سرور شوید.</li>
        </ol>`
};


// دیتای پشتیبان به همراه پلتفرم و وضعیت تست

function openTutorial(gameName) {
    const tutorialModal = document.getElementById('tutorial-modal');
    if(!tutorialModal) return;

    // پیدا کردن بازی در دیتابیس
    const game = gamesDatabase.find(g => g.name === gameName) || { name: gameName };

    // استفاده از اطلاعات اختصاصی در صورت وجود، وگرنه استفاده از دیفالت
    const finalAparatHash = game.aparatHash || defaultData.aparatHash;
    const finalTextTut = game.textTutorial || defaultData.textTutorial;

    // آپدیت کردن DOM (محتوای مودال)
    document.getElementById('tut-game-name').innerText = "آموزش اتصال - " + game.name;
    document.getElementById('text-tutorial').innerHTML = finalTextTut;
    
    // آپدیت لینک آپارات
    const iframe = document.getElementById('aparat-iframe');
    if(iframe) {
        iframe.src = `https://www.aparat.com/video/video/embed/videohash/${finalAparatHash}/vt/frame`;
    }

    // باز کردن تب آموزش متنی به صورت پیش‌فرض
    const tabTextTut = document.getElementById('tab-text-tut');
    if(tabTextTut) tabTextTut.click();

    // نمایش مودال
    tutorialModal.classList.remove('hidden');
}

function downloadGame(gameName) {
    const game = gamesDatabase.find(g => g.name === gameName) || {};
    const finalDownloadLink = game.downloadLink || defaultData.downloadLink;
    
    // باز کردن لینک دانلود در تب جدید
    window.open(finalDownloadLink, '_blank');
}
// --- تابع بستن مودال آموزش (جهت تکمیل کد شما) ---
document.addEventListener("DOMContentLoaded", function() {
    const closeBtn = document.getElementById('close-tutorial-modal');
    
    //              
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('tutorial-modal').classList.add('hidden');
            //        
            document.getElementById('aparat-iframe').src = ""; 
        });
    }
});


// توابع تب‌های آموزش (متنی / ویدیویی)
document.addEventListener("DOMContentLoaded", function() {
    //    ( )        
    const tabTextBtn = document.getElementById('tab-text-tut');
    
    //            
    if (tabTextBtn) {
        tabTextBtn.addEventListener('click', function() {
            this.classList.add('active');
            
            //     
            document.getElementById('tab-video-tut').classList.remove('active');
            document.getElementById('text-tutorial').classList.remove('hidden');
            document.getElementById('video-tutorial').classList.add('hidden');
        });
    }
});


document.addEventListener("DOMContentLoaded", function() {
    const tabVideoBtn = document.getElementById('tab-video-tut');
    
    if (tabVideoBtn) {
        tabVideoBtn.addEventListener('click', function() {
            this.classList.add('active');
            document.getElementById('tab-text-tut').classList.remove('active');
            document.getElementById('video-tutorial').classList.remove('hidden');
            document.getElementById('text-tutorial').classList.add('hidden');
        });
    }
});


// async function fetchAndRenderGames() {
//     const gamesContainer = document.getElementById('gamesList');
//     if (!gamesContainer) return;
    
//     gamesContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 20px;">در حال دریافت اطلاعات بازی‌ها...</p>';
    
//     // دریافت اطلاعات محصولات (بازی‌ها) از API
//     const res = await apiCall('/Products', 'GET');
    
//     if (res.status === 200 && res.data && res.data.length > 0) {
//         gamesDatabase = res.data.map(game => ({
//             name: game.name || game.title || "بازی ناشناس",
//             genre: (game.category || "other").toLowerCase(),
//             genreName: game.category || "Other",
//             platform: game.platform || "PC", // دریافت پلتفرم از بک‌اند در صورت وجود
//             testStatus: game.testStatus || "توسط تیم ما تست شده ✔️",
//             id: game.id
//         }));
//     } else {
//         gamesDatabase = fallbackGames;
//     }

//     renderCompactGames();
// }

function renderCompactGames(filterText = "", filterGenre = "all") {
    const gamesContainer = document.getElementById('gamesList');
    if (!gamesContainer) return;
    
    gamesContainer.innerHTML = "";

    const filteredGames = gamesDatabase.filter(game => {
        const matchName = game.name.toLowerCase().includes(filterText.toLowerCase());
        const matchGenre = filterGenre === "all" || game.genre === filterGenre;
        return matchName && matchGenre;
    });

    if (filteredGames.length === 0) {
        gamesContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 20px;">موردی یافت نشد.</p>`;
        return;
    }

    filteredGames.forEach(game => {
        const item = document.createElement('div');
        item.className = 'game-list-item';
        
        // ساختار جدید: اضافه شدن کلاس wrapper برای انیمیشن نرم
        item.innerHTML = `
            <div class="game-list-header">
                <div class="game-list-info">
                    <span class="game-list-title">${game.name}</span>
                    <span class="game-list-genre">${game.genreName}</span>
                    <span class="game-list-platform">💻 ${game.platform}</span>
                </div>
                
                <div class="game-list-right-group">
                    <div class="game-list-actions" onclick="event.stopPropagation()">
                        <a href="#" class="btn primary-btn btn-sm">دانلود</a>
                        <button class="btn secondary-btn btn-sm" onclick="openTutorial('${game.name}')">آموزش</button>
                        <button class="btn secondary-btn btn-sm" style="border-color: var(--purple);" onclick="openForumChat('${game.name}')">چت 💬</button>
                    </div>
                    <div class="expand-icon">▼</div>
                </div>
            </div>
            
            <div class="game-list-body-wrapper">
                <div class="game-list-body-inner" onclick="event.stopPropagation()">
                    <div style="padding-top: 15px;">
                        <div class="test-status-text">وضعیت اجرا: <span>${game.testStatus}</span></div>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px; line-height: 1.6;">
                            این بازی با موفقیت بر روی سرورهای LAN ما پیکربندی شده است. برای تجربه بهتر و پینگ پایین‌تر حتماً از نرم‌افزار لانچر اختصاصی ما استفاده کنید.
                        </p>
                    </div>
                </div>
            </div>
        `;

        // لاجیک آکاردئون: بستن بقیه و باز کردن آیتم کلیک شده
        const header = item.querySelector('.game-list-header');
        header.addEventListener('click', () => {
            const isExpanded = item.classList.contains('expanded');
            
            // ابتدا تمام آیتم‌های باز را می‌بندیم
            const allItems = gamesContainer.querySelectorAll('.game-list-item');
            allItems.forEach(el => el.classList.remove('expanded'));
            
            // اگر آیتمی که روی آن کلیک شده قبلاً باز نبوده، حالا بازش می‌کنیم
            if (!isExpanded) {
                item.classList.add('expanded');
            }
        });

        gamesContainer.appendChild(item);
    });
}



const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');

if (searchInput && genreFilter) {
    searchInput.addEventListener('input', (e) => renderCompactGames(e.target.value, genreFilter.value));
    genreFilter.addEventListener('change', (e) => renderCompactGames(searchInput.value, e.target.value));
}

// === منطق تب‌های آموزش (متنی و ویدیویی) ===
const tabTextTut = document.getElementById('tab-text-tut');
const tabVideoTut = document.getElementById('tab-video-tut');
const textTutorialDiv = document.getElementById('text-tutorial');
const videoTutorialDiv = document.getElementById('video-tutorial');

if(tabTextTut && tabVideoTut) {
    tabTextTut.addEventListener('click', () => {
        tabTextTut.classList.add('active');
        tabVideoTut.classList.remove('active');
        textTutorialDiv.classList.remove('hidden');
        videoTutorialDiv.classList.add('hidden');
    });

    tabVideoTut.addEventListener('click', () => {
        tabVideoTut.classList.add('active');
        tabTextTut.classList.remove('active');
        videoTutorialDiv.classList.remove('hidden');
        textTutorialDiv.classList.add('hidden');
    });
}


// ==========================================
// 8. آموزش و تالار گفتمان (برای لیست بازی‌ها)
// ==========================================
const tutorialModal = document.getElementById('tutorial-modal');

// تابع اختصاصی برای بستن پاپ‌آپ آموزش و قطع کردن ویدیو
function closeTutorial() {
    if (tutorialModal) tutorialModal.classList.add('hidden');
    
    // پیدا کردن iframe آپارات و ریست کردن آن برای توقف پخش ویدیو
    const iframe = document.getElementById('aparat-iframe');
    if (iframe) {
        const src = iframe.src;
        iframe.src = src; 
    }
}

function openTutorial(gameName) {
    if(!tutorialModal) return;
    document.getElementById('tut-game-name').innerText = `آموزش اتصال - ${gameName}`;
    document.getElementById('tut-game-text-name').innerText = gameName;
    document.getElementById('tab-text-tut').click();
    tutorialModal.classList.remove('hidden');
}

// متصل کردن دکمه ضربدر (X) به تابع جدید
document.getElementById('close-tutorial-modal')?.addEventListener('click', closeTutorial);

// امکان بسته شدن پاپ‌آپ با کلیک روی فضای تاریک بیرون آن (اختیاری و برای رابط کاربری بهتر)
tutorialModal?.addEventListener('click', (e) => { 
    if(e.target === tutorialModal) closeTutorial(); 
});


// === کدهای مربوط به انجمن (Forum) بدون تغییر ===
const forumModal = document.getElementById('forum-modal');
function openForumChat(gameName) {
    if(!forumModal) return;
    document.getElementById('forum-game-title').innerText = `چت و تبادل نظر - ${gameName}`;
    forumModal.classList.remove('hidden');
}
function closeForumChat() { if(forumModal) forumModal.classList.add('hidden'); }
function sendForumMsg() {
    const input = document.getElementById('forum-input');
    const txt = input.value.trim();
    if(!txt) return;
    const chatBody = document.getElementById('forum-chat-body');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg user-msg'; msgDiv.innerText = txt;
    chatBody.appendChild(msgDiv);
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;
}
forumModal?.addEventListener('click', (e) => { if(e.target === forumModal) closeForumChat(); });

// ==========================================
// 9. ویجت پشتیبانی (چت شناور)
// ==========================================
function toggleSupportChat() {
    const chatWindow = document.getElementById('support-chat-window');
    if(chatWindow) chatWindow.classList.toggle('hidden');
}

function sendSupportMsg() {
    const input = document.getElementById('support-input');
    const txt = input.value.trim();
    if(!txt) return;
    const chatBody = document.getElementById('support-chat-body');
    
    const userDiv = document.createElement('div');
    userDiv.className = 'msg user-msg'; userDiv.innerText = txt;
    chatBody.appendChild(userDiv);
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;
    
    setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.className = 'msg support-msg'; botDiv.innerText = 'متاسفانه ارسال پیام با خطا مواجه شد لطفا با پشتیبانی بله (@lan_gaming) در ارتباط باشید.';
        chatBody.appendChild(botDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1000);
}
 function goToPayment() {
            // ۱. گرفتن مبلغ از آیدی دقیق شما (inv-total)
            const finalAmountElement = document.getElementById('inv-total');
            
            if (finalAmountElement) {
                const finalAmount = finalAmountElement.innerText;
                
                // ۲. ذخیره مبلغ در حافظه مرورگر
                localStorage.setItem('invoiceTotalAmount', finalAmount);
                
                // ۳. انتقال به صفحه پرداخت
                window.location.href = 'payment.html';
            } else {
                alert("خطا در خواندن مبلغ فاکتور!");
            }
        }

// دریافت المان ها
const hubModal = document.getElementById('hub-modal');
const subTabsContainer = document.getElementById('mobile-sub-tabs');
const commonTips = document.getElementById('common-tips');

// باز و بسته کردن پاپ آپ هاب (باید در scope اصلی یا window باشد تا onclick کار کند)
window.openHubModal = function() {
    if(hubModal) {
        hubModal.classList.remove('hidden');
        selectHubPlatform('pc'); // پیش‌فرض روی ویندوز
        commonTips.classList.add('hidden'); // بستن نکات مشترک در هر بار باز شدن
    }
}

window.closeHubModal = function() {
    if(hubModal) hubModal.classList.add('hidden');
}

// تغییر پلتفرم
window.selectHubPlatform = function(platform) {
    document.getElementById('tab-pc').classList.toggle('active', platform === 'pc');
    document.getElementById('tab-mobile').classList.toggle('active', platform === 'mobile');

    document.querySelectorAll('.tutorial-content').forEach(el => el.classList.add('hidden'));

    if (platform === 'pc') {
        subTabsContainer.classList.remove('open');
        subTabsContainer.classList.add('closed');
        document.getElementById('content-pc').classList.remove('hidden');
    } else if (platform === 'mobile') {
        subTabsContainer.classList.remove('closed');
        subTabsContainer.classList.add('open');
        selectHubOS('iphone'); // پیش فرض موبایل روی ایفون
    }
}

// تغییر سیستم عامل موبایل
window.selectHubOS = function(os) {
    document.getElementById('tab-android').classList.toggle('active', os === 'android');
    document.getElementById('tab-iphone').classList.toggle('active', os === 'iphone');

    document.getElementById('content-android').classList.add('hidden');
    document.getElementById('content-iphone').classList.add('hidden');

    if (os === 'android') {
        document.getElementById('content-android').classList.remove('hidden');
    } else if (os === 'iphone') {
        document.getElementById('content-iphone').classList.remove('hidden');
    }
}

// باز و بسته کردن تب نکات مشترک
window.toggleTips = function() {
    if(commonTips.classList.contains('hidden')) {
        commonTips.classList.remove('hidden');
    } else {
        commonTips.classList.add('hidden');
    }
}


document.addEventListener("DOMContentLoaded", function() {
    fetchProductData();
});

async function fetchProductData() {
    try {
        // آدرس دقیق API خود را اینجا قرار دهید (مثلا /api/Product/GetProductsByCurrentUser)
        const apiUrl = `${BASE_API_URL}/Products/GetProductsByCurrentUser`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // اگر توکن را در هدر هم می‌فرستید اینجا اضافه کنید، اما طبق کد شما توکن در کوکی است.
            },
            credentials: 'include'
        });

        if (response.ok) {
            // بررسی میکنیم که آیا دیتایی برگشته یا خیر (ممکن است null باشد)
            const textData = await response.text();
            if (!textData) {
                setDefaultNoProduct();
                return;
            }

            const product = JSON.parse(textData);

            // اگر پروداکت معتبر بود، اطلاعات را نمایش بده
            if (product && product.hubName) {
                updateDashboard(product);
            } else {
                setDefaultNoProduct();
            }
        } else {
            // اگر ارور 401 یا خطای دیگری بود
            setDefaultNoProduct();
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        setDefaultNoProduct();
    }
}

function updateDashboard(product) {
    // تنظیم نام هاب
    document.getElementById('ui-hub-name').innerText = product.hubName;

    // تنظیم نوع اشتراک (با توجه به اینام شما باید مپ شود)
    document.getElementById('ui-sub-type').innerText = getProductTypeName(product.type);

    // تبدیل اعداد به فارسی و نمایش ظرفیت
    document.getElementById('ui-user-limit').innerText = toPersianNum(product.userLimit) + ' کاربر';

    // محاسبه روزهای باقی‌مانده از EndTime
    const endDate = new Date(product.endTime);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // تبدیل میلی‌ثانیه به روز

    if (diffDays > 0) {
        document.getElementById('ui-time-left').innerText = toPersianNum(diffDays) + ' روز';
    } else {
        document.getElementById('ui-time-left').innerText = 'منقضی شده';
    }
}

function setDefaultNoProduct() {
    document.getElementById('ui-hub-name').innerText = 'هابی برای شما موجود نیست';
    document.getElementById('ui-sub-type').innerText = '-';
    document.getElementById('ui-user-limit').innerText = '-';
    document.getElementById('ui-time-left').innerText = '-';
}

// تابع کمکی برای تبدیل Enum به متن خوانا
// اعداد کیس‌ها را بر اساس ProductTypeEnum خودتان در سی‌شارپ تنظیم کنید
function getProductTypeName(typeInt) {
    switch (typeInt) {
        case 1: return 'استاندارد';
        case 2: return 'ویژه (VIP)';
        default: return 'اشتراک ویژه';
    }
}

// تابع کمکی برای فارسی کردن اعداد
function toPersianNum(num) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, x => persianDigits[x]);
}

// تابع برای کلیک روی دکمه‌های اصلی (ویندوز / موبایل)
function selectHubPlatform(platform) {
    // 1. تغییر حالت دکمه های اصلی (تغییر رنگ به حالت فعال)
    document.getElementById('tab-pc').classList.remove('active');
    document.getElementById('tab-mobile').classList.remove('active');
    document.getElementById('tab-' + platform).classList.add('active');

    // گرفتن المان های مربوط به زیر منو و محتواها
    const mobileSubTabs = document.getElementById('mobile-sub-tabs');
    const contentPc = document.getElementById('content-pc');
    const contentAndroid = document.getElementById('content-android');
    const contentIphone = document.getElementById('content-iphone');

    if (platform === 'mobile') {
        // اگر روی موبایل کلیک شد: زیر منو (دکمه های اندروید و آیفون) را نشان بده
        mobileSubTabs.classList.remove('closed');
        mobileSubTabs.style.display = 'flex'; // یا 'block'
        
        // محتوای ویندوز را مخفی کن
        contentPc.classList.add('hidden');
        
        // به صورت خودکار آموزش اندروید را باز کن که صفحه خالی نماند
        selectHubOS('android'); 

    } else if (platform === 'pc') {
        // اگر روی ویندوز کلیک شد: زیر منوی موبایل را مخفی کن
        mobileSubTabs.classList.add('closed');
        mobileSubTabs.style.display = 'none';

        // محتوای موبایل ها را مخفی کن
        contentAndroid.classList.add('hidden');
        contentIphone.classList.add('hidden');

        // محتوای ویندوز را نمایش بده
        contentPc.classList.remove('hidden');
    }
}

// تابع برای کلیک روی دکمه‌های زیرمنو (اندروید / آیفون)
function selectHubOS(os) {
    // 1. تغییر رنگ دکمه های اندروید و آیفون (اگر کلاس active برایشان تعریف کرده اید)
    document.getElementById('tab-android').classList.remove('active');
    document.getElementById('tab-iphone').classList.remove('active');
    document.getElementById('tab-' + os).classList.add('active');

    // 2. مخفی کردن محتوای هر دو گوشی
    document.getElementById('content-android').classList.add('hidden');
    document.getElementById('content-iphone').classList.add('hidden');

    // 3. نمایش محتوای همان گوشی که کلیک شده
    document.getElementById('content-' + os).classList.remove('hidden');
}
