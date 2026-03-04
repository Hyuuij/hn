const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdht6CoTy4Ldy3IguEeGB3c4lHKjnorQwyJe0D6BWG10t9D21BB-Q_-JZilVd8m6aslgNMYy93u2Yi/pub?output=csv";

async function startExtraction() {
    const oIn = document.getElementById('orderID').value.trim();
    const uIn = document.getElementById('user').value.trim().toLowerCase();

    // المشكلة 4: حد الاستخدام (3 مرات لكل رقم طلب)
    let usageCount = localStorage.getItem('usage_' + oIn) || 0;
    if (parseInt(usageCount) >= 3) {
        alert("عذراً، لقد تجاوزت الحد الأقصى لاستخدام رقم هذا الطلب (3 مرات).");
        return;
    }

    try {
        const res = await fetch(csvUrl);
        const data = await res.text();
        const rows = data.split(/\r?\n/).map(row => row.split(","));
        
        let secret = null;

        // المشكلة 2: التأكد أن اليوزر ورقم الطلب في نفس السطر
        for (let i = 1; i < rows.length; i++) {
            const rowOrderID = rows[i][0]?.trim();
            const rowUsername = rows[i][1]?.trim().toLowerCase();
            const rowSecret = rows[i][2]?.trim();

            if (rowOrderID === oIn && rowUsername === uIn && rowSecret) {
                secret = rowSecret.replace(/=/g, ''); // المشكلة 1: تنظيف السر
                break;
            }
        }

        if (secret) {
            // تحديث عدد الاستخدامات
            usageCount++;
            localStorage.setItem('usage_' + oIn, usageCount);

            document.getElementById('resultArea').style.display = 'block';
            
            // المشكلة 3: توليد كود واحد ثابت (بدون setInterval)
            document.getElementById('steamCode').innerText = generateSteamCode(secret);
            document.getElementById('timerBar').innerText = `عدد مرات الاستخراج المتبقية لهذا الطلب: ${3 - usageCount}`;
            
        } else {
            alert("بيانات غير متطابقة! تأكد من أن رقم الطلب واليوزر في نفس السطر بالجدول.");
        }
    } catch (e) {
        alert("خطأ في جلب البيانات من الجدول.");
    }
}

// محرك التوليد الأساسي
function generateSteamCode(secret) {
    const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bin = '';
    for (let i = 0; i < secret.length; i++) {
        const p = b64.indexOf(secret[i]);
        if (p !== -1) bin += p.toString(2).padStart(6, '0');
    }
    const time = Math.floor(Date.now() / 1000 / 30);
    const tBuf = new Uint8Array(8);
    for (let i = 0; i < 8; i++) tBuf[7 - i] = (time >> (i * 8)) & 0xff;
    const sha = new jsSHA("SHA-1", "BYTES");
    let sBytes = "";
    for(let i=0; i<bin.length; i+=8) sBytes += String.fromCharCode(parseInt(bin.substr(i,8), 2));
    sha.setHMACKey(sBytes, "BYTES");
    sha.update(String.fromCharCode.apply(null, tBuf));
    const h = sha.getHMAC("BYTES");
    const chars = "23456789BCDFGHJKMNPQRTVWXY";
    const off = h.charCodeAt(h.length - 1) & 0xf;
    let full = ((h.charCodeAt(off) & 0x7f) << 24) | ((h.charCodeAt(off + 1) & 0xff) << 16) | ((h.charCodeAt(off + 2) & 0xff) << 8) | (h.charCodeAt(off + 3) & 0xff);
    let res = "";
    for (let i = 0; i < 5; i++) { res += chars.charAt(full % chars.length); full = Math.floor(full / chars.length); }
    return res;
}