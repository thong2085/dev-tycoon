# 🎮 Start Game Services - Dev Tycoon

## 📋 **Required Services for Full Game Functionality**

---

## 🚀 **QUICKSTART (Recommended)** ⭐

### **Option 1: Single Command** (Easiest!)
```powershell
cd D:\dev-tycoon\backend
php artisan serve:all
```
**This starts BOTH server AND scheduler automatically!** 🎉

Or use composer shortcut:
```powershell
cd D:\dev-tycoon\backend
composer serve
# or
composer dev
```

### **Option 2: Batch File** (Click & Go!)
Double-click: `start-game.bat` in project root
→ Opens 3 terminals automatically!

---

## 📖 **Manual Setup (If You Want Control)**

## 1️⃣ **Laravel Server + Scheduler** (Combined)
```powershell
cd D:\dev-tycoon\backend
php artisan serve:all
```
**Port**: http://localhost:8000  
**Purpose**: 
- ✅ Handle API requests
- ✅ Auto-progress projects (every minute)
- ✅ Calculate idle income (every minute)
- ✅ Trigger market events (every 5 minutes)
- ✅ Update employee energy/morale

---

## 2️⃣ **Next.js Frontend**
```powershell
cd D:\dev-tycoon\frontend
npm run dev
```
**Port**: http://localhost:3000  
**Purpose**: Game UI

---

## 3️⃣ **Laravel Scheduler** (Separate - Old Way)
```powershell
cd D:\dev-tycoon\backend
php artisan schedule:work
```
**Only use this if you're running `php artisan serve` separately**

---

## 4️⃣ **Queue Worker** (Optional - for async jobs)
```powershell
cd D:\dev-tycoon\backend
php artisan queue:work
```
**Purpose**: Process background jobs (emails, notifications, etc.)

---

## 🚀 **Quick Start (All Services)**

Open **2 terminals** (or just use batch file!):

### **Method A: Two Terminals** (Recommended)

**Terminal 1: Backend (Server + Scheduler)**
```powershell
cd D:\dev-tycoon\backend
php artisan serve:all
# or
composer serve
```

**Terminal 2: Frontend**
```powershell
cd D:\dev-tycoon\frontend
npm run dev
```

---

### **Method B: Batch File** (One Click!)
```powershell
# Just double-click:
start-game.bat
```
This opens 3 terminals automatically (Backend, Scheduler, Frontend)

---

### **Method C: Old Way** (3 Terminals)

**Terminal 1: Backend**
```powershell
cd D:\dev-tycoon\backend
php artisan serve
```

**Terminal 2: Scheduler**
```powershell
cd D:\dev-tycoon\backend
php artisan schedule:work
```

**Terminal 3: Frontend**
```powershell
cd D:\dev-tycoon\frontend
npm run dev
```

---

## 🎯 **What Runs When:**

| Service | Frequency | Commands |
|---------|-----------|----------|
| **Scheduler** | Every minute | `game:process-projects`<br>`game:calculate-idle-income` |
| **Scheduler** | Every 5 min | `game:trigger-market-event` |

---

## 🐛 **Troubleshooting:**

### Projects not progressing?
✅ Check if **Terminal 3 (Scheduler)** is running  
✅ Look for: `Running ["artisan" game:process-projects] .... DONE`

### Scheduler showing FAIL?
Check command exists:
```powershell
php artisan game:process-projects
```

### Want to test manually?
```powershell
# Test project progress
php artisan game:process-projects

# Test idle income
php artisan game:calculate-idle-income
```

---

## 📝 **Production Setup:**

In production, use **cron job** instead of `schedule:work`:

```bash
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

This runs every minute and Laravel decides which tasks to execute.

---

## 💡 **Pro Tip:**

Create a batch file `start-game.bat`:
```batch
@echo off
start "Backend Server" cmd /k "cd D:\dev-tycoon\backend && php artisan serve"
start "Frontend" cmd /k "cd D:\dev-tycoon\frontend && npm run dev"
start "Scheduler" cmd /k "cd D:\dev-tycoon\backend && php artisan schedule:work"
echo All services started!
```

Double-click to start everything at once! 🚀

