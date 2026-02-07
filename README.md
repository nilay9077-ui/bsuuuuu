# BSU Chat - Bakı Dövlət Universiteti Tələbələr Platforması

## Layihə Haqqında

BSU Chat, Bakı Dövlət Universitetinin 16 fakültəsinin tələbələri üçün real-time mesajlaşma platformasıdır. Platform, fakültə əsaslı qrup çatları və şəxsi mesajlaşma imkanları təqdim edir.

## Əsas Xüsusiyyətlər

### İstifadəçi Funksiyaları
- ✅ **Qeydiyyat Sistemi**: @bsu.edu.az email və +994 telefon nömrəsi ilə qeydiyyat
- ✅ **Doğrulama**: Fakültə korpus məlumatları ilə 3 təsdiqleme sualı (minimum 2 doğru cavab)
- ✅ **Avatar Seçimi**: 16 müxtəlif avatar arasından seçim
- ✅ **16 Fakültə Chat Otağı**: Hər fakültə üçün ayrı qrup söhbəti
- ✅ **Şəxsi Mesajlaşma**: İstifadəçilər arası direkt mesaj
- ✅ **Blok Funksiyası**: İstifadəçiləri bloklama imkanı
- ✅ **Şikayət Sistemi**: Uyğunsuz hesabları bildirmə
- ✅ **Profil Redaktəsi**: Ad, fakültə, dərəcə, kurs, avatar dəyişmə
- ✅ **Real-time Mesajlar**: Socket.IO ilə canlı mesajlaşma
- ✅ **Filtr Sistemi**: Admin tərəfindən qadağan edilən sözlərin avtomatik senzuru

### Admin Paneli
- ✅ **İstifadəçi İdarəetməsi**: Bütün istifadəçilərin siyahısı və status dəyişmə
- ✅ **Təhlikəli Hesablar**: 8+ şikayət alan hesabların xüsusi siyahısı
- ✅ **Filtr Sistemi**: Mesajlarda qadağan edilən sözlərin idarəsi
- ✅ **Günün Mövzusu**: Bütün çatlarda görsənən mövzu təyin etmə
- ✅ **Mesaj Avtomatik Silinmə**: Qrup və şəxsi mesajlar üçün ayrı vaxt ayarları
- ✅ **Qaydalar**: Platformanın istifadə qaydalarını redaktə etmə
- ✅ **Haqqında**: Platform haqqında məlumat redaktəsi
- ✅ **Alt Admin Yaratma**: Super admin alt adminlər yarada bilər (yalnız super admin)

### Fakültələr

1. Mexanika-riyaziyyat
2. Tətbiqi riyaziyyat və kibernetika
3. Fizika
4. Kimya
5. Biologiya
6. Ekologiya və torpaqşünaslıq
7. Coğrafiya
8. Geologiya
9. Filologiya
10. Tarix
11. Beynəlxalq münasibətlər və iqtisadiyyat
12. Hüquq
13. Jurnalistika
14. İnformasiya və sənəd menecmenti
15. Şərqşünaslıq
16. Sosial elmlər və psixologiya

## Texnologiyalar

### Backend
- **Node.js** - Server mühiti
- **Express.js** - Web framework
- **Socket.IO** - Real-time mesajlaşma
- **PostgreSQL** - Verilənlər bazası (Render)
- **bcryptjs** - Şifrələmə
- **express-session** - Sessiya idarəsi

### Frontend
- **HTML5/CSS3** - İnterfeys
- **Vanilla JavaScript** - Frontend məntiq
- **Socket.IO Client** - Real-time bağlantı
- **DiceBear Avatars** - Avatar generasiyası

## Quraşdırma

### Lokal İnkişaf

```bash
# Asılılıqları quraşdır
npm install

# Environment dəyişənləri (.env faylı)
PORT=3000
DATABASE_URL=postgresql://...
SESSION_SECRET=your_secret_key

# Serveri işə sal
npm start

# Development rejimi (nodemon)
npm run dev
```

### Render.com Deploy

1. **GitHub Repository**: Layihəni GitHub-a yüklə
2. **Render Dashboard**: render.com-da yeni Web Service yarat
3. **Ayarlar**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: `.env` faylındakı dəyişənləri əlavə et

