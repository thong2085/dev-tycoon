# ⚡ Dev Tycoon - Quick Start Guide

## 🎯 **TL;DR - Start Game in 30 Seconds**

### **Option 1: One Command** (Recommended) ⭐
```powershell
# Terminal 1: Backend + Scheduler (combined!)
cd backend
php artisan serve:all

# Terminal 2: Frontend
cd frontend  
npm run dev
```
**Done!** Open http://localhost:3000

---

### **Option 2: Composer Shortcut** 
```powershell
# Terminal 1
cd backend
composer serve

# Terminal 2
cd frontend
npm run dev
```

---

### **Option 3: One-Click Batch File** 🚀
```
Double-click: start-game.bat
```
→ Opens everything automatically!

---

## 📋 **All Available Commands**

### **Backend**
```powershell
php artisan serve:all        # Server + Scheduler (recommended)
php artisan serve            # Server only (need scheduler separately)
php artisan schedule:work    # Scheduler only

composer serve               # Alias for serve:all
composer dev                 # Alias for serve:all
```

### **Frontend**
```powershell
npm run dev                  # Development server
npm run build                # Production build
npm start                    # Production server
```

---

## 🔧 **Custom Port**
```powershell
php artisan serve:all --port=8080
```

---

## 🛑 **Stop Services**
Press `CTRL + C` in terminal

---

## ❓ **Troubleshooting**

### Projects not progressing?
✅ Make sure you used `serve:all` (includes scheduler)  
❌ If you used `php artisan serve`, you MUST also run `schedule:work`

### Port already in use?
```powershell
php artisan serve:all --port=8080
```

### Need to restart?
```powershell
# Stop (CTRL+C), then:
php artisan serve:all
```

---

## 💡 **What's Running?**

When you use `php artisan serve:all`:
- ✅ Laravel API Server (port 8000)
- ✅ Scheduler (auto-progress, idle income)
- ✅ All game mechanics work!

When you use `php artisan serve`:
- ✅ Laravel API Server (port 8000)
- ❌ NO Scheduler → Projects WON'T progress!
- ⚠️ Must run `schedule:work` separately

---

## 🎮 **Full Setup (First Time)**

```powershell
# 1. Backend setup
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# 2. Frontend setup
cd frontend
npm install

# 3. Start everything
cd backend
php artisan serve:all

# In another terminal:
cd frontend
npm run dev
```

---

## 🔗 **URLs**
- **Frontend (Game)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api

---

**Need more details?** See `START_GAME_SERVICES.md`

