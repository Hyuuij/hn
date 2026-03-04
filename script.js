const scriptURL = "https://script.google.com/macros/s/AKfycbz63_Yk5orvvPniPC-CmAfOtjIBPiOHeEOO_xARZ5nsHERQmrj9pEgfkdezOuB6CxE7KQ/exec"; 

async function processRequest() {
    // جلب العناصر والتأكد أنها موجودة
    const orderEl = document.getElementById('orderID');
    const userEl = document.getElementById('username');
    const resultDiv = document.getElementById('result');
    const counterDiv = document.getElementById('attemptsCounter');
    const btn = document.getElementById('mainBtn');

    if (!orderEl || !userEl) {
        console.error("العناصر ناقصة في الـ HTML");
        return;
    }

    const orderID = orderEl.value.trim();
    const username = userEl.value.trim().toLowerCase();

    if (!orderID || !username) {
        alert("أدخل البيانات أولاً");
        return;
    }

    // بداية العملية
    btn.disabled = true;
    btn.innerText = "جاري الاتصال...";

    try {
        const fullURL = scriptURL + "?orderID=" + encodeURIComponent(orderID) + "&user=" + encodeURIComponent(username);
        
        const response = await fetch(fullURL);
        if (!response.ok) throw new Error("مشكلة في الشبكة");
        
        const resData = await response.json();

        if (resData.status === "success") {
            const code = generateSteamCode(resData.secret);
            resultDiv.innerText = code;
            resultDiv.style.display = 'block';
            counterDiv.innerText = "المحاولات المتبقية: " + resData.remaining;
        } else if (resData.status === "blocked") {
            alert("تم استنفاد المحاولات لهذا الطلب");
        } else {
            alert("المعلومات غير صحيحة");
        }
    } catch (err) {
        console.error(err);
        alert("حدث خطأ تقني: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "استخراج الكود";
    }
}

function generateSteamCode(secret) {
    try {
        const timeCount = Math.floor(Date.now() / 1000 / 30);
        let timeHex = timeCount.toString(16).padStart(16, '0');
        let timeWords = CryptoJS.enc.Hex.parse(timeHex);
        let key = CryptoJS.enc.Base64.parse(secret);
        let hmac = CryptoJS.HmacSHA1(timeWords, key);
        let hmacSig = hmac.toString(CryptoJS.enc.Hex);
        let h = [];
        for (let c = 0; c < hmacSig.length; c += 2) { h.push(parseInt(hmacSig.substr(c, 2), 16)); }
        let start = h[19] & 0xf;
        let fullCode = ((h[start] & 0x7f) << 24) | ((h[start+1] & 0xff) << 16) | ((h[start+2] & 0xff) << 8) | (h[start+3] & 0xff);
        const chars = "23456789BCDFGHJKMNPQRTVWXY";
        let finalCode = "";
        for (let i = 0; i < 5; i++) { finalCode += chars.charAt(fullCode % 26); finalCode = Math.floor(fullCode / 26); }
        return finalCode;
    } catch (e) { return "ERROR"; }
}