<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LimitedPermission extends Model
{
    protected $fillable = [
        'user_id',
        'permission_name',
        'max_uses',
        'used_count',
        'expires_at',
    ];

    protected $dates = ['expires_at'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isValid(): bool
    {
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    public function usePermission(): void
    {
        $this->increment('used_count');
    }
}
