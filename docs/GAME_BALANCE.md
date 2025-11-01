# Game Balance Configuration Guide

## Overview
Game balance values are now centralized in `backend/config/game_balance.php` for easy adjustment.

## Key Balance Changes

### 📈 **Increased Rewards & Income**
- **Project Rewards**: Increased from `difficulty * 100` to `difficulty * 150` (+50%)
- **Product Revenue**: Increased from 10% to 12% of project reward (+20%)
- **Product Growth Rate**: Increased from 2% to 2.5% per month (+25%)
- **Offline Income Cap**: Increased from 8 hours to 12 hours (+50%)

### 💰 **Cost Adjustments**
- **Employee Hire Costs**: 
  - Junior: 1000 → 1500 (+50%)
  - Mid: 2500 → 3500 (+40%)
  - Senior: 5000 → 7500 (+50%)
  - Lead: 10000 → 15000 (+50%)
  - Architect: 20000 → 30000 (+50%)
- **Employee Salaries**: Increased from 10% to 12% of hire cost
- **Product Upkeep**: Decreased from 20% to 18% of revenue (-10%) - more profitable

### ⏱️ **Duration Changes**
- **Quest Expiry**: Increased from 24 hours to 48 hours - more time to complete
- **Quest Project Deadlines**: Increased from 7 days to 10 days
- **Project Deadlines**: Increased from `difficulty * 2 hours` to `difficulty * 3 hours`

## Configuration File

All balance values are in `backend/config/game_balance.php`:

```php
'employees' => [
    'hire_costs' => [...],
    'salary_multiplier' => 0.12,
    'productivity' => [...],
],
'projects' => [
    'reward_multiplier' => 150,
    'deadline_hours_per_difficulty' => 3,
    'quest_project_deadline_days' => 10,
],
'products' => [
    'revenue_percentage' => 0.12,
    'upkeep_percentage' => 0.18,
    'growth_rate' => 0.025,
],
'quests' => [
    'expiry_hours' => 48,
],
'offline' => [
    'max_hours' => 12,
],
```

## How to Adjust

1. **Edit `backend/config/game_balance.php`**
2. **Clear config cache** (if in production):
   ```bash
   php artisan config:clear
   ```
3. **Test the changes** - values take effect immediately

## Balance Philosophy

### Current Strategy:
- **More Generous Rewards**: Players earn more from projects and products
- **Higher Costs**: Employees are more expensive to maintain economic balance
- **Longer Durations**: More time to complete quests and projects reduces stress
- **Better Product Economics**: Products generate more revenue with lower upkeep

### If Game Feels Too Easy:
- Decrease `reward_multiplier` (projects)
- Decrease `revenue_percentage` (products)
- Increase `hire_costs` (employees)
- Decrease `expiry_hours` (quests)

### If Game Feels Too Hard:
- Increase `reward_multiplier` (projects)
- Increase `revenue_percentage` (products)
- Decrease `hire_costs` (employees)
- Increase `expiry_hours` (quests)
- Increase `max_hours` (offline income)

## Notes

- **Employee Salaries**: Paid every minute (in-game day)
- **Product Revenue**: Generated every minute (in-game day)
- **Quest Expiry**: Starts from quest creation time
- **Project Deadlines**: Based on difficulty level
- **Offline Income**: Capped to prevent abuse while rewarding returning players

