// رابط السكريبت الخاص بك
const scriptURL = "https://script.google.com/macros/s/AKfycbzxCbnKrqBPtn-BhWA3MHwerWWHx-A7YFiDF_zWWEpxmuPdvSBb0_Wj7VcojPAEo0siQQ/exec"; 

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
        // الاتصال بسكريبت جوجل
        const response = await fetch(`${scriptURL}?orderID=${orderID}&user=${usernameInput}`);
        const resData = await response.json();

        // 🔥 كونسول لمراقبة الرد من جوجل 🔥
        console.log("الرد القادم من جوجل شيت:", resData);

        if (resData.status === "success") {
            // 🔥 كونسول للتأكد من السر قبل التصنيع 🔥
            console.log("السر (Secret) اللي بنستخدمه الآن:", resData.secret);

            // تشغيل محرك التصنيع
            const code = generateSteamCode(resData.secret);
            
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';
            counterDiv.innerText = "المحاولات المتبقية لهذا الطلب: " + resData.remaining;

        } else if (resData.status === "blocked") {
            alert("عذراً، هذا الطلب استنفد جميع محاولاته.");
            counterDiv.innerText = "المحاولات المتبقية: 0";
            resultDiv.style.display = 'none';
        } else {
            alert("البيانات غير صحيحة، تأكد من رقم الطلب واسم المستخدم.");
            resultDiv.style.display = 'none';
        }
    } catch (e) {
        console.error("Error:", e);
        alert("حدث خطأ في الاتصال بالخادم.");
    }
}

/**
 * دالة تحويل Hex إلى بايتات (مطلوبة لمحركك الاحترافي)
 */
function hexToBytes(hex) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

/**
 * محرك التصنيع (نسخة طبق الأصل من كودك الاحترافي)
 */
function generateSteamCode(secretB64) {
    try {
        // 1. حساب الوقت
        const epoch = Math.floor(Date.now() / 1000);
        const timeCount = Math.floor(epoch / 30);

        // 2. تحويل الوقت إلى Buffer
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);

        // 3. فك تشفير السر (Base64)
        let key = CryptoJS.enc.Base64.parse(secretB64);

        // 4. تطبيق HMAC-SHA1
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);

        // 5. التقطيع الديناميكي (باستخدام دالة hexToBytes)
        let h = hexToBytes(hmacSig);
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | 
                       ((h[start+1] & 0xff) << 16) | 
                       ((h[start+2] & 0xff) << 8) | 
                       (h[start+3] & 0xff);

        // 6. التحويل إلى أبجدية Steam
        const chars = "23456789BCDFGHJKMNPQRTVWXY";
        let finalCode = "";
        for (let i = 0; i < 5; i++) {
            finalCode += chars.charAt(fullCode % 26);
            fullCode = Math.floor(fullCode / 26);
        }

        // 🔥 كونسول لمشاهدة الكود النهائي المولد 🔥
        console.log("الكود الناتج عن التصنيع:", finalCode);

        return finalCode;
    } catch (e) {
        console.error("خطأ في دالة generateSteamCode:", e);
        return "ERROR";
    }
}