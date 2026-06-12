<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Recordatorios de citas: cada día a las 8am
Schedule::command('notifications:send --type=reminder')->dailyAt('08:00');

// Stock bajo: cada día a las 9am
Schedule::command('notifications:send --type=stock')->dailyAt('09:00');

// Deudas pendientes: cada lunes a las 9am
Schedule::command('notifications:send --type=debt')->weeklyOn(1, '09:00');
