<?php

namespace App\Http\Middleware;

use App\Models\Menu;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $user = $request->user();

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'warning' => session('warning'),
                'info' => session('info'),
                'receipt' => session('receipt'),
            ],
            'notifications' => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'recent' => $user->unreadNotifications()->latest()->take(5)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'data' => $n->data,
                    'created_at' => $n->created_at->diffForHumans(),
                ])->toArray(),
            ] : ['unread_count' => 0, 'recent' => []],
            'auth' => [
                'user' => $request->user(),
                'roles' => $user ? $user->getRoleNames()->values() : [],
                'permissions' => $user
                    ? $user->getAllPermissions()->pluck('name')->values()
                    : [],

                'menuSidebar' => $user
                    ? Menu::query()
                        ->whereNull('parent_id')
                        ->with(['children', 'permissions'])
                        ->orderBy('order')
                        ->get()
                        ->values()
                    : [],
            ],
        ]);
    }
}
