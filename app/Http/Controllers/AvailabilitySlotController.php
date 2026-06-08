<?php

namespace App\Http\Controllers;

use App\Models\AvailabilitySlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AvailabilitySlotController extends Controller
{
    public function available(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2020'],
        ]);

        $slots = AvailabilitySlot::whereYear('date', $request->year)
            ->whereMonth('date', $request->month)
            ->where('active', true)
            ->whereDoesntHave('appointment')
            ->get(['id', 'date', 'start_time', 'end_time']);

        return response()->json($slots);
    }
}
