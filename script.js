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
        // الاتصال بسكريبت جوجل للتحقق من البيانات وتحديث المحاولات في الجدول
        const response = await fetch(`${scriptURL}?orderID=${orderID}&user=${usernameInput}`);
        const resData = await response.json();

        if (resData.status === "success") {
            // توليد كود Steam Guard باستخدام المحرك المصحح
            const code = generateSteamCode(resData.secret);
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';
            
            // تحديث العداد بناءً على القيمة الراجعة من الجدول مباشرة
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
        alert("حدث خطأ في الاتصال بالخادم. تأكد من أن السكريبت منشور (Deployed) بصلاحية الوصول للجميع (Anyone).");
    }
}

// محرك توليد الأكواد المصحح (الوحيد الذي تم تغييره لضمان المطابقة)
function generateSteamCode(secret) {
    try {
        const timeCount = Math.floor(Date.now() / 1000 / 30);
        
        // التعديل الجوهري لضمان مطابقة SDA وتطبيق الموبايل
        let timeWords = CryptoJS.lib.WordArray.create([0, timeCount]); 
        
        let key = CryptoJS.enc.Base64.parse(secret);
        
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);

        let h = [];
        for (let c = 0; c < hmacSig.length; c += 2) {
            h.push(parseInt(hmacSig.substr(c, 2), 16));
        }
        
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | 
                       ((h[start+1] & 0xff) << 16) | 
                       ((h[start+2] & 0xff) << 8) | 
                       (h[start+3] & 0xff);

        const chars = "23456789BCDFGHJKMNPQRTVWXY";
        let finalCode = "";
        for (let i = 0; i < 5; i++) {
            finalCode += chars.charAt(fullCode % 26);
            fullCode = Math.floor(fullCode / 26);
        }
        return finalCode;
    } catch (e) {
        return "ERROR";
    }
}