// رابط الجدول الخاص بك
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdht6CoTy4Ldy3IguEeGB3c4lHKjnorQwyJe0D6BWG10t9D21BB-Q_-JZilVd8m6aslgNMYy93u2Yi/pub?output=csv";

async function processRequest() {
    const orderID = document.getElementById('orderID').value.trim();
    const usernameInput = document.getElementById('username').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');
    const btn = document.querySelector('button');

    // نظام حد المحاولات (3 مرات)
    let attempts = localStorage.getItem('steam_attempts') || 0;
    if (attempts >= 3) {
        alert("استنفدت محاولاتك (3 مرات مسموحة فقط).");
        btn.disabled = true;
        return;
    }

    if (!orderID || !usernameInput) {
        alert("يرجى إدخال رقم الطلب واسم المستخدم");
        return;
    }

    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        const rows = data.split(/\r?\n/).map(row => row.split(","));
        
        let orderFound = false;
        let userSecret = null;

        // الدوران على الجدول للتحقق
        for (let i = 1; i < rows.length; i++) {
            const rowOrder = rows[i][0]?.trim();
            const rowUser = rows[i][1]?.trim().toLowerCase();
            const rowSecret = rows[i][2]?.trim();

            // التأكد أولاً من وجود رقم الطلب في أي مكان بالجدول
            if (rowOrder === orderID) {
                orderFound = true;
            }

            // إذا تطابق اليوزرنام، نحفظ السر الخاص به
            if (rowUser === usernameInput) {
                userSecret = rowSecret;
            }
        }

        // المنطق المطلوب: يجب وجود رقم الطلب + وجود سر لليوزرنام
        if (orderFound && userSecret) {
            const code = generateSteamCode(userSecret);
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';

            attempts++;
            localStorage.setItem('steam_attempts', attempts);
        } else if (!orderFound) {
            alert("رقم الطلب غير صحيح أو غير موجود.");
        } else {
            alert("اسم المستخدم غير موجود.");
        }

    } catch (error) {
        alert("حدث خطأ في جلب البيانات.");
    }
}

// محرك التشفير الناجح CryptoJS
function generateSteamCode(secret) {
    try {
        const timeCount = Math.floor(Date.now() / 1000 / 30);
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);
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
    } catch (e) { return "ERR"; }
}