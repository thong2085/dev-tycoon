# 🧪 Realtime Testing Guide - Phase 3

Complete guide for testing Pusher realtime features in Dev Tycoon.

---

## 🎯 **What We're Testing**

1. ✅ **Achievement Unlocked** - Real-time notifications when achievements are unlocked
2. ✅ **Player Prestiged** - Notifications when players prestige
3. ✅ **Leaderboard Updated** - Auto-refresh leaderboard when someone progresses
4. ✅ **Pusher Connection** - Connection status indicators
5. ✅ **Debug Console** - Event logging and debugging

---

## 🛠️ **Setup**

### **1. Backend (.env)**
Ensure your `backend/.env` has Pusher credentials:
```env
PUSHER_APP_ID=2071184
PUSHER_APP_KEY=642a5ff6eee4d82268ec
PUSHER_APP_SECRET=96986db4ff0330b68055
PUSHER_HOST=api-ap1.pusher.com
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=ap1
```

### **2. Frontend (.env.local)**
Create `frontend/.env.local` if not exists:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PUSHER_APP_KEY=642a5ff6eee4d82268ec
NEXT_PUBLIC_PUSHER_APP_CLUSTER=ap1
```

### **3. Start Services**
```bash
# Terminal 1 - Laravel Backend
cd backend
php artisan serve

# Terminal 2 - Next.js Frontend
cd frontend
npm run dev

# Terminal 3 - Laravel Queue Worker (IMPORTANT!)
cd backend
php artisan queue:work
```

⚠️ **CRITICAL**: Queue worker must be running for events to broadcast!

---

## 🧪 **Test Scenarios**

### **Test 1: Debug Console** 🐛

**Steps:**
1. Open `http://localhost:3000/dashboard`
2. Look for **"🐛 Debug Console"** button in bottom-right
3. Click to open console
4. Check connection status: **🟢 Connected** or **🔴 Disconnected**

**Expected:**
- Console opens with animation
- Shows "Connected" status
- Displays channel: `global-activities`

---

### **Test 2: Achievement Notification** 🏅

**Setup:**
- Open **2 browser windows** (or tabs)
- Login to **same or different accounts** in each

**Window 1 (Trigger):**
1. Go to Dashboard
2. Click "💻 Write Code" button multiple times
3. Click "🧪 Test: Check Achievements" button

**Window 2 (Receiver):**
1. Watch **top-right corner** for purple notification:
   ```
   ┌───────────────────────────────────┐
   │ 🏅 YourName unlocked 💵 First... │
   └───────────────────────────────────┘
   ```

**Debug Console Check:**
- Should log `achievement.unlocked` event
- Data should contain: `user_name`, `achievement_name`, `achievement_icon`

---

### **Test 3: Prestige Notification** ✨

**Setup:**
- Window 1: Player with Level 50+ and $1M+
- Window 2: Observer

**Window 1 (Trigger):**
1. Go to Dashboard
2. Scroll down to **"✨ Prestige Available!"** section
3. Click **"✨ PRESTIGE NOW ✨"**
4. Confirm in modal

**Window 2 (Receiver):**
1. Watch **top-right** for notification:
   ```
   ┌───────────────────────────────────┐
   │ ✨ YourName prestiged to Level X!│
   └───────────────────────────────────┘
   ```

**Debug Console Check:**
- Event: `player.prestiged`
- Data: `user_name`, `prestige_level`, `points_gained`

---

### **Test 4: Leaderboard Auto-Refresh** 📊

**Setup:**
- Window 1: Dashboard (to trigger actions)
- Window 2: Leaderboard page (`/dashboard/leaderboard`)

**Window 2 (Leaderboard):**
1. Open Leaderboard
2. Check **top-right corner** for:
   - 🟢 **Live** indicator (green dot)
   - Last update time

**Window 1 (Trigger):**
1. Earn money (click "Write Code")
2. Complete projects
3. Or prestige

**Window 2 (Expected):**
1. **"LIVE UPDATE!"** badge appears (green, bouncing) in top-right
2. Leaderboard **automatically refreshes**
3. Rankings update in real-time
4. Badge disappears after 3 seconds

**Debug Console Check:**
- Event: `leaderboard.updated`
- Data: `category` (e.g., "money")

---

### **Test 5: Multiple Tabs** 🔀

**Setup:**
- Open **3+ tabs** on same browser
- All on Dashboard or different pages

**Test:**
1. Tab 1: Unlock achievement
2. **All other tabs** should receive notification simultaneously

**Expected:**
- Notifications appear in **all tabs**
- Timing is near-instant (<1 second delay)
- Console logs in all tabs

---

### **Test 6: Connection Recovery** 🔄

**Test Disconnect:**
1. Open Leaderboard page
2. Turn off WiFi / disconnect internet
3. Check status: 🔴 **Offline**

**Test Reconnect:**
1. Turn on WiFi / reconnect internet
2. Status should change to: 🟢 **Live**
3. Events resume

