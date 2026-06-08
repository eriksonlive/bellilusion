import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Key, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '#' },
    { title: 'Permisos', href: '/admin/permissions' },
];

interface PermRow { id: number; name: string; roles: string[] }
interface Props   { permissions: PermRow[]; roles: string[]; filters: { search?: string } }

const ROLE_BADGE: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700', employee: 'bg-blue-100 text-blue-700', user: 'bg-slate-100 text-slate-600',
};

export default function AdminPermissionsIndex({ permissions, roles, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<PermRow | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({ name: '' });

    function openCreate() { reset(); setEditing(null); setShowModal(true); }
    function openEdit(p: PermRow) { setEditing(p); setData({ name: p.name }); setShowModal(true); }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) put(route('admin.permissions.update', editing.id), { onSuccess: () => { setShowModal(false); reset(); } });
        else post(route('admin.permissions.store'), { onSuccess: () => { setShowModal(false); reset(); } });
    }
    function handleDelete(p: PermRow) {
        if (!confirm(`¿Eliminar el permiso "${p.name}"?`)) return;
        router.delete(route('admin.permissions.destroy', p.id));
    }
    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('admin.permissions.index'), { search: search || undefined }, { preserveState: true, replace: true });
    }

    // Group permissions by prefix
    const grouped = permissions.reduce<Record<string, PermRow[]>>((acc, p) => {
        const key = p.name.includes('.') ? p.name.split('.')[0] : 'otros';
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Permisos — Admin" />
            <div className="flex flex-col gap-5 p-5">

                {(flash?.success || flash?.error) && (
                    <div className={`flex items-center gap-3 px-4 py-3 text-sm ring-1 ${flash.success ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}
                        style={{ borderRadius: 'var(--radius)' }}>
                        <span className={`h-2 w-2 rounded-full ${flash.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        {flash.success ?? flash.error}
                    </div>
                )}

                <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h1 className="text-base font-bold">Permisos</h1>
                            <p className="text-xs text-muted-foreground">{permissions.length} permiso{permissions.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <form onSubmit={applySearch} className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar permiso..."
                                    style={{ borderRadius: 'var(--radius)' }}
                                    className="h-9 w-52 border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                            </form>
                            {filters.search && (
                                <button onClick={() => { setSearch(''); router.get(route('admin.permissions.index'), {}, { replace: true }); }}
                                    className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Nuevo permiso</Button>
                        </div>
                    </div>

                    {permissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Key className="mb-3 h-12 w-12 opacity-20" />
                            <p className="font-medium">No hay permisos</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {Object.entries(grouped).map(([group, perms]) => (
                                <div key={group}>
                                    <div className="bg-muted/30 px-5 py-2">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{group}</span>
                                    </div>
                                    <table className="berry-table w-full">
                                        <tbody>
                                            {perms.map((p) => (
                                                <tr key={p.id}>
                                                    <td className="w-10">
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                                                            <Key className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                    </td>
                                                    <td><span className="font-mono text-sm font-semibold">{p.name}</span></td>
                                                    <td>
                                                        <div className="flex flex-wrap gap-1">
                                                            {p.roles.map((r) => (
                                                                <span key={r} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[r] ?? 'bg-muted text-muted-foreground'}`}>{r}</span>
                                                            ))}
                                                            {p.roles.length === 0 && <span className="text-xs text-muted-foreground">Sin rol asignado</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => openEdit(p)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                                                            <button onClick={() => handleDelete(p)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>{editing ? 'Editar permiso' : 'Nuevo permiso'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label>Nombre *</Label>
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)}
                                placeholder="ej: agenda.view" autoFocus />
                            <p className="text-xs text-muted-foreground">Usa el formato <span className="font-mono">modulo.accion</span> para organizar permisos</p>
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Guardar' : 'Crear permiso'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
