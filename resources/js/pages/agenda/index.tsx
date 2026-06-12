import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
    format, isSameDay, isSameMonth, isToday, parseISO,
    startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowUpCircle, CalendarPlus, ChevronLeft, ChevronRight,
    LayoutGrid, List, ListOrdered, Minus, Package, Pencil, Plus, Scissors, Search, SlidersHorizontal, Trash2, X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Agenda', href: '/agenda' },
];

interface Client    { id: number; name: string; phone?: string }
interface Service   { id: number; name: string; price: number; duration_minutes?: number }
interface Product   { id: number; name: string; price: number; stock: number }
interface ItemPivot { id: number; name: string; price: number; quantity: number }
interface IncomeCategory { id: number; name: string; color: string }
interface Appointment {
    id: number; client?: Client;
    services: ItemPivot[]; products: ItemPivot[];
    date: string; start_time: string; end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; notes?: string; slot_id: number;
}
interface Props {
    appointments: Appointment[]; clients: Client[];
    services: Service[]; products: Product[];
    incomeCategories: IncomeCategory[];
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada',
};
const STATUS_BG: Record<string, string> = {
    pending: 'bg-amber-400', confirmed: 'bg-blue-500',
    cancelled: 'bg-slate-400', completed: 'bg-green-500',
};
const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-slate-100 text-slate-600', completed: 'bg-green-100 text-green-700',
};
const STATUS_DOT: Record<string, string> = {
    pending: 'bg-amber-400', confirmed: 'bg-blue-500',
    cancelled: 'bg-slate-400', completed: 'bg-green-500',
};

type ViewMode = 'month' | 'week' | 'list';

interface Filters {
    search: string;
    statuses: string[];
    dateFrom: string;
    dateTo: string;
    timeFrom: string;
    timeTo: string;
    clientId: string;
}
const EMPTY_FILTERS: Filters = { search: '', statuses: [], dateFrom: '', dateTo: '', timeFrom: '', timeTo: '', clientId: '' };

