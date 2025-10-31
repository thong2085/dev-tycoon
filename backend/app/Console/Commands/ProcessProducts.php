<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

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
            $currentMonthlyRevenue = (float)$product->base_monthly_revenue * pow(1 + (float)$product->growth_rate, $months);
            $monthlyUpkeep = (float)$product->upkeep;

            // Accrue per-minute amount (30 days/month)
            $perMinuteNet = ($currentMonthlyRevenue - $monthlyUpkeep) / (30 * 24 * 60);

            $company->cash += $perMinuteNet;
            $company->save();

            $totalAccrued += $perMinuteNet;
            $count++;
        }

        $this->info("Processed {$count} products. Accrued $" . number_format($totalAccrued, 2) . "");
        return Command::SUCCESS;
    }
}


