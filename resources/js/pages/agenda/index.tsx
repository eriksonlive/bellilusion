import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
    format, isSameDay, isSameMonth, isToday, parseISO,
    startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ArrowUpCircle, CalendarPlus, ChevronLeft, ChevronRight,
    LayoutGrid, List, ListOrdered, Pencil, Trash2,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Agenda', href: '/agenda' },
];

interface Client    { id: number; name: string; phone?: string }
interface Service   { id: number; name: string; price: number; duration_minutes?: number }
interface IncomeCategory { id: number; name: string; color: string }
interface Appointment {
    id: number; client?: Client; service?: Service;
    date: string; start_time: string; end_time: string;
    status: 'pending'|'confirmed'|'cancelled'|'completed'; notes?: string; slot_id: number;
}
interface Props {
    appointments: Appointment[]; clients: Client[]; services: Service[]; incomeCategories: IncomeCategory[];
}

const STATUS_LABELS: Record<string,string> = {
    pending:'Pendiente', confirmed:'Confirmada', cancelled:'Cancelada', completed:'Completada',
};
const STATUS_BG: Record<string,string> = {
    pending:   'bg-amber-400',
    confirmed: 'bg-blue-500',
    cancelled: 'bg-slate-400',
    completed: 'bg-green-500',
};
const STATUS_BADGE: Record<string,string> = {
    pending:   'bg-amber-100  text-amber-700',
    confirmed: 'bg-blue-100   text-blue-700',
    cancelled: 'bg-slate-100  text-slate-600',
    completed: 'bg-green-100  text-green-700',
};
const STATUS_DOT: Record<string,string> = {
    pending:'bg-amber-400', confirmed:'bg-blue-500', cancelled:'bg-slate-400', completed:'bg-green-500',
};

type ViewMode = 'month' | 'week' | 'list';

