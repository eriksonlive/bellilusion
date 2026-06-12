<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $query = $user->notifications();

        if ($request->filled('filter') && $request->filter === 'unread') {
            $query = $user->unreadNotifications();
        }

        $notifications = $query->latest()->paginate(20)->withQueryString()
            ->through(fn ($n) => [
                'id' => $n->id,
                'data' => $n->data,
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at->diffForHumans(),
                'created_at_full' => $n->created_at->format('d/m/Y H:i'),
            ]);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
            'filters' => $request->only(['filter']),
        ]);
    }

    public function markRead(string $id): RedirectResponse
    {
        auth()->user()->notifications()->findOrFail($id)->markAsRead();

        return back()->with('success', 'Notificación marcada como leída.');
    }

    public function markAllRead(): RedirectResponse
    {
        auth()->user()->unreadNotifications->markAsRead();

        return back()->with('success', 'Todas las notificaciones marcadas como leídas.');
    }

    public function destroy(string $id): RedirectResponse
    {
        auth()->user()->notifications()->findOrFail($id)->delete();

        return back()->with('success', 'Notificación eliminada.');
    }

    public function destroyAll(): RedirectResponse
    {
        auth()->user()->notifications()->delete();

        return back()->with('success', 'Notificaciones eliminadas.');
    }
}
