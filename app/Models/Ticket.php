<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    protected $fillable = ['title', 'description', 'user_id', 'status', 'created_at', 'service_id'];

    public function user()
    {
        return $this->belongsTo(User::class); // El cliente que creó el ticket
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function files()
    {
        return $this->hasMany(TicketFile::class);
    }
}
