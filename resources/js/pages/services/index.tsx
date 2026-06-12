import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Clock, DollarSign, Pencil, Plus, Search, Trash2, X, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Servicios', href: '/services' },
];

interface Service {
    id: number; name: string; description?: string;
    duration_minutes?: number; price: string;
    active: boolean; appointments_count: number;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number;
    next_page_url: string|null; prev_page_url: string|null;
    total: number; from: number; to: number;
}
interface Props { services: Paginated<Service>; filters: { search?: string; active?: string } }

function formatDuration(m?: number): string {
    if (!m) return '—';
    const h = Math.floor(m/60), min = m%60;
    return h>0 ? (min>0?`${h}h ${min}min`:`${h}h`) : `${m} min`;
}

export default function ServicesIndex({ services, filters }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service|null>(null);
    const [searchValue, setSearchValue] = useState(filters.search??'');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:'', description:'', duration_minutes:'', price:'', active: true as boolean,
    });

    function openCreate() { reset(); setEditingService(null); setShowModal(true); }
    function openEdit(s: Service) {
        setEditingService(s);
        setData({ name:s.name, description:s.description??'', duration_minutes:s.duration_minutes?.toString()??'', price:s.price, active:s.active });
        setShowModal(true);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingService) put(route('services.update',editingService.id),{onSuccess:()=>{setShowModal(false);reset();}});
        else post(route('services.store'),{onSuccess:()=>{setShowModal(false);reset();}});
    }
    function handleDelete(s: Service) {
        if (!confirm(`¿Eliminar "${s.name}"?`)) return;
        router.delete(route('services.destroy',s.id));
    }
    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('services.index'),{...filters,search:searchValue||undefined},{preserveState:true,replace:true});
    }
    function setActiveFilter(v: string|undefined) {
        router.get(route('services.index'),{...filters,active:v},{preserveState:true,replace:true});
    }

    const activeFilter = filters.active;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Servicios"/>
            <div className="flex flex-col gap-5 p-5">

                <div className="card-berry overflow-hidden bg-card" style={{borderRadius:'var(--radius-lg)'}}>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h1 className="text-base font-bold">Servicios</h1>
                            <p className="text-xs text-muted-foreground">
                                {services.total} servicio{services.total!==1?'s':''}
                                {services.from && services.to ? ` · mostrando ${services.from}–${services.to}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Active filter pills */}
                            <div className="flex rounded-[var(--radius)] border bg-muted/30 p-0.5 text-xs">
                                {[
                                    {label:'Todos', value:undefined},
                                    {label:'Activos', value:'true'},
                                    {label:'Inactivos', value:'false'},
                                ].map(({label,value})=>(
                                    <button key={label} onClick={()=>setActiveFilter(value)}
                                        className={`rounded-[calc(var(--radius)-2px)] px-3 py-1.5 font-medium transition-all
                                            ${activeFilter===value?'bg-card shadow-sm text-primary':'text-muted-foreground hover:text-foreground'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex items-center gap-1.5">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"/>
                                    <input value={searchValue} onChange={(e)=>setSearchValue(e.target.value)}
                                        placeholder="Buscar servicio..."
                                        style={{borderRadius:'var(--radius)'}}
                                        className="h-9 w-48 border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"/>
                                </div>
                                {filters.search && (
                                    <button type="button" onClick={()=>{setSearchValue('');router.get(route('services.index'),{...filters,search:undefined},{replace:true});}}
                                        className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                        <X className="h-4 w-4"/>
                                    </button>
                                )}
                            </form>
                            <Button onClick={openCreate} size="sm">
                                <Plus className="h-4 w-4"/> Nuevo servicio
                            </Button>
                        </div>
                    </div>

                    {/* Empty state */}
                    {services.data.length===0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <DollarSign className="mb-3 h-12 w-12 opacity-20"/>
                            <p className="font-medium">{filters.search?'Sin resultados':'No hay servicios registrados'}</p>
                            {!filters.search && <Button onClick={openCreate} size="sm" className="mt-4"><Plus className="h-4 w-4"/>Crear primer servicio</Button>}
                        </div>
                    ) : (
                        <>
                        {/* Desktop table */}
                        <div className="hidden md:block">
                            <table className="berry-table w-full">
                                <thead>
                                    <tr>
                                        <th>Servicio</th>
                                        <th>Precio</th>
                                        <th>Duración</th>
                                        <th>Citas</th>
                                        <th>Estado</th>
                                        <th/>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.data.map((s)=>(
                                        <tr key={s.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.active?'bg-primary/10 text-primary':'bg-muted text-muted-foreground'}`}>
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{s.name}</p>
                                                        {s.description && <p className="line-clamp-1 max-w-[220px] text-xs text-muted-foreground">{s.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-semibold text-green-700 dark:text-green-400">
                                                    ${parseFloat(s.price).toLocaleString('es-CO',{minimumFractionDigits:0})}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5"/> {formatDuration(s.duration_minutes)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                    <CalendarDays className="h-3 w-3"/> {s.appointments_count}
                                                </span>
                                            </td>
                                            <td>
                                                {s.active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                                        <CheckCircle2 className="h-3 w-3"/> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                                        <XCircle className="h-3 w-3"/> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={()=>openEdit(s)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
                                                    <button onClick={()=>handleDelete(s)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y md:hidden">
                            {services.data.map((s)=>(
                                <div key={s.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${!s.active?'opacity-60':''}`}>
                                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.active?'bg-primary/10 text-primary':'bg-muted text-muted-foreground'}`}>
                                        {s.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{s.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatDuration(s.duration_minutes)} · ${parseFloat(s.price).toLocaleString('es-CO',{minimumFractionDigits:0})}</p>
                                        {!s.active && <span className="text-xs text-muted-foreground">Inactivo</span>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={()=>openEdit(s)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
                                        <button onClick={()=>handleDelete(s)} className="rounded-[var(--radius)] p-1.5 hover:bg-danger/10 hover:text-danger transition-colors"><Trash2 className="h-3.5 w-3.5 text-muted-foreground"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}

                    {/* Pagination */}
                    {services.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                            <span className="text-muted-foreground">Página {services.current_page} de {services.last_page}</span>
                            <div className="flex gap-1">
                                <Link href={services.prev_page_url??'#'} className={!services.prev_page_url?'pointer-events-none opacity-40':''}>
                                    <Button variant="outline" size="sm">Anterior</Button>
                                </Link>
                                <Link href={services.next_page_url??'#'} className={!services.next_page_url?'pointer-events-none opacity-40':''}>
                                    <Button variant="outline" size="sm">Siguiente</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editingService?'Editar servicio':'Nuevo servicio'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input id="name" value={data.name} onChange={(e)=>setData('name',e.target.value)} placeholder="Ej: Corte de cabello, Manicure..." autoFocus/>
                            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="description">Descripción</Label>
                            <textarea id="description" value={data.description} onChange={(e)=>setData('description',e.target.value)} rows={2}
                                style={{borderRadius:'var(--radius)'}}
                                className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Descripción del servicio..."/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="price">Precio *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                    <Input id="price" type="number" step="0.01" min="0" value={data.price} onChange={(e)=>setData('price',e.target.value)} placeholder="0.00" className="pl-9"/>
                                </div>
                                {errors.price && <p className="text-xs text-danger">{errors.price}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="duration_minutes">Duración (min)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
                                    <Input id="duration_minutes" type="number" min="5" step="5" value={data.duration_minutes} onChange={(e)=>setData('duration_minutes',e.target.value)} placeholder="60" className="pl-9"/>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 ring-1 ring-border" style={{borderRadius:'var(--radius)'}}>
                            <button type="button" onClick={()=>setData('active',!data.active)}
                                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${data.active?'bg-primary':'bg-input'}`}>
                                <span className={`block h-4 w-4 translate-y-1 rounded-full bg-white shadow-sm transition-transform ${data.active?'translate-x-6':'translate-x-1'}`}/>
                            </button>
                            <div>
                                <p className="text-sm font-medium">Servicio activo</p>
                                <p className="text-xs text-muted-foreground">Solo los servicios activos aparecen al agendar citas</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={()=>setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editingService?'Guardar cambios':'Crear servicio'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
