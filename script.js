// تأكد أن هذا الرابط هو نفس رابط الـ CSV الخاص بك
const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSdht6CoTy4Ldy3IguEeGB3c4lHKjnorQwyJe0D6BWG10t9D21BB-Q_-JZilVd8m6aslgNMYy93u2Yi/pub?output=csv";

async function startExtraction() {
    console.log("تم ضغط الزر..."); // للتأكد أن الزر يعمل
    const oIn = document.getElementById('orderID').value.trim();
    const uIn = document.getElementById('user').value.trim().toLowerCase();

    if (!oIn || !uIn) {
        alert("يرجى إدخال رقم الطلب واسم الحساب!");
        return;
    }

    try {
        const res = await fetch(csvUrl);
        if (!res.ok) throw new Error("فشل الاتصال بالجدول");
        
        const data = await res.text();
        const rows = data.split("\n").map(r => r.split(","));
        
        let secret = null;
        for(let i=1; i<rows.length; i++) {
            // تنظيف البيانات من المسافات المخفية
            const rowOrder = rows[i][0]?.trim();
            const rowUser = rows[i][1]?.trim().toLowerCase();
            
            if(rowOrder === oIn && rowUser === uIn) {
                secret = rows[i][2]?.trim().replace(/=/g, '');
                break;
            }
        }

        if(secret) {
            document.getElementById('resultArea').style.display = 'block';
            if (window.otpTimer) clearInterval(window.otpTimer);
            window.otpTimer = setInterval(() => {
                document.getElementById('steamCode').innerText = generateSteamCode(secret);
                let seconds = 30 - (Math.floor(Date.now() / 1000) % 30);
                document.getElementById('timerBar').innerText = "يتغير الكود خلال: " + seconds + " ثانية";
            }, 1000);
        } else { 
            alert("لم يتم العثور على بيانات مطابقة. تأكد من رقم الطلب واسم الحساب في الجدول."); 
        }
    } catch(e) { 
        console.error(e);
        alert("حدث خطأ أثناء جلب البيانات. تأكد من أن رابط الجدول منشور (Published to web) بصيغة CSV."); 
    }
}

function generateSteamCode(secret) {
    try {
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
    } catch (e) { return "ERR"; }
}