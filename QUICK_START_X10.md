# ⚡ Quick Start - Deploy lên x10Hosting

Hướng dẫn nhanh để deploy Dev Tycoon lên x10Hosting trong 10 phút.

## 🎯 Prerequisites

Trước khi bắt đầu, bạn cần có:
- ✅ Account x10Hosting
- ✅ Domain đã setup (vd: devtycoon.x10.mx)
- ✅ Gemini API Key
- ✅ Pusher credentials
- ✅ MySQL database đã tạo

---

## 📦 Bước 1: Prepare Files

### Trên local machine:

```bash
# 1. Clone project
git clone https://github.com/thong2085/dev-tycoon.git
cd dev-tycoon

# 2. Install backend dependencies
cd backend
# Update composer.json to support PHP 8.1 (already done if using latest code)
composer install --optimize-autoloader --no-dev
# Nếu gặp lỗi PHP version, run trên local với PHP 8.2+, sau đó upload vendor folder

# 3. Copy install helper
# File install.php đã có sẵn
```

### Tạo .env file:

Copy nội dung này vào `backend/.env`:

```env
APP_NAME="Dev Tycoon"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:GENERATE_LATER
APP_TIMEZONE=UTC
APP_URL=https://devtycoon.x10.mx

# Database (lấy từ x10Hosting MySQL)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=YOUR_DB_NAME
DB_USERNAME=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

# Cache & Queue
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file

# Pusher
PUSHER_APP_ID=YOUR_PUSHER_APP_ID
PUSHER_APP_KEY=YOUR_PUSHER_KEY
PUSHER_APP_SECRET=YOUR_PUSHER_SECRET
PUSHER_APP_CLUSTER=ap1
BROADCAST_DRIVER=pusher

# Gemini AI
GEMINI_API_KEY=YOUR_GEMINI_KEY

# Session & CORS
SESSION_LIFETIME=120
SANCTUM_STATEFUL_DOMAINS=devtycoon.x10.mx
FRONTEND_URL=https://devtycoon.x10.mx
```

**Lưu ý**: Thay `YOUR_*` bằng credentials thực của bạn!

---

## 🚀 Bước 2: Upload lên x10Hosting

### Via Control Panel → File Manager:

1. **Tạo ZIP archive** của thư mục `backend`:
   ```bash
   # Trên local
   cd dev-tycoon
   zip -r backend.zip backend/
   ```

2. **Upload file ZIP**:
   - Vào Control Panel
   - Click "File Manager"
   - Navigate đến `public_html`
   - Upload `backend.zip`

3. **Extract ZIP**:
   - Right-click `backend.zip` → "Extract"
   - Xóa file ZIP sau khi extract

4. **Kết quả**: Bạn có cấu trúc:
   ```
   public_html/
   └── backend/
       ├── app/
       ├── bootstrap/
       ├── config/
       ├── database/
       ├── public/
       ├── resources/
       ├── routes/
       ├── storage/
       ├── vendor/
       ├── .env
       ├── artisan
       └── ...
   ```

---

## 🔑 Bước 3: Setup Database

### Trong x10Hosting Control Panel:

1. Vào **MySQL Databases**
2. Tạo database mới: `dev_tycoon`
3. Tạo user mới: `db_user`
4. Cấp full permissions
5. **Ghi lại**:
   - Database name: `username_dev_tycoon`
   - Username: `username_db_user`
   - Password: `your_password`
   - Host: `localhost`

6. **Update `.env`** trong File Manager:
   ```
   DB_DATABASE=username_dev_tycoon
   DB_USERNAME=username_db_user
   DB_PASSWORD=your_password
   ```

---

## ⚠️ QUAN TRỌNG: Update Vendor Folder (Laravel 10)

**Trước khi chạy install.php**, bạn CẦN update vendor folder lên Laravel 10!

### Trên Local Machine (Windows/Mac/Linux):

```bash
cd backend

# Xóa vendor cũ (nếu có Laravel 11)
rm -rf vendor composer.lock

# Update lên Laravel 10
composer update --no-dev --optimize-autoloader

# Verify Laravel version
php artisan --version
# Should show: Laravel Framework 10.x.x
```

### Upload Vendor Folder:

1. **Xóa vendor folder cũ trên server** (qua File Manager hoặc FTP)
2. **Upload vendor folder mới** (từ local, đã có Laravel 10) lên server
3. **Lưu ý**: Vendor folder rất lớn (~50-100MB), upload có thể mất vài phút

