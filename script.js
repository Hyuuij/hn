// الرابط الجديد الذي زودتني به
const scriptURL = "https://script.google.com/macros/s/AKfycbz63_Yk5orvvPniPC-CmAfOtjIBPiOHeEOO_xARZ5nsHERQmrj9pEgfkdezOuB6CxE7KQ/exec"; 

async function processRequest() {
    const orderID = document.getElementById('orderID').value.trim();
    const usernameInput = document.getElementById('username').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');
    const counterDiv = document.getElementById('attemptsCounter');
    const btn = document.getElementById('mainBtn');

    if (!orderID || !usernameInput) {
        alert("يرجى إدخال رقم الطلب واسم المستخدم");
        return;
    }

    // إظهار حالة التحميل للمستخدم
    btn.innerText = "جاري التحقق من البيانات...";
    btn.disabled = true;
    resultDiv.style.display = 'none';

    try {
        // طلب البيانات من سكريبت جوجل المحدث
        const response = await fetch(`${scriptURL}?orderID=${orderID}&user=${usernameInput}`);
        const resData = await response.json();

        if (resData.status === "success") {
            // توليد الكود الصحيح باستخدام المحرك
            const code = generateSteamCode(resData.secret);
            
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';
            counterDiv.innerText = "المحاولات المتبقية لهذا الطلب: " + resData.remaining;
            
        } else if (resData.status === "blocked") {
            alert("عذراً، هذا الطلب استنفد جميع محاولاته (3 محاولات).");
            counterDiv.innerText = "المحاولات المتبقية: 0";
        } else {
            alert("المعلومات غير صحيحة، تأكد من رقم الطلب واسم المستخدم.");
        }
    } catch (e) {
        console.error("Error:", e);
        alert("حدث خطأ في الاتصال بالسيرفر. تأكد من أن السكريبت يعمل.");
    } finally {
        btn.innerText = "استخراج الكود الآن";
        btn.disabled = false;
    }
}

// محرك توليد الأكواد المطابق لـ Steam
function generateSteamCode(secret) {
    try {
        const timeCount = Math.floor(Date.now() / 1000 / 30);
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);
        
        // فك التشفير كـ Base64 (كما هو مخزن في ملفات Steam/SDA)
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