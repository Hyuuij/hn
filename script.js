// الرابط المباشر لجدول بياناتك (CSV)
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdht6CoTy4Ldy3IguEeGB3c4lHKjnorQwyJe0D6BWG10t9D21BB-Q_-JZilVd8m6aslgNMYy93u2Yi/pub?output=csv";

async function processRequest() {
    const orderID = document.getElementById('orderID').value.trim();
    const username = document.getElementById('username').value.trim().toLowerCase();
    const resultDiv = document.getElementById('result');

    if (!orderID || !username) {
        alert("يرجى إدخال رقم الطلب واسم المستخدم");
        return;
    }

    try {
        const response = await fetch(csvUrl);
        const data = await response.text();
        const rows = data.split(/\r?\n/).map(row => row.split(","));
        
        let sharedSecret = null;

        // البحث عن المطابقة في الجدول
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][0]?.trim() === orderID && rows[i][1]?.trim().toLowerCase() === username) {
                sharedSecret = rows[i][2]?.trim();
                break;
            }
        }

        if (sharedSecret) {
            // توليد الكود باستخدام المحرك الناجح (CryptoJS)
            const code = generateSteamCode(sharedSecret);
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';
        } else {
            alert("البيانات غير متطابقة، تأكد من رقم الطلب واليوزرنام");
        }
    } catch (error) {
        console.error("خطأ في جلب البيانات:", error);
        alert("حدث خطأ أثناء الاتصال بالخادم");
    }
}

function generateSteamCode(secret) {
    try {
        // 1. حساب الوقت الحالي (دورة 30 ثانية)
        const timeCount = Math.floor(Date.now() / 1000 / 30);
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);

        // 2. فك تشفير السر من Base64
        let key = CryptoJS.enc.Base64.parse(secret);

        // 3. تطبيق HMAC-SHA1
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);

        // 4. التقطيع الديناميكي (Steam Truncation)
        let h = [];
        for (let c = 0; c < hmacSig.length; c += 2) {
            h.push(parseInt(hmacSig.substr(c, 2), 16));
        }
        
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | 
                       ((h[start+1] & 0xff) << 16) | 
                       ((h[start+2] & 0xff) << 8) | 
                       (h[start+3] & 0xff);

        // 5. التحويل لأبجدية Steam (26 حرفاً)
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