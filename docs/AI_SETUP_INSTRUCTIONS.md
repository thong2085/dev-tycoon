# 🤖 Gemini AI Integration - Setup Instructions

## Step 1: Add API Key to .env

Add these lines to your `backend/.env` file:

```env
GEMINI_API_KEY=AIzaSyBJF5WUlplifveelre2gGa98Ld0ylIDM54
GEMINI_MODEL=gemini-pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048
```

## Step 2: Clear Cache

```bash
cd backend
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

## Step 3: Access AI Generator

Navigate to: http://localhost:3000/dashboard/ai-generator

## API Endpoints

### Test Connection
```
GET /api/ai/test
```

### Generate Projects
```
POST /api/ai/generate/projects
Body: {
  "count": 5,
  "difficulty": "intermediate",
  "category": "web"
}
```

### Create Project (Auto-save)
```
POST /api/ai/create/project
Body: {
  "difficulty": "intermediate",
  "category": "web"
}
```

### Generate Skills
```
POST /api/ai/generate/skills
Body: {
  "count": 5,
  "category": "frontend"
}
```

### Create Skill (Auto-save)
```
POST /api/ai/create/skill
Body: {
  "category": "frontend"
}
```

### Generate Achievements
```
POST /api/ai/generate/achievements
Body: {
  "count": 5,
  "category": "money"
}
```

### Create Achievement (Auto-save)
```
POST /api/ai/create/achievement
Body: {
  "category": "money"
}
```

## Features

✅ **AI-Powered Generation:**
- Random realistic projects
- New tech skills/technologies
- Creative achievements

✅ **Smart Context Awareness:**
- Difficulty-based rewards
- Category-specific content
- Balanced game economy

✅ **Preview Before Save:**
- Review AI-generated content
- Edit if needed
- One-click save to database

✅ **Batch Generation:**
- Generate multiple items (max 10)
- Auto-delay to avoid rate limits
- Efficient API usage

## Example Usage

1. **Generate 5 Web Projects:**
   - Content Type: Projects
   - Count: 5
   - Category: Web
   - Difficulty: Intermediate
   - Click "Generate with AI"

2. **Review & Save:**
   - Check generated projects
   - Click "💾 Save" on desired items
   - Items added to your game!

3. **Test AI Quality:**
   - Generate different categories
   - Compare creativity & realism
   - Adjust parameters as needed

## Rate Limits

- Max 10 items per batch
- 0.5s delay between generations
- Gemini API has daily quotas

## Troubleshooting

**Connection Failed:**
- Check API key is correct
- Verify internet connection
- Check Gemini API status

**Generation Failed:**
- Try different parameters
- Reduce batch size
- Check Laravel logs

**JSON Parse Error:**
- AI response may be malformed
- Try regenerating
- Check backend logs

## Tips

💡 **For Best Results:**
- Use specific categories
- Start with count=1 for testing
- Review before bulk generation
- Mix difficulties for variety

💡 **Content Quality:**
- Intermediate difficulty = best balanced
- Specific categories = more relevant
- Lower temperature = more consistent

## Future Enhancements

🚀 **Coming Soon:**
- Auto-generation scheduler
- Content templates
- AI-powered employee names
- Dynamic market events
- Project description improvements

