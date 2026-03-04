// رابط السكريبت الخاص بك (Google Apps Script)
const scriptURL = "https://script.google.com/macros/s/AKfycby41lJyEd_m_6t71hHLhF9FWKn8Iho6eSRMcnF4HfIW-Y9tTosLVMq3MgO_JyAL4l6xzg/exec"; 

async function processRequest() {
    const orderID = document.getElementById('orderID').value.trim();
    const usernameInput = document.getElementById('username').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');
    const counterDiv = document.getElementById('attemptsCounter');
    const btn = document.getElementById('mainBtn');

    // التأكد من إدخال البيانات
    if (!orderID || !usernameInput) {
        alert("يرجى إدخال رقم الطلب واسم المستخدم");
        return;
    }

    // تغيير حالة الزر أثناء الانتظار
    btn.innerText = "جاري التحقق...";
    btn.disabled = true;

    try {
        // 1. الاتصال بجوجل شيت للتحقق من رقم الطلب وزيادة المحاولات
        const response = await fetch(`${scriptURL}?orderID=${orderID}&user=${usernameInput}`);
        const resData = await response.json();

        if (resData.status === "success") {
            // 2. توليد الكود باستخدام المحرك الصحيح
            const code = generateSteamCode(resData.secret);
            
            // 3. عرض النتيجة وتحديث العداد
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';
            counterDiv.innerText = "المحاولات المتبقية لهذا الطلب: " + resData.remaining;
            
        } else if (resData.status === "blocked") {
            alert("عذراً، هذا الطلب استنفد جميع محاولاته (3 محاولات مسموحة).");
            counterDiv.innerText = "المحاولات المتبقية: 0";
            resultDiv.style.display = 'none';
        } else {
            alert("البيانات غير صحيحة، تأكد من رقم الطلب واسم المستخدم.");
            resultDiv.style.display = 'none';
        }
    } catch (e) {
        console.error("Error:", e);
        alert("حدث خطأ في الاتصال بالسيرفر. تأكد من نشر السكريبت (Deploy) للجميع.");
    } finally {
        btn.innerText = "استخراج الكود الآن";
        btn.disabled = false;
    }
}

// المحرك الصحيح لتوليد الأكواد (مطابق لـ Steam 100%)
function generateSteamCode(secret) {
    try {
        // حساب الوقت الحالي (دورة 30 ثانية)
        const timeCount = Math.floor(Date.now() / 1000 / 30);
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);
        
        // فك تشفير السر (Base64) - كما هو مخزن في SDA
        let key = CryptoJS.enc.Base64.parse(secret);
        
        // تطبيق HMAC-SHA1
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);

        // التقطيع الديناميكي (Dynamic Truncation)
        let h = [];
        for (let c = 0; c < hmacSig.length; c += 2) {
            h.push(parseInt(hmacSig.substr(c, 2), 16));
        }
        
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | 
                       ((h[start+1] & 0xff) << 16) | 
                       ((h[start+2] & 0xff) << 8) | 
                       (h[start+3] & 0xff);

        // أبجدية Steam (26 حرفاً)
        const chars = "23456789BCDFGHJKMNPQRTVWXY";
        let finalCode = "";
        for (let i = 0; i < 5; i++) {
            finalCode += chars.charAt(fullCode % 26);
            fullCode = Math.floor(fullCode / 26);
        }
        return finalCode;
    } catch (e) {
        console.error("تنبيه: خطأ في تشفير الكود", e);
        return "ERROR";
    }
}