export default function AgendaIndex({ appointments, clients, services, incomeCategories }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [view, setView] = useState<ViewMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [editingApt, setEditingApt] = useState<Appointment|null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        client_id:'', service_id:'',
        date: format(new Date(),'yyyy-MM-dd'),
        start_time:'09:00', end_time:'10:00',
        status:'pending', notes:'',
        register_income: false as boolean,
        income_amount:'', income_description:'', income_category_id:'',
    });

    /* ── Calendar days ──────────────────────────────────────────── */
    const monthStart = startOfMonth(currentDate);
    const monthEnd   = endOfMonth(currentDate);
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
    const calDays    = eachDayOfInterval({ start: calStart, end: calEnd });
    const aptsForDay = (d: Date) => appointments.filter((a) => a.date && isSameDay(parseISO(a.date), d));

    /* ── Week view ──────────────────────────────────────────────── */
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd   = endOfWeek(currentDate,   { weekStartsOn: 1 });
    const weekDays  = eachDayOfInterval({ start: weekStart, end: weekEnd });

    function navigate(dir: 1|-1) {
        if (view === 'week') setCurrentDate((d) => {
            const nd = new Date(d); nd.setDate(nd.getDate() + dir * 7); return nd;
        });
        else setCurrentDate(dir === 1 ? addMonths(currentDate,1) : subMonths(currentDate,1));
    }
    function goToday() { setCurrentDate(new Date()); }

    function navLabel() {
        if (view === 'week') return `${format(weekStart,'d MMM',{locale:es})} – ${format(weekEnd,'d MMM yyyy',{locale:es})}`;
        return format(currentDate,'MMMM yyyy',{locale:es});
    }

    /* ── Event handlers ─────────────────────────────────────────── */
    function openCreate(date?: Date) {
        reset(); setEditingApt(null);
        if (date) setData('date', format(date,'yyyy-MM-dd'));
        setShowModal(true);
    }
    function openEdit(apt: Appointment) {
        setEditingApt(apt);
        setData({
            client_id: apt.client?.id?.toString()??'',
            service_id: apt.service?.id?.toString()??'',
            date: apt.date, start_time: apt.start_time, end_time: apt.end_time,
            status: apt.status, notes: apt.notes??'',
            register_income: false,
            income_amount: apt.service?.price?.toString()??'',
            income_description: apt.service ? `Servicio: ${apt.service.name}${apt.client?` — ${apt.client.name}`:''}` : '',
            income_category_id: '',
        });
        setShowModal(true);
    }
    function handleStatusChange(s: string) {
        setData((p) => ({ ...p, status: s, register_income: s==='completed' }));
    }
    function handleServiceChange(id: string) {
        const svc = services.find((s) => s.id.toString()===id);
        setData((p) => ({
            ...p, service_id: id,
            income_amount: svc?.price?.toString()??p.income_amount,
            income_description: svc
                ? `Servicio: ${svc.name}${p.client_id?` — ${clients.find((c)=>c.id.toString()===p.client_id)?.name??''}`:''}`
                : p.income_description,
        }));
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingApt) put(route('agenda.update',editingApt.id),{onSuccess:()=>{setShowModal(false);reset();}});
        else post(route('agenda.store'),{onSuccess:()=>{setShowModal(false);reset();}});
    }
    function handleDelete(apt: Appointment) {
        if (!confirm('¿Eliminar esta cita?')) return;
        router.delete(route('agenda.destroy',apt.id));
    }

    const sorted = [...appointments].sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);
    const showIncome = !!editingApt && data.status==='completed';

    /* ── View toggle buttons ─────────────────────────────────────── */
    const views: { key: ViewMode; icon: React.ReactNode; label: string }[] = [
        { key:'month', icon:<LayoutGrid className="h-[18px] w-[18px]"/>, label:'Mes' },
        { key:'week',  icon:<List className="h-[18px] w-[18px]"/>,       label:'Semana' },
        { key:'list',  icon:<ListOrdered className="h-[18px] w-[18px]"/>,label:'Lista' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agenda"/>
            <div className="flex flex-col gap-5 p-5">

                {flash?.success && (
                    <div className="flex items-center gap-3 bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200" style={{borderRadius:'var(--radius)'}}>
                        <span className="h-2 w-2 rounded-full bg-green-500"/> {flash.success}
                    </div>
                )}

                {/* ── Single Berry card ──────────────────────────────────── */}
                <div className="card-berry overflow-hidden bg-card" style={{borderRadius:'var(--radius-lg)'}}>

                    {/* Card header — title + Add button */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <h2 className="text-base font-bold text-foreground">Calendario de citas</h2>
                        <Button onClick={()=>openCreate()} size="sm"
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md shadow-secondary/30">
                            <CalendarPlus className="h-4 w-4"/> Agregar cita
                        </Button>
                    </div>
                    <div className="border-b"/>

                    {/* Toolbar — Today | nav | view toggle */}
                    <div className="flex flex-wrap items-center gap-3 px-5 py-3">
                        {/* Today */}
                        <button onClick={goToday}
                            className="rounded-[var(--radius)] border border-input px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors">
                            Hoy
                        </button>

                        {/* Month/Week navigation */}
                        <div className="flex items-center gap-1">
                            <button onClick={()=>navigate(-1)}
                                className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                <ChevronLeft className="h-4 w-4"/>
                            </button>
                            <h3 className="min-w-[140px] text-center text-base font-semibold capitalize">{navLabel()}</h3>
                            <button onClick={()=>navigate(1)}
                                className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                <ChevronRight className="h-4 w-4"/>
                            </button>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1"/>

                        {/* View toggle — Berry ButtonGroup style */}
                        <div className="flex overflow-hidden rounded-[var(--radius)] border border-primary/40">
                            {views.map((v, i) => (
                                <button key={v.key} onClick={()=>setView(v.key)}
                                    title={v.label}
                                    className={`flex items-center justify-center p-2 transition-colors
                                        ${i>0?'border-l border-primary/40':''}
                                        ${view===v.key
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-primary hover:bg-primary/10'
                                        }`}>
                                    {v.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Month view ──────────────────────────────────────── */}
                    {view==='month' && (
                        <div className="border-t">
                            {/* Day-of-week headers */}
                            <div className="grid grid-cols-7 border-b">
                                {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d, i) => (
                                    <div key={d} className={`py-3 text-center text-[11px] font-bold uppercase tracking-wider
                                        ${i>=5 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                        {d}
                                    </div>
                                ))}
                            </div>
                            {/* Days grid */}
                            <div className="grid grid-cols-7">
                                {calDays.map((day, i) => {
                                    const apts  = aptsForDay(day);
                                    const inM   = isSameMonth(day, currentDate);
                                    const isT   = isToday(day);
                                    const isWknd = (i % 7) >= 5;
                                    const noR   = (i+1)%7===0;
                                    const noB   = i>=calDays.length-7;
                                    return (
                                        <div key={day.toISOString()} onClick={()=>openCreate(day)}
                                            className={`group cursor-pointer transition-colors
                                                min-h-[110px] md:min-h-[130px]
                                                ${isT        ? 'bg-primary/5'              : ''}
                                                ${!inM       ? 'bg-muted/20'               : isWknd && !isT ? 'bg-muted/10' : ''}
                                                ${!noR ? 'border-r border-border' : ''}
                                                ${!noB ? 'border-b border-border' : ''}
                                                hover:bg-primary/[0.07]
                                            `}>
                                            {/* Date number — top left like Berry */}
                                            <div className="p-2 pb-1">
                                                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold
                                                    ${isT
                                                        ? 'bg-primary text-white shadow-sm shadow-primary/40'
                                                        : !inM
                                                            ? 'text-muted-foreground/40'
                                                            : isWknd
                                                                ? 'text-red-500'
                                                                : 'text-foreground'
                                                    }`}>
                                                    {format(day,'d')}
                                                </span>
                                            </div>
                                            {/* Events */}
                                            <div className="flex flex-col gap-[3px] px-1 pb-1.5">
                                                {apts.slice(0,3).map((apt) => (
                                                    <div key={apt.id}
                                                        onClick={(e)=>{e.stopPropagation();openEdit(apt);}}
                                                        className={`cursor-pointer truncate rounded-[3px] px-1.5 py-[3px] text-[11px] font-medium leading-tight text-white shadow-sm ${STATUS_BG[apt.status]}`}>
                                                        <span className="opacity-80 mr-0.5">{apt.start_time.slice(0,5)}</span>
                                                        {apt.client?.name??apt.service?.name??'Cita'}
                                                    </div>
                                                ))}
                                                {apts.length>3 && (
                                                    <span className="px-1.5 text-[10px] font-medium text-muted-foreground">+{apts.length-3} más</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Week view ───────────────────────────────────────── */}
                    {view==='week' && (
                        <div className="border-t">
                            <div className="grid grid-cols-7 border-b">
                                {weekDays.map((day, i) => {
                                    const apts   = aptsForDay(day);
                                    const isT    = isToday(day);
                                    const isWknd = i >= 5;
                                    return (
                                        <div key={day.toISOString()}
                                            className={`cursor-pointer transition-colors
                                                ${isT ? 'bg-primary/5' : isWknd ? 'bg-muted/10' : ''}
                                                ${i<6 ? 'border-r border-border' : ''}
                                                hover:bg-primary/[0.07]`}
                                            onClick={()=>openCreate(day)}>
                                            {/* Header */}
                                            <div className={`border-b px-2 py-2 text-center ${isT ? 'border-primary/20' : ''}`}>
                                                <div className={`text-[11px] font-semibold uppercase tracking-wider ${isWknd ? 'text-red-400' : 'text-muted-foreground'}`}>
                                                    {format(day,'EEE',{locale:es})}
                                                </div>
                                                <div className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold
                                                    ${isT ? 'bg-primary text-white shadow-sm shadow-primary/40' : isWknd ? 'text-red-500' : 'text-foreground'}`}>
                                                    {format(day,'d')}
                                                </div>
                                            </div>
                                            {/* Events */}
                                            <div className="flex min-h-[120px] flex-col gap-1 p-1.5">
                                                {apts.map((apt) => (
                                                    <div key={apt.id}
                                                        onClick={(e)=>{e.stopPropagation();openEdit(apt);}}
                                                        className={`cursor-pointer truncate rounded-[3px] px-1.5 py-[3px] text-[11px] font-medium text-white shadow-sm ${STATUS_BG[apt.status]}`}>
                                                        <span className="opacity-80 mr-0.5">{apt.start_time.slice(0,5)}</span>
                                                        {apt.client?.name??apt.service?.name??'Cita'}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── List view ───────────────────────────────────────── */}
                    {view==='list' && (
                        sorted.length===0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <LayoutGrid className="mb-3 h-12 w-12 opacity-20"/>
                                <p className="font-medium">No hay citas registradas</p>
                                <Button onClick={()=>openCreate()} size="sm" className="mt-4">Crear primera cita</Button>
                            </div>
                        ) : (
                            <table className="berry-table w-full border-t">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Horario</th>
                                        <th>Cliente</th>
                                        <th>Servicio</th>
                                        <th>Estado</th>
                                        <th/>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((apt) => (
                                        <tr key={apt.id}>
                                            <td>
                                                <div className="font-medium">{apt.date?format(parseISO(apt.date),'dd MMM yyyy',{locale:es}):'—'}</div>
                                                <div className="text-xs text-muted-foreground capitalize">{apt.date?format(parseISO(apt.date),'EEEE',{locale:es}):''}</div>
                                            </td>
                                            <td className="tabular-nums text-muted-foreground">{apt.start_time?.slice(0,5)} – {apt.end_time?.slice(0,5)}</td>
                                            <td>
                                                {apt.client ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                            {apt.client.name.charAt(0)}
                                                        </div>
                                                        <span className="font-medium">{apt.client.name}</span>
                                                    </div>
                                                ) : <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="text-muted-foreground">{apt.service?.name??'—'}</td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[apt.status]}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[apt.status]}`}/>
                                                    {STATUS_LABELS[apt.status]}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={()=>openEdit(apt)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
                                                    <button onClick={()=>handleDelete(apt)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}

                    {/* Legend */}
                    {view!=='list' && (
                        <div className="flex flex-wrap items-center gap-4 border-t px-5 py-2.5">
                            {Object.entries(STATUS_LABELS).map(([k,v]) => (
                                <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_BG[k]}`}/>
                                    {v}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal ──────────────────────────────────────────────── */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editingApt?'Editar cita':'Nueva cita'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label>Cliente (opcional)</Label>
                            <Select value={data.client_id||'_none'} onValueChange={(v)=>setData('client_id',v==='_none'?'':v)}>
                                <SelectTrigger><SelectValue placeholder="Sin cliente"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin cliente</SelectItem>
                                    {clients.map((c)=><SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Servicio *</Label>
                            <Select value={data.service_id||'_none'} onValueChange={(v)=>handleServiceChange(v==='_none'?'':v)}>
                                <SelectTrigger><SelectValue placeholder="Selecciona servicio"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin servicio</SelectItem>
                                    {services.map((s)=>(
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name} — ${parseFloat(s.price as unknown as string).toLocaleString('es-CO')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.service_id && <p className="text-xs text-red-500">{errors.service_id}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Fecha *</Label>
                            <Input type="date" value={data.date} onChange={(e)=>setData('date',e.target.value)}/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Inicio *</Label>
                                <Input type="time" value={data.start_time} onChange={(e)=>setData('start_time',e.target.value)}/>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Fin *</Label>
                                <Input type="time" value={data.end_time} onChange={(e)=>setData('end_time',e.target.value)}/>
                            </div>
                        </div>
                        {editingApt && (
                            <div className="flex flex-col gap-1.5">
                                <Label>Estado</Label>
                                <Select value={data.status} onValueChange={handleStatusChange}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(STATUS_LABELS).map(([v,l])=>(
                                            <SelectItem key={v} value={v}>
                                                <span className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[v]}`}/>{l}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex flex-col gap-1.5">
                            <Label>Notas</Label>
                            <textarea value={data.notes} onChange={(e)=>setData('notes',e.target.value)} rows={2}
                                style={{borderRadius:'var(--radius)'}}
                                className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Observaciones..."/>
                        </div>
                        {showIncome && (
                            <div className="flex flex-col gap-3 rounded-[var(--radius)] bg-green-50/60 p-4 ring-1 ring-green-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpCircle className="h-4 w-4 text-green-600"/>
                                        <p className="text-sm font-semibold text-green-700">Registrar ingreso</p>
                                    </div>
                                    <button type="button" onClick={()=>setData('register_income',!data.register_income)}
                                        className={`relative h-6 w-11 rounded-full transition-colors ${data.register_income?'bg-green-600':'bg-muted'}`}>
                                        <span className={`block h-4 w-4 translate-y-1 rounded-full bg-white shadow transition-transform ${data.register_income?'translate-x-6':'translate-x-1'}`}/>
                                    </button>
                                </div>
                                {data.register_income && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-xs">Descripción</Label>
                                            <Input value={data.income_description} onChange={(e)=>setData('income_description',e.target.value)}/>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-xs">Monto *</Label>
                                                <Input type="number" step="0.01" min="0" value={data.income_amount} onChange={(e)=>setData('income_amount',e.target.value)}/>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-xs">Categoría</Label>
                                                <Select value={data.income_category_id||'_none'} onValueChange={(v)=>setData('income_category_id',v==='_none'?'':v)}>
                                                    <SelectTrigger><SelectValue placeholder="Sin categoría"/></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="_none">Sin categoría</SelectItem>
                                                        {incomeCategories.map((c)=>(
                                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                                <span className="flex items-center gap-2">
                                                                    <span className="h-2 w-2 rounded-full" style={{background:c.color}}/>{c.name}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={()=>setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editingApt?'Guardar cambios':'Crear cita'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
