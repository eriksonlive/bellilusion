import { Link, router, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Bell,
    CalendarCheck,
    CalendarClock,
    CheckCheck,
    Package,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────── */
interface NotifData {
    type: 'success' | 'warning' | 'alert' | 'reminder' | 'info';
    icon: string;
    color: string;
    title: string;
    message: string;
    action_url?: string;
}
interface RecentNotif { id: string; data: NotifData; created_at: string; }
interface SharedProps {
    notifications: { unread_count: number; recent: RecentNotif[] };
}

/* ─── Icon map ───────────────────────────────────────────── */
function NotifIcon({ icon, color }: { icon: string; color: string }) {
    const colorMap: Record<string, string> = {
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600',
        violet: 'bg-violet-100 text-violet-600',
    };
    const cls = colorMap[color] ?? 'bg-muted text-muted-foreground';
    const iconMap: Record<string, React.ReactNode> = {
        'calendar':       <CalendarClock className="h-4 w-4" />,
        'calendar-check': <CalendarCheck className="h-4 w-4" />,
        'package':        <Package className="h-4 w-4" />,
        'wallet':         <Wallet className="h-4 w-4" />,
    };
    return (
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cls}`}>
            {iconMap[icon] ?? <Bell className="h-4 w-4" />}
        </div>
    );
}

/* ─── Main component ─────────────────────────────────────── */
export default function NotificationBell() {
    const { props } = usePage<SharedProps>();
    const { unread_count, recent } = props.notifications ?? { unread_count: 0, recent: [] };

    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    function markRead(id: string, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        router.patch(route('notifications.read', id), {}, { preserveScroll: true });
    }

    function deleteOne(id: string, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        router.delete(route('notifications.destroy', id), { preserveScroll: true });
    }

    function markAllRead() {
        router.patch(route('notifications.read-all'), {}, { preserveScroll: true, onSuccess: () => setOpen(false) });
    }

    return (
        <div ref={ref} className="relative">
            {/* Bell button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Notificaciones"
            >
                <Bell className="h-5 w-5" />
                {unread_count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                        {unread_count > 9 ? '9+' : unread_count}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border bg-card shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            <span className="font-semibold">Notificaciones</span>
                            {unread_count > 0 && (
                                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600">{unread_count}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unread_count > 0 && (
                                <button onClick={markAllRead} className="rounded-md p-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors" title="Marcar todas como leídas">
                                    <CheckCheck className="h-4 w-4" />
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto">
                        {recent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <Bell className="mb-2 h-8 w-8 opacity-20" />
                                <p className="text-sm">Sin notificaciones pendientes</p>
                            </div>
                        ) : (
                            recent.map((n) => (
                                <div key={n.id} className="group flex items-start gap-3 border-b px-4 py-3 hover:bg-muted/30 transition-colors last:border-b-0">
                                    <NotifIcon icon={n.data.icon} color={n.data.color} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold leading-tight">{n.data.title}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.data.message}</p>
                                        <p className="mt-1 text-xs text-muted-foreground/70">{n.created_at}</p>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button onClick={(e) => markRead(n.id, e)} title="Marcar como leída" className="rounded p-1 hover:bg-green-100 hover:text-green-700 transition-colors">
                                            <CheckCheck className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={(e) => deleteOne(n.id, e)} title="Eliminar" className="rounded p-1 hover:bg-red-100 hover:text-red-600 transition-colors">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t px-4 py-2.5">
                        <Link
                            href={route('notifications.index')}
                            onClick={() => setOpen(false)}
                            className="block text-center text-xs font-semibold text-primary hover:underline"
                        >
                            Ver todas las notificaciones
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