function formatMoney(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function aptDisplayName(apt: Appointment) {
    if (apt.client) return apt.client.name;
    if (apt.services[0]) return apt.services[0].name;
    return 'Cita';
}

// ── Multi-select pill component ────────────────────────────────────────────────
function MultiSelect<T extends { id: number; name: string; price: number }>({
    label, icon: Icon, items, selectedIds, onToggle, formatSub,
}: {
    label: string;
    icon: React.ElementType;
    items: T[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    formatSub?: (item: T) => string;
}) {
    const [open, setOpen] = useState(false);
    return (
        <div className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            {/* Selected pills */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedIds.map((id) => {
                        const item = items.find((i) => i.id === id);
                        if (!item) return null;
                        return (
                            <span key={id} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                <Icon className="h-3 w-3" />
                                {item.name}
                                <button type="button" onClick={() => onToggle(id)} className="ml-0.5 rounded-full hover:text-red-500">×</button>
                            </span>
                        );
                    })}
                </div>
            )}
            {/* Dropdown toggle */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-9 w-full items-center gap-2 rounded-[var(--radius)] border border-input bg-background px-3 text-sm text-muted-foreground hover:border-ring transition"
            >
                <Plus className="h-3.5 w-3.5" />
                {selectedIds.length === 0 ? `Seleccionar ${label.toLowerCase()}…` : `Agregar más…`}
            </button>
            {open && (
                <div className="max-h-48 overflow-y-auto rounded-[var(--radius)] border border-border bg-background shadow-sm">
                    {items.length === 0 && (
                        <p className="px-3 py-4 text-center text-xs text-muted-foreground">No hay {label.toLowerCase()} disponibles</p>
                    )}
                    {items.map((item) => {
                        const selected = selectedIds.includes(item.id);
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => { onToggle(item.id); }}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-muted ${selected ? 'bg-primary/5' : ''}`}
                            >
                                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>
                                    {selected && <span className="text-[10px]">✓</span>}
                                </span>
                                <span className="flex-1 font-medium">{item.name}</span>
                                {formatSub && <span className="text-xs text-muted-foreground">{formatSub(item)}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function AgendaIndex({ appointments, clients, services, products, incomeCategories }: Props) {
    const [view, setView] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [editingApt, setEditingApt] = useState<Appointment | null>(null);
    const [processing, setProcessing] = useState(false);

    /* ── Filters ────────────────────────────────────────────── */
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

    function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }
    function toggleStatus(s: string) {
        setFilters((prev) => ({
            ...prev,
            statuses: prev.statuses.includes(s) ? prev.statuses.filter((x) => x !== s) : [...prev.statuses, s],
        }));
    }
    function clearFilters() { setFilters(EMPTY_FILTERS); }

    const activeFilterCount = useMemo(() => {
        let n = 0;
        if (filters.search) n++;
        if (filters.statuses.length) n++;
        if (filters.dateFrom || filters.dateTo) n++;
        if (filters.timeFrom || filters.timeTo) n++;
        if (filters.clientId) n++;
        return n;
    }, [filters]);

    const filtered = useMemo(() => {
        return appointments.filter((apt) => {
            // Search: client name or service name
            if (filters.search) {
                const q = filters.search.toLowerCase();
                const inClient = apt.client?.name.toLowerCase().includes(q) ?? false;
                const inService = apt.services.some((s) => s.name.toLowerCase().includes(q));
                const inProduct = apt.products.some((p) => p.name.toLowerCase().includes(q));
                if (!inClient && !inService && !inProduct) return false;
            }
            // Status
            if (filters.statuses.length && !filters.statuses.includes(apt.status)) return false;
            // Date range
            if (filters.dateFrom && apt.date < filters.dateFrom) return false;
            if (filters.dateTo && apt.date > filters.dateTo) return false;
            // Time range
            if (filters.timeFrom && apt.start_time < filters.timeFrom) return false;
            if (filters.timeTo && apt.start_time > filters.timeTo) return false;
            // Client
            if (filters.clientId && apt.client?.id?.toString() !== filters.clientId) return false;
            return true;
        });
    }, [appointments, filters]);

    // Form state
    const [formData, setFormData] = useState({
        client_id: '',
        services: [] as number[],
        products: [] as number[],
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:00',
        status: 'pending',
        notes: '',
        income_category_id: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Selected services & products in form (arrays of ids)
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

    function setField<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }

    /* ── Calendar helpers ──────────────────────────────────────── */
    const monthStart = startOfMonth(currentDate);
    const monthEnd   = endOfMonth(currentDate);
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
    const calDays    = eachDayOfInterval({ start: calStart, end: calEnd });
    const aptsForDay = (d: Date) => filtered.filter((a) => a.date && isSameDay(parseISO(a.date), d));
    const weekStart  = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd    = endOfWeek(currentDate,   { weekStartsOn: 1 });
    const weekDays   = eachDayOfInterval({ start: weekStart, end: weekEnd });

    function navigate(dir: 1 | -1) {
        if (view === 'week') setCurrentDate((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + dir * 7); return nd; });
        else setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
    function goToday() { setCurrentDate(new Date()); }
    function navLabel() {
        if (view === 'week') return `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM yyyy', { locale: es })}`;
        return format(currentDate, 'MMMM yyyy', { locale: es });
    }

    /* ── Service/product toggle ─────────────────────────────────── */
    function toggleService(id: number) {
        const next = selectedServices.includes(id)
            ? selectedServices.filter((s) => s !== id)
            : [...selectedServices, id];
        setSelectedServices(next);
        setFormData((prev) => ({ ...prev, services: next }));
    }

    function toggleProduct(id: number) {
        const next = selectedProducts.includes(id)
            ? selectedProducts.filter((p) => p !== id)
            : [...selectedProducts, id];
        setSelectedProducts(next);
        setFormData((prev) => ({ ...prev, products: next }));
    }

    /* ── Open/close modal ───────────────────────────────────────── */
    function resetForm() {
        setFormData({
            client_id: '',
            services: [],
            products: [],
            date: format(new Date(), 'yyyy-MM-dd'),
            start_time: '09:00',
            end_time: '10:00',
            status: 'pending',
            notes: '',
            income_category_id: '',
        });
        setFormErrors({});
        setSelectedServices([]);
        setSelectedProducts([]);
    }

    function openCreate(date?: Date) {
        resetForm();
        setEditingApt(null);
        if (date) setFormData((prev) => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
        setShowModal(true);
    }

    function openEdit(apt: Appointment) {
        setEditingApt(apt);
        const svcIds = apt.services.map((s) => s.id);
        const prdIds = apt.products.map((p) => p.id);
        setSelectedServices(svcIds);
        setSelectedProducts(prdIds);
        setFormErrors({});
        setFormData({
            client_id: apt.client?.id?.toString() ?? '',
            services: svcIds,
            products: prdIds,
            date: apt.date,
            start_time: apt.start_time?.slice(0, 5) ?? '09:00',
            end_time: apt.end_time?.slice(0, 5) ?? '10:00',
            status: apt.status,
            notes: apt.notes ?? '',
            income_category_id: '',
        });
        setShowModal(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setFormErrors({});

        const payload = {
            ...formData,
            services: selectedServices,
            products: selectedProducts,
        };

        const method = editingApt ? 'put' : 'post';
        const url = editingApt
            ? route('agenda.update', editingApt.id)
            : route('agenda.store');

        router[method](url, payload, {
            onSuccess: () => {
                setShowModal(false);
                resetForm();
            },
            onError: (errors) => {
                setFormErrors(errors as Record<string, string>);
            },
            onFinish: () => setProcessing(false),
        });
    }

    function handleDelete(apt: Appointment) {
        if (!confirm('¿Eliminar esta cita?')) { return; }
        router.delete(route('agenda.destroy', apt.id));
    }

    /* ── Computed total ─────────────────────────────────────────── */
    const formTotal = selectedServices.reduce((sum, id) => sum + (services.find((s) => s.id === id)?.price ?? 0), 0)
        + selectedProducts.reduce((sum, id) => sum + (products.find((p) => p.id === id)?.price ?? 0), 0);

    const sorted = [...filtered].sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
    const showIncome = !!editingApt && formData.status === 'completed';

    const views: { key: ViewMode; icon: React.ReactNode; label: string }[] = [
        { key: 'month', icon: <LayoutGrid className="h-[18px] w-[18px]" />, label: 'Mes' },
        { key: 'week',  icon: <List className="h-[18px] w-[18px]" />,       label: 'Semana' },
        { key: 'list',  icon: <ListOrdered className="h-[18px] w-[18px]" />, label: 'Lista' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agenda" />
            <div className="flex flex-col gap-5 p-4 md:p-5">

                <div className="card-berry overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-4 sm:px-5">
                        <h2 className="text-base font-bold">Calendario de citas</h2>
                        <Button onClick={() => openCreate()} size="sm"
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm shadow-secondary/30">
                            <CalendarPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Agregar cita</span>
                        </Button>
                    </div>
                    <div className="border-b" />

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                        <button onClick={goToday} className="rounded-[var(--radius)] border border-input px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors">
                            Hoy
                        </button>
                        <div className="flex items-center gap-1">
                            <button onClick={() => navigate(-1)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors"><ChevronLeft className="h-4 w-4" /></button>
                            <h3 className="min-w-[130px] text-center text-sm font-semibold capitalize sm:text-base sm:min-w-[160px]">{navLabel()}</h3>
                            <button onClick={() => navigate(1)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                        <div className="flex-1" />
                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters((v) => !v)}
                            className={`relative flex items-center gap-1.5 rounded-[var(--radius)] border px-3 py-1.5 text-xs font-semibold transition-colors ${showFilters || activeFilterCount > 0 ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:bg-muted'}`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Filtros
                            {activeFilterCount > 0 && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <div className="flex overflow-hidden rounded-[var(--radius)] border border-primary/40">
                            {views.map((v, i) => (
                                <button key={v.key} onClick={() => setView(v.key)} title={v.label}
                                    className={`flex items-center justify-center p-2 transition-colors ${i > 0 ? 'border-l border-primary/40' : ''} ${view === v.key ? 'bg-primary text-primary-foreground' : 'text-primary hover:bg-primary/10'}`}>
                                    {v.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="border-t bg-muted/20 px-4 py-4 sm:px-5">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Search */}
                                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Buscar</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={filters.search}
                                            onChange={(e) => setFilter('search', e.target.value)}
                                            placeholder="Cliente, servicio o producto…"
                                            className="h-9 w-full rounded-[var(--radius)] border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                        {filters.search && (
                                            <button onClick={() => setFilter('search', '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Estado */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                            <button
                                                key={k}
                                                type="button"
                                                onClick={() => toggleStatus(k)}
                                                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all ${filters.statuses.includes(k) ? STATUS_BADGE[k] + ' border-transparent ring-1 ring-current/30' : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[k]}`} />
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cliente */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</label>
                                    <select
                                        value={filters.clientId}
                                        onChange={(e) => setFilter('clientId', e.target.value)}
                                        className="h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="">Todos los clientes</option>
                                        {clients.map((c) => (
                                            <option key={c.id} value={c.id.toString()}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rango de fechas */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha desde</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilter('dateFrom', e.target.value)}
                                        className="h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha hasta</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilter('dateTo', e.target.value)}
                                        className="h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>

                                {/* Rango de horas */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hora desde</label>
                                    <input
                                        type="time"
                                        value={filters.timeFrom}
                                        onChange={(e) => setFilter('timeFrom', e.target.value)}
                                        className="h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hora hasta</label>
                                    <input
                                        type="time"
                                        value={filters.timeTo}
                                        onChange={(e) => setFilter('timeTo', e.target.value)}
                                        className="h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            {/* Active filter chips + clear */}
                            {activeFilterCount > 0 && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Activos:</span>
                                    {filters.search && (
                                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                            <Search className="h-3 w-3" />"{filters.search}"
                                            <button onClick={() => setFilter('search', '')}><X className="h-3 w-3" /></button>
                                        </span>
                                    )}
                                    {filters.statuses.map((s) => (
                                        <span key={s} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[s]}`}>
                                            {STATUS_LABELS[s]}
                                            <button onClick={() => toggleStatus(s)}><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                    {(filters.dateFrom || filters.dateTo) && (
                                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                            {filters.dateFrom || '…'} → {filters.dateTo || '…'}
                                            <button onClick={() => { setFilter('dateFrom', ''); setFilter('dateTo', ''); }}><X className="h-3 w-3" /></button>
                                        </span>
                                    )}
                                    {(filters.timeFrom || filters.timeTo) && (
                                        <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                                            {filters.timeFrom || '…'} – {filters.timeTo || '…'}
                                            <button onClick={() => { setFilter('timeFrom', ''); setFilter('timeTo', ''); }}><X className="h-3 w-3" /></button>
                                        </span>
                                    )}
                                    {filters.clientId && (
                                        <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                                            {clients.find((c) => c.id.toString() === filters.clientId)?.name}
                                            <button onClick={() => setFilter('clientId', '')}><X className="h-3 w-3" /></button>
                                        </span>
                                    )}
                                    <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600 transition-colors">
                                        <X className="h-3 w-3" />Limpiar filtros
                                    </button>
                                </div>
                            )}

                            {/* Results count */}
                            <p className="mt-2 text-xs text-muted-foreground">
                                {filtered.length} de {appointments.length} citas
                            </p>
                        </div>
                    )}

                    {/* Month view */}
                    {view === 'month' && (
                        <div className="border-t">
                            <div className="grid grid-cols-7 border-b">
                                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                                    <div key={d} className={`py-2 text-center text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${i >= 5 ? 'text-red-400' : 'text-muted-foreground'}`}>{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {calDays.map((day, i) => {
                                    const apts = aptsForDay(day);
                                    const inM = isSameMonth(day, currentDate);
                                    const isT = isToday(day);
                                    const isWknd = (i % 7) >= 5;
                                    return (
                                        <div key={day.toISOString()} onClick={() => openCreate(day)}
                                            className={`group cursor-pointer transition-colors min-h-[80px] sm:min-h-[110px] md:min-h-[130px]
                                                ${isT ? 'bg-primary/5' : ''}
                                                ${!inM ? 'bg-muted/20' : isWknd && !isT ? 'bg-muted/10' : ''}
                                                ${(i + 1) % 7 !== 0 ? 'border-r border-border' : ''}
                                                ${i < calDays.length - 7 ? 'border-b border-border' : ''}
                                                hover:bg-primary/[0.07]`}>
                                            <div className="p-1.5 sm:p-2">
                                                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm
                                                    ${isT ? 'bg-primary text-white shadow-sm shadow-primary/40' : !inM ? 'text-muted-foreground/40' : isWknd ? 'text-red-500' : 'text-foreground'}`}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-[2px] px-1 pb-1">
                                                {apts.slice(0, 2).map((apt) => (
                                                    <div key={apt.id} onClick={(e) => { e.stopPropagation(); openEdit(apt); }}
                                                        className={`cursor-pointer truncate rounded-[3px] px-1 py-[2px] text-[10px] font-medium leading-tight text-white shadow-sm sm:px-1.5 sm:py-[3px] sm:text-[11px] ${STATUS_BG[apt.status]}`}>
                                                        <span className="opacity-80 mr-0.5 hidden sm:inline">{apt.start_time.slice(0, 5)}</span>
                                                        {aptDisplayName(apt)}
                                                    </div>
                                                ))}
                                                {apts.length > 2 && <span className="px-1 text-[9px] font-medium text-muted-foreground sm:text-[10px]">+{apts.length - 2} más</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Week view */}
                    {view === 'week' && (
                        <div className="border-t overflow-x-auto">
                            <div className="grid grid-cols-7 border-b min-w-[500px]">
                                {weekDays.map((day, i) => {
                                    const apts = aptsForDay(day);
                                    const isT = isToday(day);
                                    const isWknd = i >= 5;
                                    return (
                                        <div key={day.toISOString()} onClick={() => openCreate(day)}
                                            className={`cursor-pointer transition-colors ${isT ? 'bg-primary/5' : isWknd ? 'bg-muted/10' : ''} ${i < 6 ? 'border-r border-border' : ''} hover:bg-primary/[0.07]`}>
                                            <div className={`border-b px-2 py-2 text-center ${isT ? 'border-primary/20' : ''}`}>
                                                <div className={`text-[10px] font-semibold uppercase tracking-wider sm:text-[11px] ${isWknd ? 'text-red-400' : 'text-muted-foreground'}`}>{format(day, 'EEE', { locale: es })}</div>
                                                <div className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold sm:h-7 sm:w-7 ${isT ? 'bg-primary text-white' : isWknd ? 'text-red-500' : 'text-foreground'}`}>{format(day, 'd')}</div>
                                            </div>
                                            <div className="flex min-h-[100px] flex-col gap-1 p-1 sm:min-h-[120px] sm:p-1.5">
                                                {apts.map((apt) => (
                                                    <div key={apt.id} onClick={(e) => { e.stopPropagation(); openEdit(apt); }}
                                                        className={`cursor-pointer truncate rounded-[3px] px-1 py-[2px] text-[10px] font-medium text-white shadow-sm sm:px-1.5 sm:py-[3px] sm:text-[11px] ${STATUS_BG[apt.status]}`}>
                                                        {apt.start_time.slice(0, 5)} {aptDisplayName(apt)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* List view */}
                    {view === 'list' && (
                        sorted.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <LayoutGrid className="mb-3 h-12 w-12 opacity-20" />
                                {activeFilterCount > 0 ? (
                                    <>
                                        <p className="font-medium">Sin resultados para los filtros aplicados</p>
                                        <button onClick={clearFilters} className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
                                            <X className="h-3.5 w-3.5" /> Limpiar filtros
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium">No hay citas registradas</p>
                                        <Button onClick={() => openCreate()} size="sm" className="mt-4">Crear primera cita</Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto border-t">
                                <table className="berry-table w-full">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th className="hidden sm:table-cell">Horario</th>
                                            <th>Cliente</th>
                                            <th className="hidden md:table-cell">Servicios / Productos</th>
                                            <th>Estado</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sorted.map((apt) => (
                                            <tr key={apt.id}>
                                                <td>
                                                    <div className="font-medium">{apt.date ? format(parseISO(apt.date), 'dd MMM yyyy', { locale: es }) : '—'}</div>
                                                    <div className="text-xs text-muted-foreground capitalize hidden sm:block">{apt.date ? format(parseISO(apt.date), 'EEEE', { locale: es }) : ''}</div>
                                                </td>
                                                <td className="hidden tabular-nums text-muted-foreground sm:table-cell">{apt.start_time?.slice(0, 5)} – {apt.end_time?.slice(0, 5)}</td>
                                                <td>
                                                    {apt.client ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{apt.client.name.charAt(0)}</div>
                                                            <span className="font-medium">{apt.client.name}</span>
                                                        </div>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="hidden md:table-cell">
                                                    <div className="flex flex-col gap-0.5">
                                                        {apt.services.map((s) => (
                                                            <span key={s.id} className="flex items-center gap-1 text-xs"><Scissors className="h-3 w-3 text-primary/60" />{s.name}</span>
                                                        ))}
                                                        {apt.products.map((p) => (
                                                            <span key={p.id} className="flex items-center gap-1 text-xs"><Package className="h-3 w-3 text-violet-400" />{p.name}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[apt.status]}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[apt.status]}`} />
                                                        {STATUS_LABELS[apt.status]}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEdit(apt)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                                                        <button onClick={() => handleDelete(apt)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* Legend */}
                    {view !== 'list' && (
                        <div className="flex flex-wrap items-center gap-3 border-t px-4 py-2.5 sm:gap-4 sm:px-5">
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_BG[k]}`} />{v}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal ───────────────────────────────────────────────── */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingApt ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">

                        {/* Errores generales */}
                        {Object.keys(formErrors).length > 0 && (
                            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-200">
                                <p className="font-semibold mb-1">Corrige los siguientes errores:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {Object.values(formErrors).map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Cliente */}
                        <div className="flex flex-col gap-1.5">
                            <Label>Cliente (opcional)</Label>
                            <Select value={formData.client_id || '_none'} onValueChange={(v) => setField('client_id', v === '_none' ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="Sin cliente" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin cliente</SelectItem>
                                    {clients.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Servicios multi-select */}
                        <MultiSelect
                            label="Servicios *"
                            icon={Scissors}
                            items={services}
                            selectedIds={selectedServices}
                            onToggle={toggleService}
                            formatSub={(s) => formatMoney(s.price)}
                        />
                        {formErrors.services && <p className="text-xs text-red-500">{formErrors.services}</p>}

                        {/* Productos multi-select */}
                        <MultiSelect
                            label="Productos"
                            icon={Package}
                            items={products}
                            selectedIds={selectedProducts}
                            onToggle={toggleProduct}
                            formatSub={(p) => formatMoney(p.price)}
                        />

                        {/* Total estimado */}
                        {formTotal > 0 && (
                            <div className="flex items-center justify-between rounded-[var(--radius)] bg-primary/5 px-3 py-2 text-sm">
                                <span className="text-muted-foreground">Total estimado</span>
                                <span className="font-bold text-primary">{formatMoney(formTotal)}</span>
                            </div>
                        )}

                        {/* Fecha y hora */}
                        <div className="flex flex-col gap-1.5">
                            <Label>Fecha *</Label>
                            <Input type="date" value={formData.date} onChange={(e) => setField('date', e.target.value)} />
                            {formErrors.date && <p className="text-xs text-red-500">{formErrors.date}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Inicio *</Label>
                                <Input type="time" value={formData.start_time} onChange={(e) => setField('start_time', e.target.value)} />
                                {formErrors.start_time && <p className="text-xs text-red-500">{formErrors.start_time}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Fin *</Label>
                                <Input type="time" value={formData.end_time} onChange={(e) => setField('end_time', e.target.value)} />
                                {formErrors.end_time && <p className="text-xs text-red-500">{formErrors.end_time}</p>}
                            </div>
                        </div>

                        {/* Estado (solo edición) */}
                        {editingApt && (
                            <div className="flex flex-col gap-1.5">
                                <Label>Estado</Label>
                                <Select value={formData.status} onValueChange={(s) => setField('status', s)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                            <SelectItem key={v} value={v}>
                                                <span className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[v]}`} />{l}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Notas */}
                        <div className="flex flex-col gap-1.5">
                            <Label>Notas</Label>
                            <textarea value={formData.notes} onChange={(e) => setField('notes', e.target.value)} rows={2}
                                style={{ borderRadius: 'var(--radius)' }}
                                className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Observaciones..." />
                        </div>

                        {/* Info: ingreso automático al completar */}
                        {showIncome && (
                            <div className="flex items-start gap-3 rounded-[var(--radius)] bg-green-50/60 p-3 ring-1 ring-green-200">
                                <ArrowUpCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-700">Se registrará un ingreso automático</p>
                                    <p className="text-xs text-green-600 mt-0.5">
                                        Al guardar, se creará un ingreso con el desglose de servicios y productos de esta cita.
                                    </p>
                                    <div className="mt-2 flex flex-col gap-1.5">
                                        <Label className="text-xs">Categoría del ingreso (opcional)</Label>
                                        <Select value={formData.income_category_id || '_none'} onValueChange={(v) => setField('income_category_id', v === '_none' ? '' : v)}>
                                            <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="_none">Sin categoría</SelectItem>
                                                {incomeCategories.map((c) => (
                                                    <SelectItem key={c.id} value={c.id.toString()}>
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing || selectedServices.length === 0}>
                                {processing ? 'Guardando…' : editingApt ? 'Guardar cambios' : 'Crear cita'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
