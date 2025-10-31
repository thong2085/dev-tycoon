<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ServeAll extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'serve:all {--host=127.0.0.1} {--port=8000}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Start Laravel server and scheduler together (for development)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting Dev Tycoon Game Services...');
        $this->newLine();

        $host = $this->option('host');
        $port = $this->option('port');

        // Start server process
        $serverProcess = new Process(['php', 'artisan', 'serve', "--host={$host}", "--port={$port}"]);
        $serverProcess->setTimeout(null);
        $serverProcess->start();

        $this->info("✅ Laravel Server started at http://{$host}:{$port}");

        // Start scheduler process
        $schedulerProcess = new Process(['php', 'artisan', 'schedule:work']);
        $schedulerProcess->setTimeout(null);
        $schedulerProcess->start();

        $this->info('✅ Scheduler started (runs tasks every minute)');
        $this->newLine();
        
        $this->warn('⚠️  Press CTRL+C to stop all services');
        $this->newLine();

        // Keep both processes running
        try {
            while (true) {
                // Check if server is still running
                if (!$serverProcess->isRunning()) {
                    $this->error('❌ Server process stopped!');
                    $this->line($serverProcess->getOutput());
                    $this->error($serverProcess->getErrorOutput());
                    break;
                }

                // Check if scheduler is still running
                if (!$schedulerProcess->isRunning()) {
                    $this->error('❌ Scheduler process stopped!');
                    $this->line($schedulerProcess->getOutput());
                    $this->error($schedulerProcess->getErrorOutput());
                    break;
                }

                // Output from server
                $serverOutput = $serverProcess->getIncrementalOutput();
                if ($serverOutput) {
                    $this->line("[SERVER] " . trim($serverOutput));
                }

                // Output from scheduler
                $schedulerOutput = $schedulerProcess->getIncrementalOutput();
                if ($schedulerOutput) {
                    $this->line("[SCHEDULER] " . trim($schedulerOutput));
                }

                usleep(100000); // Sleep 0.1 second
            }
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
        } finally {
            // Cleanup: stop both processes
            $this->info('🛑 Stopping all services...');
            
            if ($serverProcess->isRunning()) {
                $serverProcess->stop();
            }
            
            if ($schedulerProcess->isRunning()) {
                $schedulerProcess->stop();
            }
            
            $this->info('✅ All services stopped');
        }

        return Command::SUCCESS;
    }
}
