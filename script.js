// رابط السكريبت الخاص بك (تأكد من عمل New Deployment عند أي تغيير في Apps Script)
const scriptURL = "https://script.google.com/macros/s/AKfycbzStcky-ncmEhopVbjpJI0eS15Rz9v2ru0MOaIE9iU8piyVKKNVzQvh8qWMWgPoKImF7g/exec"; 

async function processRequest() {
    const orderID = document.getElementById('orderID').value.trim();
    const username = document.getElementById('username').value.trim().toLowerCase();
    
    const resultDiv = document.getElementById('result');
    const counterDiv = document.getElementById('attemptsCounter');
    const btn = document.getElementById('mainBtn');

    // 1. فحص المدخلات
    if (!orderID || !username) {
        alert("يرجى إدخال رقم الطلب واسم المستخدم");
        return;
    }

    // تجهيز الواجهة (بدون disabled كما طلبت)
    btn.innerText = "جاري الاستخراج...";
    resultDiv.style.display = 'none';

    try {
        // 2. إرسال الطلب لجوجل (يرسل الاثنين: رقم الطلب واليوزر)
        const finalURL = `${scriptURL}?orderID=${encodeURIComponent(orderID)}&user=${encodeURIComponent(username)}`;
        
        const response = await fetch(finalURL);
        const resData = await response.json();

        // 3. التعامل مع ردود السيرفر (Apps Script)
        if (resData.status === "success") {
            // استخدام محرك التصنيع المطابق لنسختك
            const steamCode = generateSteamCode(resData.secret);
            
            resultDiv.innerText = steamCode;
            resultDiv.style.display = 'block';
            counterDiv.innerText = "المحاولات المتبقية لهذا الطلب: " + resData.remaining;
            
        } else if (resData.status === "blocked") {
            alert("عذراً، هذا الطلب استنفد كافة المحاولات (3/3)");
        } else if (resData.status === "order_not_found") {
            alert("رقم الطلب غير صحيح أو غير موجود");
        } else if (resData.status === "user_not_found") {
            alert("اسم المستخدم غير مطابق لهذا الطلب");
        } else {
            alert("حدث خطأ في البيانات");
        }

    } catch (error) {
        console.error("Error:", error);
        alert("فشل الاتصال بالسيرفر. تأكد من إعدادات الـ Deployment");
    } finally {
        btn.innerText = "استخراج الكود الآن";
    }
}

/**
 * محرك تصنيع الأكواد (نسخة مطابقة تماماً للمحرك الاحترافي الذي أرفقته)
 */
function generateSteamCode(secretB64) {
    try {
        // 1. حساب الوقت الحالي (بثواني 30)
        const epoch = Math.floor(Date.now() / 1000);
        const timeCount = Math.floor(epoch / 30);

        // 2. تحويل الوقت إلى Hex وكلمات برمجية
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);

        // 3. فك تشفير السر من Base64 (القادم من العمود C في جدولك)
        let key = CryptoJS.enc.Base64.parse(secretB64);

        // 4. تطبيق HMAC-SHA1
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);

        // 5. التقطيع الديناميكي (Dynamic Truncation)
        let h = [];
        for (let c = 0; c < hmacSig.length; c += 2) {
            h.push(parseInt(hmacSig.substr(c, 2), 16));
        }
        
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | 
                       ((h[start+1] & 0xff) << 16) | 
                       ((h[start+2] & 0xff) << 8) | 
                       (h[start+3] & 0xff);

        // 6. التحويل لأبجدية Steam الـ 26 حرفاً
        const chars = "23456789BCDFGHJKMNPQRTVWXY";
        let finalCode = "";
        for (let i = 0; i < 5; i++) {
            finalCode += chars.charAt(fullCode % 26);
            fullCode = Math.floor(fullCode / 26);
        }
        
        return finalCode;
    } catch (e) {
        console.error("Generator Error:", e);
        return "ERROR";
    }
}