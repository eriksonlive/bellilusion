import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { CalendarClock, CalendarDays, Check, Pencil, TrendingDown, TrendingUp, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
    citasHoy: number;
    citasMes: number;
    ingresosMes: number;
    egresosMes: number;
    totalClientes: number;
    balanceMes: number;
}

interface WeekPoint { semana: string; ingresos: number; egresos: number; }
interface StatusPoint { name: string; value: number; }
interface Cita { id: number; cliente: string; servicio: string; fecha: string; hora: string; status: string; }
interface Note { id: string; text: string; color: string; createdAt: string; }

interface Props {
    stats: Stats;
    weeklyData: WeekPoint[];
    citasPorEstado: StatusPoint[];
    proximasCitas: Cita[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

const PIE_COLORS = ['#b88a44', '#6c8ebf', '#82b97c', '#e08080'];

const NOTE_COLORS = [
    { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-400', key: 'amber' },
    { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700', dot: 'bg-rose-400', key: 'rose' },
    { bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-700', dot: 'bg-sky-400', key: 'sky' },
    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-400', key: 'emerald' },
    { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-700', dot: 'bg-violet-400', key: 'violet' },
];

const NOTE_COLOR_CYCLE = ['amber', 'rose', 'sky', 'emerald', 'violet'];

function formatMoney(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

/** Parse "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss" safely without timezone shift */
function parseDateStr(dateStr: string | null | undefined): { day: number; monthShort: string } | null {
    if (!dateStr) return null;
    const parts = dateStr.substring(0, 10).split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const d = new Date(year, month, day);
    return {
        day: d.getDate(),
        monthShort: d.toLocaleDateString('es-CO', { month: 'short' }),
    };
}

function formatTime(timeStr: string) {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    color: string;
}) {
    return (
        <div className="card-berry flex items-center gap-4 p-5">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', color)}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-bold leading-tight">{value}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
        </div>
    );
}

// ── NoteItem ──────────────────────────────────────────────────────────────────
function NoteItem({ note, onDelete, onSave }: {
    note: Note;
    onDelete: (id: string) => void;
    onSave: (id: string, text: string) => void;
}) {
    const colorDef = NOTE_COLORS.find((c) => c.key === note.color) ?? NOTE_COLORS[0];
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(note.text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function startEdit() {
        setDraft(note.text);
        setEditing(true);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.select();
        }, 30);
    }

    function saveEdit() {
        const trimmed = draft.trim();
        if (trimmed) onSave(note.id, trimmed);
        setEditing(false);
    }

    function cancelEdit() {
        setDraft(note.text);
        setEditing(false);
    }

    function handleKey(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEdit();
        if (e.key === 'Escape') cancelEdit();
    }

    return (
        <div className={cn('group relative rounded-[var(--radius)] border p-3 text-sm transition', colorDef.bg, colorDef.border)}>
            {editing ? (
                <div className="flex flex-col gap-2">
                    <textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKey}
                        rows={3}
                        className="w-full resize-none rounded border border-input bg-white/80 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring dark:bg-black/20"
                    />
                    <div className="flex gap-1.5">
                        <button
                            onClick={saveEdit}
                            disabled={!draft.trim()}
                            className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                        >
                            <Check className="h-3 w-3" /> Guardar
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80"
                        >
                            <X className="h-3 w-3" /> Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start gap-2">
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', colorDef.dot)} />
                        <p className="flex-1 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <button
                                onClick={startEdit}
                                className="rounded p-0.5 text-muted-foreground hover:text-primary"
                                title="Editar nota"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                                onClick={() => onDelete(note.id)}
                                className="rounded p-0.5 text-muted-foreground hover:text-red-500"
                                title="Eliminar nota"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    <p className="mt-1 pl-4 text-xs text-muted-foreground">{note.createdAt}</p>
                </>
            )}
        </div>
    );
}

// ── QuickNotes ────────────────────────────────────────────────────────────────
function QuickNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('bellilusion_notes');
            if (saved) setNotes(JSON.parse(saved));
        } catch {}
    }, []);

    function persist(updated: Note[]) {
        setNotes(updated);
        localStorage.setItem('bellilusion_notes', JSON.stringify(updated));
    }

    function addNote() {
        const text = input.trim();
        if (!text) return;
        const note: Note = {
            id: Date.now().toString(),
            text,
            color: NOTE_COLOR_CYCLE[notes.length % NOTE_COLOR_CYCLE.length],
            createdAt: new Date().toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        };
        persist([note, ...notes]);
        setInput('');
        textareaRef.current?.focus();
    }

    function deleteNote(id: string) {
        persist(notes.filter((n) => n.id !== id));
    }

