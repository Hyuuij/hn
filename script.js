// إضافة المكتبة برمجياً لضمان عملها في أي مكان
var script = document.createElement('script');
script.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js";
document.head.appendChild(script);

// رابط السكريبت الخاص بك (تأكد من عمل Deploy جديد عند تغيير كود جوجل)
const scriptURL = "https://script.google.com/macros/s/AKfycbxCkLoEWY19_kPqFjUwatBrqDFk9_YIM0fXfBgHZmzIIHyOLRQasCqgHQlg6a9nq2bkWA/exec"; 

async function processRequest() {
    const orderID = document.getElementById('orderID').value.trim();
    const usernameInput = document.getElementById('username').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');
    const counterDiv = document.getElementById('attemptsCounter');

    if (!orderID || !usernameInput) {
        alert("يرجى إدخال رقم الطلب واسم المستخدم");
        return;
    }

    try {
        // 1. الاتصال بجوجل شيت
        const response = await fetch(`${scriptURL}?orderID=${orderID}&user=${usernameInput}`);
        const resData = await response.json();

        console.log("الرد من جوجل:", resData);

        if (resData.status === "success") {
            const secretFromServer = resData.secret;

            if (!secretFromServer) {
                console.error("خطأ: السر (Secret) وصل فارغاً من الجدول!");
                alert("السر غير موجود في الجدول لهذا الطلب.");
                return;
            }

            console.log("السر المستخدم للتوليد:", secretFromServer);

            // 2. توليد الكود باستخدام المحرك الاحترافي المصحح
            const code = generateSteamCode(secretFromServer);
            
            // 3. عرض النتيجة
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';
            counterDiv.innerText = "المحاولات المتبقية: " + resData.remaining;

        } else if (resData.status === "blocked") {
            alert("عذراً، هذا الطلب استنفد جميع محاولاته.");
        } else {
            alert("بيانات غير صحيحة أو غير موجودة.");
        }
    } catch (e) {
        console.error("Error:", e);
        alert("فشل الاتصال بالسيرفر.");
    }
}

/**
 * دالة التصنيع الاحترافية - مطابقة لـ Steam Desktop Authenticator
 */
function generateSteamCode(secretB64) {
    try {
        // حساب الوقت بصيغة 30 ثانية
        const epoch = Math.floor(Date.now() / 1000);
        const timeCount = Math.floor(epoch / 30);

        // تحويل الوقت لـ 64-bit WordArray (هنا السر في المطابقة)
        let timeWords = CryptoJS.lib.WordArray.create([0, timeCount]); 

        // فك تشفير السر من Base64
        let key = CryptoJS.enc.Base64.parse(secretB64);

        // حساب HMAC-SHA1
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);

        // تحويل الـ Hex إلى مصفوفة بايتات
        let h = [];
        for (let c = 0; c < hmacSig.length; c += 2) {
            h.push(parseInt(hmacSig.substr(c, 2), 16));
        }

        // التقطيع الديناميكي (Dynamic Truncation)
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | 
                       ((h[start+1] & 0xff) << 16) | 
                       ((h[start+2] & 0xff) << 8) | 
                       (h[start+3] & 0xff);

        // تحويل الرقم إلى حروف Steam (26 حرف)
        const chars = "23456789BCDFGHJKMNPQRTVWXY";
        let finalCode = "";
        for (let i = 0; i < 5; i++) {
            finalCode += chars.charAt(fullCode % 26);
            fullCode = Math.floor(fullCode / 26);
        }

        console.log("وقت التوليد (Epoch):", epoch);
        console.log("الكود الناتج:", finalCode);
        return finalCode;

    } catch (e) {
        console.error("Generator Error:", e);
        return "ERROR";
    }
}