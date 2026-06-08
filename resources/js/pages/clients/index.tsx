import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Mail, Pencil, Phone, Plus, Search, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Clientes', href: '/clients' },
];

interface Client {
    id: number; name: string; email?: string; phone?: string; notes?: string;
    appointments_count: number; created_at: string;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number;
    next_page_url: string|null; prev_page_url: string|null; total: number;
    from: number; to: number;
}
interface Props { clients: Paginated<Client>; filters: { search?: string } }

function Avatar({ name }: { name: string }) {
    const initials = name.split(' ').slice(0,2).map((w)=>w[0]).join('').toUpperCase();
    const colors = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700','bg-green-100 text-green-700',
                    'bg-amber-100 text-amber-700','bg-pink-100 text-pink-700','bg-teal-100 text-teal-700'];
    const color  = colors[name.charCodeAt(0)%colors.length];
    return (
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}>
            {initials}
        </div>
    );
}

export default function ClientsIndex({ clients, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client|null>(null);
    const [searchValue, setSearchValue] = useState(filters.search??'');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:'', email:'', phone:'', notes:'',
    });

    function openCreate() { reset(); setEditingClient(null); setShowModal(true); }
    function openEdit(c: Client) {
        setEditingClient(c);
        setData({ name:c.name, email:c.email??'', phone:c.phone??'', notes:c.notes??'' });
        setShowModal(true);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingClient) put(route('clients.update',editingClient.id),{onSuccess:()=>{setShowModal(false);reset();}});
        else post(route('clients.store'),{onSuccess:()=>{setShowModal(false);reset();}});
    }
    function handleDelete(c: Client) {
        if (!confirm(`¿Eliminar al cliente "${c.name}"?`)) return;
        router.delete(route('clients.destroy',c.id));
    }
    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('clients.index'),{search:searchValue||undefined},{preserveState:true,replace:true});
    }
    function clearSearch() {
        setSearchValue('');
        router.get(route('clients.index'),{},{replace:true});
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clientes"/>
            <div className="flex flex-col gap-5 p-5">

                {flash?.success && (
                    <div className="flex items-center gap-3 bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200" style={{borderRadius:'var(--radius)'}}>
                        <span className="h-2 w-2 rounded-full bg-green-500"/>
                        {flash.success}
                    </div>
                )}

                {/* ── Tabla card ─────────────────────────────── */}
                <div className="card-berry overflow-hidden bg-card" style={{borderRadius:'var(--radius-lg)'}}>

                    {/* Table toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h1 className="text-base font-bold text-foreground">Clientes</h1>
                            <p className="text-xs text-muted-foreground">
                                {clients.total} cliente{clients.total!==1?'s':''} en total
                                {clients.from && clients.to ? ` · mostrando ${clients.from}–${clients.to}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="flex items-center gap-1.5">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"/>
                                    <input
                                        value={searchValue}
                                        onChange={(e)=>setSearchValue(e.target.value)}
                                        placeholder="Buscar cliente..."
                                        style={{borderRadius:'var(--radius)'}}
                                        className="h-9 w-52 border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                {filters.search && (
                                    <button type="button" onClick={clearSearch}
                                        className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                        <X className="h-4 w-4"/>
                                    </button>
                                )}
                            </form>
                            <Button onClick={openCreate} size="sm">
                                <Plus className="h-4 w-4"/> Nuevo cliente
                            </Button>
                        </div>
                    </div>

                    {/* Empty state */}
                    {clients.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <User className="mb-3 h-12 w-12 opacity-20"/>
                            <p className="font-medium">{filters.search?'Sin resultados':'No hay clientes registrados'}</p>
                            {!filters.search && (
                                <Button onClick={openCreate} size="sm" className="mt-4">
                                    <Plus className="h-4 w-4"/> Crear primer cliente
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                        {/* Desktop table */}
                        <div className="hidden md:block">
                            <table className="berry-table w-full">
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Contacto</th>
                                        <th>Citas</th>
                                        <th>Notas</th>
                                        <th/>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.data.map((c)=>(
                                        <tr key={c.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={c.name}/>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{c.name}</p>
                                                        {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-0.5">
                                                    {c.phone && (
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Phone className="h-3 w-3"/> {c.phone}
                                                        </span>
                                                    )}
                                                    {c.email && (
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Mail className="h-3 w-3"/> {c.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                    <CalendarDays className="h-3 w-3"/>
                                                    {c.appointments_count} cita{c.appointments_count!==1?'s':''}
                                                </span>
                                            </td>
                                            <td className="max-w-[180px] truncate text-xs text-muted-foreground">{c.notes??'—'}</td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={()=>openEdit(c)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
                                                    <button onClick={()=>handleDelete(c)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="divide-y md:hidden">
                            {clients.data.map((c)=>(
                                <div key={c.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                                    <Avatar name={c.name}/>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold">{c.name}</p>
                                        {c.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3"/>{c.phone}</p>}
                                        {c.email && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Mail className="h-3 w-3"/>{c.email}</p>}
                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3"/>{c.appointments_count} citas</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={()=>openEdit(c)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
                                        <button onClick={()=>handleDelete(c)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        </>
                    )}

                    {/* Pagination */}
                    {clients.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                            <span className="text-muted-foreground">
                                Página {clients.current_page} de {clients.last_page}
                            </span>
                            <div className="flex gap-1">
                                <Link href={clients.prev_page_url??'#'} className={!clients.prev_page_url?'pointer-events-none opacity-40':''}>
                                    <Button variant="outline" size="sm">Anterior</Button>
                                </Link>
                                <Link href={clients.next_page_url??'#'} className={!clients.next_page_url?'pointer-events-none opacity-40':''}>
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
                    <DialogHeader><DialogTitle>{editingClient?'Editar cliente':'Nuevo cliente'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input id="name" value={data.name} onChange={(e)=>setData('name',e.target.value)} placeholder="Nombre completo" autoFocus/>
                            {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" value={data.phone} onChange={(e)=>setData('phone',e.target.value)} placeholder="+57 300 000 0000"/>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e)=>setData('email',e.target.value)} placeholder="correo@ejemplo.com"/>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="notes">Notas</Label>
                            <textarea id="notes" value={data.notes} onChange={(e)=>setData('notes',e.target.value)} rows={3}
                                style={{borderRadius:'var(--radius)'}}
                                className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Preferencias, alergias, observaciones..."/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={()=>setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editingClient?'Guardar cambios':'Crear cliente'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
