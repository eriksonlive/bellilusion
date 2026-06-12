import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { AppLayout } from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarCheck,
    CalendarClock,
    CheckCheck,
    Package,
    Trash2,
    Wallet,
} from 'lucide-react';
import { type ReactNode } from 'react';

/* ─── Types ──────────────────────────────────────────────── */
interface NotifData {
    type: string;
    icon: string;
    color: string;
    title: string;
    message: string;
    action_url?: string;
}
interface Notification {
    id: string;
    data: NotifData;
    read_at: string | null;
    created_at: string;
    created_at_full: string;
}
interface PaginatedNotifications {
    data: Notification[];
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    total: number;
}
interface Props {
    notifications: PaginatedNotifications;
    unread_count: number;
    filters: { filter?: string };
}

/* ─── Icon + color helpers ───────────────────────────────── */
const colorMap: Record<string, string> = {
    green:  'bg-green-100 text-green-600',
    blue:   'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    red:    'bg-red-100 text-red-600',
    violet: 'bg-violet-100 text-violet-600',
};
const iconMap: Record<string, ReactNode> = {
    'calendar':       <CalendarClock className="h-5 w-5" />,
    'calendar-check': <CalendarCheck className="h-5 w-5" />,
    'package':        <Package className="h-5 w-5" />,
    'wallet':         <Wallet className="h-5 w-5" />,
};

function NotifIcon({ icon, color }: { icon: string; color: string }) {
    return (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorMap[color] ?? 'bg-muted text-muted-foreground'}`}>
            {iconMap[icon] ?? <Bell className="h-5 w-5" />}
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function NotificationsIndex({ notifications, unread_count, filters }: Props) {
    const activeFilter = filters.filter ?? 'all';

    function setFilter(f: string) {
        router.get(route('notifications.index'), f === 'all' ? {} : { filter: f }, { preserveScroll: true });
    }

    function markRead(id: string) {
        router.patch(route('notifications.read', id), {}, { preserveScroll: true });
    }

    function markAllRead() {
        router.patch(route('notifications.read-all'), {}, { preserveScroll: true });
    }

    function deleteOne(id: string) {
        router.delete(route('notifications.destroy', id), { preserveScroll: true });
    }

    function deleteAll() {
        if (!confirm('¿Eliminar todas las notificaciones?')) return;
        router.delete(route('notifications.destroy-all'), { preserveScroll: true });
    }

    function goToPage(url: string | null) {
        if (!url) return;
        router.visit(url, { preserveScroll: true });
    }

    return (
        <AppLayout header={<AppSidebarHeader breadcrumbs={[{ title: 'Notificaciones', href: route('notifications.index') }]} />}>
            <div className="mx-auto max-w-2xl px-4 py-6">
                {/* Title row */}
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Notificaciones</h1>
                        {unread_count > 0 && (
                            <p className="text-sm text-muted-foreground">{unread_count} sin leer</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {unread_count > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Marcar todas
                            </button>
                        )}
                        {notifications.total > 0 && (
                            <button
                                onClick={deleteAll}
                                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Limpiar todo
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="mb-4 flex gap-1 rounded-lg border bg-muted/30 p-1">
                    {[
                        { value: 'all', label: 'Todas' },
                        { value: 'unread', label: 'Sin leer' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                                activeFilter === tab.value
                                    ? 'bg-card shadow-sm text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                {notifications.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-muted-foreground">
                        <Bell className="mb-3 h-12 w-12 opacity-10" />
                        <p className="font-medium">Sin notificaciones</p>
                        <p className="mt-1 text-sm">Aquí aparecerán tus alertas y recordatorios</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.data.map((n) => (
                            <div
                                key={n.id}
                                className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                                    !n.read_at ? 'bg-card ring-1 ring-primary/10' : 'bg-card/60'
                                }`}
                            >
                                {/* Unread indicator */}
                                {!n.read_at && (
                                    <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary" />
                                )}

                                <NotifIcon icon={n.data.icon} color={n.data.color} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold leading-tight">{n.data.title}</p>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{n.data.message}</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground/70">{n.created_at_full} · {n.created_at}</span>
                                        {n.data.action_url && (
                                            <a
                                                href={n.data.action_url}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Ver →
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    {!n.read_at && (
                                        <button
                                            onClick={() => markRead(n.id)}
                                            title="Marcar como leída"
                                            className="rounded-md p-1.5 hover:bg-green-100 hover:text-green-700 transition-colors"
                                        >
                                            <CheckCheck className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteOne(n.id)}
                                        title="Eliminar"
                                        className="rounded-md p-1.5 hover:bg-red-100 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <button
                            onClick={() => goToPage(notifications.prev_page_url)}
                            disabled={!notifications.prev_page_url}
                            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                            ← Anterior
                        </button>
                        <span className="text-sm text-muted-foreground">
                            Página {notifications.current_page} de {notifications.last_page}
                        </span>
                        <button
                            onClick={() => goToPage(notifications.next_page_url)}
                            disabled={!notifications.next_page_url}
                            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