**Expected:**
- Status indicator updates correctly
- Auto-reconnect on network restore
- Events work after reconnect

---

### **Test 7: Cross-User Notifications** 👥

**Setup:**
- Register **2 different accounts**
- Login on different browsers (Chrome, Firefox)

**Browser 1 (User A):**
1. Play game, earn achievements
2. Prestige

**Browser 2 (User B):**
1. Should see User A's notifications
2. Leaderboard auto-updates with User A's progress

**Expected:**
- Both users see each other's activities
- Real "multiplayer feel"

---

## 🔍 **Debug Console Features**

### **Buttons:**
- **🧪 Test**: Send a manual test event to console
- **🗑️ Clear**: Clear all logs
- **✕**: Close console

### **Event Log Shows:**
```json
{
  "channel": "global-activities",
  "event": "achievement.unlocked",
  "timestamp": "10:30:45 AM",
  "data": {
    "user_name": "John Doe",
    "achievement_name": "First Dollar",
    "achievement_icon": "💵",
    "message": "John Doe unlocked 💵 First Dollar!"
  }
}
```

---

## 🐛 **Troubleshooting**

### **Problem: Status shows "Disconnected" 🔴**

**Solutions:**
1. Check `.env.local` in frontend
2. Verify Pusher credentials
3. Check browser console for errors
4. Restart Next.js dev server

### **Problem: No events received**

**Solutions:**
1. ✅ **START QUEUE WORKER**: `php artisan queue:work`
2. Check backend `.env` Pusher config
3. Verify event dispatching in code
4. Check Debug Console for errors

### **Problem: Events delayed**

**Solutions:**
1. Restart queue worker
2. Check network latency
3. Verify Pusher dashboard (pusher.com)

### **Problem: Duplicate events**

**Solutions:**
1. Only one Pusher instance should exist
2. Check for multiple RealtimeProvider components
3. Restart browser

---

## ✅ **Success Criteria**

All tests pass if:
- ✅ Debug console shows "Connected"
- ✅ Achievement notifications appear in other tabs
- ✅ Prestige notifications appear globally
- ✅ Leaderboard auto-refreshes with "LIVE UPDATE!" badge
- ✅ Connection status indicator works
- ✅ Events appear in Debug Console
- ✅ Cross-user notifications work
- ✅ Reconnection after disconnect works

---

## 📸 **Visual Indicators**

### **1. Realtime Notifications (Top-Right)**
```
Purple/Pink gradient box with:
🏅 Player unlocked Achievement!
✨ Player prestiged to Level X!
```

### **2. Leaderboard Status (Top-Right)**
```
┌─────────────────────┐
│ 🟢 Live            │  ← Green dot = connected
│ 10:30:45 AM        │  ← Last update
└─────────────────────┘
```

### **3. Live Update Badge**
```
┌─────────────────────┐
│ 🔴 LIVE UPDATE!    │  ← Appears & bounces
└─────────────────────┘
```

### **4. Debug Console**
```
┌─────────────────────────────────┐
│ 🐛 Pusher Debug Console         │
│ 🟢 Connected                    │
├─────────────────────────────────┤
│ [global-activities]             │
│ [achievement.unlocked]          │
│ { ... data ... }                │
└─────────────────────────────────┘
```

---

## 🎮 **Quick Test Checklist**

- [ ] Backend running (`php artisan serve`)
- [ ] Frontend running (`npm run dev`)
- [ ] **Queue worker running** (`php artisan queue:work`)
- [ ] `.env` configured (backend & frontend)
- [ ] Debug console shows "Connected"
- [ ] Open 2+ tabs/windows
- [ ] Test achievement notification
- [ ] Test prestige notification
- [ ] Test leaderboard auto-refresh
- [ ] Test connection recovery
- [ ] All events appear in Debug Console

---

## 🚀 **Performance Notes**

- **Leaderboard**: Auto-refresh every 30s + instant on event
- **Notifications**: 5-second auto-dismiss
- **Connection**: Auto-reconnect on disconnect
- **Debug Console**: Keeps last 50 events
- **Queue**: Processes events in background

---

## 📝 **Event Payloads**

### **achievement.unlocked**
```json
{
  "user_id": 1,
  "user_name": "John Doe",
  "achievement_id": 1,
  "achievement_name": "First Dollar",
  "achievement_icon": "💵",
  "message": "John Doe unlocked 💵 First Dollar!"
}
```

### **player.prestiged**
```json
{
  "user_id": 1,
  "user_name": "John Doe",
  "prestige_level": 1,
  "points_gained": 10,
  "message": "✨ John Doe prestiged to Level 1!"
}
```

### **leaderboard.updated**
```json
{
  "category": "money",
  "message": "Leaderboard (money) updated!"
}
```

---

**Happy Testing! 🎉**

If all tests pass, Phase 3 is complete! ✅

