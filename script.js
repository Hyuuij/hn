const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdht6CoTy4Ldy3IguEeGB3c4lHKjnorQwyJe0D6BWG10t9D21BB-Q_-JZilVd8m6aslgNMYy93u2Yi/pub?output=csv";

async function startExtraction() {
    // 1. جلب القيم من الخانات
    const oIn = document.getElementById('orderID').value.trim();
    const uIn = document.getElementById('user').value.trim().toLowerCase();

    if (!oIn || !uIn) {
        alert("أدخل رقم الطلب واسم الحساب أولاً!");
        return;
    }

    try {
        // 2. جلب بيانات الجدول
        const res = await fetch(csvUrl);
        const data = await res.text();
        const rows = data.split("\n").map(r => r.split(","));
        
        let secret = null;
        // 3. البحث عن المطابقة
        for(let i=1; i<rows.length; i++) {
            if(rows[i][0]?.trim() === oIn && rows[i][1]?.trim().toLowerCase() === uIn) {
                secret = rows[i][2]?.trim().replace(/=/g, ''); 
                break;
            }
        }

        // 4. تشغيل المولد إذا وجدنا السر
        if(secret) {
            document.getElementById('resultArea').style.display = 'block';
            if (window.otpTimer) clearInterval(window.otpTimer);
            window.otpTimer = setInterval(() => {
                document.getElementById('steamCode').innerText = generateSteamCode(secret);
                let seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
                document.getElementById('timerBar').innerText = "يتحدث الكود خلال: " + seconds + " ثانية";
            }, 1000);
        } else { 
            alert("البيانات غير صحيحة أو غير موجودة بالجدول!"); 
        }
    } catch(e) { 
        alert("فشل الاتصال بالجدول، تأكد من نشره بصيغة CSV"); 
    }
}

// محرك توليد الأكواد (نفس المعتمد الذي أظهر PDW9T)
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