<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AvailabilitySlot extends Model
{
    //

    public function appointment()
    {
        return $this->hasOne(Appointment::class);
    }
}
