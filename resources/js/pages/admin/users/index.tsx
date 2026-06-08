import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Plus, Search, Shield, Trash2, UserCheck, UserX, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin', href: '#' },
    { title: 'Usuarios', href: '/admin/users' },
];

interface UserRow {
    id: number; name: string; email: string; is_active: boolean;
    roles: string[]; created_at: string;
}
interface Paginated<T> {
    data: T[]; current_page: number; last_page: number;
    next_page_url: string | null; prev_page_url: string | null; total: number;
}
interface Props {
    users: Paginated<UserRow>; roles: string[];
    filters: { search?: string; role?: string };
}

const ROLE_BADGE: Record<string, string> = {
    admin:    'bg-purple-100 text-purple-700',
    employee: 'bg-blue-100 text-blue-700',
    user:     'bg-slate-100 text-slate-600',
};

function Avatar({ name }: { name: string }) {
    const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700',
                    'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700',
                    'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700'];
    return (
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${colors[name.charCodeAt(0) % colors.length]}`}>
            {initials}
        </div>
    );
}

export default function AdminUsersIndex({ users, roles, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', email: '', password: '', role: '', is_active: true as boolean,
    });

    function openCreate() {
        reset(); setEditing(null); setShowModal(true);
    }
    function openEdit(u: UserRow) {
        setEditing(u);
        setData({ name: u.name, email: u.email, password: '', role: u.roles[0] ?? '', is_active: u.is_active });
        setShowModal(true);
    }
    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) put(route('admin.users.update', editing.id), { onSuccess: () => { setShowModal(false); reset(); } });
        else post(route('admin.users.store'), { onSuccess: () => { setShowModal(false); reset(); } });
    }
    function handleDelete(u: UserRow) {
        if (!confirm(`¿Eliminar al usuario "${u.name}"?`)) return;
        router.delete(route('admin.users.destroy', u.id));
    }
    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(route('admin.users.index'), { ...filters, search: search || undefined }, { preserveState: true, replace: true });
    }
    function applyFilter(key: string, value: string) {
        router.get(route('admin.users.index'), { ...filters, [key]: value === '_all' ? undefined : value }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuarios — Admin" />
            <div className="flex flex-col gap-5 p-5">

                {(flash?.success || flash?.error) && (
                    <div className={`flex items-center gap-3 px-4 py-3 text-sm ring-1 ${flash.success ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-700 ring-red-200'}`}
                        style={{ borderRadius: 'var(--radius)' }}>
                        <span className={`h-2 w-2 rounded-full ${flash.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        {flash.success ?? flash.error}
                    </div>
                )}

                <div className="card-berry overflow-hidden bg-card" style={{ borderRadius: 'var(--radius-lg)' }}>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                        <div>
                            <h1 className="text-base font-bold">Usuarios</h1>
                            <p className="text-xs text-muted-foreground">{users.total} usuario{users.total !== 1 ? 's' : ''} en total</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <form onSubmit={applySearch} className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar usuario..."
                                    style={{ borderRadius: 'var(--radius)' }}
                                    className="h-9 w-52 border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                            </form>
                            {filters.search && (
                                <button onClick={() => { setSearch(''); applyFilter('search', '_all'); }}
                                    className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            <Select value={filters.role ?? '_all'} onValueChange={(v) => applyFilter('role', v)}>
                                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Rol" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Todos los roles</SelectItem>
                                    {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Nuevo usuario</Button>
                        </div>
                    </div>

                    {/* Table */}
                    {users.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <Shield className="mb-3 h-12 w-12 opacity-20" />
                            <p className="font-medium">No hay usuarios</p>
                        </div>
                    ) : (
                        <>
                            <table className="berry-table w-full">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Registrado</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={u.name} />
                                                    <span className="font-semibold">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-muted-foreground">{u.email}</td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {u.roles.map((r) => (
                                                        <span key={r} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[r] ?? 'bg-muted text-muted-foreground'}`}>
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                                        <UserCheck className="h-3 w-3" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                                        <UserX className="h-3 w-3" /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-muted-foreground tabular-nums">{u.created_at}</td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(u)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                                                    <button onClick={() => handleDelete(u)} className="rounded-[var(--radius)] p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.last_page > 1 && (
                                <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                                    <span className="text-muted-foreground">Página {users.current_page} de {users.last_page}</span>
                                    <div className="flex gap-1">
                                        <Link href={users.prev_page_url ?? '#'} className={!users.prev_page_url ? 'pointer-events-none opacity-40' : ''}>
                                            <Button variant="outline" size="sm">Anterior</Button>
                                        </Link>
                                        <Link href={users.next_page_url ?? '#'} className={!users.next_page_url ? 'pointer-events-none opacity-40' : ''}>
                                            <Button variant="outline" size="sm">Siguiente</Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>{editing ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
                        <div className="flex flex-col gap-1.5">
                            <Label>Nombre *</Label>
                            <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Nombre completo" autoFocus />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Email *</Label>
                            <Input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="correo@ejemplo.com" />
                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>{editing ? 'Nueva contraseña (dejar en blanco para mantener)' : 'Contraseña *'}</Label>
                            <Input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="••••••••" />
                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Rol *</Label>
                            <Select value={data.role || '_none'} onValueChange={(v) => setData('role', v === '_none' ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                                <SelectContent>
                                    {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                        </div>
                        <div className="flex items-center justify-between rounded-[var(--radius)] border p-3">
                            <div>
                                <p className="text-sm font-medium">Usuario activo</p>
                                <p className="text-xs text-muted-foreground">Los usuarios inactivos no pueden iniciar sesión</p>
                            </div>
                            <button type="button" onClick={() => setData('is_active', !data.is_active)}
                                className={`relative h-6 w-11 rounded-full transition-colors ${data.is_active ? 'bg-primary' : 'bg-muted'}`}>
                                <span className={`block h-4 w-4 translate-y-1 rounded-full bg-white shadow transition-transform ${data.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                            <Button type="submit" disabled={processing}>{editing ? 'Guardar cambios' : 'Crear usuario'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