4. **PostgreSQL Database**: Render-də PostgreSQL database yarat və `DATABASE_URL` əlavə et

## Admin Girişi

### Super Admin
- **İstifadəçi adı**: 618ursamajor618
- **Şifrə**: majorursa618

Super admin bütün admin funksiyalarına və alt admin yaratma hüququna malikdir.

## Verilənlər Bazası Strukturu

### Users
- id, email, phone, password, full_name, faculty, degree, course, avatar, is_active, created_at

### Messages
- id, sender_id, receiver_id, faculty, message, is_private, created_at

### Blocks
- id, blocker_id, blocked_id, created_at

### Reports
- id, reporter_id, reported_id, created_at

### Admins
- id, username, password, is_super, created_at

### Admin Settings
- id, key, value, updated_at

## API Endpoints

### İstifadəçi
- `POST /api/register` - Qeydiyyat
- `POST /api/login` - Giriş
- `POST /api/logout` - Çıxış
- `GET /api/user` - Cari istifadəçi məlumatı
- `PUT /api/user` - Profil yeniləmə
- `GET /api/verification-questions` - Təsdiqleme sualları
- `POST /api/block/:userId` - İstifadəçini blokla
- `POST /api/report/:userId` - İstifadəçini şikayət et

### Admin
- `POST /api/admin/login` - Admin girişi
- `GET /api/admin/settings` - Ayarlar
- `PUT /api/admin/settings` - Ayarları yenilə
- `GET /api/admin/users` - Bütün istifadəçilər
- `PUT /api/admin/users/:id/toggle` - İstifadəçi statusunu dəyiş
- `GET /api/admin/reported-users` - Şikayət edilən istifadəçilər
- `GET /api/admin/sub-admins` - Alt adminlər (super admin)
- `POST /api/admin/sub-admins` - Alt admin yarat (super admin)
- `DELETE /api/admin/sub-admins/:id` - Alt admini sil (super admin)

### Public
- `GET /api/settings/public` - Ümumi ayarlar (mövzu, qaydalar, haqqında)

## Socket.IO Events

### Client -> Server
- `user_connected` - İstifadəçi bağlandı
- `join_faculty` - Fakültəyə qoşul
- `send_message` - Mesaj göndər
- `get_messages` - Mesajları yüklə
- `get_faculty_users` - Fakültə istifadəçilərini yüklə

### Server -> Client
- `new_message` - Yeni mesaj
- `messages_loaded` - Mesajlar yükləndi
- `faculty_users_loaded` - İstifadəçilər yükləndi
- `settings_updated` - Ayarlar yeniləndi
- `error` - Xəta

## Xüsusiyyətlər

### Avtomatik Mesaj Silinmə
- Qrup və şəxsi mesajlar üçün ayrı vaxt ayarları
- Dəqiqə və ya saat vahidi ilə konfiqurasiya
- Hər dəqiqə avtomatik yoxlama

### Mesaj Filtri
- Admin tərəfindən qadağan edilmiş sözlərin avtomatik ulduzlaması
- Real-time tətbiq
- Vergüllə ayrılmış siyahı

### Təhlükəsizlik
- Şifrələrin bcrypt ilə hash-lənməsi
- Session əsaslı autentifikasiya
- SQL injection qorunması
- XSS qorunması

## Layihə Statusu

- ✅ **Backend**: Tam funksional
- ✅ **Frontend**: Responsive dizayn
- ✅ **Real-time Chat**: Socket.IO inteqrasiyası
- ✅ **Admin Panel**: Tam funksional
- ✅ **Database**: PostgreSQL (Render)
- ✅ **Deployment Ready**: Render.com üçün hazır

## Gələcək Təkmilləşdirmələr

- [ ] File upload (şəkil, sənəd)
- [ ] Mesaj axtarışı
- [ ] Notification sistemi
- [ ] Email bildirişləri
- [ ] Mobil tətbiq (React Native)
- [ ] Video/audio çağırış

## Lisenziya

Bu layihə təhsil məqsədi üçün hazırlanmışdır.

## Əlaqə

Suallar üçün admin paneli vasitəsilə əlaqə saxlayın.

---

**Son yenilənmə**: 2026-02-07
**Version**: 1.0.0
**Status**: Production Ready ✅
