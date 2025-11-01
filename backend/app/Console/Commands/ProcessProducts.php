<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\MarketingCampaign;
use Illuminate\Console\Command;
use App\Models\MarketEvent;

class ProcessProducts extends Command
{
    protected $signature = 'game:process-products';
    protected $description = 'Accrue product revenue into company cash';

    public function handle()
    {
        $products = Product::where('active', true)->with('company')->get();
        $count = 0;
        $totalAccrued = 0;

        foreach ($products as $product) {
            $company = $product->company;
            if (!$company) continue;

            // Current monthly revenue with growth (simple compounding by months since launch)
            $months = max(0, now()->diffInMonths($product->launched_at));
            
            // Apply research bonuses
            $user = $product->user;
            $researchBonuses = $this->getResearchBonuses($user);
            
            $growthRate = (float)$product->growth_rate;
            $growthRate *= (1 + ($researchBonuses['product_growth_multiplier'] ?? 0));
            
            $currentMonthlyRevenue = (float)$product->base_monthly_revenue * pow(1 + $growthRate, $months);
            $currentMonthlyRevenue *= (1 + ($researchBonuses['product_revenue_multiplier'] ?? 0));

            // Apply bug penalties
            $bugMultiplier = $product->getTotalPenaltyMultiplier();
            $currentMonthlyRevenue *= $bugMultiplier;

            // Apply active marketing campaign multiplier
            $campaign = MarketingCampaign::where('product_id', $product->id)
                ->where('start_time', '<=', now())
                ->where('end_time', '>=', now())
                ->orderByDesc('end_time')
                ->first();
            if ($campaign) {
                $currentMonthlyRevenue *= (float)$campaign->revenue_multiplier;
            }
            $monthlyUpkeep = (float)$product->upkeep * (1 - ($researchBonuses['upkeep_reduction'] ?? 0));

            // Apply active market events
            $activeEvents = MarketEvent::getActiveEvents();
            foreach ($activeEvents as $event) {
                $effect = $event->effect ?? [];
                if (isset($effect['global_revenue_multiplier'])) {
                    $currentMonthlyRevenue *= (1 + (float)$effect['global_revenue_multiplier']);
                }
                if (isset($effect['upkeep_multiplier'])) {
                    $monthlyUpkeep *= (1 + (float)$effect['upkeep_multiplier']);
                }
            }

            // Accrue daily amount (1 minute = 1 day in-game, 30 days/month)
            $dailyNet = ($currentMonthlyRevenue - $monthlyUpkeep) / 30;

            $company->cash += $dailyNet;
            $company->save();

            $totalAccrued += $dailyNet;
            $count++;
        }

        $this->info("Processed {$count} products. Accrued $" . number_format($totalAccrued, 2) . " today");
        return Command::SUCCESS;
    }

    protected function getResearchBonuses($user): array
    {
        if (!$user) return [];
        
        $bonuses = [];
        $researches = $user->researches()->get();
        
        foreach ($researches as $research) {
            $effects = $research->effects ?? [];
            foreach ($effects as $key => $value) {
                if (!isset($bonuses[$key])) {
                    $bonuses[$key] = 0;
                }
                $bonuses[$key] += $value;
            }
        }
        
        return $bonuses;
    }
}