### Hoặc dùng FTP Client:

- **FileZilla**: Upload toàn bộ folder `backend/vendor/` 
- **WinSCP**: Sync folder `backend/vendor/`

---

## ⚙️ Bước 4: Run Installation

### Via Browser:

1. Truy cập: **https://devtycoon.x10.mx/backend/public/install.php**
2. Installer sẽ tự động:
   - Check PHP version
   - Check permissions
   - Generate APP_KEY
   - Run migrations
   - Seed database
   - Optimize application

3. **Nếu thành công**, bạn sẽ thấy:
   ```
   ✅ Installation Complete!
   ```

4. **⚠️ QUAN TRỌNG**: Xóa file install.php sau khi install xong!

---

## 🔧 Bước 5: Setup Permissions

### Trong File Manager:

1. Select folders `storage` và `bootstrap/cache`
2. Right-click → **Permissions**
3. Set: **775** (rwxrwxr-x)
4. Apply to all subfolders

---

## ⏰ Bước 6: Setup Scheduler

Shared hosting không có cron ổn định, dùng external cron:

1. **Đăng ký free**: https://cron-job.org

2. **Tạo cron job**:
   - Name: `Dev Tycoon Scheduler`
   - URL: `https://devtycoon.x10.mx/backend/public/api/schedule-trigger`
   - Schedule: `*/1 * * * *` (mỗi phút)

3. **Add header** (Optional - cho security):
   - Name: `X-Schedule-Secret`
   - Value: `your-secret-key`

4. **Update `.env`**:
   ```
   SCHEDULE_SECRET=your-secret-key
   ```

5. **Route đã có sẵn** trong `routes/api.php`:
   ```php
   Route::get('/schedule-trigger', function(Request $request) {
       $secret = env('SCHEDULE_SECRET');
       if ($request->header('X-Schedule-Secret') !== $secret) {
           return response()->json(['error' => 'Unauthorized'], 401);
       }
       
       Artisan::call('schedule:run');
       return response()->json(['success' => true, 'message' => 'Schedule executed']);
   });
   ```

---

## 🌐 Bước 7: Deploy Frontend

### Option A: Vercel (Recommended)

```bash
cd frontend

# Install
npm install

# Deploy
vercel --prod
```

### Configure Vercel Environment Variables:

```
NEXT_PUBLIC_API_URL=https://devtycoon.x10.mx/backend/public/api
NEXT_PUBLIC_PUSHER_APP_KEY=YOUR_PUSHER_KEY
NEXT_PUBLIC_PUSHER_APP_CLUSTER=ap1
```

### Option B: Deploy cùng x10Hosting

1. Build trên local:
   ```bash
   cd frontend
   npm run build
   ```

2. Upload folder `.next` và `public` lên `public_html/frontend`

3. Configure `.htaccess` để point về frontend

---

## ✅ Bước 8: Test

1. **Test API**: https://devtycoon.x10.mx/backend/public/api
2. **Test Login**: Tạo tài khoản test
3. **Test Game**: Chơi thử các tính năng

---

## 🚨 Troubleshooting

### Lỗi: 500 Internal Server Error
**Fix**: Check permissions của `storage/` và `bootstrap/cache/` (phải là 775)

### Lỗi: Database connection failed
**Fix**: 
- Check credentials trong `.env`
- Database host phải là `localhost` (không phải IP)

### Lỗi: Class not found
**Fix**: 
- `vendor/` folder chưa upload
- Run lại: `composer dump-autoload` trên local và upload lại

### Lỗi: Permission denied writing to storage
**Fix**: Set permissions 775 cho `storage/` và các subfolders

---

## 📋 Final Checklist

- [ ] Backend uploaded
- [ ] Database created và configured
- [ ] Installation completed
- [ ] Permissions set (775)
- [ ] Scheduler configured (external cron)
- [ ] Frontend deployed (Vercel)
- [ ] All environment variables set
- [ ] **install.php deleted** (security!)
- [ ] Test login works
- [ ] Test game works

---

## 🎉 Done!

Dev Tycoon đã sẵn sàng chạy trên production!

**Next**: Share game với friends và enjoy! 🚀

---

**Need Help?** 
- Check `DEPLOYMENT_X10.md` for detailed guide
- Check logs: `backend/storage/logs/laravel.log`

