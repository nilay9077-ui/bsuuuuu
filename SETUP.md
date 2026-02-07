# BSU Chat - Quraşdırma Təlimatı

## ⚠️ ÖNƏMLİ - Verilənlər Bazası Konfiqurasiyası

Layihə işə düşməmiş hal Layihə bu halda hazırda PostgreSQL verilənlər bazası bağlantı xətası verir. Bu xətanı həll etmək üçün aşağıdakı addımları izləyin:

## Database URL-i Yeniləmə

### Render PostgreSQL Database URL-i əldə etmək:

1. **Render.com**-a daxil olun: https://render.com
2. Dashboard-da **PostgreSQL database**-inizi seçin
3. **"Info"** və ya **"Connect"** bölməsinə keçin
4. **"External Database URL"** və ya tam bağlantı məlumatlarını kopyalayın

URL formatı belə görünməlidir:
```
postgresql://username:actual_password@hostname.oregon-postgres.render.com:5432/database_name
```

### `.env` Faylını Yeniləyin:

1. Layihə qovluğunda `.env` faylını açın
2. `DATABASE_URL` xəttini tapın
3. Render-dən aldığınız URL ilə əvəz edin

**Nümunə `.env` faylı:**
```bash
PORT=3000
DATABASE_URL=postgresql://buy_ziva1_user:ACTUAL_PASSWORD_HERE@dpg-d639fh7pm1nc73egqh9g-a.oregon-postgres.render.com:5432/buy_ziva1
SESSION_SECRET=bsu_secret_key_618ursamajor618_secure_random
NODE_ENV=production
```

**⚠️ ÖNƏMLİ:** `ACTUAL_PASSWORD_HERE` hissəsini Render-dəki real şifrə ilə əvəz edin!

## Serveri Yenidən İşə Salma

`.env` faylını yenilədikdən sonra:

```bash
cd /home/user/webapp

# Port-u təmizlə
fuser -k 3000/tcp 2>/dev/null || true

# PM2-ni yenilə
pm2 delete all
pm2 start ecosystem.config.cjs

# Logları yoxla
pm2 logs bsu-chat --nostream

# Server işləyirsə bu mesajı görəcəksiniz:
# "Database initialized successfully!"
# "BSU Chat server running on port 3000"
```

## Database-i Test Etmək

```bash
cd /home/user/webapp
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT NOW()', (err, res) => { if (err) { console.log('Error:', err.message); } else { console.log('✅ Success! Connected'); console.log('Time:', res.rows[0].now); } pool.end(); });"
```

Əgər "✅ Success! Connected" görürsünüzsə, bağlantı düzdür!

## Yeni Render PostgreSQL Database Yaratmaq (Alternativ)

Əgər mövcud database ilə problem varsa, yeni yarada bilərsiniz:

1. Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Database adı: `bsu-chat-db` (və ya istədiyiniz ad)
3. **"Create Database"** düyməsinə basın
4. Yarandıqdan sonra **"External Database URL"**-i kopyalayın
5. `.env` faylında `DATABASE_URL`-i yeniləyin

## Xəta Həlli

### "password authentication failed" xətası
- `.env` faylında şifrənin düzgün olduğunu yoxlayın
- Render dashboard-dan yenidən URL kopyalayın
- Boşluq və ya xüsusi simvolların düzgün yazıldığını yoxlayın

### "connection timeout" xətası
- Internet bağlantınızı yoxlayın
- Render database-in aktiv olduğunu yoxlayın (hibernated ola bilər)
- Hostname-in düzgün olduğunu yoxlayın

### "SSL required" xətası
- Kod avtomatik SSL aktivləşdirir, ancaq URL-də `?sslmode=require` əlavə edə bilərsiniz

## Test İstifadəçiləri

Database düzgün işləyəndən sonra avtomatik yaradılacaq:

**Super Admin:**
- İstifadəçi adı: `618ursamajor618`
- Şifrə: `majorursa618`

**Test ayarları avtomatik əlavə olunacaq:**
- Günün mövzusu
- Qaydalar
- Haqqında mətn
- Filtr sözləri

## Kömək

Əgər problem davam edirs Render-in dəstək sənədlərinə baxın:
- https://render.com/docs/databases
- https://render.com/docs/connect-to-postgresql

Və ya yeni database yaradıb təmiz başlayın.
