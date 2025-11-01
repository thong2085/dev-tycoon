# 🎯 NPC Quest System

## ✅ Implementation Complete!

Added AI-powered quest system for NPCs, allowing players to receive dynamic quests with rewards.

---

## 🎯 **What's New:**

### **Quest System**
1. **AI-Generated Quests**: Dynamic quests based on NPC role and player progress
2. **Multiple Quest Types**: Hire employees, complete projects, launch products, reach levels, earn money, gain reputation
3. **Progress Tracking**: Real-time progress updates for active quests
4. **Rewards**: Money, reputation, and XP rewards
5. **Quest Expiration**: 24-hour time limit for completion

---

## 📊 **Database Schema:**

### **NPC Model:**
- `can_give_quests`: Boolean flag
- `quest_types`: JSON array of allowed quest types

### **NPCQuest Model:**
- `user_id`: Foreign key to users
- `npc_id`: Foreign key to NPCs
- `quest_type`: String (hire_employee, complete_project, etc.)
- `title`: Quest title
- `description`: Quest description
- `requirements`: JSON object
- `current_progress`: Integer (0+)
- `target_progress`: Integer
- `rewards`: JSON object (money, reputation, xp)
- `status`: Enum (active, completed, expired)
- `expires_at`: Timestamp
- `completed_at`: Timestamp

---

## 🎮 **Quest Types:**

### **Based on NPC Role:**

#### **Client NPCs:**
- `complete_project`: Complete X projects
- `reach_level`: Reach company level X
- `launch_product`: Launch X products

#### **Investor NPCs:**
- `earn_money`: Earn $X
- `gain_reputation`: Gain X reputation
- `launch_product`: Launch X products

#### **Mentor NPCs:**
- `reach_level`: Reach level X
- `gain_reputation`: Gain X reputation

#### **Competitor NPCs:**
- `earn_money`: Earn $X
- `complete_project`: Complete X projects

---

## 🔄 **API Endpoints:**

```
POST   /api/npcs/{npcId}/request-quest   // Request a new quest from NPC
GET    /api/npcs/quests/active          // Get all active quests
POST   /api/npcs/quests/{questId}/complete  // Complete a quest
```

---

## 💻 **How It Works:**

1. **Request Quest**: Player clicks "Request Quest" button in NPC chat
2. **AI Generation**: Gemini generates quest based on:
   - NPC role & personality
   - Player level & progress
   - Company level & stats
3. **Quest Creation**: Quest saved to database with 24h expiration
4. **Progress Tracking**: Player performs actions, system updates progress
5. **Quest Completion**: Player clicks "Complete", rewards granted

---

## 📈 **Quest Rewards:**

Quests grant:
- **Money**: Added to company cash
- **Reputation**: Added to game state
- **XP**: Added to game state

---

## 🎨 **UI Features:**

### **Quest Display:**
- Amber/orange gradient quest card
- Progress bar showing completion
- Reward preview (money, reputation, XP)
- Complete button

### **Quest Request:**
- "Request Quest" button when no active quest
- Loading state during AI generation
- Error handling for failed requests

---

## 🔮 **Future Enhancements:**

1. **Auto-Progress Tracking**: Auto-update quest progress based on game actions
2. **Quest Chains**: Multi-part quest sequences
3. **Daily Quests**: Special limited-time quests
4. **Quest Categories**: Easy/Medium/Hard difficulty
5. **Leaderboard Integration**: Track quest completions
6. **Quest Rewards**: Special items or bonuses

---

## ✅ **Testing Checklist:**

- [x] Request quest from NPC
- [x] Display active quests
- [x] Complete quest successfully
- [x] Handle duplicate quest requests
- [x] Show quest expiration
- [x] Grant rewards correctly
- [x] Error handling for AI failures

---

## 📝 **Example Quest:**

```json
{
  "quest_type": "complete_project",
  "title": "Deliver Excellence",
  "description": "Alex Chen wants to see your company's quality. Complete 3 projects to prove your worth!",
  "requirements": {
    "target": "3 projects",
    "count": 3
  },
  "target_progress": 3,
  "rewards": {
    "money": 15000,
    "reputation": 50,
    "xp": 100
  }
}
```

---

**NPC Quest System - Making NPCs truly interactive!** 🎯✨

