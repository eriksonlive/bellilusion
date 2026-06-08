import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, Pencil, Plus, Shield, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '#' },
    { title: 'Roles', href: '/admin/roles' },
];

interface RoleRow { id: number; name: string; users_count: number; permissions: string[] }
interface Props   { roles: RoleRow[]; permissions: string[] }

const PROTECTED_ROLES = ['admin'];

const PERM_GROUPS: Record<string, string[]> = {
    'Admin':     ['admin.users', 'admin.roles', 'admin.permissions'],
    'Agenda':    ['agenda.view', 'agenda.create', 'agenda.edit', 'agenda.delete'],
    'Clientes':  ['clients.view', 'clients.create', 'clients.edit', 'clients.delete'],
    'Servicios': ['services.view', 'services.create', 'services.edit', 'services.delete'],
    'Finanzas':  ['finance.view', 'finance.create', 'finance.edit', 'finance.delete'],
};

const PERM_LABEL: Record<string, string> = {
    'admin.users': 'Gestionar usuarios', 'admin.roles': 'Gestionar roles', 'admin.permissions': 'Gestionar permisos',
    'agenda.view': 'Ver agenda', 'agenda.create': 'Crear citas', 'agenda.edit': 'Editar citas', 'agenda.delete': 'Eliminar citas',
    'clients.view': 'Ver clientes', 'clients.create': 'Crear clientes', 'clients.edit': 'Editar clientes', 'clients.delete': 'Eliminar clientes',
    'services.view': 'Ver servicios', 'services.create': 'Crear servicios', 'services.edit': 'Editar servicios', 'services.delete': 'Eliminar servicios',
    'finance.view': 'Ver finanzas', 'finance.create': 'Crear transacciones', 'finance.edit': 'Editar transacciones', 'finance.delete': 'Eliminar transacciones',
};

export default function AdminRolesIndex({ roles, permissions }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<RoleRow | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', permissions: [] as string[],
    });

    function openCreate() { reset(); setEditing(null); setShowModal(true); }
    function openEdit(r: RoleRow) {
        setEditing(r);
        setData({ name: r.name, permissions: r.permissions });
        setShowModal(true);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) put(route('admin.roles.update', editing.id), { onSuccess: () => { setShowModal(false); reset(); } });
        else post(route('admin.roles.store'), { onSuccess: () => { setShowModal(false); reset(); } });
    }
    function handleDelete(r: RoleRow) {
        if (!confirm(`¿Eliminar el rol "${r.name}"?`)) return;
        router.delete(route('admin.roles.destroy', r.id));
    }
    function togglePerm(p: string) {
        setData('permissions', data.permissions.includes(p)
            ? data.permissions.filter((x) => x !== p)
            : [...data.permissions, p]);
    }
    function toggleGroup(group: string) {
        const groupPerms = PERM_GROUPS[group].filter((p) => permissions.includes(p));
        const allOn = groupPerms.every((p) => data.permissions.includes(p));
        setData('permissions', allOn
            ? data.permissions.filter((p) => !groupPerms.includes(p))
            : [...new Set([...data.permissions, ...groupPerms])]);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles — Admin" />
            <div className="flex flex-col gap-5 p-5">

                {(flash?.success || flash?.error) && (
                    <div className={`flex items-center gap-3 px-4 py-3 text-sm ring-1 ${flash.success ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}
                        style={{ borderRadius: 'var(--radius)' }}>
                        <span className={`h-2 w-2 rounded-full ${flash.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        {flash.success ?? flash.error}
                    </div>
                )}

                <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div>
                            <h1 className="text-base font-bold">Roles</h1>
                            <p className="text-xs text-muted-foreground">{roles.length} rol{roles.length !== 1 ? 'es' : ''}</p>
                        </div>
                        <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Nuevo rol</Button>
                    </div>

                    {roles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Shield className="mb-3 h-12 w-12 opacity-20" />
                            <p className="font-medium">No hay roles</p>
                        </div>
                    ) : (
                        <table className="berry-table w-full">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Usuarios</th>
                                    <th>Permisos</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((r) => (
                                    <tr key={r.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <Shield className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-semibold">{r.name}</span>
                                                {PROTECTED_ROLES.includes(r.name) && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Protegido</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                <Users className="h-3 w-3" /> {r.users_count}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {r.permissions.slice(0, 5).map((p) => (
                                                    <span key={p} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{p}</span>
                                                ))}
                                                {r.permissions.length > 5 && (
                                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">+{r.permissions.length - 5}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(r)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                                                {!PROTECTED_ROLES.includes(r.name) && (
                                                    <button onClick={() => handleDelete(r)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editing ? `Editar rol: ${editing.name}` : 'Nuevo rol'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label>Nombre del rol *</Label>
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)}
                                placeholder="ej: editor" disabled={editing ? PROTECTED_ROLES.includes(editing.name) : false} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Label>Permisos</Label>
                            <div className="flex flex-col gap-4 rounded-[var(--radius)] border p-4">
                                {Object.entries(PERM_GROUPS).map(([group, groupPerms]) => {
                                    const available = groupPerms.filter((p) => permissions.includes(p));
                                    if (available.length === 0) return null;
                                    const allOn = available.every((p) => data.permissions.includes(p));
                                    const someOn = available.some((p) => data.permissions.includes(p));
                                    return (
                                        <div key={group}>
                                            {/* Group header */}
                                            <button type="button" onClick={() => toggleGroup(group)}
                                                className="mb-2 flex w-full items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                                                <span className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${allOn ? 'border-primary bg-primary text-white' : someOn ? 'border-primary bg-primary/20' : 'border-border'}`}>
                                                    {allOn && <Check className="h-2.5 w-2.5" />}
                                                    {someOn && !allOn && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                                </span>
                                                {group}
                                            </button>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {available.map((p) => (
                                                    <label key={p} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] px-2 py-1.5 hover:bg-muted transition-colors">
                                                        <button type="button" onClick={() => togglePerm(p)}
                                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${data.permissions.includes(p) ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                                                            {data.permissions.includes(p) && <Check className="h-2.5 w-2.5" />}
                                                        </button>
                                                        <span className="text-xs text-muted-foreground">{PERM_LABEL[p] ?? p}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Guardar cambios' : 'Crear rol'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
