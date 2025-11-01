# 👥🤖 AI NPC Conversations Feature

## ✅ Implementation Complete!

Added AI NPC Conversations feature powered by Google Gemini API, providing players with dynamic conversations with various characters in the game world.

**NEW**: NPCs now offer AI-powered quests! See [NPC_QUEST_SYSTEM.md](./NPC_QUEST_SYSTEM.md) for details.

---

## 🎯 **What's New:**

### **AI NPC System**
1. **Multiple NPC Types**: Clients, Investors, Mentors, Competitors
2. **Dynamic Personalities**: Friendly, Serious, Funny, Strict
3. **Context-Aware**: NPCs know your progress and company stats
4. **Conversation Memory**: Last 15 messages remembered
5. **Unique Characters**: 7 pre-seeded NPCs with rich backgrounds

---

## 🎨 **Available NPCs:**

### **Early Game (Level 1+)**
- **👤 Alex Chen** - Tech startup founder (Client, Friendly)
  - "Looking for reliable dev partners with clean code and fast delivery"
  
- **🍪 Grandma Betty** - Retired teacher (Client, Funny)
  - "Wants to build a recipe-sharing website, provides homemade cookies!"

### **Mid Game (Level 2+)**
- **⚔️ Luna Rodriguez** - Rival agency CEO (Competitor, Funny)
  - "Started same time as you, friendly rivalry and competition"

### **Mid-High Game (Level 3+)**
- **🎓 Marcus Johnson** - Seasoned CTO (Mentor, Friendly)
  - "Built 3 tech companies, loves sharing wisdom about team building"

- **🎓 Dr. Priya Patel** - Product management expert (Mentor, Friendly)
  - "Led product at 5 unicorns, expert in growth strategy"

### **High Game (Level 5+)**
- **💰 Sarah Martinez** - Angel investor (Investor, Serious)
  - "Invested in 50+ companies, very analytical and data-driven"

### **End Game (Level 6+)**
- **👤 CryptoKing** - Crypto project owner (Client, Strict)
  - "Made millions from crypto, very demanding with security"

---

## 🚀 **How to Use:**

### **Access NPCs:**
1. Reach **Company Level 10** (Premium AI Feature)
2. Go to Dashboard → Click **"👥 NPCs"** card
3. Browse available NPCs
4. Click an NPC to start chatting!

### **Conversation Features:**
- Chat with unique AI characters
- Each NPC has their own personality
- Context-aware responses based on your progress
- Save and clear conversation history
- Beautiful gradient cards by personality type

---

## 🧩 **Technical Implementation:**

### **Backend:**
- **Model**: `NPC` table stores character data
- **Conversations**: `npc_conversations` table stores chat history
- **Controller**: `NPCController` handles API requests
- **Service**: `GeminiService::chatWithNPC()` for AI responses
- **Context**: Game state included for personalized conversations

### **Database Schema:**
```sql
npcs table:
- id: Primary key
- name: Character name
- role: client/investor/mentor/competitor
- description: Short description
- personality: friendly/serious/funny/strict
- background: Rich backstory
- required_company_level: Minimum level to unlock

npc_conversations table:
- id: Primary key
- user_id: Foreign key
- npc_id: Foreign key
- role: 'user' or 'npc'
- message: Text content
- timestamps
```

### **API Endpoints:**
```php
GET    /api/npcs                           // Get all available NPCs
GET    /api/npcs/{npcId}/conversation      // Get conversation history
POST   /api/npcs/{npcId}/conversation      // Send message to NPC
DELETE /api/npcs/{npcId}/conversation      // Clear conversation
```

### **AI Context:**
Each NPC receives:
- NPC name, role, description
- Personality traits
- Background information
- Last 15 conversation messages
- Player level & reputation
- Company level & name

---

## 🎯 **Features:**

✅ **Multiple Characters** - 7 unique NPCs with distinct personalities  
✅ **Role-Based** - Clients, Investors, Mentors, Competitors  
✅ **Personality Types** - Friendly, Serious, Funny, Strict  
✅ **Context-Aware** - NPCs know your progress and stats  
✅ **Conversation Memory** - Last 15 messages remembered  
✅ **Progressive Unlock** - NPCs unlock as you progress  
✅ **Beautiful UI** - Gradient cards matching personality  
✅ **Conversation History** - All messages saved  
✅ **Clear History** - Delete conversations anytime  

---

## 🎨 **UI Design:**

### **Personality Colors:**
- **Friendly**: Green to Blue gradient
- **Serious**: Gray gradient
- **Funny**: Yellow to Orange gradient
- **Strict**: Red to Pink gradient

### **NPC Cards:**
- Large emoji icon
- Name and role
- Description preview
- Required level badge
- Hover effects and animations

### **Chat Interface:**
- Message bubbles with role distinction
- NPC icons in messages
- Typing indicators
- Timestamps
- Auto-scroll to latest

---

## 🔒 **Unlock System:**

NPCs unlock based on Company Level:
- **Level 1+**: Alex Chen, Grandma Betty
- **Level 2+**: Luna Rodriguez
- **Level 3+**: Marcus Johnson
- **Level 4+**: Dr. Priya Patel
- **Level 5+**: Sarah Martinez
- **Level 6+**: CryptoKing

---

## 🎉 **Example Conversations:**

```
Player: "I'm struggling with team productivity"

Marcus Johnson (Mentor): "Hey! I saw you have 5 employees at Level 3. 
Great start! 🎉 My advice: Focus on hiring specialists over generalists. 
A dedicated Frontend Dev will boost your project progress way more than 
another Jack-of-all-trades. Also, make sure to use the Auto Rest feature 
- happy devs = better results!"

-----------

Player: "How can I get more funding?"

Sarah Martinez (Investor): "Based on your current stats (Level 8, 12 
completed projects), you're on the right track. But here's what I look for: 
1) Consistent monthly revenue 2) Active products generating income 
3) Team scalability. Right now focus on launching your first product 
- that's where the real value lies in tech companies."
```

---

## 🚀 **Future Enhancements:**

- [ ] **NPC Quests**: NPCs can offer quests/rewards
- [ ] **Multiple Conversations**: Talk to multiple NPCs at once
- [ ] **NPC Reactions**: Visual reactions to messages
- [ ] **More NPCs**: Add more characters and roles
- [ ] **NPC Events**: Random NPC appearances
- [ ] **Voice**: Voice responses from NPCs
- [ ] **Persistent Story**: Ongoing story arcs with NPCs
- [ ] **NPC Trading**: Trade resources with NPCs

---

## 🎉 **Ready to Use!**

1. Reach **Company Level 10**
2. Visit Dashboard
3. Click **"👥 NPCs"**
4. Choose your NPC
5. Start conversing!

**Your AI-powered NPCs are ready to chat!** 🚀