    function saveNote(id: string, text: string) {
        persist(notes.map((n) => n.id === id ? { ...n, text } : n));
    }

    return (
        <div className="card-berry flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <h2 className="font-semibold">Notas rápidas</h2>
                {notes.length > 0 && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {notes.length}
                    </span>
                )}
            </div>

            {/* Input */}
            <div className="flex flex-col gap-2">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote(); }}
                    placeholder="Escribe una nota… (Ctrl+Enter para guardar)"
                    rows={2}
                    className="w-full resize-none rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                    onClick={addNote}
                    disabled={!input.trim()}
                    className="self-end rounded-[var(--radius)] bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
                >
                    + Agregar
                </button>
            </div>

            {/* Notes list */}
            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 320 }}>
                {notes.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No hay notas todavía. ¡Agrega la primera!</p>
                ) : (
                    notes.map((note) => (
                        <NoteItem key={note.id} note={note} onDelete={deleteNote} onSave={saveNote} />
                    ))
                )}
            </div>
        </div>
    );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        confirmed: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        cancelled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
    };
    const labels: Record<string, string> = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        completed: 'Completada',
        cancelled: 'Cancelada',
    };
    return (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', map[status] ?? 'bg-muted text-muted-foreground')}>
            {labels[status] ?? status}
        </span>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ stats, weeklyData, citasPorEstado, proximasCitas }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-5 p-4 md:p-6">

                {/* ── KPI Cards ─────────────────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard icon={CalendarClock} label="Citas hoy" value={String(stats.citasHoy)} color="bg-primary" />
                    <StatCard icon={CalendarDays} label="Citas este mes" value={String(stats.citasMes)} color="bg-sky-500" />
                    <StatCard icon={TrendingUp} label="Ingresos del mes" value={formatMoney(stats.ingresosMes)} color="bg-emerald-500" />
                    <StatCard icon={TrendingDown} label="Egresos del mes" value={formatMoney(stats.egresosMes)} color="bg-rose-500" />
                    <StatCard
                        icon={Users}
                        label="Total clientes"
                        value={String(stats.totalClientes)}
                        sub={`Balance: ${formatMoney(stats.balanceMes)}`}
                        color="bg-violet-500"
                    />
                </div>

                {/* ── Charts row ────────────────────────────────────────────── */}
                <div className="grid gap-4 lg:grid-cols-3">

                    {/* Area chart – ingresos vs egresos */}
                    <div className="card-berry col-span-2 p-5">
                        <h2 className="mb-4 font-semibold">Ingresos vs Egresos — últimas 8 semanas</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82b97c" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#82b97c" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e08080" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#e08080" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                                <XAxis dataKey="semana" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value: number, name: string) => [formatMoney(value), name]}
                                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                                />
                                <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#82b97c" strokeWidth={2} fill="url(#colorIngresos)" />
                                <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#e08080" strokeWidth={2} fill="url(#colorEgresos)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Donut – citas por estado */}
                    <div className="card-berry flex flex-col p-5">
                        <h2 className="mb-4 font-semibold">Citas por estado</h2>
                        {citasPorEstado.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Sin datos aún</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie data={citasPorEstado} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                                            {citasPorEstado.map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-2 flex flex-col gap-1.5">
                                    {citasPorEstado.map((item, i) => (
                                        <div key={item.name} className="flex items-center gap-2 text-sm">
                                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="flex-1 text-muted-foreground">{item.name}</span>
                                            <span className="font-semibold">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Bottom row ────────────────────────────────────────────── */}
                <div className="grid gap-4 lg:grid-cols-2">

                    {/* Próximas citas */}
                    <div className="card-berry p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-semibold">Próximas citas</h2>
                            <a href="/agenda" className="text-xs text-primary hover:underline">Ver todas →</a>
                        </div>
                        {proximasCitas.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No hay citas próximas programadas.</p>
                        ) : (
                            <div className="flex flex-col divide-y divide-border">
                                {proximasCitas.map((cita) => {
                                    const dateInfo = parseDateStr(cita.fecha);
                                    return (
                                        <div key={cita.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-center leading-none">
                                                {dateInfo ? (
                                                    <>
                                                        <span className="text-[10px] font-medium uppercase text-primary/70">{dateInfo.monthShort}</span>
                                                        <span className="text-base font-bold text-primary">{dateInfo.day}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{cita.cliente}</p>
                                                <p className="truncate text-xs text-muted-foreground">{cita.servicio}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-medium">{formatTime(cita.hora)}</span>
                                                <StatusBadge status={cita.status} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Notas rápidas */}
                    <QuickNotes />
                </div>

            </div>
        </AppLayout>
    );
}
