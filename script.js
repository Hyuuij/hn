// رابط السكريبت الجديد الذي زودتني به
const scriptURL = "https://script.google.com/macros/s/AKfycbz63_Yk5orvvPniPC-CmAfOtjIBPiOHeEOO_xARZ5nsHERQmrj9pEgfkdezOuB6CxE7KQ/exec"; 

/**
 * الوظيفة الأساسية لمعالجة الطلب عند الضغط على الزر
 */
async function processRequest() {
    // 1. جلب المدخلات وتنظيفها من المسافات
    const orderID = document.getElementById('orderID').value.trim();
    const username = document.getElementById('username').value.trim().toLowerCase();
    
    // عناصر الواجهة لتحديثها
    const resultDiv = document.getElementById('result');
    const counterDiv = document.getElementById('attemptsCounter');
    const btn = document.getElementById('mainBtn');

    // 2. فحص بسيط قبل الإرسال
    if (!orderID || !username) {
        alert("يرجى إدخال رقم الطلب واسم المستخدم أولاً");
        return;
    }

    // 3. تحديث حالة الزر (تجربة مستخدم أفضل)
    btn.disabled = true;
    btn.innerText = "جاري التحقق من البيانات...";
    resultDiv.style.display = 'none';

    try {
        // 4. الاتصال بسكريبت جوجل (الربط مع الجدول)
        // نستخدم encodeURIComponent لضمان عدم تعليق الرابط إذا كان هناك رموز
        const finalURL = `${scriptURL}?orderID=${encodeURIComponent(orderID)}&user=${encodeURIComponent(username)}`;
        
        const response = await fetch(finalURL);
        const resData = await response.json();

        // 5. التعامل مع ردود السكريبت المختلفة
        if (resData.status === "success") {
            // توليد الكود من السر القادم من الجدول
            const steamCode = generateSteamCode(resData.secret);
            
            // عرض النتائج للمستخدم
            resultDiv.innerText = steamCode;
            resultDiv.style.display = 'block';
            counterDiv.innerText = "المحاولات المتبقية لهذا الطلب: " + resData.remaining;
            
        } else if (resData.status === "blocked") {
            alert("نعتذر، لقد استنفدت الحد الأقصى للمحاولات (3 محاولات) لهذا الطلب.");
            counterDiv.innerText = "المحاولات المتبقية: 0";
        } else if (resData.status === "not_found") {
            alert("المعلومات غير صحيحة. يرجى التأكد من رقم الطلب واسم المستخدم.");
        } else {
            alert("حدث خطأ غير متوقع: " + (resData.message || "Unknown Error"));
        }

    } catch (error) {
        console.error("Fetch Error:", error);
        alert("فشل الاتصال بالسيرفر. تأكد من جودة الإنترنت أو من صلاحيات نشر السكريبت.");
    } finally {
        // 6. إعادة الزر لحالته الطبيعية
        btn.disabled = false;
        btn.innerText = "استخراج الكود الآن";
    }
}

/**
 * محرك توليد أكواد Steam Guard (نفس آلية تطبيق الموبايل)
 */
function generateSteamCode(secret) {
    try {
        // أ. حساب الوقت الحالي بوحدات 30 ثانية
        const timeCount = Math.floor(Date.now() / 1000 / 30);
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);
        
        // ب. فك تشفير السر (يفترض أن يكون Base64 كما في ملفات SDA)
        let key = CryptoJS.enc.Base64.parse(secret);
        
        // ج. تطبيق تشفير HMAC-SHA1
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);

        // د. تحويل التوقيع إلى مصفوفة بايتات
        let h = [];
        for (let c = 0; c < hmacSig.length; c += 2) {
            h.push(parseInt(hmacSig.substr(c, 2), 16));
        }
        
        // هـ. عملية التقطيع الديناميكي (Dynamic Truncation)
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | 
                       ((h[start+1] & 0xff) << 16) | 
                       ((h[start+2] & 0xff) << 8) | 
                       (h[start+3] & 0xff);

        // و. التحويل إلى أبجدية Steam المكونة من 26 حرفاً
        const chars = "23456789BCDFGHJKMNPQRTVWXY";
        let finalCode = "";
        for (let i = 0; i < 5; i++) {
            finalCode += chars.charAt(fullCode % 26);
            fullCode = Math.floor(fullCode / 26);
        }
        
        return finalCode; // يرجع الكود مثل: J7K2B
    } catch (e) {
        console.error("Generator Error:", e);
        return "ERROR";
    }
}